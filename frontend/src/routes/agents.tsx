import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api, type Agent } from "@/lib/api";
import { Megaphone, MessageSquare, LineChart, Target, PenTool, Database, FileText, Globe, Bot } from "lucide-react";

// For the prototype, we map strings to components manually here
const iconMap: Record<string, any> = {
  Megaphone, MessageSquare, LineChart, Target, PenTool, Database, FileText, Globe
};
const getIcon = (name: string) => iconMap[name] || Bot;

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents — Marketing OS" },
      { name: "description", content: "Create marketing agents, assign skills, knowledge bases and a model." },
      { property: "og:title", content: "Agents — Marketing OS" },
      { property: "og:description", content: "Create marketing agents, assign skills, knowledge bases and a model." },
    ],
  }),
  loader: async () => {
    const [initialAgents, knowledgeBases, modelProviders] = await Promise.all([
      api.getAgents(),
      api.getKnowledgeBases(),
      api.getModels(),
    ]);
    return { initialAgents, knowledgeBases, modelProviders };
  },
  component: AgentsPage,
});

const statusTone: Record<Agent["status"], string> = {
  active: "border-primary/40 text-primary",
  paused: "border-border text-muted-foreground",
  draft: "border-accent/40 text-accent",
};

const skillLibrary = [
  { name: "SEO writing", category: "Content" },
  { name: "Tone matching", category: "Content" },
  { name: "Hook writing", category: "Social" },
  { name: "Repurposing", category: "Social" },
  { name: "Competitor scan", category: "Research" },
  { name: "Review mining", category: "Research" },
  { name: "Pricing diff", category: "Research" },
  { name: "Positioning", category: "Strategy" },
  { name: "Channel planning", category: "Strategy" },
  { name: "Budget split", category: "Strategy" },
  { name: "ICP research", category: "Strategy" },
];

function AgentsPage() {
  const { initialAgents, knowledgeBases, modelProviders } = Route.useLoaderData();
  const allModels = modelProviders.flatMap((p) => p.models);

  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedId, setSelectedId] = useState(initialAgents[0]?.id || "");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", role: "", description: "", model: allModels[0] || "" });
  const [newSkill, setNewSkill] = useState("");

  const selected = (agents.find((a) => a.id === selectedId) ?? agents[0]) as Agent | undefined;

  const update = (id: string, patch: Partial<Agent>) =>
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const addSkill = (skill: string) => {
    const value = skill.trim();
    if (!value || selected.skills.includes(value)) return;
    update(selected.id, { skills: [...selected.skills, value] });
    setNewSkill("");
  };

  const toggleBase = (name: string) => {
    const has = selected.knowledgeBases.includes(name);
    update(selected.id, {
      knowledgeBases: has
        ? selected.knowledgeBases.filter((k) => k !== name)
        : [...selected.knowledgeBases, name],
    });
  };

  const createAgent = () => {
    if (!draft.name.trim()) return;
    const agent: Agent = {
      id: draft.name.toLowerCase().replace(/\s+/g, "-"),
      name: draft.name,
      role: draft.role || "Custom agent",
      description: draft.description || "No description yet.",
      status: "draft",
      icon: seedAgents[0]!.icon,
      model: draft.model,
      skills: [],
      knowledgeBases: [],
      runs: 0,
      successRate: 0,
      lastRun: "never",
    };
    setAgents((prev) => [agent, ...prev]);
    setSelectedId(agent.id);
    setOpen(false);
    setDraft({ name: "", role: "", description: "", model: allModels[0]! });
    toast.success(`${agent.name} created`);
  };

  return (
    <AppShell
      title="Agents"
      subtitle="Each agent is a role, a skill set, the memory it can read and the model it runs on."
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> New agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create an agent</DialogTitle>
              <DialogDescription>Skills and knowledge can be added after.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Beacon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  placeholder="Lifecycle email writer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">What it does</Label>
                <Textarea
                  id="desc"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Writes onboarding sequences from product docs."
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={draft.model}
                  onValueChange={(model) => setDraft({ ...draft, model })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createAgent}>Create agent</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedId(agent.id)}
              className={`panel w-full p-4 text-left transition-colors ${
                agent.id === selected?.id ? "border-primary/60" : "hover:border-border/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
                  {(() => {
                    const Icon = getIcon(agent.icon);
                    return <Icon className="size-4 text-primary" />;
                  })()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
                </div>
                <Badge variant="outline" className={`ml-auto ${statusTone[agent.status]}`}>
                  {agent.status}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {agent.skills.length} skills · {agent.runs} runs · {agent.lastRun}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {selected && (
            <>
              <section className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.name}</h2>
                    <p className="text-sm text-muted-foreground">{selected.role}</p>
                  </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    update(selected.id, {
                      status: selected.status === "active" ? "paused" : "active",
                    })
                  }
                >
                  {selected.status === "active" ? "Pause" : "Activate"}
                </Button>
                <Button onClick={() => toast.success(`${selected.name} run queued`)}>Run agent</Button>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{selected.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Model", selected.model],
                ["Runs", String(selected.runs)],
                ["Success", `${selected.successRate}%`],
                ["Last run", selected.lastRun],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-border bg-secondary/40 p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-1 truncate text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Skills</h3>
            <p className="text-sm text-muted-foreground">
              What this agent is allowed to do during a run.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs"
                >
                  {skill}
                  <button
                    onClick={() =>
                      update(selected.id, {
                        skills: selected.skills.filter((s) => s !== skill),
                      })
                    }
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                </span>
              ))}
              {selected.skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills yet.</p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill(newSkill)}
                placeholder="Add a custom skill…"
              />
              <Button variant="secondary" onClick={() => addSkill(newSkill)}>
                Add
              </Button>
            </div>
            <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
              Skill library
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skillLibrary
                .filter((s) => !selected.skills.includes(s.name))
                .map((s) => (
                  <button
                    key={s.name}
                    onClick={() => addSkill(s.name)}
                    className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    + {s.name}
                    <span className="ml-1 opacity-50">{s.category}</span>
                  </button>
                ))}
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Knowledge access</h3>
            <p className="text-sm text-muted-foreground">
              Bases this agent can read during a run.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {knowledgeBases.map((kb) => {
                const on = selected.knowledgeBases.includes(kb.name);
                return (
                  <button
                    key={kb.id}
                    onClick={() => toggleBase(kb.name)}
                    className={`flex items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                      on ? "border-primary/60 bg-primary/5" : "border-border hover:border-border/80"
                    }`}
                  >
                    {(() => {
                      const Icon = getIcon(kb.icon);
                      return <Icon className="mt-0.5 size-4 text-primary" />;
                    })()}
                    <div>
                      <p className="text-sm font-medium">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {kb.type} · {kb.docs} docs
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
