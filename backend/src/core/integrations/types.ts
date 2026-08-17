/**
 * One shape for every knowledge source.
 *
 * A connector validates its credentials on connect, then on sync yields
 * documents that go straight into the ingestion pipeline. It never touches the
 * database itself — the route owns persistence, the connector owns the source.
 */

export interface SourceDocument {
  /** Stable id at the source; used to avoid re-ingesting the same item. */
  externalId: string;
  name: string;
  text: string;
  mimeType?: string | null;
  /** Link back to the original, shown in the documents list. */
  url?: string | null;
}

export interface ConnectResult {
  /** Short human-readable status, e.g. "42 pages · Marketing DB". */
  detail: string;
  /** Non-secret settings echoed back to the UI and stored as-is. */
  config: Record<string, unknown>;
}

export interface Connector {
  slug: string;
  /** Fields the Connect dialog should render. */
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'textarea';
    placeholder?: string;
    required: boolean;
    /** Secret fields are encrypted at rest and never returned. */
    secret?: boolean;
    help?: string;
  }[];
  /** Validates credentials and reports what was found. Throws on failure. */
  connect(input: Record<string, string>): Promise<ConnectResult>;
  /** Fetches the documents this source currently holds. */
  list(input: Record<string, string>): Promise<SourceDocument[]>;
}

export class ConnectorError extends Error {}
