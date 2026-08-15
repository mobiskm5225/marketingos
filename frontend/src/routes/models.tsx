import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Cloud, Server } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Models — Marketing OS" },
      {
        name: "description",
        content: "Connect Claude, ChatGPT, Gemini or a self-hosted open-source model and set run defaults.",
      },
      { property: "og:title", content: "Models — Marketing OS" },
      { property: "og:description", content: "Hosted APIs and open-source endpoints your agents can run on." },
    ],
  }),
  loader: async () => {
    const modelProviders = await api.getModels();
    return { modelProviders };
  },
  component: ModelsPage,
});

function ModelsPage() {
  const { modelProviders } = Route.useLoaderData();
  const [temperature, setTemperature] = useState([0.4]);
  const [fallback, setFallback] = useState(true);
  const [endpoint, setEndpoint] = useState("http://localhost:11434");

  return (
    <AppShell
      title="Models"
      subtitle="Hosted APIs and open-source endpoints available to your agents."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          {modelProviders.map((p) => (
            <div key={p.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-md bg-secondary">
                    {p.kind === "Open source" ? (
                      <Server className="size-4 text-accent" />
                    ) : (
                      <Cloud className="size-4 text-primary" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.kind}</p>
                  </div>
                </div>
                <Badge variant={p.status === "connected" ? "secondary" : "outline"}>
                  {p.status}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.models.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{p.note}</p>
                <Button
                  size="sm"
                  variant={p.status === "connected" ? "secondary" : "default"}
                  onClick={() => toast.success(`${p.name} settings opened`)}
                >
                  {p.status === "connected" ? "Configure" : "Add key"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="panel p-5">
            <h3 className="font-semibold">Run defaults</h3>
            <div className="mt-4 space-y-5">
              <div>
                <Label>Temperature — {temperature[0]?.toFixed(1)}</Label>
                <Slider
                  className="mt-3"
                  value={temperature}
                  onValueChange={setTemperature}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Local fallback</Label>
                  <p className="text-xs text-muted-foreground">
                    Use Ollama if a hosted API fails.
                  </p>
                </div>
                <Switch checked={fallback} onCheckedChange={setFallback} />
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Custom endpoint</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Any OpenAI-compatible URL — vLLM, LM Studio, llama.cpp.
            </p>
            <Input
              className="mt-3"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
            <Button
              className="mt-3 w-full"
              variant="secondary"
              onClick={() => toast.success("Endpoint reachable · 3 models found")}
            >
              Test connection
            </Button>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
