// Define types that match the backend responses

export interface Agent {
  id: string;
  name: string;
  role: string;
  category: string | null;
  description: string;
  status: "active" | "draft" | "paused";
  icon: string;
  model: string;
  skills: string[];
  knowledgeBases: string[];
  runs: number;
  successRate: number;
  lastRun: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  type: "notion" | "docs" | "slack" | "web";
  source: string;
  docs: number;
  chunks: number;
  updated: string;
  usedBy: string[];
  icon: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  kind: string;
  models: string[];
  status: "connected" | "available";
  note: string;
  /** Whether a key is stored. The key itself is never returned. */
  hasKey?: boolean;
  baseUrl?: string | null;
  defaultModel?: string | null;
}

export interface Integration {
  id: string;
  name: string;
  blurb: string;
  status: "connected" | "available";
  detail: string;
}

export interface IntegrationField {
  key: string;
  label: string;
  type: "text" | "password" | "textarea";
  placeholder?: string;
  required: boolean;
  secret?: boolean;
  help?: string;
}

export interface IntegrationFields {
  id: string;
  fields: IntegrationField[];
}

export interface SyncResult {
  added: number;
  replaced: number;
  chunks: number;
}

export interface EndpointTest {
  ok: boolean;
  message: string;
  models?: string[];
  /** True when a successful probe stored the endpoint and its model list. */
  saved?: boolean;
}

export interface RunDefaults {
  temperature: number;
  localFallback: boolean;
  customEndpoint: string;
}

export interface Metric {
  label: string;
  value: string;
  hint: string;
}

