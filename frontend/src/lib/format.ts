// Shared display helpers — single source of truth for labels and formatting
// used across pages (previously duplicated per-page).

export const AGENT_OPTIONS = [
  { value: 'seo-analyzer',  label: 'SEO Analyzer' },
  { value: 'blog-reviewer', label: 'Existing Blog Reviewer' },
];

export const STATUS_OPTIONS = [
  { value: 'done',       label: 'Done'       },
  { value: 'processing', label: 'Processing' },
  { value: 'pending',    label: 'Pending'    },
  { value: 'error',      label: 'Error'      },
];

export function agentLabel(name: string): string {
  return AGENT_OPTIONS.find(o => o.value === name)?.label ?? name;
}

// Job IDs are UUIDs — show a short human-readable record number (J-8CHARS)
// instead of the full 36-char string.
export function jobIdDisplay(id: string): string {
  return `J-${id.slice(0, 8).toUpperCase()}`;
}

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
