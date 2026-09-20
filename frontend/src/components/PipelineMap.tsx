import { memo, useMemo, useState, useEffect } from "react";
import {
  Bot,
  FileText,
  Maximize,
  Minimize,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AgentDetail, AgentStage, SkillSummary } from "@/lib/api";
import { Markdown } from "@/components/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

/** Category → hue mapping for visual variety on nodes. */
const categoryHues: Record<string, string> = {
  "social-media": "210",
  "email-marketing": "330",
  "content-marketing": "150",
  editorial: "45",
  seo: "270",
};

function getCategoryColor(category: string | null): string {
  if (!category) return "hsl(var(--muted-foreground))";
  const hue = categoryHues[category] ?? "200";
  return `hsl(${hue}, 65%, 55%)`;
}

// ─── Custom Canvas Nodes ──────────────────────────────────────────────────────

interface AgentNodeData {
  agent: AgentDetail;
  selected: boolean;
  stagesCount: number;
  stageNames: string[];
  onSelect: () => void;
  [key: string]: unknown;
}

function AgentNodeComponent({ data }: { data: AgentNodeData }) {
  const { agent, selected, stagesCount, stageNames } = data;
  const promptSnippet =
    agent.agentMd?.replace(/^[#\s*]+/, "").slice(0, 95) ||
    agent.description?.slice(0, 95) ||
    "No system prompt set.";

  return (
    <div
      onClick={data.onSelect}
      className={cn(
        "group relative w-[280px] cursor-pointer rounded-xl border-2 bg-card/95 p-3.5 text-left backdrop-blur-md transition-all duration-200 shadow-lg",
        selected
          ? "border-violet-500 ring-2 ring-violet-500/40 shadow-violet-500/20 shadow-xl"
          : "border-violet-500/40 hover:border-violet-400/80 hover:shadow-md",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-2 !border-background !bg-violet-500"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/15 text-violet-400 shadow-sm">
            <Bot className="size-4" />
          </div>
          <div className="min-w-0">
            <span className="inline-flex items-center rounded bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-violet-300 uppercase">
              Agent Node
            </span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] capitalize px-1.5 py-0",
            agent.status === "active"
              ? "border-emerald-500/40 text-emerald-400"
              : "border-muted-foreground/40 text-muted-foreground",
          )}
        >
          {agent.status}
        </Badge>
      </div>

      {/* Agent Title & Role */}
      <div className="mt-2">
        <p className="truncate text-xs font-bold text-foreground">{agent.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{agent.role}</p>
      </div>

      {/* Attached Skills Badges */}
      <div className="mt-2.5 rounded-lg border border-border/80 bg-muted/30 p-2">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <Sparkles className="size-3 text-violet-400" />
            Skills ({stagesCount})
          </span>
          <span>{agent.defaultModel ?? "no default model"}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {stageNames.slice(0, 3).map((name, i) => (
            <span
              key={i}
              className="inline-block max-w-[120px] truncate rounded bg-background/80 px-1.5 py-0.5 text-[9px] font-medium text-foreground/80 border border-border/60"
            >
              {name}
            </span>
          ))}
          {stageNames.length > 3 && (
            <span className="rounded bg-background/80 px-1.5 py-0.5 text-[9px] text-muted-foreground border border-border/60">
              +{stageNames.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Prompt Preview Snippet */}
      <div className="mt-2 rounded border border-border/60 bg-muted/20 px-2 py-1.5">
        <p className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
          <FileText className="size-2.5" /> Prompt / Persona Preview:
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] italic text-muted-foreground/90">
          "{promptSnippet}..."
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] font-medium text-violet-400 group-hover:text-violet-300">
        <span>Click to inspect prompt & skills</span>
        <span>➔</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-2 !border-background !bg-violet-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!size-2 !border-2 !border-background !bg-violet-500"
      />
    </div>
  );
}

interface StageNodeData {
  stage: AgentStage;
  defaultModel: string | null;
  selected: boolean;
  level: number;
  onSelect: () => void;
  [key: string]: unknown;
}

function StageNodeComponent({ data }: { data: StageNodeData }) {
  const { stage, defaultModel, selected, level } = data;
  const resolved = stage.model ?? defaultModel;
  const inherited = !stage.model;
  const catColor = getCategoryColor(stage.category);

  const promptSnippet =
    stage.promptBody?.replace(/^[#\s*]+/, "").slice(0, 85) ||
    stage.description?.slice(0, 85) ||
    "Skill instructions will load at runtime.";

  return (
    <div
      onClick={data.onSelect}
      className={cn(
        "group relative w-[250px] cursor-pointer rounded-xl border bg-card/95 p-3 text-left backdrop-blur-md transition-all duration-200 shadow-md",
        selected
          ? "border-primary ring-2 ring-primary/40 shadow-primary/10 shadow-lg"
          : stage.isGate
            ? "border-amber-500/50 hover:border-amber-400/80 hover:shadow-md"
            : "border-border hover:border-primary/40 hover:shadow-md",
      )}
      title={stage.description || stage.skillName}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-1.5 !border-0 !bg-muted-foreground"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          {stage.isGate ? (
            <ShieldCheck className="size-3.5 text-amber-400 shrink-0" />
          ) : (
            <Play className="size-3 text-primary shrink-0" style={{ fill: "currentColor" }} />
          )}
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            L{level} · Stage {stage.position}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {stage.isGate && (
            <span className="rounded bg-amber-500/15 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-400 border border-amber-500/30">
              Gate
            </span>
          )}
          {stage.hasOverride && (
            <span className="rounded bg-primary/15 px-1 py-0.5 text-[8px] font-bold uppercase text-primary border border-primary/30">
              Custom Prompt
            </span>
          )}
        </div>
      </div>

      {/* Skill Name */}
      <p className="mt-1.5 truncate text-xs font-bold text-foreground">
        {stage.skillName || stage.skill}
      </p>

      {/* Prompt preview snippet */}
      <div className="mt-1.5 rounded border border-border/60 bg-muted/20 px-2 py-1">
        <p className="flex items-center gap-1 text-[8px] font-medium text-muted-foreground">
          <FileText className="size-2" /> Prompt snippet:
        </p>
        <p className="mt-0.5 line-clamp-2 text-[9px] italic text-muted-foreground/85">
          "{promptSnippet}..."
        </p>
      </div>

      {/* Footer Info: Model & Category */}
      <div className="mt-2 flex items-center justify-between gap-1 border-t border-border/60 pt-1.5 text-[9px]">
        <span
          className={cn("truncate max-w-[140px]", inherited ? "text-muted-foreground" : "font-medium text-primary")}
          title={resolved ?? "no model"}
        >
          {resolved ?? "no model"} {inherited && resolved ? "(inherit)" : ""}
        </span>
        {stage.category && (
          <span
            className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-medium bg-muted/60"
            style={{ color: catColor }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: catColor }}
            />
            {stage.category}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!size-1.5 !border-0 !bg-muted-foreground"
      />
    </div>
  );
}

const nodeTypes = {
  agent: memo(AgentNodeComponent),
  stage: memo(StageNodeComponent),
};

const fitViewOptions = { padding: 0.25 };

// ─── Main PipelineMap Studio Component ────────────────────────────────────────

export function PipelineMap({
  agent,
  stages,
  levels,
  selectedId,
  defaultModel,
  onSelect,
  isFullscreen = false,
  onToggleFullscreen,
  skills = [],
  choices = [],
  busy = false,
  onSaveAgentPrompt,
  onSaveAgentModel,
  onUpdateStage,
  onRemoveStage,
  onAddStage,
  onRun,
}: {
  agent?: AgentDetail | null;
  stages: AgentStage[];
  levels: string[][];
  selectedId: string | null;
  defaultModel: string | null;
  onSelect: (id: string | null) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  skills?: SkillSummary[];
  choices?: { provider: string; model: string; kind?: string }[];
  busy?: boolean;
  onSaveAgentPrompt?: (newAgentMd: string) => Promise<void> | void;
  onSaveAgentModel?: (provider: string | null, model: string | null) => Promise<void> | void;
  onUpdateStage?: (updatedStage: AgentStage) => Promise<void> | void;
  onRemoveStage?: (stageId: string) => Promise<void> | void;
  onAddStage?: (skillSlug: string, provider: string | null, model: string | null) => Promise<void> | void;
  onRun?: () => void;
}) {
  const [viewMode, setViewMode] = useState<"pipeline" | "hub">("pipeline");
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Derive graph nodes and edges based on viewMode
  const { nodes, edges } = useMemo(() => {
    const byId = new Map(stages.map((s) => [s.id, s]));
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const isAgentSelected = selectedId === "agent-root";

    if (viewMode === "pipeline") {
      // 1. Root Agent Node placed at start
      if (agent) {
        nodes.push({
          id: "agent-root",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent,
            selected: isAgentSelected,
            stagesCount: stages.length,
            stageNames: stages.map((s) => s.skillName || s.skill),
            onSelect: () => onSelect("agent-root"),
          },
        });
      }

      // 2. Stage Nodes laid out by computed parallel levels
      const columnWidth = 320;
      const rowHeight = 160;
      const startX = agent ? 360 : 0;

      levels.forEach((level, column) => {
        const offset = ((level.length - 1) * rowHeight) / 2;
        level.forEach((id, row) => {
          const stage = byId.get(id);
          if (!stage) return;
          nodes.push({
            id,
            type: "stage",
            position: { x: startX + column * columnWidth, y: row * rowHeight - offset },
            data: {
              stage,
              defaultModel,
              selected: id === selectedId,
              level: column + 1,
              onSelect: () => onSelect(id),
            },
          });
        });
      });

      // 3. Connect Agent Node to entry stages (stages with 0 dependencies)
      if (agent) {
        const entryStages = stages.filter((s) => s.dependsOn.length === 0);
        entryStages.forEach((s) => {
          edges.push({
            id: `agent->${s.id}`,
            source: "agent-root",
            target: s.id,
            animated: true,
            style: { stroke: "rgb(139, 92, 246)", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "rgb(139, 92, 246)" },
          });
        });
      }

      // 4. Connect dependencies between stages
      for (const stage of stages) {
        for (const dep of stage.dependsOn) {
          if (!byId.has(dep)) continue;
          edges.push({
            id: `${dep}->${stage.id}`,
            source: dep,
            target: stage.id,
            animated: false,
            style: { strokeWidth: 1.8 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
          });
        }
      }
    } else {
      // "hub" view: Agent Node in center, connected to all attached skill nodes
      if (agent) {
        nodes.push({
          id: "agent-root",
          type: "agent",
          position: { x: 0, y: 0 },
          data: {
            agent,
            selected: isAgentSelected,
            stagesCount: stages.length,
            stageNames: stages.map((s) => s.skillName || s.skill),
            onSelect: () => onSelect("agent-root"),
          },
        });
      }

      const rowHeight = 155;
      const startX = 380;
      const offset = ((stages.length - 1) * rowHeight) / 2;

      stages.forEach((stage, idx) => {
        nodes.push({
          id: stage.id,
          type: "stage",
          position: { x: startX, y: idx * rowHeight - offset },
          data: {
            stage,
            defaultModel,
            selected: stage.id === selectedId,
            level: idx + 1,
            onSelect: () => onSelect(stage.id),
          },
        });

        // Hub edge connecting agent to every skill
        edges.push({
          id: `hub-agent->${stage.id}`,
          source: "agent-root",
          target: stage.id,
          animated: true,
          style: { stroke: "rgb(139, 92, 246)", strokeDasharray: "4,4", strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "rgb(139, 92, 246)" },
        });
      });
    }

    return { nodes, edges };
  }, [agent, stages, levels, selectedId, defaultModel, viewMode, onSelect]);

  const selectedStage = stages.find((s) => s.id === selectedId) ?? null;
  const isAgentSelected = selectedId === "agent-root";

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden border border-border bg-background/90 shadow-sm",
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "h-[640px] rounded-xl",
      )}
    >
      {/* ─── Top Studio Header / Toolbar inside Canvas ─── */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card/90 px-4 py-2.5 backdrop-blur-md">
        {/* Left: View mode tabs & Stats */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              onClick={() => setViewMode("pipeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                viewMode === "pipeline"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Workflow className="size-3.5" />
              Pipeline Flow
            </button>
            <button
              onClick={() => setViewMode("hub")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                viewMode === "hub"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="size-3.5" />
              Agent & Skills Hub
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
              1 Agent Node
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
              {stages.length} Skill Nodes
            </span>
            {viewMode === "pipeline" && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
                  {levels.length} Parallel Levels
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions inside canvas */}
        <div className="flex items-center gap-2">
          {onAddStage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddModalOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium border-primary/40 text-primary hover:bg-primary/10"
            >
              <Plus className="size-3.5" />
              Add Node
            </Button>
          )}

          {onRun && (
            <Button
              size="sm"
              onClick={onRun}
              disabled={busy || stages.length === 0}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <Play className="size-3.5" />
              Run Agent
            </Button>
          )}

          {onToggleFullscreen && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleFullscreen}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* ─── React Flow Canvas ─── */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onPaneClick={() => onSelect(null)}
          fitView
          fitViewOptions={fitViewOptions}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={true}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elevateNodesOnSelect={false}
          colorMode="dark"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} />
          <Controls showInteractive={false} position="bottom-left" />
        </ReactFlow>

        {/* ─── In-Canvas Node Inspector Drawer (Slide-Over Panel) ─── */}
        {(isAgentSelected && agent) && (
          <AgentNodeInspector
            agent={agent}
            stages={stages}
            choices={choices}
            skills={skills}
            busy={busy}
            onClose={() => onSelect(null)}
            onSelectStage={(id) => onSelect(id)}
            onSavePrompt={onSaveAgentPrompt}
            onSaveModel={onSaveAgentModel}
            onAddStage={onAddStage}
          />
        )}

        {(selectedStage && !isAgentSelected) && (
          <SkillNodeInspector
            stage={selectedStage}
            allStages={stages}
            choices={choices}
            defaultModel={defaultModel}
            busy={busy}
            onClose={() => onSelect(null)}
            onUpdate={onUpdateStage}
            onRemove={() => onRemoveStage && onRemoveStage(selectedStage.id)}
          />
        )}
      </div>

      {/* ─── In-Canvas Add Node Dialog ─── */}
      <AddNodeDialog
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        skills={skills}
        choices={choices}
        defaultModel={defaultModel}
        agentCategory={agent?.category ?? null}
        usedSkillSlugs={stages.map((s) => s.skill)}
        onAdd={(skillSlug, provider, model) => {
          if (onAddStage) {
            void onAddStage(skillSlug, provider, model);
          }
          setAddModalOpen(false);
        }}
      />
    </div>
  );
}

// ─── In-Canvas Agent Node Inspector ───────────────────────────────────────────

function AgentNodeInspector({
  agent,
  stages,
  choices,
  skills,
  busy,
  onClose,
  onSelectStage,
  onSavePrompt,
  onSaveModel,
  onAddStage,
}: {
  agent: AgentDetail;
  stages: AgentStage[];
  choices: { provider: string; model: string; kind?: string }[];
  skills: SkillSummary[];
  busy?: boolean;
  onClose: () => void;
  onSelectStage: (stageId: string) => void;
  onSavePrompt?: (newAgentMd: string) => Promise<void> | void;
  onSaveModel?: (provider: string | null, model: string | null) => Promise<void> | void;
  onAddStage?: (skillSlug: string, provider: string | null, model: string | null) => Promise<void> | void;
}) {
  const [tab, setTab] = useState<"prompt" | "skills" | "config">("prompt");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(agent.agentMd ?? "");
  const [newSkillSlug, setNewSkillSlug] = useState("");

  useEffect(() => {
    setDraftPrompt(agent.agentMd ?? "");
    setIsEditingPrompt(false);
  }, [agent.id, agent.agentMd]);

  const handleSavePrompt = async () => {
    if (onSavePrompt) {
      await onSavePrompt(draftPrompt);
      setIsEditingPrompt(false);
    }
  };

  const handleModelChange = (v: string) => {
    if (!onSaveModel) return;
    if (v === "__none__") {
      void onSaveModel(null, null);
      return;
    }
    const [provider, model] = v.split("::");
    void onSaveModel(provider!, model!);
  };

  const modelValue = agent.defaultModel ? `${agent.defaultProvider}::${agent.defaultModel}` : "__none__";

  return (
    <div className="absolute right-3 top-3 bottom-3 z-30 flex w-[480px] max-w-[calc(100%-1.5rem)] flex-col rounded-xl border border-violet-500/40 bg-card/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border bg-violet-500/10 px-5 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded bg-violet-500 text-white shadow-sm">
              <Bot className="size-3" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
              Agent Orchestrator Node
            </span>
          </div>
          <h3 className="mt-0.5 truncate text-base font-bold text-foreground">{agent.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="size-7 p-0 shrink-0">
          <X className="size-4" />
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border bg-muted/20 px-2">
        <button
          onClick={() => setTab("prompt")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
            tab === "prompt"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <FileText className="size-3.5" />
          System Prompt & Persona
        </button>
        <button
          onClick={() => setTab("skills")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
            tab === "skills"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Sparkles className="size-3.5" />
          Skills ({stages.length})
        </button>
        <button
          onClick={() => setTab("config")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
            tab === "config"
              ? "border-violet-500 text-violet-400"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Settings className="size-3.5" />
          Settings
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === "prompt" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Agent Persona & Master Instructions</p>
                <p className="text-[11px] text-muted-foreground">
                  The primary system prompt executed for this agent.
                </p>
              </div>
              <Button
                variant={isEditingPrompt ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
              >
                {isEditingPrompt ? "Preview Markdown" : "Edit Prompt"}
              </Button>
            </div>

            {isEditingPrompt ? (
              <div className="space-y-3">
                <Textarea
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  rows={16}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Enter system prompt for this agent..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraftPrompt(agent.agentMd ?? "");
                      setIsEditingPrompt(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={handleSavePrompt}
                    className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    <Save className="size-3.5" />
                    Save Prompt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/20 p-4 max-h-[440px] overflow-y-auto">
                {agent.agentMd ? (
                  <Markdown source={agent.agentMd} />
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    No custom system prompt specified. The agent uses default role instructions.
                  </p>
                )}
              </div>
            )}

            {agent.guardrails && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <ShieldCheck className="size-4" />
                  Agent Guardrails
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {agent.guardrails}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "skills" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-foreground">Skills Attached to this Agent</p>
              <p className="text-[11px] text-muted-foreground">
                Each stage runs a skill node in the pipeline with its own prompt and model.
              </p>
            </div>

            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                        {stage.position}
                      </span>
                      <p className="truncate text-xs font-semibold">{stage.skillName || stage.skill}</p>
                      {stage.isGate && (
                        <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400 px-1 py-0">
                          Gate
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{stage.category || "general"}</span>
                      <span>·</span>
                      <span>{stage.model ?? "Inherits default"}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:bg-primary/10"
                    onClick={() => onSelectStage(stage.id)}
                  >
                    Inspect Node ➔
                  </Button>
                </div>
              ))}
            </div>

            {/* Quick Add Skill section */}
            {onAddStage && (
              <div className="mt-4 rounded-lg border border-dashed border-border p-3">
                <p className="text-xs font-semibold text-foreground">Attach Another Skill</p>
                <div className="mt-2 flex gap-2">
                  <Select value={newSkillSlug} onValueChange={setNewSkillSlug}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Select skill to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {skills
                        .filter((s) => !stages.some((st) => st.skill === s.id))
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.name} ({s.category || "general"})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    disabled={!newSkillSlug || busy}
                    onClick={() => {
                      if (!newSkillSlug) return;
                      void onAddStage(newSkillSlug, null, null);
                      setNewSkillSlug("");
                    }}
                  >
                    <Plus className="size-3.5" /> Attach
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "config" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Default Model</Label>
              <Select value={modelValue} onValueChange={handleModelChange}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No default (all stages must specify)</SelectItem>
                  {choices.map((c) => (
                    <SelectItem key={`${c.provider}::${c.model}`} value={`${c.provider}::${c.model}`}>
                      {c.model} · {c.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                All skill stages without an explicit model override inherit this default.
              </p>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Agent Role</p>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Category</p>
              <p className="text-xs text-muted-foreground">{agent.category ?? "None"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── In-Canvas Skill Node Inspector ───────────────────────────────────────────

function SkillNodeInspector({
  stage,
  allStages,
  choices,
  defaultModel,
  busy,
  onClose,
  onUpdate,
  onRemove,
}: {
  stage: AgentStage;
  allStages: AgentStage[];
  choices: { provider: string; model: string; kind?: string }[];
  defaultModel: string | null;
  busy?: boolean;
  onClose: () => void;
  onUpdate?: (stage: AgentStage) => Promise<void> | void;
  onRemove: () => void;
}) {
  const [tab, setTab] = useState<"prompt" | "config" | "details">("prompt");
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [draftOverride, setDraftOverride] = useState(stage.promptBody ?? "");

  useEffect(() => {
    setDraftOverride(stage.promptBody ?? "");
    setIsEditingOverride(false);
  }, [stage.id, stage.promptBody]);

  const value = stage.model ? `${stage.provider}::${stage.model}` : "__inherit__";

  const handleSaveOverride = async () => {
    if (!onUpdate) return;
    await onUpdate({
      ...stage,
      hasOverride: true,
      promptBody: draftOverride,
    });
    setIsEditingOverride(false);
  };

  const handleResetOverride = async () => {
    if (!onUpdate) return;
    await onUpdate({
      ...stage,
      hasOverride: false,
    });
    setIsEditingOverride(false);
  };

  return (
    <div className="absolute right-3 top-3 bottom-3 z-30 flex w-[480px] max-w-[calc(100%-1.5rem)] flex-col rounded-xl border border-primary/40 bg-card/95 backdrop-blur-md shadow-2xl animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {stage.isGate ? (
              <ShieldCheck className="size-4 text-amber-400 shrink-0" />
            ) : (
              <Play className="size-4 text-primary shrink-0" style={{ fill: "currentColor" }} />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {stage.isGate ? "Quality Gate Node" : "Skill Stage Node"}
            </span>
          </div>
          <h3 className="mt-0.5 truncate text-base font-bold text-foreground">
            {stage.skillName || stage.skill}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            Stage {stage.position} · {stage.category || "general"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="size-7 p-0 shrink-0">
          <X className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/20 px-2">
        <button
          onClick={() => setTab("prompt")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
            tab === "prompt"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <FileText className="size-3.5" />
          Skill Prompt
        </button>
        <button
          onClick={() => setTab("config")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
            tab === "config"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Settings className="size-3.5" />
          Model & Routing
        </button>
        <button
          onClick={() => setTab("details")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
            tab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Sparkles className="size-3.5" />
          Node Details
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === "prompt" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Prompt Instructions Sent to LLM</p>
                <p className="text-[11px] text-muted-foreground">
                  {stage.hasOverride
                    ? "⚡ Using a customized prompt override for this agent stage."
                    : "Using default instructions from the skill library."}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {stage.hasOverride && !isEditingOverride && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetOverride}
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    title="Reset to skill default"
                  >
                    <RotateCcw className="size-3" /> Reset
                  </Button>
                )}
                <Button
                  variant={isEditingOverride ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsEditingOverride(!isEditingOverride)}
                >
                  {isEditingOverride ? "Preview Markdown" : "Edit Override"}
                </Button>
              </div>
            </div>

            {isEditingOverride ? (
              <div className="space-y-3">
                <Textarea
                  value={draftOverride}
                  onChange={(e) => setDraftOverride(e.target.value)}
                  rows={16}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Enter custom prompt override for this stage..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraftOverride(stage.promptBody ?? "");
                      setIsEditingOverride(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={handleSaveOverride}
                    className="gap-1.5"
                  >
                    <Save className="size-3.5" />
                    Save Prompt Override
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/20 p-4 max-h-[440px] overflow-y-auto">
                {stage.promptBody ? (
                  <Markdown source={stage.promptBody} />
                ) : (
                  <p className="text-xs italic text-muted-foreground">
                    No prompt instructions available. Skill will load its default template at runtime.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "config" && (
          <div className="space-y-5">
            {/* Model Picker */}
            <div className="space-y-2">
              <Label className="text-xs">Model Override</Label>
              <Select
                value={value}
                onValueChange={(v) => {
                  if (!onUpdate) return;
                  if (v === "__inherit__") {
                    void onUpdate({ ...stage, provider: null, model: null });
                    return;
                  }
                  const [provider, model] = v.split("::");
                  void onUpdate({ ...stage, provider: provider!, model: model! });
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__inherit__">
                    Inherit agent default ({defaultModel ?? "none"})
                  </SelectItem>
                  {choices.map((c) => (
                    <SelectItem key={`${c.provider}::${c.model}`} value={`${c.provider}::${c.model}`}>
                      {c.model} · {c.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Override the model for this specific stage (e.g. use a stronger model for complex generation).
              </p>
            </div>

            {/* Quality Gate Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-xs font-semibold">Quality Gate</Label>
                <p className="text-[11px] text-muted-foreground">
                  A failing gate sends work back for revision instead of advancing.
                </p>
              </div>
              <Switch
                checked={stage.isGate}
                disabled={busy}
                onCheckedChange={(isGate) => onUpdate && void onUpdate({ ...stage, isGate })}
              />
            </div>

            {/* Dependencies */}
            <div>
              <Label className="text-xs">Runs After (Dependencies)</Label>
              <p className="text-[11px] text-muted-foreground mb-2">
                Click stages that must finish before this stage runs.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allStages
                  .filter((s) => s.id !== stage.id)
                  .map((other) => {
                    const isDep = stage.dependsOn.includes(other.id);
                    return (
                      <button
                        key={other.id}
                        disabled={busy}
                        onClick={() => {
                          if (!onUpdate) return;
                          void onUpdate({
                            ...stage,
                            dependsOn: isDep
                              ? stage.dependsOn.filter((d) => d !== other.id)
                              : [...stage.dependsOn, other.id],
                          });
                        }}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          isDep
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {other.position}. {other.skillName || other.skill}
                      </button>
                    );
                  })}
              </div>
              {stage.dependsOn.length === 0 && (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  Starts in the first level immediately when the pipeline starts.
                </p>
              )}
            </div>

            {/* Remove */}
            <div className="border-t border-border pt-4">
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-1.5 text-xs"
                disabled={busy}
                onClick={onRemove}
              >
                <Trash2 className="size-3.5" />
                Remove Stage from Pipeline
              </Button>
            </div>
          </div>
        )}

        {tab === "details" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Skill Identifier</p>
              <p className="font-mono text-xs text-muted-foreground">{stage.skill}</p>
            </div>

            {stage.description && (
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">Description</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{stage.description}</p>
              </div>
            )}

            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-xs font-semibold text-foreground">Category</p>
              <p className="text-xs text-muted-foreground">{stage.category ?? "General"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Node Dialog ──────────────────────────────────────────────────────────

function AddNodeDialog({
  open,
  onOpenChange,
  skills,
  choices,
  defaultModel,
  agentCategory,
  usedSkillSlugs,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: SkillSummary[];
  choices: { provider: string; model: string; kind?: string }[];
  defaultModel: string | null;
  agentCategory: string | null;
  usedSkillSlugs: string[];
  onAdd: (skillSlug: string, provider: string | null, model: string | null) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("__inherit__");

  const available = skills.filter((s) => !usedSkillSlugs.includes(s.id));
  const filtered = available.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(search.toLowerCase())),
  );

  const suggested = agentCategory ? filtered.filter((s) => s.category === agentCategory) : [];
  const otherSkills = filtered.filter((s) => !suggested.includes(s));

  const handleAdd = () => {
    if (!selectedSkill) return;
    const provider = selectedModel === "__inherit__" ? null : selectedModel.split("::")[0]!;
    const model = selectedModel === "__inherit__" ? null : selectedModel.split("::")[1]!;
    onAdd(selectedSkill, provider, model);
    setSelectedSkill(null);
    setSelectedModel("__inherit__");
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Add Skill Node to Canvas
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choose a skill from your library to add as an executable stage in the pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills by name or category..."
              className="pl-8 text-xs h-8"
            />
          </div>

          {/* Skill List */}
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {suggested.length > 0 && (
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                Suggested for this Agent
              </p>
            )}
            {suggested.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSkill(s.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  selectedSkill === s.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted/40",
                )}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-[10px] opacity-75">{s.category}</span>
              </button>
            ))}

            {suggested.length > 0 && otherSkills.length > 0 && (
              <p className="mt-2 border-t border-border px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                All Skills
              </p>
            )}
            {otherSkills.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSkill(s.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  selectedSkill === s.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted/40",
                )}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-[10px] opacity-75">{s.category}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">
                No matching skills found.
              </p>
            )}
          </div>

          {/* Model picker for new node */}
          <div className="space-y-1.5">
            <Label className="text-xs">Model for this stage</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__inherit__" className="text-xs">
                  Inherit agent default ({defaultModel ?? "none"})
                </SelectItem>
                {choices.map((c) => (
                  <SelectItem key={`${c.provider}::${c.model}`} value={`${c.provider}::${c.model}`} className="text-xs">
                    {c.model} · {c.provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={!selectedSkill} onClick={handleAdd}>
            <Plus className="size-3.5" />
            Add to Canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
