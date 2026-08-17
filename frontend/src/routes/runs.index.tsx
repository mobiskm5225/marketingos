import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Cpu, FileBarChart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

export const Route = createFileRoute("/runs/")({
  head: () => ({
    meta: [
      { title: "Results — Marketing OS" },
      {
        name: "description",
        content: "Every agent run, its report, sources, attachments and review comments.",
      },
      { property: "og:title", content: "Results — Marketing OS" },
      {
        property: "og:description",
        content: "Every agent run, its report, sources, attachments and review comments.",
      },
    ],
  }),
  loader: async () => {
    const runs = await api.getRuns();
    return { runs };
  },
  component: RunsPage,
});

function RunsPage() {
  const { runs } = Route.useLoaderData();
  return (
    <AppShell title="Results" subtitle="What the agents produced, and what still needs a human.">
      <div className="space-y-4">
        {runs.length === 0 && (
          <div className="panel flex flex-col items-center gap-2 border-dashed p-10 text-center">
            <FileBarChart className="size-6 text-primary" />
            <p className="font-medium">No results yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Every agent run lands here with its report, the sources it used and any review
              comments. Run an agent to see the first one.
            </p>
          </div>
        )}
        {runs.map((run) => (
          <Link
            key={run.id}
            to="/runs/$runId"
            params={{ runId: run.id }}
            className="panel block p-5 transition-colors hover:border-primary/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{run.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{run.summary}</p>
              </div>
              <Badge variant={run.status === "complete" ? "secondary" : "outline"}>
                {run.status}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>{run.agent}</span>
              <span className="flex items-center gap-1">
                <Cpu className="size-3" /> {run.model}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {run.started} · {run.duration}
              </span>
              <span>{run.comments.length} comments</span>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
