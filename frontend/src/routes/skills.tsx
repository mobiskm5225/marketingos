import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Blocks,
  FileUp,
  Github,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, type ImportPreview, type SkillSummary } from "@/lib/api";

export const Route = createFileRoute("/skills")({
  head: () => ({
    meta: [
      { title: "Skills — Marketing OS" },
      {
        name: "description",
        content:
          "Author reusable skills as markdown, or import them from a folder or a GitHub repository.",
      },
      { property: "og:title", content: "Skills — Marketing OS" },
      {
        property: "og:description",
        content: "The skill library your agents are built from.",
      },
    ],
  }),
  loader: async () => {
    const [skills, categories] = await Promise.all([api.getSkills(), api.getCategories()]);
    return { skills, categories };
  },
  component: SkillsPage,
});

/** The scaffold a new skill starts from — the section contract agents rely on. */
const TEMPLATE = `---
name: my-skill
description: One sentence on what this skill does and when the pipeline should reach for it.
---

# My Skill

## When to use

## Inputs

## Preconditions

## Process

1.

## Output contract

## Done when
`;

const sourceTone: Record<SkillSummary["source"], string> = {
  manual: "border-border text-muted-foreground",
  folder: "border-primary/40 text-primary",
  github: "border-accent/40 text-accent",
};

