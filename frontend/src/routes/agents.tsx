import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Play, Plus, Save, Trash2, TriangleAlert, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PipelineMap } from "@/components/PipelineMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  api,
  type Agent,
  type AgentDetail,
  type AgentStage,
  type Category,
  type ModelProvider,
  type SkillSummary,
  type StageWrite,
} from "@/lib/api";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents — Marketing OS" },
      {
        name: "description",
        content:
          "Build an agent as a pipeline of skills, and choose which model runs at each stage.",
      },
      { property: "og:title", content: "Agents — Marketing OS" },
      {
        property: "og:description",
        content: "Compose skills into a pipeline and route each stage to its own model.",
      },
    ],
  }),
  loader: async () => {
    const [agents, knowledgeBases, modelProviders, skills, categories] = await Promise.all([
      api.getAgents(),
      api.getKnowledgeBases(),
      api.getModels(),
      api.getSkills(),
      api.getCategories(),
    ]);
    return { agents, knowledgeBases, modelProviders, skills, categories };
  },
  component: AgentsPage,
});

const statusTone: Record<Agent["status"], string> = {
  active: "border-primary/40 text-primary",
  paused: "border-border text-muted-foreground",
  draft: "border-accent/40 text-accent",
};

/** Every model across every provider, tagged so a stage can pick one. */
function modelChoices(providers: ModelProvider[]) {
  return providers.flatMap((p) => p.models.map((m) => ({ provider: p.id, model: m, kind: p.kind })));
}

