import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileUp, Layers, Plus, RefreshCw, Bot, Database, FileText, Globe, Trash2, Pin, PinOff, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  api,
  type CoreMemoryItem,
  type Integration,
  type IntegrationField,
  type KnowledgeDocument,
} from "@/lib/api";

const iconMap: Record<string, any> = { Database, FileText, Globe };
const getIcon = (name: string) => iconMap[name] || Bot;

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge base — Marketing OS" },
      {
        name: "description",
        content: "Connect Notion, Obsidian and Microsoft Office, upload files, and build layered agent memory.",
      },
      { property: "og:title", content: "Knowledge base — Marketing OS" },
      {
        property: "og:description",
        content: "Connect Notion, Obsidian and Office, upload files, build layered agent memory.",
      },
    ],
  }),
  loader: async () => {
    const [knowledgeBases, integrations, memory, integrationFields, coreMemory] = await Promise.all([
      api.getKnowledgeBases(),
      api.getIntegrations(),
      api.getMemoryLayers(),
      api.getIntegrationFields(),
      api.getCoreMemory().catch(() => []),
    ]);
    return { knowledgeBases, integrations, memory, integrationFields, coreMemory };
  },
  component: KnowledgePage,
});

function KnowledgePage() {
  const { knowledgeBases, integrations, memory, integrationFields, coreMemory } = Route.useLoaderData();
  const [connecting, setConnecting] = useState<Integration | null>(null);
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(knowledgeBases[0]?.id ?? "");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [coreEntries, setCoreEntries] = useState<CoreMemoryItem[]>(coreMemory);
  const [coreSaving, setCoreSaving] = useState(false);
  const memoryLayers = memory.layers;
  const maxLayerCount = Math.max(1, ...memoryLayers.map((l) => l.count));

  const reload = async () => {
    await router.invalidate();
    if (target) setDocuments(await api.getDocuments(target).catch(() => []));
    api.getCoreMemory().then(setCoreEntries).catch(() => {});
  };

  useEffect(() => {
    setCoreEntries(coreMemory);
  }, [coreMemory]);

  useEffect(() => {
    if (!target) return;
    api.getDocuments(target).then(setDocuments).catch(() => setDocuments([]));
  }, [target]);

  return (
    <AppShell
      title="Knowledge"
      subtitle="Sources, uploads and the layered memory your agents actually read."
      action={
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await api.syncAll();
              toast.success(result.message ?? `Synced ${result.synced} source(s)`);
              await reload();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Sync failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <RefreshCw className="size-4" /> {busy ? "Syncing…" : "Sync all"}
        </Button>
      }
    >
      <Tabs defaultValue="bases">
        <div className="overflow-x-auto">
          <TabsList className="mb-0">
            <TabsTrigger value="bases">Bases</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="memory">Memory builder</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="bases" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {knowledgeBases.map((kb) => (
              <div key={kb.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
                      {(() => {
                        const Icon = getIcon(kb.icon);
                        return <Icon className="size-4 text-primary" />;
                      })()}
                    </span>
                    <div>
                      <p className="font-medium">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">{kb.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{kb.type}</Badge>
                    <button
                      aria-label={`Delete ${kb.name}`}
                      disabled={busy}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-muted"
                      onClick={async () => {
                        if (!confirm(`Delete knowledge base "${kb.name}" and all its documents?`)) return;
                        setBusy(true);
                        try {
                          await api.deleteKnowledgeBase(kb.id);
                          toast.success(`${kb.name} deleted`);
                          await reload();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Could not delete knowledge base");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Docs</p>
                    <p className="font-medium">{kb.docs}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Chunks</p>
                    <p className="font-medium">{kb.chunks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Updated</p>
                    <p className="font-medium">{kb.updated}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {kb.usedBy.length > 0 ? `Used by ${kb.usedBy.join(", ")}` : "Not used by any agent yet"}
                </p>
              </div>
            ))}
            <div className="panel flex flex-col items-start justify-center gap-3 border-dashed p-5">
              <Layers className="size-5 text-primary" />
              <p className="text-sm font-medium">New knowledge base</p>
              <div className="flex w-full gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Customer interviews"
                />
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (!name.trim()) return;
                    setBusy(true);
                    try {
                      const { id } = await api.createKnowledgeBase({ name });
                      toast.success(`${name} created`);
                      setName("");
                      setTarget(id);
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not create");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.map((i) => (
              <div key={i.id} className="panel flex items-start justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{i.name}</p>
                    {i.status === "connected" && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{i.blurb}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{i.detail}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {i.status === "connected" && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const r = await api.syncIntegration(i.id);
                          toast.success(
                            `${r.added} added, ${r.replaced} refreshed, ${r.chunks} chunks`,
                          );
                          await reload();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Sync failed");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Sync
                    </Button>
                  )}
                  <Button
                    variant={i.status === "connected" ? "secondary" : "default"}
                    onClick={() => setConnecting(i)}
                  >
                    {i.status === "connected" ? "Manage" : "Connect"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <div className="panel hero-gradient p-5">
            <h3 className="font-semibold">Layered memory</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Raw files are not a knowledge base. Sources get summarised into notes, get
              distilled into deduped facts, and only the essentials stay in core memory that every
              agent carries into every run.
            </p>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {memoryLayers.map((layer, idx) => (
              <div key={layer.key} className="panel p-5">
                <p className="text-xs uppercase tracking-widest text-primary">
                  Layer {idx + 1}
                </p>
                <p className="mt-2 font-medium">{layer.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{layer.blurb}</p>
                <p className="mt-4 text-sm font-medium">
                  {layer.count.toLocaleString()} {layer.unit}
                </p>
                <Progress
                  value={maxLayerCount ? (layer.count / maxLayerCount) * 100 : 0}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
          <div className="panel mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">
              {memory.lastDistillation
                ? `Last pass: ${memory.lastDistillation.status} · ${memory.lastDistillation.factsAdded} new facts, ${memory.lastDistillation.conflictsResolved} conflicts resolved.`
                : "No distillation pass has run yet."}
              {!memory.embeddingsAvailable &&
                " Embeddings are unavailable, so retrieval falls back to keyword search."}
            </p>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await api.distill();
                  // A pass that could not run reports why rather than claiming success.
                  if (result.skipped) toast.error(result.skipped);
                  else
                    toast.success(
                      `${result.notesWritten} notes, ${result.factsAdded} facts, ${result.conflictsResolved} conflicts resolved`,
                    );
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Distillation failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Running…" : "Run distillation"}
            </Button>
          </div>

          {/* Core Memory Editor (Layer 4) */}
          <section className="panel mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Pin className="size-4 text-primary" /> Core Memory Essentials
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Brand voice, ICP, positioning, and non-negotiables that every agent receives in every prompt.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCoreEntries((prev) => [
                      ...prev,
                      { key: "New fact or guideline", value: "", pinned: true },
                    ]);
                  }}
                >
                  <Plus className="size-3.5 mr-1" /> Add Entry
                </Button>
                <Button
                  size="sm"
                  disabled={coreSaving}
                  onClick={async () => {
                    setCoreSaving(true);
                    try {
                      const valid = coreEntries.filter((e) => e.key.trim() && e.value.trim());
                      await api.saveCoreMemory(valid);
                      toast.success(`Saved ${valid.length} core memory entries`);
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not save core memory");
                    } finally {
                      setCoreSaving(false);
                    }
                  }}
                >
                  <Save className="size-3.5 mr-1" /> {coreSaving ? "Saving…" : "Save Memory"}
                </Button>
              </div>
            </div>

            {coreEntries.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No core memory defined yet. Click <strong>Add Entry</strong> to define brand voice, target customer, or constraints that all agents must respect.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {coreEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Input
                        className="font-medium text-sm h-8 max-w-sm"
                        value={entry.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoreEntries((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, key: val } : item)),
                          );
                        }}
                        placeholder="e.g. Brand Voice & Tone"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                            entry.pinned
                              ? "border-primary/50 text-primary bg-primary/10"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => {
                            setCoreEntries((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, pinned: !item.pinned } : item,
                              ),
                            );
                          }}
                        >
                          {entry.pinned ? <Pin className="size-3" /> : <PinOff className="size-3" />}
                          {entry.pinned ? "Pinned" : "Optional"}
                        </button>
                        <button
                          type="button"
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => {
                            setCoreEntries((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <Textarea
                      rows={2}
                      className="text-xs resize-y"
                      value={entry.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCoreEntries((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, value: val } : item)),
                        );
                      }}
                      placeholder="e.g. Direct, authoritative, founder-to-founder. Never use hype words or corporate buzzwords."
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <div className="panel p-5">
            {knowledgeBases.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Create a knowledge base first — uploads are indexed into one.
              </p>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Index into
                  </span>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {knowledgeBases.map((kb) => (
                        <SelectItem key={kb.id} value={kb.id}>
                          {kb.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center">
                  <FileUp className="size-5 text-primary" />
                  <span className="text-sm font-medium">
                    {busy ? "Indexing…" : "Drop documents"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, DOCX, XLSX, CSV, MD, TXT — parsed, chunked and embedded
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    disabled={busy || !target}
                    onChange={async (e) => {
                      const picked = Array.from(e.target.files ?? []);
                      if (picked.length === 0) return;
                      setBusy(true);
                      try {
                        const result = await api.uploadDocuments(target, picked);
                        toast.success(
                          `${result.indexed} indexed · ${result.chunks} chunks` +
                            (result.embeddingsAvailable && !result.embedded
                              ? " · embeddings unavailable, keyword search only"
                              : ""),
                        );
                        await reload();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Upload failed");
                      } finally {
                        setBusy(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>

                {documents.length === 0 ? (
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    No files in this base yet.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {documents.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-3 py-3 text-sm">
                        <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {doc.chunks} chunk{doc.chunks === 1 ? "" : "s"}
                        </span>
                        <Badge
                          variant="outline"
                          className={doc.status === "error" ? "border-destructive/50 text-destructive" : ""}
                          title={doc.error ?? undefined}
                        >
                          {doc.status}
                        </Badge>
                        <button
                          aria-label={`Delete ${doc.name}`}
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await api.deleteDocument(doc.id);
                              await reload();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Could not delete");
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ConnectDialog
        integration={connecting}
        fields={integrationFields.find((f) => f.id === connecting?.id)?.fields ?? []}
        onClose={() => setConnecting(null)}
        onDone={async () => {
          setConnecting(null);
          await reload();
        }}
      />
    </AppShell>
  );
}

/**
 * Renders whatever fields the connector declares, so adding a new source needs
 * no frontend change. Secret values are write-only — they are encrypted server
 * side and never sent back, so an existing credential shows as a placeholder.
 */
function ConnectDialog({
  integration,
  fields,
  onClose,
  onDone,
}: {
  integration: Integration | null;
  fields: IntegrationField[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);

  if (integration && integration.id !== lastId) {
    setLastId(integration.id);
    setValues({});
  }

  if (!integration) return null;
  const supported = fields.length > 0;

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const connect = async () => {
    setBusy(true);
    try {
      const result = await api.connectIntegration(integration.id, values);
      toast.success(result.detail);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not connect");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await api.disconnectIntegration(integration.id);
      toast.success(`${integration.name} disconnected`);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disconnect");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{integration.name}</DialogTitle>
          <DialogDescription>{integration.blurb}</DialogDescription>
        </DialogHeader>

        {supported ? (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    className="min-h-28 font-mono text-xs"
                    value={values[field.key] ?? ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === "password" ? "password" : "text"}
                    autoComplete="off"
                    value={values[field.key] ?? ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
                {field.help && (
                  <p className="text-xs text-muted-foreground">{field.help}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {integration.name} needs a signed-in account, which this platform does not support
            yet. Use Notion, Obsidian or Google Drive, or upload files directly.
          </p>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {integration.status === "connected" && (
              <Button variant="secondary" disabled={busy} onClick={disconnect}>
                Disconnect
              </Button>
            )}
          </div>
          {supported && (
            <Button disabled={busy} onClick={connect}>
              {busy ? "Connecting…" : "Connect"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