function SkillsPage() {
  const { skills, categories } = Route.useLoaderData();
  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("__all__");
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = skills.filter((s) => {
    const matchesQuery = `${s.name} ${s.description} ${s.category ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory = filterCategory === "__all__" || s.category === filterCategory;
    return matchesQuery && matchesCategory;
  });

  const open = async (slug: string) => {
    try {
      const skill = await api.getSkill(slug);
      setSelected(slug);
      setBody(skill.bodyMd);
      setCategory(skill.category ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open that skill");
    }
  };

  const startNew = () => {
    setSelected("");
    setBody(TEMPLATE);
    setCategory("");
  };

  const save = async () => {
    setBusy(true);
    try {
      if (selected) {
        await api.updateSkill(selected, body, category || null);
        toast.success("Skill saved");
      } else {
        const { id } = await api.createSkill(body, category || null);
        setSelected(id);
        toast.success("Skill created");
      }
      await router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api.deleteSkill(selected);
      setSelected(null);
      setBody("");
      toast.success("Skill deleted");
      await router.invalidate();
    } catch (e) {
      // A skill still used by an agent's pipeline reports which agents block it.
      toast.error(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  };

  const editing = selected !== null;

  return (
    <AppShell
      title="Skills"
      subtitle="The reusable units agents are built from. Each one is a markdown document with its own contract."
      action={
        <div className="flex gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <FileUp className="size-4" /> Import
              </Button>
            </DialogTrigger>
            <ImportDialog
              onDone={async () => {
                setImportOpen(false);
                await router.invalidate();
              }}
            />
          </Dialog>
          <Button onClick={startNew}>
            <Plus className="size-4" /> New skill
          </Button>
        </div>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-3 lg:sticky lg:top-[104px] lg:h-[calc(100vh-128px)] lg:overflow-y-auto lg:pr-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {skills.length === 0 && (
            <div className="panel flex flex-col items-center gap-2 border-dashed p-8 text-center">
              <Wrench className="size-5 text-primary" />
              <p className="text-sm font-medium">No skills yet</p>
              <p className="text-xs text-muted-foreground">
                Import an agent folder or a GitHub repository, or write one by hand.
              </p>
            </div>
          )}

          {filtered.map((skill) => (
            <button
              key={skill.id}
              onClick={() => open(skill.id)}
              className={`panel w-full p-4 text-left transition-colors ${
                skill.id === selected ? "border-primary/60" : "hover:border-border/80"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{skill.name}</p>
                <Badge variant="outline" className={sourceTone[skill.source]}>
                  {skill.source}
                </Badge>
              </div>
              {skill.description && (
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                  {skill.description}
                </p>
              )}
              {skill.category && (
                <p className="mt-2 text-xs uppercase tracking-widest text-primary">
                  {skill.category}
                </p>
              )}
            </button>
          ))}

          {skills.length > 0 && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing matches “{query}”.</p>
          )}
        </div>

        {editing ? (
          <div className="space-y-4 lg:sticky lg:top-[104px] lg:h-[calc(100vh-128px)] lg:overflow-y-auto lg:pl-1 lg:pr-2">
            <div className="panel flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">{selected || "New skill"}</p>
                <p className="text-xs text-muted-foreground">
                  The frontmatter <code className="font-mono">name</code> becomes the skill's
                  identity.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={category || "__none__"} onValueChange={(v) => setCategory(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="w-40 sm:w-44">
                    <SelectValue placeholder="Category" />
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
                {selected && (
                  <Button variant="secondary" onClick={remove} disabled={busy}>
                    <Trash2 className="size-4" /> Delete
                  </Button>
                )}
                <Button onClick={save} disabled={busy}>
                  <Save className="size-4" /> {busy ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="panel p-4">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Markdown
                </Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  spellCheck={false}
                  className="mt-2 min-h-[520px] font-mono text-xs leading-relaxed"
                />
              </div>
              <div className="panel p-4">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Preview
                </Label>
                <div className="mt-2 max-h-[520px] overflow-y-auto pr-1">
                  <Markdown source={body} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center lg:sticky lg:top-[104px]">
            <Blocks className="size-6 text-primary" />
            <p className="font-medium">Pick a skill to edit</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              A skill states when to use it, what it takes in, what it produces, and when it is
              done. Agents chain them into a pipeline.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Import ───────────────────────────────────────────────────────────────────

function ImportDialog({ onDone }: { onDone: () => Promise<void> }) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [source, setSource] = useState<"folder" | "github">("folder");
  const [sourceRef, setSourceRef] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const runImport = async (fn: () => Promise<ImportPreview>, kind: "folder" | "github", ref: string) => {
    setBusy(true);
    try {
      const result = await fn();
      setPreview(result);
      setSource(kind);
      setSourceRef(ref);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const result = await api.commitImport(preview, source, sourceRef);
      toast.success(
        `Imported ${result.agent} — ${result.skillsCreated} new skills, ${result.skillsReused} reused`,
      );
      setPreview(null);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the import");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Import skills</DialogTitle>
        <DialogDescription>
          Nothing is saved until you review the proposed pipeline below.
        </DialogDescription>
      </DialogHeader>

      {preview ? (
        <PreviewPane preview={preview} busy={busy} onBack={() => setPreview(null)} onCommit={commit} />
      ) : (
        <Tabs defaultValue="folder">
          <TabsList>
            <TabsTrigger value="folder">Folder</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
          </TabsList>

          <TabsContent value="folder" className="mt-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center">
              <FileUp className="size-5 text-primary" />
              <span className="text-sm font-medium">
                {busy ? "Reading…" : "Choose a .zip of the agent folder"}
              </span>
              <span className="text-xs text-muted-foreground">
                Expects <code className="font-mono">skills/&lt;name&gt;/SKILL.md</code>. An
                AGENT.md and references/ are used when present, and a parent agent is generated
                when there isn’t one.
              </span>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void runImport(() => api.importFromFolder(file), "folder", file.name);
                }}
              />
            </label>
          </TabsContent>

          <TabsContent value="github" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="repo">Repository or folder URL</Label>
              <Input
                id="repo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/tree/main/agents/my-agent"
              />
            </div>
            <Button
              disabled={busy || !url.trim()}
              onClick={() => void runImport(() => api.importFromGithub(url), "github", url)}
            >
              <Github className="size-4" /> {busy ? "Fetching…" : "Fetch skills"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Public repositories only. Set <code className="font-mono">GITHUB_TOKEN</code> on the
              backend to raise the rate limit.
            </p>
          </TabsContent>
        </Tabs>
      )}
    </DialogContent>
  );
}

/**
 * Groups stages into execution levels the same way the runtime will: a level
 * contains only stages whose dependencies are already satisfied, so everything
 * shown side by side can run in parallel.
 */
function toLevels(stages: ImportPreview["stages"]): ImportPreview["stages"][] {
  const remaining = new Map(stages.map((s) => [s.position, s]));
  const done = new Set<number>();
  const levels: ImportPreview["stages"][] = [];

  while (remaining.size > 0) {
    const ready = [...remaining.values()].filter((s) =>
      s.dependsOn.every((d) => done.has(d) || !remaining.has(d)),
    );
    if (ready.length === 0) break; // cycle — the rest is shown as leftovers
    ready.forEach((s) => remaining.delete(s.position));
    ready.forEach((s) => done.add(s.position));
    levels.push(ready.sort((a, b) => a.position - b.position));
  }

  if (remaining.size > 0) levels.push([...remaining.values()]);
  return levels;
}

function PreviewPane({
  preview,
  busy,
  onBack,
  onCommit,
}: {
  preview: ImportPreview;
  busy: boolean;
  onBack: () => void;
  onCommit: () => void;
}) {
  const levels = toLevels(preview.stages);

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">{preview.agent.name}</p>
            <p className="text-xs text-muted-foreground">
              {preview.skills.length} skills · {preview.references.length} references ·{" "}
              {preview.stages.length} stages
            </p>
          </div>
          {preview.agent.generated && <Badge variant="outline">AGENT.md generated</Badge>}
        </div>
      </div>

      {preview.warnings.map((warning) => (
        <div
          key={warning}
          className="flex gap-2 rounded-md border border-accent/40 bg-accent/5 p-3 text-xs"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-accent" />
          <span>{warning}</span>
        </div>
      ))}

      <div className="panel max-h-[320px] overflow-y-auto p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Proposed pipeline
        </p>
        <div className="mt-3 space-y-3">
          {levels.map((level, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="mt-1 w-16 shrink-0 text-xs text-muted-foreground">
                Level {i + 1}
              </span>
              <div className="flex flex-1 flex-wrap gap-2">
                {level.map((stage) => (
                  <div
                    key={stage.position}
                    className={`rounded-md border px-2.5 py-1.5 text-xs ${
                      stage.isGate ? "border-accent/50 bg-accent/5" : "border-border bg-secondary/40"
                    }`}
                  >
                    <span className="text-muted-foreground">{stage.position}.</span>{" "}
                    <span className="font-medium">{stage.skillSlug}</span>
                    {stage.isGate && <span className="ml-1.5 text-accent">gate</span>}
                    {stage.dependsOn.length > 0 && (
                      <span className="ml-1.5 text-muted-foreground">
                        ← {stage.dependsOn.join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Stages on the same level have no dependency on each other and run in parallel.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button onClick={onCommit} disabled={busy}>
          {busy ? "Saving…" : `Import ${preview.skills.length} skills`}
        </Button>
      </div>
    </div>
  );
}
