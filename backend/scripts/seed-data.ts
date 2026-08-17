/**
 * Reference data, not demo content.
 *
 * There are deliberately no agents, knowledge bases, runs or activity here —
 * those are created by the user through the UI. What remains is the catalog the
 * app needs in order to be usable at all: which model providers and integrations
 * exist, and the starting skill library.
 *
 * Nothing here claims to be connected. Every provider and integration starts as
 * `available`, and becomes `connected` only once real credentials are supplied.
 */

/**
 * The shared vocabulary agents and skills both draw from. Matching an agent's
 * category against a skill's is what drives suggestions in the pipeline builder,
 * so both sides must pick from this one list rather than typing free text.
 * Editable later — this is only the starting set.
 */
export const categories = [
  { slug: 'content', name: 'Content' },
  { slug: 'social', name: 'Social' },
  { slug: 'research', name: 'Research' },
  { slug: 'strategy', name: 'Strategy' },
  { slug: 'analytics', name: 'Analytics' },
  { slug: 'seo', name: 'SEO' },
  { slug: 'publishing', name: 'Publishing' },
];

export interface SeedModelProvider {
  id: string;
  name: string;
  kind: 'Hosted API' | 'Open source';
  models: string[];
  note: string;
}

export const modelProviders: SeedModelProvider[] = [
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    kind: 'Hosted API',
    models: ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5-20251001'],
    note: 'Add an API key to enable',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'Hosted API',
    models: ['gpt-4o', 'gpt-4o-mini'],
    note: 'Add an API key to enable',
  },
  {
    id: 'google',
    name: 'Google Gemini',
    kind: 'Hosted API',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
    note: 'Add an API key to enable',
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    kind: 'Open source',
    models: [],
    note: 'Set a local endpoint to load its models',
  },
  {
    id: 'vllm',
    name: 'vLLM endpoint',
    kind: 'Open source',
    models: [],
    note: 'Point to any OpenAI-compatible URL',
  },
];

export const integrations = [
  {
    id: 'notion',
    name: 'Notion',
    blurb: 'Sync pages and databases from shared workspaces.',
    detail: 'Not connected',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    blurb: 'Watch a local vault folder and index markdown notes.',
    detail: 'Not connected',
  },
  {
    id: 'msoffice',
    name: 'Microsoft Office',
    blurb: 'Pull Word, Excel and PowerPoint files from OneDrive/SharePoint.',
    detail: 'Not connected',
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    blurb: 'Index docs, sheets and slides from a shared drive.',
    detail: 'Not connected',
  },
];

/** Suggestions offered when editing an agent. Users can add anything else. */
export const skillLibrary = [
  { name: 'SEO writing', category: 'Content' },
  { name: 'Tone matching', category: 'Content' },
  { name: 'Hook writing', category: 'Social' },
  { name: 'Repurposing', category: 'Social' },
  { name: 'Competitor scan', category: 'Research' },
  { name: 'Review mining', category: 'Research' },
  { name: 'Pricing diff', category: 'Research' },
  { name: 'Positioning', category: 'Strategy' },
  { name: 'Channel planning', category: 'Strategy' },
  { name: 'Budget split', category: 'Strategy' },
  { name: 'Metric rollup', category: 'Analytics' },
  { name: 'Anomaly notes', category: 'Analytics' },
];
