import { memo, useMemo } from "react";
import { Maximize, Minimize } from "lucide-react";
import {
  Background,
  Controls,
  ControlButton,
  ReactFlow,
  type Edge,
  type Node,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { AgentStage } from "@/lib/api";

/**
 * The agent's pipeline drawn from its dependency graph.
 *
 * Positions are derived from the execution levels the backend computes, so the
 * picture and the runtime always agree: one column per level, and every stage in
 * a column runs in parallel. Nothing about layout is stored.
 */
export function PipelineMap({
  stages,
  levels,
  selectedId,
  defaultModel,
  onSelect,
  isFullscreen = false,
  onToggleFullscreen,
}: {
  stages: AgentStage[];
  levels: string[][];
  selectedId: string | null;
  defaultModel: string | null;
  onSelect: (id: string) => void;
  /**
   * Fullscreen is owned by the caller so the whole pipeline workspace — tabs,
   * the model picker, the stage panel — goes fullscreen with the canvas rather
   * than the canvas alone. The map only grows to fill whatever it is given.
   */
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const byId = new Map(stages.map((s) => [s.id, s]));
    const columnWidth = 240;
    const rowHeight = 104;

    const nodes: Node[] = [];
    levels.forEach((level, column) => {
      const offset = ((level.length - 1) * rowHeight) / 2;
      level.forEach((id, row) => {
        const stage = byId.get(id);
        if (!stage) return;
        nodes.push({
          id,
          type: "stage",
          position: { x: column * columnWidth, y: row * rowHeight - offset },
          data: {
            stage,
            defaultModel,
            selected: id === selectedId,
            level: column + 1,
          },
        });
      });
    });

    const edges: Edge[] = [];
    for (const stage of stages) {
      for (const dep of stage.dependsOn) {
        if (!byId.has(dep)) continue;
        edges.push({
          id: `${dep}->${stage.id}`,
          source: dep,
          target: stage.id,
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
          style: { strokeWidth: 1.5 },
        });
      }
    }

    return { nodes, edges };
  }, [stages, levels, selectedId, defaultModel]);

  if (stages.length === 0) {
    return (
      <div className="flex h-[420px] min-h-0 items-center justify-center rounded-md border border-dashed border-border text-center">
        <div className="max-w-xs">
          <p className="text-sm font-medium">No stages yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a skill from the library to start the pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "absolute inset-0"
          : "h-[420px] rounded-md border border-border"
      }
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelect(node.id)}
        fitView
        fitViewOptions={fitViewOptions}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elevateNodesOnSelect={false}
        colorMode="dark"
      >
        <Background gap={16} size={1} />
        {/* Fullscreen parks the stage controls bottom-left, so zoom moves out
            of their way. */}
        <Controls showInteractive={false} position={isFullscreen ? "top-left" : "bottom-left"}>
          {onToggleFullscreen && (
            <ControlButton onClick={onToggleFullscreen} title="Toggle fullscreen">
              {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </ControlButton>
          )}
        </Controls>
      </ReactFlow>
    </div>
  );
}

function StageNode({ data }: { data: Record<string, unknown> }) {
  const stage = data.stage as AgentStage;
  const defaultModel = data.defaultModel as string | null;
  const selected = data.selected as boolean;
  const level = data.level as number;

  // Blank on the stage means it inherits — show what it will actually run on.
  const resolved = stage.model ?? defaultModel;
  const inherited = !stage.model;

  return (
    <div
      className={`w-[196px] cursor-pointer rounded-md border bg-card px-3 py-2 text-left shadow-sm transition-[border-color,box-shadow] duration-150 ${
        selected ? "border-primary" : stage.isGate ? "border-accent/60" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-border" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          L{level} · {stage.position}
        </span>
        {stage.isGate && (
          <span className="rounded-sm bg-accent/15 px-1 text-[10px] text-accent">gate</span>
        )}
      </div>
      <p className="mt-0.5 truncate text-xs font-medium">{stage.skill}</p>
      <p
        className={`mt-1 truncate text-[10px] ${
          inherited ? "text-muted-foreground" : "text-primary"
        }`}
        title={resolved ?? "no model set"}
      >
        {resolved ?? "no model"}
        {inherited && resolved ? " (inherit)" : ""}
      </p>
      <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-border" />
    </div>
  );
}

const nodeTypes = { stage: memo(StageNode) };
const fitViewOptions = { padding: 0.2 };
