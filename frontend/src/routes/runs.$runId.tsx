import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, ImageIcon, Paperclip, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api, type Run } from "@/lib/api";

export const Route = createFileRoute("/runs/$runId")({
  loader: async ({ params }) => {
    try {
      const run = await api.getRun(params.runId);
      return { run };
    } catch (e) {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.run.title} — Marketing OS` : "Result — Marketing OS";
    const description = loaderData?.run.summary ?? "Agent run report.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: RunDetail,
});

function RunDetail() {
  const { run } = Route.useLoaderData();
  const [comments, setComments] = useState(run.comments);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState(run.attachments);

  const post = () => {
    if (!draft.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `c${prev.length + 1}`, author: "You", initials: "YO", time: "just now", body: draft },
    ]);
    setDraft("");
    toast.success("Comment added — agent will re-run affected sections");
  };

  return (
    <AppShell
      title={run.title}
      subtitle={`${run.agent} · ${run.model} · ${run.started} · ${run.duration}`}
      action={
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <Link to="/runs">
              <ArrowLeft className="size-4" /> All results
            </Link>
          </Button>
          <Button onClick={() => toast.success("Re-run queued with the latest comments")}>
            Re-run with edits
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="panel hero-gradient p-5">
            <div className="flex items-center gap-3">
              <Badge variant={run.status === "complete" ? "secondary" : "outline"}>
                {run.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{run.id}</span>
            </div>
            <p className="mt-3 max-w-3xl text-sm">{run.summary}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {run.metrics.map((m) => (
                <div key={m.label} className="rounded-md border border-border bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="mt-1 text-lg font-semibold">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.hint}</p>
                </div>
              ))}
            </div>
          </section>

          {run.sections.map((section) => (
            <section key={section.heading} className="panel p-5">
              <h2 className="font-semibold">{section.heading}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.body}</p>
              {section.bullets && (
                <ul className="mt-3 space-y-2 text-sm">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {comments.some((c) => c.anchor === section.heading) && (
                <p className="mt-3 text-xs text-primary">
                  {comments.filter((c) => c.anchor === section.heading).length} comment on this
                  section
                </p>
              )}
            </section>
          ))}

          <section className="panel p-5">
            <h2 className="font-semibold">Sources used</h2>
            <ul className="mt-3 divide-y divide-border text-sm">
              {run.sources.map((s) => (
                <li key={s.name} className="flex items-center justify-between py-2.5">
                  <span>{s.name}</span>
                  <Badge variant="outline">{s.kind}</Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="panel flex flex-col p-5">
            <h2 className="font-semibold">Comments</h2>
            <p className="text-xs text-muted-foreground">
              Twist the output — the agent reads these on the next run.
            </p>
            <ul className="mt-4 space-y-4">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                    {c.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {c.author} · {c.time}
                    </p>
                    {c.anchor && (
                      <p className="mt-1 border-l-2 border-primary/60 pl-2 text-xs text-primary">
                        on "{c.anchor}"
                      </p>
                    )}
                    <p className="mt-1 text-sm">{c.body}</p>
                  </div>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="text-sm text-muted-foreground">No comments yet.</li>
              )}
            </ul>
            <Textarea
              className="mt-4"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask for a change…"
            />
            <div className="mt-2 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="size-3.5" /> Attach
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const added = Array.from(e.target.files ?? []).map((f) => ({
                      name: f.name,
                      kind: (f.type.startsWith("image/") ? "image" : "doc") as "image" | "doc",
                      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
                    }));
                    if (added.length) {
                      setAttachments((prev) => [...prev, ...added]);
                      toast.success(`${added.length} file(s) attached`);
                    }
                  }}
                />
              </label>
              <Button size="sm" onClick={post}>
                <Send className="size-3.5" /> Comment
              </Button>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="font-semibold">Attachments</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {attachments.map((a) => (
                <li
                  key={a.name}
                  className="flex items-center gap-2 rounded-md border border-border p-2.5"
                >
                  {a.kind === "image" ? (
                    <ImageIcon className="size-4 text-accent" />
                  ) : (
                    <FileText className="size-4 text-primary" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.size}</span>
                </li>
              ))}
              {attachments.length === 0 && (
                <li className="text-sm text-muted-foreground">Nothing attached yet.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
