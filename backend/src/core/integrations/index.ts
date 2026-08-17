import type { Connector } from './types';
import { notionConnector } from './notion';
import { obsidianConnector } from './obsidian';
import { gdriveConnector } from './gdrive';

export * from './types';

/**
 * Registry of every source that can be connected.
 *
 * Microsoft Office is deliberately absent: it needs delegated OAuth against a
 * signed-in user, which this platform has no identity for yet. Its Connect
 * button reports that rather than failing obscurely.
 */
const connectors: Connector[] = [notionConnector, obsidianConnector, gdriveConnector];

const bySlug = new Map(connectors.map((c) => [c.slug, c]));

export function getConnector(slug: string): Connector | null {
  return bySlug.get(slug) ?? null;
}

export function listConnectors(): Connector[] {
  return connectors;
}
