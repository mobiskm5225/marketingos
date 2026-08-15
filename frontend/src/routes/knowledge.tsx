import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileUp, Layers, Plus, RefreshCw, Bot, Database, FileText, Globe } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { api } from "@/lib/api";

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
    const [knowledgeBases, integrations] = await Promise.all([
      api.getKnowledgeBases(),
      api.getIntegrations(),
    ]);
    return { knowledgeBases, integrations };
  },
  component: KnowledgePage,
});

const memoryLayers = [
  { key: "raw", title: "Raw context", blurb: "Everything dropped in as-is: docs, transcripts, exports, crawls.", stat: "511 files" },
  { key: "notes", title: "Working notes", blurb: "Agent-written summaries of each source, refreshed on every sync.", stat: "1,204 notes" },
  { key: "distilled", title: "Distilled facts", blurb: "Deduped, conflict-checked statements the agents treat as truth.", stat: "386 facts" },
  { key: "core", title: "Core memory", blurb: "Always-in-prompt essentials: brand voice, ICP, non-negotiables.", stat: "18 entries" },
];

function KnowledgePage() {
  const { knowledgeBases, integrations } = Route.useLoaderData();
  const [files, setFiles] = useState<string[]>([
    "q3-campaign-results.csv",
    "brand-voice-guide.pdf",
    "webinar-transcript.docx",
  ]);
  const [name, setName] = useState("");

  return (
    <AppShell
      title="Knowledge"
      subtitle="Sources, uploads and the layered memory your agents actually read."
      action={
        <Button onClick={() => toast.success("Sync started for all sources")}>
          <RefreshCw className="size-4" /> Sync all
        </Button>
      }
    >
      <Tabs defaultValue="bases">
        <TabsList>
          <TabsTrigger value="bases">Bases</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="memory">Memory builder</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

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
                  <Badge variant="outline">{kb.type}</Badge>
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
                  Used by {kb.usedBy.join(", ")}
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
                  onClick={() => {
                    if (!name.trim()) return;
                    toast.success(`${name} created`);
                    setName("");
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
                <Button
                  variant={i.status === "connected" ? "secondary" : "default"}
                  onClick={() =>
                    toast.success(
                      i.status === "connected" ? `${i.name} re-synced` : `Connect ${i.name}`,
                    )
                  }
                >
                  {i.status === "connected" ? "Manage" : "Connect"}
                </Button>
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
                <p className="mt-4 text-sm font-medium">{layer.stat}</p>
                <Progress value={100 - idx * 22} className="mt-2" />
              </div>
            ))}
          </div>
          <div className="panel mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">
              Last distillation pass: today 08:30 · 42 new facts, 6 conflicts resolved.
            </p>
            <Button variant="secondary" onClick={() => toast.success("Distillation pass queued")}>
              Run distillation
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <div className="panel p-5">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center">
              <FileUp className="size-5 text-primary" />
              <span className="text-sm font-medium">Drop images or documents</span>
              <span className="text-xs text-muted-foreground">
                PDF, DOCX, XLSX, MD, PNG — indexed into the selected base
              </span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const names = Array.from(e.target.files ?? []).map((f) => f.name);
                  if (names.length) {
                    setFiles((prev) => [...names, ...prev]);
                    toast.success(`${names.length} file(s) queued for indexing`);
                  }
                }}
              />
            </label>
            <ul className="mt-4 divide-y divide-border">
              {files.map((f) => (
                <li key={f} className="flex items-center justify-between py-3 text-sm">
                  <span>{f}</span>
                  <Badge variant="outline">indexed</Badge>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