function AgentsPage() {
  const { agents, knowledgeBases, modelProviders, skills, categories } = Route.useLoaderData();
  const router = useRouter();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(agents[0]?.id ?? null);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const navigate = useNavigate();

  const choices = modelChoices(modelProviders);

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    api
      .getAgent(selectedSlug)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setSelectedStageId(null);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load agent"));
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  const reload = async () => {
    await router.invalidate();
    if (selectedSlug) setDetail(await api.getAgent(selectedSlug));
  };

  /** Writes the whole pipeline back, then refreshes so levels are recomputed. */
  const saveStages = async (next: AgentStage[]) => {
    if (!detail) return;
    setBusy(true);
    try {
      const payload: StageWrite[] = next.map((s) => ({
        id: s.id,
        skill: s.skill,
        position: s.position,
        dependsOn: s.dependsOn,
        isGate: s.isGate,
        provider: s.provider,
        model: s.model,
      }));
      await api.saveStages(detail.id, payload);
      await reload();
      toast.success("Pipeline saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the pipeline");
    } finally {
      setBusy(false);
    }
  };

  const patchAgent = async (body: Parameters<typeof api.updateAgent>[1], message: string) => {
    if (!detail) return;
    setBusy(true);
    try {
      await api.updateAgent(detail.id, body);
      await reload();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const removeAgent = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await api.deleteAgent(detail.id);
      setSelectedSlug(null);
      setDetail(null);
      await router.invalidate();
      toast.success("Agent deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  };

  const stage = detail?.stages.find((s) => s.id === selectedStageId) ?? null;

  return (
    <AppShell
      title="Agents"
      subtitle="An agent is a pipeline of skills. Each stage can run on its own model."
      action={
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> New agent
            </Button>
          </DialogTrigger>
          <CreateAgentDialog
            choices={choices}
            categories={categories}
            onCreated={async (slug) => {
              setCreateOpen(false);
              await router.invalidate();
              setSelectedSlug(slug);
            }}
          />
        </Dialog>
      }
    >
      {agents.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <Bot className="size-6 text-primary" />
          <p className="font-medium">No agents yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Create one here, or import a folder of skills from the Skills tab — an import builds
            the agent and its pipeline for you.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedSlug(agent.id)}
                className={`panel w-full p-4 text-left transition-colors ${
                  agent.id === selectedSlug ? "border-primary/60" : "hover:border-border/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{agent.name}</p>
                  <Badge variant="outline" className={statusTone[agent.status]}>
                    {agent.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {agent.skills.length} stages · {agent.runs} runs
                </p>
              </button>
            ))}
          </div>

          {detail ? (
            <div className="space-y-4">
              <section className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">{detail.name}</h2>
                    <p className="text-sm text-muted-foreground">{detail.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={busy || detail.stages.length === 0 || !!detail.cycle}
                      onClick={() => setRunOpen(true)}
                    >
                      <Play className="size-4" /> Run
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        patchAgent(
                          { status: detail.status === "active" ? "paused" : "active" },
                          detail.status === "active" ? "Agent paused" : "Agent activated",
                        )
                      }
                    >
                      {detail.status === "active" ? "Pause" : "Activate"}
                    </Button>
                    <Button variant="secondary" disabled={busy} onClick={removeAgent}>
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  </div>
                </div>
                <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                  {detail.description}
                </p>
              </section>

              {/* Run dialog */}
              <Dialog open={runOpen} onOpenChange={setRunOpen}>
                <RunAgentDialog
                  agent={detail}
                  onStarted={async (slug) => {
                    setRunOpen(false);
                    await navigate({ to: "/runs/$runId", params: { runId: slug } });
                  }}
                />
              </Dialog>

              <Tabs defaultValue="pipeline">
                <TabsList>
                  <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                  <TabsTrigger value="references">References</TabsTrigger>
                </TabsList>

                <TabsContent value="pipeline" className="mt-4 space-y-4">
                  {detail.cycle && (
                    <div className="flex gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-xs">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                      <span>
                        These stages depend on each other in a loop and cannot run. Fix their
                        dependencies below.
                      </span>
                    </div>
                  )}

                  <PipelineMap
                    stages={detail.stages}
                    levels={detail.levels}
                    selectedId={selectedStageId}
                    defaultModel={detail.defaultModel}
                    onSelect={setSelectedStageId}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <AddStage
                      skills={skills}
                      agentCategory={detail.category}
                      used={detail.stages.map((s) => s.skill)}
                      disabled={busy}
                      onAdd={(skillSlug) => {
                        const last = detail.stages[detail.stages.length - 1];
                        const next: AgentStage[] = [
                          ...detail.stages,
                          {
                            id: `new-${Date.now()}`,
                            skill: skillSlug,
                            skillName: skillSlug,
                            description: "",
                            position: (last?.position ?? 0) + 1,
                            dependsOn: last ? [last.id] : [],
                            isGate: false,
                            provider: null,
                            model: null,
                            hasOverride: false,
                          },
                        ];
                        void saveStages(next);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Stages in the same column run in parallel.
                    </p>
                  </div>

                  {stage && (
                    <StagePanel
                      stage={stage}
                      allStages={detail.stages}
                      choices={choices}
                      defaultModel={detail.defaultModel}
                      busy={busy}
                      onClose={() => setSelectedStageId(null)}
                      onChange={(updated) =>
                        void saveStages(
                          detail.stages.map((s) => (s.id === updated.id ? updated : s)),
                        )
                      }
                      onRemove={() =>
                        void saveStages(detail.stages.filter((s) => s.id !== stage.id))
                      }
                    />
                  )}
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                  <SettingsTab
                    detail={detail}
                    choices={choices}
                    categories={categories}
                    busy={busy}
                    onSave={patchAgent}
                  />
                </TabsContent>

                <TabsContent value="knowledge" className="mt-4">
                  <section className="panel p-5">
                    <h3 className="font-semibold">Knowledge access</h3>
                    <p className="text-sm text-muted-foreground">
                      Bases this agent may retrieve from during a run.
                    </p>
                    {knowledgeBases.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        No knowledge bases yet — create one on the Knowledge page.
                      </p>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {knowledgeBases.map((kb) => {
                          const on = detail.knowledgeBases.includes(kb.id);
                          return (
                            <button
                              key={kb.id}
                              disabled={busy}
                              onClick={async () => {
                                const next = on
                                  ? detail.knowledgeBases.filter((k) => k !== kb.id)
                                  : [...detail.knowledgeBases, kb.id];
                                setBusy(true);
                                try {
                                  await api.saveAgentKnowledgeBases(detail.id, next);
                                  await reload();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Could not save");
                                } finally {
                                  setBusy(false);
                                }
                              }}
                              className={`rounded-md border p-3 text-left transition-colors ${
                                on ? "border-primary/60 bg-primary/5" : "border-border hover:border-border/80"
                              }`}
                            >
                              <p className="text-sm font-medium">{kb.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {kb.type} · {kb.docs} docs
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </TabsContent>

                <TabsContent value="references" className="mt-4">
                  <section className="panel p-5">
                    <h3 className="font-semibold">References</h3>
                    <p className="text-sm text-muted-foreground">
                      Small curated documents injected into every prompt this agent runs — distinct
                      from knowledge bases, which are retrieved from by similarity.
                    </p>
                    {detail.references.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">No references yet.</p>
                    ) : (
                      <ul className="mt-4 divide-y divide-border">
                        {detail.references.map((r) => (
                          <li key={r.id} className="flex items-center justify-between py-2.5">
                            <span className="text-sm">{r.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.max(1, Math.round(r.bodyMd.length / 1024))} KB
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="panel flex items-center justify-center border-dashed p-12">
              <p className="text-sm text-muted-foreground">Select an agent.</p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

// ─── Stage editor ─────────────────────────────────────────────────────────────

function StagePanel({
  stage,
  allStages,
  choices,
  defaultModel,
  busy,
  onClose,
  onChange,
  onRemove,
}: {
  stage: AgentStage;
  allStages: AgentStage[];
  choices: { provider: string; model: string; kind: string }[];
  defaultModel: string | null;
  busy: boolean;
  onClose: () => void;
  onChange: (stage: AgentStage) => void;
  onRemove: () => void;
}) {
  const value = stage.model ? `${stage.provider}::${stage.model}` : "__inherit__";

  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{stage.skill}</p>
          <p className="text-xs text-muted-foreground">
            Stage {stage.position}
            {stage.hasOverride && " · uses an agent-specific version of this skill"}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={value}
            onValueChange={(v) => {
              if (v === "__inherit__") {
                onChange({ ...stage, provider: null, model: null });
                return;
              }
              const [provider, model] = v.split("::");
              onChange({ ...stage, provider: provider!, model: model! });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__inherit__">
                Inherit — {defaultModel ?? "no agent default set"}
              </SelectItem>
              {choices.map((c) => (
                <SelectItem key={`${c.provider}::${c.model}`} value={`${c.provider}::${c.model}`}>
                  {c.model} · {c.provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Leave on inherit for cheap stages and override only where quality matters.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Gate</Label>
              <p className="text-xs text-muted-foreground">
                A failing gate sends work back instead of finishing the run.
              </p>
            </div>
            <Switch
              checked={stage.isGate}
              disabled={busy}
              onCheckedChange={(isGate) => onChange({ ...stage, isGate })}
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Label>Runs after</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {allStages
            .filter((s) => s.id !== stage.id)
            .map((other) => {
              const on = stage.dependsOn.includes(other.id);
              return (
                <button
                  key={other.id}
                  disabled={busy}
                  onClick={() =>
                    onChange({
                      ...stage,
                      dependsOn: on
                        ? stage.dependsOn.filter((d) => d !== other.id)
                        : [...stage.dependsOn, other.id],
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    on
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-dashed border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {other.position}. {other.skill}
                </button>
              );
            })}
        </div>
        {stage.dependsOn.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            No dependencies — this stage starts in the first level.
          </p>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="secondary" size="sm" disabled={busy} onClick={onRemove}>
          <Trash2 className="size-3.5" /> Remove stage
        </Button>
      </div>
    </section>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsTab({
  detail,
  choices,
  categories,
  busy,
  onSave,
}: {
  detail: AgentDetail;
  choices: { provider: string; model: string }[];
  categories: Category[];
  busy: boolean;
  onSave: (body: Parameters<typeof api.updateAgent>[1], message: string) => void;
}) {
  const [guardrails, setGuardrails] = useState(detail.guardrails ?? "");
  const [role, setRole] = useState(detail.role);

  useEffect(() => {
    setGuardrails(detail.guardrails ?? "");
    setRole(detail.role);
  }, [detail.id, detail.guardrails, detail.role]);

  const value = detail.defaultModel ? `${detail.defaultProvider}::${detail.defaultModel}` : "__none__";

  return (
    <div className="space-y-4">
      <section className="panel p-5">
        <h3 className="font-semibold">Default model</h3>
        <p className="text-sm text-muted-foreground">
          Every stage uses this unless it sets its own.
        </p>
        <div className="mt-4 max-w-md">
          <Select
            value={value}
            onValueChange={(v) => {
              if (v === "__none__") {
                onSave({ defaultProvider: null, defaultModel: null }, "Default cleared");
                return;
              }
              const [provider, model] = v.split("::");
              onSave({ defaultProvider: provider!, defaultModel: model! }, "Default model set");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No default</SelectItem>
              {choices.map((c) => (
                <SelectItem key={`${c.provider}::${c.model}`} value={`${c.provider}::${c.model}`}>
                  {c.model} · {c.provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="font-semibold">Category</h3>
        <p className="text-sm text-muted-foreground">
          Determines which skills are suggested first in the pipeline builder.
        </p>
        <div className="mt-4 max-w-md">
          <Select
            value={detail.category ?? "__none__"}
            onValueChange={(v) =>
              onSave({ category: v === "__none__" ? null : v }, "Category saved")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="font-semibold">Role</h3>
        <div className="mt-3 flex max-w-xl gap-2">
          <Input value={role} onChange={(e) => setRole(e.target.value)} />
          <Button disabled={busy || role === detail.role} onClick={() => onSave({ role }, "Role saved")}>
            <Save className="size-4" />
          </Button>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="font-semibold">Guardrails</h3>
        <p className="text-sm text-muted-foreground">
          What this agent must not do. Carried into every stage's prompt.
        </p>
        <Textarea
          className="mt-3 min-h-32"
          value={guardrails}
          onChange={(e) => setGuardrails(e.target.value)}
          placeholder="Writes copy only. Never implies a published page exists."
        />
        <div className="mt-3 flex justify-end">
          <Button
            disabled={busy || guardrails === (detail.guardrails ?? "")}
            onClick={() => onSave({ guardrails: guardrails || null }, "Guardrails saved")}
          >
            <Save className="size-4" /> Save
          </Button>
        </div>
      </section>
    </div>
  );
}

// ─── Add stage / create agent ─────────────────────────────────────────────────

/**
 * Skills matching the agent's category are listed first under "Suggested".
 * Everything else stays available below rather than being filtered out — a
 * cross-category skill like gather-context belongs in most pipelines.
 */
function AddStage({
  skills,
  agentCategory,
  used,
  disabled,
  onAdd,
}: {
  skills: SkillSummary[];
  agentCategory: string | null;
  used: string[];
  disabled: boolean;
  onAdd: (slug: string) => void;
}) {
  const [value, setValue] = useState("");
  const available = skills.filter((s) => !used.includes(s.id));
  const suggested = agentCategory ? available.filter((s) => s.category === agentCategory) : [];
  const rest = available.filter((s) => !suggested.includes(s));

  if (skills.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No skills in the library yet — add one on the Skills tab.
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Add a skill as a stage…" />
        </SelectTrigger>
        <SelectContent>
          {suggested.length > 0 && (
            <>
              <p className="px-2 py-1.5 text-xs uppercase tracking-widest text-primary">
                Suggested
              </p>
              {suggested.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
              <p className="mt-1 border-t border-border px-2 pb-1.5 pt-2 text-xs uppercase tracking-widest text-muted-foreground">
                All skills
              </p>
            </>
          )}
          {rest.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
              {s.category ? ` · ${s.category}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="secondary"
        disabled={disabled || !value}
        onClick={() => {
          onAdd(value);
          setValue("");
        }}
      >
        <Plus className="size-4" /> Add stage
      </Button>
    </div>
  );
}

function CreateAgentDialog({
  choices,
  categories,
  onCreated,
}: {
  choices: { provider: string; model: string }[];
  categories: Category[];
  onCreated: (slug: string) => Promise<void>;
}) {
  const empty = { name: "", role: "", description: "", model: "", category: "" };
  const [draft, setDraft] = useState(empty);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!draft.name.trim()) return;
    setBusy(true);
    try {
      const { id } = await api.createAgent({
        name: draft.name,
        role: draft.role || "Custom agent",
        description: draft.description,
        model: draft.model || null,
        category: draft.category || null,
      });
      toast.success(`${draft.name} created`);
      setDraft(empty);
      await onCreated(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the agent");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create an agent</DialogTitle>
        <DialogDescription>Stages and knowledge can be added after.</DialogDescription>
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
          <Label>Category</Label>
          <Select
            value={draft.category}
            onValueChange={(category) => setDraft({ ...draft, category })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Skills in this category are suggested first when you build the pipeline.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Default model</Label>
          <Select value={draft.model} onValueChange={(model) => setDraft({ ...draft, model })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a model" />
            </SelectTrigger>
            <SelectContent>
              {choices.map((c) => (
                <SelectItem key={`${c.provider}::${c.model}`} value={c.model}>
                  {c.model} · {c.provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={create} disabled={busy}>
          {busy ? "Creating…" : "Create agent"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Run agent dialog ─────────────────────────────────────────────────────────

function RunAgentDialog({
  agent,
  onStarted,
}: {
  agent: AgentDetail;
  onStarted: (slug: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(
    `${agent.name} — ${new Date().toLocaleDateString()}`,
  );
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const input: Record<string, unknown> = {};
      for (const inp of agent.inputs) {
        const val = inputValues[inp.key];
        if (inp.required && (!val || !val.trim())) {
          toast.error(`"${inp.label}" is required.`);
          setBusy(false);
          return;
        }
        if (val) input[inp.key] = val;
      }

      const { slug } = await api.startRun(agent.id, title, input);
      toast.success("Run started");
      await onStarted(slug);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the run");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Run {agent.name}</DialogTitle>
        <DialogDescription>
          {agent.stages.length} stages · {agent.defaultModel ?? "default model"}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="run-title">Run title</Label>
          <Input
            id="run-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        {agent.inputs.map((inp) => (
          <div key={inp.key} className="space-y-2">
            <Label htmlFor={`input-${inp.key}`}>
              {inp.label}
              {inp.required && <span className="text-destructive"> *</span>}
            </Label>
            {inp.type === "textarea" ? (
              <Textarea
                id={`input-${inp.key}`}
                placeholder={inp.placeholder ?? ""}
                value={inputValues[inp.key] ?? ""}
                onChange={(e) =>
                  setInputValues((prev) => ({ ...prev, [inp.key]: e.target.value }))
                }
              />
            ) : (
              <Input
                id={`input-${inp.key}`}
                type={inp.type === "url" ? "url" : "text"}
                placeholder={inp.placeholder ?? ""}
                value={inputValues[inp.key] ?? ""}
                onChange={(e) =>
                  setInputValues((prev) => ({ ...prev, [inp.key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}
        {agent.inputs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            This agent has no configured inputs — it will run using its pipeline and
            knowledge bases.
          </p>
        )}
      </div>
      <DialogFooter>
        <Button onClick={start} disabled={busy}>
          <Play className="size-4" />
          {busy ? "Starting…" : "Start run"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