export interface Section {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface Source {
  name: string;
  kind: "notion" | "web" | "doc";
}

export interface Attachment {
  name: string;
  kind: "image" | "pdf" | "doc";
  size: string;
}

export interface Comment {
  id: string;
  author: string;
  initials: string;
  time: string;
  body: string;
  anchor?: string;
}

export interface Run {
  id: string;
  title: string;
  agent: string;
  status: "complete" | "running" | "needs review";
  started: string;
  duration: string;
  model: string;
  summary: string;
  metrics: Metric[];
  sections: Section[];
  sources: Source[];
  attachments: Attachment[];
  comments: Comment[];
}

export interface Activity {
  id: string;
  text: string;
  time: string;
}

export interface SkillSummary {
  id: string;
  name: string;
  description: string;
  category: string | null;
  source: "manual" | "folder" | "github";
  sourceRef: string | null;
  updated: string;
}

export interface Skill extends SkillSummary {
  bodyMd: string;
  frontmatter: Record<string, unknown>;
}

/** A proposed stage in an imported pipeline. `dependsOn` holds stage positions. */
export interface ImportStage {
  skillSlug: string;
  position: number;
  dependsOn: number[];
  isGate: boolean;
}

/**
 * What an import returns before anything is written. The user confirms this,
 * then it is posted back to /skills/import/commit unchanged.
 */
export interface ImportPreview {
  agent: {
    slug: string;
    name: string;
    description: string;
    agentMd: string | null;
    guardrails: string | null;
    generated: boolean;
  };
  skills: {
    slug: string;
    name: string;
    description: string;
    bodyMd: string;
    frontmatter: Record<string, unknown>;
  }[];
  references: { name: string; bodyMd: string }[];
  stages: ImportStage[];
  warnings: string[];
}

export interface AgentStage {
  id: string;
  skill: string;
  skillName: string;
  description: string;
  position: number;
  dependsOn: string[];
  isGate: boolean;
  /** null on both = inherit the agent's default model. */
  provider: string | null;
  model: string | null;
  hasOverride: boolean;
}

export interface AgentInput {
  id: string;
  key: string;
  label: string;
  type: "text" | "textarea" | "file" | "url" | "select";
  required: boolean;
  placeholder: string | null;
  options: string[];
}

export interface AgentDetail {
  id: string;
  name: string;
  role: string;
  description: string;
  status: "active" | "draft" | "paused";
  icon: string;
  category: string | null;
  guardrails: string | null;
  agentMd: string | null;
  defaultProvider: string | null;
  defaultModel: string | null;
  temperature: number | null;
  maxTokens: number | null;
  knowledgeBases: string[];
  stages: AgentStage[];
  /** Stage ids grouped into execution levels; a level runs in parallel. */
  levels: string[][];
  /** Non-null when the stored graph has a loop — the map shows it as broken. */
  cycle: string[] | null;
  references: { id: string; name: string; bodyMd: string }[];
  inputs: AgentInput[];
}

/** What PUT /agents/:slug/stages accepts. `id` is absent for a new stage. */
export interface StageWrite {
  id?: string;
  skill: string;
  position: number;
  dependsOn: string[];
  isGate: boolean;
  provider?: string | null;
  model?: string | null;
  bodyOverride?: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface MemoryLayer {
  key: string;
  title: string;
  blurb: string;
  count: number;
  unit: string;
}

export interface MemoryLayers {
  layers: MemoryLayer[];
  lastDistillation: {
    status: string;
    factsAdded: number;
    conflictsResolved: number;
    startedAt: string;
    finishedAt: string | null;
  } | null;
  /** False when no OPENAI_API_KEY is set — retrieval falls back to keyword search. */
  embeddingsAvailable: boolean;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  sourceType: string;
  mimeType: string | null;
  sizeBytes: number | null;
  status: "pending" | "indexed" | "error";
  error: string | null;
  chunks: number;
  created: string;
}

export interface UploadResult {
  indexed: number;
  chunks: number;
  embedded: boolean;
  embeddingsAvailable: boolean;
  documents: { name: string; chunks: number; embedded: boolean }[];
}

export interface DistillResult {
  runId: string;
  notesWritten: number;
  factsAdded: number;
  conflictsResolved: number;
  /** Present when the pass could not run, e.g. no model provider configured. */
  skipped?: string;
}

export interface ImportResult {
  agent: string;
  skillsCreated: number;
  skillsReused: number;
  overrides: number;
  stages: number;
  references: number;
}

// Route loaders run in two places, and each needs a different address for the
// same API:
//   - On the server (SSR, and inside Docker) the backend is a peer service, so
//     "localhost" would resolve to the frontend container itself.
//   - In the browser it has to be a URL the user's machine can reach.
// INTERNAL_API_URL is a runtime env var; VITE_API_URL is inlined at build time.
const API_BASE =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL ?? "http://localhost:8000/api"
    : import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const api = {
  getAgents: async (): Promise<Agent[]> => {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error("Failed to fetch agents");
    return res.json();
  },
  
  getKnowledgeBases: async (): Promise<KnowledgeBase[]> => {
    const res = await fetch(`${API_BASE}/knowledge-bases`);
    if (!res.ok) throw new Error("Failed to fetch knowledge bases");
    return res.json();
  },
  
  getModels: async (): Promise<ModelProvider[]> => {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error("Failed to fetch models");
    return res.json();
  },
  
  getIntegrations: async (): Promise<Integration[]> => {
    const res = await fetch(`${API_BASE}/integrations`);
    if (!res.ok) throw new Error("Failed to fetch integrations");
    return res.json();
  },
  
  getRuns: async (): Promise<Run[]> => {
    const res = await fetch(`${API_BASE}/runs`);
    if (!res.ok) throw new Error("Failed to fetch runs");
    return res.json();
  },
  
  getRun: async (slug: string): Promise<Run> => {
    const res = await fetch(`${API_BASE}/runs/${slug}`);
    if (!res.ok) throw new Error("Failed to fetch run");
    return res.json();
  },
  
  getActivity: async (): Promise<Activity[]> => {
    const res = await fetch(`${API_BASE}/activity`);
    if (!res.ok) throw new Error("Failed to fetch activity");
    return res.json();
  },

  // ─── Agent builder ──────────────────────────────────────────────────────────

  getAgent: async (slug: string): Promise<AgentDetail> => {
    const res = await fetch(`${API_BASE}/agents/${slug}`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
  },

  createAgent: (body: {
    name: string;
    role?: string;
    description?: string;
    model?: string | null;
    category?: string | null;
  }) => send<{ id: string }>("POST", "/agents", body),

  updateAgent: (
    slug: string,
    body: Partial<{
      name: string;
      role: string;
      description: string;
      status: "active" | "draft" | "paused";
      category: string | null;
      guardrails: string | null;
      defaultProvider: string | null;
      defaultModel: string | null;
      temperature: number | null;
      maxTokens: number | null;
    }>,
  ) => send<{ id: string }>("PATCH", `/agents/${slug}`, body),

  deleteAgent: (slug: string) => send<void>("DELETE", `/agents/${slug}`),

  saveStages: (slug: string, stages: StageWrite[]) =>
    send<{ stages: number }>("PUT", `/agents/${slug}/stages`, { stages }),

  saveAgentKnowledgeBases: (slug: string, kbSlugs: string[]) =>
    send<{ knowledgeBases: number }>("PUT", `/agents/${slug}/knowledge-bases`, { kbSlugs }),

  saveAgentInputs: (slug: string, inputs: Omit<AgentInput, "id">[]) =>
    send<{ inputs: number }>("PUT", `/agents/${slug}/inputs`, { inputs }),

  // ─── Integrations ───────────────────────────────────────────────────────────

  getIntegrationFields: async (): Promise<IntegrationFields[]> => {
    const res = await fetch(`${API_BASE}/integrations/fields`);
    if (!res.ok) throw new Error("Failed to fetch integration fields");
    return res.json();
  },

  connectIntegration: (slug: string, input: Record<string, string>) =>
    send<{ id: string; detail: string }>("POST", `/integrations/${slug}/connect`, input),

  disconnectIntegration: (slug: string) =>
    send<void>("DELETE", `/integrations/${slug}/connect`),

  syncIntegration: (slug: string, kb?: string | null) =>
    send<SyncResult>("POST", `/integrations/${slug}/sync`, { kb: kb ?? null }),

  syncAll: () => send<{ synced: number; message?: string }>("POST", "/knowledge-bases/sync"),

  // ─── Runs ───────────────────────────────────────────────────────────────────

  addComment: (slug: string, body: string, anchor?: string | null) =>
    send<Comment>("POST", `/runs/${slug}/comments`, { body, anchor: anchor ?? null }),

  uploadRunAttachments: async (slug: string, files: File[]): Promise<{ attachments: Attachment[] }> => {
    const form = new FormData();
    for (const file of files) form.append("files", file);
    const res = await fetch(`${API_BASE}/runs/${slug}/attachments`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  deleteRun: (slug: string) => send<void>("DELETE", `/runs/${slug}`),

  // ─── Models ─────────────────────────────────────────────────────────────────

  updateModelProvider: (
    slug: string,
    body: { apiKey?: string | null; baseUrl?: string | null; defaultModel?: string | null },
  ) => send<{ id: string }>("PATCH", `/models/${slug}`, body),

  testEndpoint: (baseUrl: string, slug?: string | null, apiKey?: string | null) =>
    send<EndpointTest>("POST", "/models/test", { baseUrl, slug: slug ?? null, apiKey: apiKey ?? null }),

  getRunDefaults: async (): Promise<RunDefaults> => {
    const res = await fetch(`${API_BASE}/settings/run-defaults`);
    if (!res.ok) throw new Error("Failed to fetch run defaults");
    return res.json();
  },

  saveRunDefaults: (body: RunDefaults) =>
    send<RunDefaults>("PUT", "/settings/run-defaults", body),

  // ─── Knowledge ──────────────────────────────────────────────────────────────

  getMemoryLayers: async (): Promise<MemoryLayers> => {
    const res = await fetch(`${API_BASE}/memory/layers`);
    if (!res.ok) throw new Error("Failed to fetch memory layers");
    return res.json();
  },

  createKnowledgeBase: (body: { name: string; type?: string; source?: string }) =>
    send<{ id: string }>("POST", "/knowledge-bases", body),

  deleteKnowledgeBase: (slug: string) => send<void>("DELETE", `/knowledge-bases/${slug}`),

  getDocuments: async (slug: string): Promise<KnowledgeDocument[]> => {
    const res = await fetch(`${API_BASE}/knowledge-bases/${slug}/documents`);
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  uploadDocuments: async (slug: string, files: File[]): Promise<UploadResult> => {
    const body = new FormData();
    for (const file of files) body.append("files", file);
    const res = await fetch(`${API_BASE}/knowledge-bases/${slug}/documents`, {
      method: "POST",
      body,
    });
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  deleteDocument: (id: string) => send<void>("DELETE", `/documents/${id}`),

  distill: (kb?: string | null) =>
    send<DistillResult>("POST", "/memory/distill", { kb: kb ?? null }),

  // ─── Skills ─────────────────────────────────────────────────────────────────

  getSkills: async (): Promise<SkillSummary[]> => {
    const res = await fetch(`${API_BASE}/skills`);
    if (!res.ok) throw new Error("Failed to fetch skills");
    return res.json();
  },

  getSkill: async (slug: string): Promise<Skill> => {
    const res = await fetch(`${API_BASE}/skills/${slug}`);
    if (!res.ok) throw new Error("Failed to fetch skill");
    return res.json();
  },

  createSkill: (bodyMd: string, category?: string | null) =>
    send<{ id: string }>("POST", "/skills", { bodyMd, category: category ?? null }),

  updateSkill: (slug: string, bodyMd: string, category?: string | null) =>
    send<{ id: string }>("PATCH", `/skills/${slug}`, { bodyMd, category: category ?? null }),

  deleteSkill: (slug: string) => send<void>("DELETE", `/skills/${slug}`),

  importFromFolder: async (file: File): Promise<ImportPreview> => {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${API_BASE}/skills/import/folder`, { method: "POST", body });
    if (!res.ok) throw new Error(await errorMessage(res));
    return res.json();
  },

  importFromGithub: (url: string) =>
    send<ImportPreview>("POST", "/skills/import/github", { url }),

  commitImport: (preview: ImportPreview, source: "folder" | "github", sourceRef: string) =>
    send<ImportResult>("POST", "/skills/import/commit", { ...preview, source, sourceRef }),
};

/** Surfaces the backend's `{ error }` message instead of a bare status code. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    // fall through to the status text
  }
  return `Request failed (${res.status})`;
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  if (res.status === 204) return undefined as T;
  return res.json();
}
