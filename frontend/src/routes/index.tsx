import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, Brain, Cpu, FileBarChart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marketing OS — Agent workspace overview" },
      {
        name: "description",
        content:
          "Build marketing agents, wire them to knowledge bases and models, and review every result in one workspace.",
      },
      { property: "og:title", content: "Marketing OS — Agent workspace overview" },
      {
        property: "og:description",
        content: "Agents, knowledge bases, models and reports for a small marketing team.",
      },
    ],
  }),
  loader: async () => {
    const [agents, knowledgeBases, modelProviders, runs, activity] = await Promise.all([
      api.getAgents(),
      api.getKnowledgeBases(),
      api.getModels(),
      api.getRuns(),
      api.getActivity(),
    ]);
    return { agents, knowledgeBases, modelProviders, runs, activity };
  },
  component: Index,
});

function Index() {
  const { agents, knowledgeBases, modelProviders, runs, activity } = Route.useLoaderData();

  const stats = [
    { label: "Agents", value: agents.length, icon: Bot, to: "/agents" as const },
    { label: "Knowledge bases", value: knowledgeBases.length, icon: Brain, to: "/knowledge" as const },
    {
      label: "Model providers",
      value: modelProviders.filter((m) => m.status === "connected").length,
      icon: Cpu,
      to: "/models" as const,
    },
    { label: "Runs this week", value: runs.length, icon: FileBarChart, to: "/runs" as const },
  ];

  return (
    <AppShell
      title="Overview"
      subtitle="Everything your marketing agents know, use and produce."
      action={
        <Button asChild>
          <Link to="/agents">New agent</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="panel hero-gradient p-6">
          <p className="text-xs uppercase tracking-widest text-primary">Northstar workspace</p>
          <h2 className="mt-2 max-w-2xl text-2xl font-semibold">
            Five agents, four knowledge bases, one place to review the work.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Give an agent skills, point it at the memory you trust, pick a model, then read the
            report and comment inline where it needs a twist.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="panel p-4 transition-colors hover:border-primary/50">
              <s.icon className="size-4 text-primary" />
              <p className="mt-3 text-2xl font-semibold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="panel p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Latest results</h3>
              <Link to="/runs" className="flex items-center gap-1 text-sm text-primary">
                All results <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {runs.map((run) => (
                <li key={run.id}>
                  <Link
                    to="/runs/$runId"
                    params={{ runId: run.id }}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{run.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.agent} · {run.started} · {run.duration}
                      </p>
                    </div>
                    <Badge variant={run.status === "complete" ? "secondary" : "outline"}>
                      {run.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Activity</h3>
            <ul className="mt-4 space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p>{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
