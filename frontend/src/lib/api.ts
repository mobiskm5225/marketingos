// Define types that match the backend responses

export interface Agent {
  id: string;
  name: string;
  role: string;
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
}

export interface Integration {
  id: string;
  name: string;
  blurb: string;
  status: "connected" | "available";
  detail: string;
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
  kind: "image" | "pdf";
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

const API_BASE = "http://localhost:8000/api";

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
  }
};
