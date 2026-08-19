import { createFileRoute, Link, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileText,
  ImageIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/Markdown";
import { toast } from "sonner";
import { api, type RunStage } from "@/lib/api";

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

function stageIcon(status: string) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "running":
      return <Loader2 className="size-4 animate-spin text-primary" />;
    case "error":
    case "failed":
      return <XCircle className="size-4 text-destructive" />;
    default:
      return <Circle className="size-4 text-muted-foreground" />;
  }
}

function RunDetail() {
  const { run: initialRun } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();
  const [run, setRun] = useState(initialRun);
  const [comments, setComments] = useState(initialRun.comments);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState(initialRun.attachments);
  const [stages, setStages] = useState<RunStage[]>(initialRun.stages ?? []);
  const [busy, setBusy] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE: connect when run is in progress
  useEffect(() => {
    if (run.status !== "running" && run.status !== "pending") return;

    const es = api.streamRunEvents(run.id);
    eventSourceRef.current = es;

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "stage_started") {
          setStages((prev) => {
            const existing = prev.find((s) => s.name === data.data?.name);
            if (existing) {
              return prev.map((s) =>
                s.name === data.data?.name ? { ...s, status: "running" as const } : s,
              );
            }
            return [
              ...prev,
              {
                id: data.data?.stageId ?? crypto.randomUUID(),
                name: data.data?.name ?? "Stage",
                position: data.data?.position ?? prev.length + 1,
                status: "running" as const,
                attempt: 1,
                model: null,
                inputTokens: 0,
                outputTokens: 0,
                costUsd: "0",
                output: null,
                error: null,
                startedAt: data.timestamp,
                finishedAt: null,
              },
            ];
          });
        }

        if (data.type === "stage_complete") {
          setStages((prev) =>
            prev.map((s) =>
              s.name === data.data?.name
                ? {
                    ...s,
                    status: "complete" as const,
                    model: data.data?.model ?? s.model,
                    inputTokens: data.data?.inputTokens ?? s.inputTokens,
                    outputTokens: data.data?.outputTokens ?? s.outputTokens,
                    costUsd: String(data.data?.costUsd ?? s.costUsd),
                    finishedAt: data.timestamp,
                  }
                : s,
            ),
          );
        }

        if (data.type === "stage_error" || data.type === "gate_failed") {
          setStages((prev) =>
            prev.map((s) =>
              s.name === data.data?.name
                ? { ...s, status: "error" as const, error: data.data?.error ?? data.data?.reason ?? null }
                : s,
            ),
          );
        }

        if (data.type === "run_complete" || data.type === "run_error" || data.type === "stream_end") {
          es.close();
          // Refresh the full run data
          try {
            const refreshed = await api.getRun(run.id);
            setRun(refreshed);
            setComments(refreshed.comments);
            setAttachments(refreshed.attachments);
            setStages(refreshed.stages ?? []);
          } catch {
            // fall through
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [run.id, run.status]);

  const post = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const created = await api.addComment(run.id, draft);
      setComments((prev) => [...prev, created]);
      setDraft("");
      toast.success("Comment added");
      await router.invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add the comment");
    } finally {
      setBusy(false);
    }
  };

  const rerun = async () => {
    setBusy(true);
    try {
      const { slug } = await api.rerunRun(run.id);
      toast.success("Re-run started");
      await navigate({ to: "/runs/$runId", params: { runId: slug } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not re-run");
    } finally {
      setBusy(false);
    }
  };

  const isLive = run.status === "running" || run.status === "pending";

  return (
    <AppShell
      title={run.title}
      subtitle={`${run.agent} · ${run.model || "pending"} · ${run.started} · ${run.duration}`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" asChild>
            <Link to="/runs">
              <ArrowLeft className="size-4" /> All results
            </Link>
          </Button>
          <Button
            disabled={busy || isLive}
            onClick={rerun}
          >
            <RefreshCw className="size-4" /> Re-run
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Status + metrics */}
          <section className="panel hero-gradient p-5">
            <div className="flex items-center gap-3">
              <Badge
                variant={run.status === "complete" ? "secondary" : "outline"}
                className={isLive ? "animate-pulse" : ""}
              >
                {isLive && <Loader2 className="mr-1 size-3 animate-spin" />}
                {run.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{run.id}</span>
            </div>
            <p className="mt-3 max-w-3xl text-sm">{run.summary || (isLive ? "Running…" : "")}</p>
            {run.metrics.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {run.metrics.map((m) => (
                  <div key={m.label} className="rounded-md border border-border bg-card/70 p-3">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="mt-1 text-lg font-semibold">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.hint}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Live stage progress */}
          {stages.length > 0 && (
            <section className="panel p-5">
              <h2 className="font-semibold">Pipeline stages</h2>
              <ul className="mt-4 space-y-3">
                {stages.map((s) => (
                  <li key={s.id} className="flex items-start gap-3">
                    <div className="mt-0.5">{stageIcon(s.status)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{s.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {s.status === "complete" && s.model ? `${s.model}` : ""}
                        </span>
                      </div>
                      {s.status === "complete" && (
                        <p className="text-xs text-muted-foreground">
                          {s.inputTokens + s.outputTokens} tokens · ${Number(s.costUsd).toFixed(4)}
                        </p>
                      )}
                      {s.error && (
                        <p className="mt-1 text-xs text-destructive">{s.error}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Report sections */}
          {run.sections.map((section) => (
            <section key={section.heading} className="panel p-5">
              <h2 className="font-semibold">{section.heading}</h2>
              <div className="mt-2 prose-sm text-sm text-muted-foreground">
                <Markdown source={section.body} />
              </div>
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

          {/* Sources */}
          {run.sources.length > 0 && (
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
          )}
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
                        on &quot;{c.anchor}&quot;
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
                  disabled={busy}
                  onChange={async (e) => {
                    const picked = Array.from(e.target.files ?? []);
                    if (picked.length === 0) return;
                    setBusy(true);
                    try {
                      const { attachments: saved } = await api.uploadRunAttachments(run.id, picked);
                      setAttachments((prev) => [...prev, ...saved]);
                      toast.success(`${saved.length} file(s) attached`);
                      await router.invalidate();
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Upload failed");
                    } finally {
                      setBusy(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
              <Button size="sm" disabled={busy} onClick={post}>
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
