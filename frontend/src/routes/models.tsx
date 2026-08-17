import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Cloud, KeyRound, Server, Wifi } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api, type ModelProvider, type RunDefaults } from "@/lib/api";

export const Route = createFileRoute("/models")({
  head: () => ({
    meta: [
      { title: "Models — Marketing OS" },
      {
        name: "description",
        content:
          "Connect Claude, ChatGPT, Gemini or a self-hosted open-source model and set run defaults.",
      },
      { property: "og:title", content: "Models — Marketing OS" },
      {
        property: "og:description",
        content: "Hosted APIs and open-source endpoints your agents can run on.",
      },
    ],
  }),
  loader: async () => {
    const [modelProviders, runDefaults] = await Promise.all([
      api.getModels(),
      api.getRunDefaults(),
    ]);
    return { modelProviders, runDefaults };
  },
  component: ModelsPage,
});

function ModelsPage() {
  const { modelProviders, runDefaults } = Route.useLoaderData();
  const router = useRouter();

  const [editing, setEditing] = useState<ModelProvider | null>(null);
  const [defaults, setDefaults] = useState<RunDefaults>(runDefaults);
  const [busy, setBusy] = useState(false);

  const saveDefaults = async (next: RunDefaults) => {
    setDefaults(next);
    try {
      await api.saveRunDefaults(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save run defaults");
    }
  };

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

              {p.models.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.models.map((m) => (
                    <span
                      key={m}
                      className={`rounded-full border px-2.5 py-1 font-mono text-xs ${
                        m === p.defaultModel
                          ? "border-primary/50 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  No models yet — test the endpoint to load them.
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {p.baseUrl ?? p.note}
                </p>
                <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                  {p.kind === "Open source" ? (
                    <>
                      <Wifi className="size-3.5" /> Endpoint
                    </>
                  ) : (
                    <>
                      <KeyRound className="size-3.5" /> {p.hasKey ? "Configure" : "Add key"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="panel p-5">
            <h3 className="font-semibold">Run defaults</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Applied to any stage that does not set its own.
            </p>
            <div className="mt-4 space-y-5">
              <div>
                <Label>Temperature — {defaults.temperature.toFixed(1)}</Label>
                <Slider
                  className="mt-3"
                  value={[defaults.temperature]}
                  onValueChange={([v]) => setDefaults({ ...defaults, temperature: v ?? 0 })}
                  onValueCommit={([v]) =>
                    void saveDefaults({ ...defaults, temperature: v ?? 0 })
                  }
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Local fallback</Label>
                  <p className="text-xs text-muted-foreground">
                    Use a self-hosted model if a hosted API fails.
                  </p>
                </div>
                <Switch
                  checked={defaults.localFallback}
                  onCheckedChange={(localFallback) =>
                    void saveDefaults({ ...defaults, localFallback })
                  }
                />
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <h3 className="font-semibold">Custom endpoint</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Any OpenAI-compatible URL — Ollama, vLLM, LM Studio, llama.cpp.
            </p>
            <Input
              className="mt-3"
              value={defaults.customEndpoint}
              onChange={(e) => setDefaults({ ...defaults, customEndpoint: e.target.value })}
              onBlur={() => void saveDefaults(defaults)}
              placeholder="http://localhost:11434"
            />
            <Button
              className="mt-3 w-full"
              variant="secondary"
              disabled={busy || !defaults.customEndpoint.trim()}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await api.testEndpoint(defaults.customEndpoint);
                  if (result.ok) toast.success(result.message);
                  else toast.error(result.message);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not reach endpoint");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Testing…" : "Test connection"}
            </Button>
          </section>
        </aside>
      </div>

      <ProviderDialog
        provider={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await router.invalidate();
        }}
      />
    </AppShell>
  );
}

function ProviderDialog({
  provider,
  onClose,
  onSaved,
}: {
  provider: ModelProvider | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [models, setModels] = useState<string[]>([]);

  // Reset the form whenever a different provider is opened.
  const [lastId, setLastId] = useState<string | null>(null);
  if (provider && provider.id !== lastId) {
    setLastId(provider.id);
    setApiKey("");
    setBaseUrl(provider.baseUrl ?? "");
    setDefaultModel(provider.defaultModel ?? "");
    setModels(provider.models);
  }

  if (!provider) return null;
  const selfHosted = provider.kind === "Open source";

  const test = async () => {
    setBusy(true);
    try {
      const result = await api.testEndpoint(baseUrl, provider.id, apiKey || null);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setModels(result.models ?? []);
      if (result.models?.[0] && !defaultModel) setDefaultModel(result.models[0]);
      toast.success(result.message + (result.saved ? " · saved" : ""));
      if (result.saved) await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reach endpoint");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.updateModelProvider(provider.id, {
        // Only send the key when one was typed — an empty field must not wipe it.
        ...(apiKey ? { apiKey } : {}),
        baseUrl: baseUrl || null,
        defaultModel: defaultModel || null,
      });
      toast.success(`${provider.name} saved`);
      await onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await api.updateModelProvider(provider.id, { apiKey: null, baseUrl: null });
      toast.success(`${provider.name} disconnected`);
      await onSaved();
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
          <DialogTitle>{provider.name}</DialogTitle>
          <DialogDescription>
            {selfHosted
              ? "Point at any OpenAI-compatible server. Testing loads the models it serves."
              : "Your key is encrypted before it is stored and is never sent back to the browser."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selfHosted && (
            <div className="space-y-2">
              <Label htmlFor="key">API key</Label>
              <Input
                id="key"
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider.hasKey ? "•••••••• (leave blank to keep)" : "sk-…"}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">{selfHosted ? "Endpoint URL" : "Base URL (optional)"}</Label>
            <Input
              id="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
            />
            {selfHosted && (
              <p className="text-xs text-muted-foreground">
                A localhost URL is translated automatically when the server runs in Docker.
              </p>
            )}
          </div>

          {models.length > 0 && (
            <div className="space-y-2">
              <Label>Default model</Label>
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {(provider.hasKey || provider.baseUrl) && (
              <Button variant="secondary" disabled={busy} onClick={disconnect}>
                Disconnect
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={busy || !baseUrl.trim()}
              onClick={test}
            >
              {busy ? "Testing…" : "Test"}
            </Button>
            <Button disabled={busy} onClick={save}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
