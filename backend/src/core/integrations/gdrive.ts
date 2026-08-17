import crypto from 'node:crypto';
import type { Connector, SourceDocument } from './types';
import { ConnectorError } from './types';

/**
 * Indexes a Google Drive folder using a service account.
 *
 * A service account avoids OAuth entirely: you share a folder with the account's
 * email and it reads on its own behalf. That matters here because OAuth needs a
 * signed-in identity and this platform has no auth yet.
 *
 * The JWT is signed with node:crypto rather than pulling in googleapis, which is
 * a very large dependency for two REST calls.
 */

const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const MAX_FILES = 500;

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function parseKey(raw: string): ServiceAccountKey {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConnectorError('That is not valid JSON. Paste the whole service-account key file.');
  }
  const key = parsed as Partial<ServiceAccountKey>;
  if (!key.client_email || !key.private_key) {
    throw new ConnectorError('The key file is missing client_email or private_key.');
  }
  // Keys pasted through a form often arrive with literal \n sequences.
  return { client_email: key.client_email, private_key: key.private_key.replace(/\\n/g, '\n') };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Exchanges a signed JWT for an access token. */
async function getAccessToken(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );

  let signature: string;
  try {
    signature = base64url(
      crypto.createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key.private_key),
    );
  } catch {
    throw new ConnectorError('Could not sign with that private key — is the key file complete?');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${signature}`,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ConnectorError(`Google rejected the service account: ${detail.slice(0, 200)}`);
  }

  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new ConnectorError('Google returned no access token.');
  return body.access_token;
}

/** Accepts a folder id or any Drive URL containing one. */
function normaliseFolderId(value: string): string {
  const fromUrl = value.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (fromUrl) return fromUrl[1]!;
  const trimmed = value.trim();
  if (!trimmed) throw new ConnectorError('A folder id or URL is required.');
  return trimmed;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

async function listFiles(token: string, folderId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
      pageSize: '100',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      ...(pageToken ? { pageToken } : {}),
    });

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (response.status === 404) throw new ConnectorError('That folder was not found.');
    if (!response.ok) throw new ConnectorError(`Drive returned ${response.status}.`);

    const body = (await response.json()) as { files?: DriveFile[]; nextPageToken?: string };
    files.push(...(body.files ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken && files.length < MAX_FILES);

  return files;
}

/** Google-native formats must be exported; everything else downloads directly. */
const EXPORT_AS: Record<string, string> = {
  'application/vnd.google-apps.document': 'text/plain',
  'application/vnd.google-apps.presentation': 'text/plain',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
};

async function readFile(token: string, file: DriveFile): Promise<string | null> {
  const exportType = EXPORT_AS[file.mimeType];
  const url = exportType
    ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportType)}`
    : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) return null;

  // Binary formats (PDF, DOCX) are handled by the ingest parsers, not here.
  const isText =
    Boolean(exportType) || /^(text\/|application\/json)/.test(file.mimeType);
  return isText ? response.text() : null;
}

export const gdriveConnector: Connector = {
  slug: 'gdrive',
  fields: [
    {
      key: 'serviceAccountKey',
      label: 'Service account key (JSON)',
      type: 'textarea',
      placeholder: '{ "type": "service_account", … }',
      required: true,
      secret: true,
      help: 'Create a service account in Google Cloud, download its JSON key, then share the Drive folder with the account email.',
    },
    {
      key: 'folderId',
      label: 'Folder ID or URL',
      type: 'text',
      placeholder: 'https://drive.google.com/drive/folders/1AbC…',
      required: true,
    },
  ],

  async connect(input) {
    const key = parseKey(input.serviceAccountKey ?? '');
    const folderId = normaliseFolderId(input.folderId ?? '');
    const token = await getAccessToken(key);
    const files = await listFiles(token, folderId);

    if (files.length === 0) {
      throw new ConnectorError(
        `No files visible in that folder. Share it with ${key.client_email} and try again.`,
      );
    }

    return {
      detail: `Connected · ${files.length} files`,
      config: { folderId, serviceAccountEmail: key.client_email, fileCount: files.length },
    };
  },

  async list(input) {
    const key = parseKey(input.serviceAccountKey ?? '');
    const folderId = normaliseFolderId(input.folderId ?? '');
    const token = await getAccessToken(key);
    const files = await listFiles(token, folderId);
    const documents: SourceDocument[] = [];

    for (const file of files) {
      const text = await readFile(token, file);
      if (!text?.trim()) continue;
      documents.push({
        externalId: file.id,
        name: file.name,
        text,
        mimeType: 'text/plain',
        url: file.webViewLink ?? null,
      });
    }

    return documents;
  },
};
