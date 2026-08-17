import { n as __toESM } from "../_runtime.mjs";
import { a as MarkerType, i as index, n as Controls, o as Position, r as Handle, t as Background } from "../_libs/@xyflow/react+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as api, s as Route$6 } from "./router-CYsXxj1S.mjs";
import { O as Bot, c as Save, i as Trash2, r as TriangleAlert, t as X, u as Plus } from "../_libs/lucide-react.mjs";
import { n as Badge, t as AppShell } from "./badge-DUy4Kh1K.mjs";
import { t as Button } from "./button-CuAW9m_P.mjs";
import { t as Input } from "./input-Z3vyt-AO.mjs";
import { t as Label } from "./label-DwooDaT2.mjs";
import { t as Switch } from "./switch-BcuW7dHr.mjs";
import { t as Textarea } from "./textarea-C1bEjhgl.mjs";
import { a as SelectValue, c as TabsList, i as SelectTrigger, l as TabsTrigger, n as SelectContent, o as Tabs, r as SelectItem, s as TabsContent, t as Select } from "./select-DKLhxk_L.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-DgLEsHYW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/agents-C5lKWCH0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* The agent's pipeline drawn from its dependency graph.
*
* Positions are derived from the execution levels the backend computes, so the
* picture and the runtime always agree: one column per level, and every stage in
* a column runs in parallel. Nothing about layout is stored.
*/
function PipelineMap({ stages, levels, selectedId, defaultModel, onSelect }) {
	const { nodes, edges } = (0, import_react.useMemo)(() => {
		const byId = new Map(stages.map((s) => [s.id, s]));
		const columnWidth = 240;
		const rowHeight = 104;
		const nodes = [];
		levels.forEach((level, column) => {
			const offset = (level.length - 1) * rowHeight / 2;
			level.forEach((id, row) => {
				const stage = byId.get(id);
				if (!stage) return;
				nodes.push({
					id,
					type: "stage",
					position: {
						x: column * columnWidth,
						y: row * rowHeight - offset
					},
					data: {
						stage,
						defaultModel,
						selected: id === selectedId,
						level: column + 1
					}
				});
			});
		});
		const edges = [];
		for (const stage of stages) for (const dep of stage.dependsOn) {
			if (!byId.has(dep)) continue;
			edges.push({
				id: `${dep}->${stage.id}`,
				source: dep,
				target: stage.id,
				animated: false,
				markerEnd: {
					type: MarkerType.ArrowClosed,
					width: 14,
					height: 14
				},
				style: { strokeWidth: 1.5 }
			});
		}
		return {
			nodes,
			edges
		};
	}, [
		stages,
		levels,
		selectedId,
		defaultModel
	]);
	if (stages.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-[420px] items-center justify-center rounded-md border border-dashed border-border text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "No stages yet"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "Add a skill from the library to start the pipeline."
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-[420px] rounded-md border border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(index, {
			nodes,
			edges,
			nodeTypes,
			onNodeClick: (_, node) => onSelect(node.id),
			fitView: true,
			fitViewOptions: { padding: .2 },
			proOptions: { hideAttribution: true },
			nodesDraggable: false,
			nodesConnectable: false,
			colorMode: "dark",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Background, {
				gap: 16,
				size: 1
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Controls, { showInteractive: false })]
		})
	});
}
function StageNode({ data }) {
	const stage = data.stage;
	const defaultModel = data.defaultModel;
	const selected = data.selected;
	const level = data.level;
	const resolved = stage.model ?? defaultModel;
	const inherited = !stage.model;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `w-[196px] rounded-md border bg-card px-3 py-2 text-left shadow-sm transition-colors ${selected ? "border-primary" : stage.isGate ? "border-accent/60" : "border-border"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, {
				type: "target",
				position: Position.Left,
				className: "!size-1.5 !border-0 !bg-border"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-[10px] uppercase tracking-widest text-muted-foreground",
					children: [
						"L",
						level,
						" · ",
						stage.position
					]
				}), stage.isGate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-sm bg-accent/15 px-1 text-[10px] text-accent",
					children: "gate"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 truncate text-xs font-medium",
				children: stage.skill
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `mt-1 truncate text-[10px] ${inherited ? "text-muted-foreground" : "text-primary"}`,
				title: resolved ?? "no model set",
				children: [resolved ?? "no model", inherited && resolved ? " (inherit)" : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, {
				type: "source",
				position: Position.Right,
				className: "!size-1.5 !border-0 !bg-border"
			})
		]
	});
}
var nodeTypes = { stage: StageNode };
var statusTone = {
	active: "border-primary/40 text-primary",
	paused: "border-border text-muted-foreground",
	draft: "border-accent/40 text-accent"
};
/** Every model across every provider, tagged so a stage can pick one. */
function modelChoices(providers) {
	return providers.flatMap((p) => p.models.map((m) => ({
		provider: p.id,
		model: m,
		kind: p.kind
	})));
}
function AgentsPage() {
	const { agents, knowledgeBases, modelProviders, skills, categories } = Route$6.useLoaderData();
	const router = useRouter();
	const [selectedSlug, setSelectedSlug] = (0, import_react.useState)(agents[0]?.id ?? null);
	const [detail, setDetail] = (0, import_react.useState)(null);
	const [selectedStageId, setSelectedStageId] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const choices = modelChoices(modelProviders);
	(0, import_react.useEffect)(() => {
		if (!selectedSlug) {
			setDetail(null);
			return;
		}
		let cancelled = false;
		api.getAgent(selectedSlug).then((d) => {
			if (cancelled) return;
			setDetail(d);
			setSelectedStageId(null);
		}).catch((e) => toast.error(e instanceof Error ? e.message : "Could not load agent"));
		return () => {
			cancelled = true;
		};
	}, [selectedSlug]);
	const reload = async () => {
		await router.invalidate();
		if (selectedSlug) setDetail(await api.getAgent(selectedSlug));
	};
	/** Writes the whole pipeline back, then refreshes so levels are recomputed. */
	const saveStages = async (next) => {
		if (!detail) return;
		setBusy(true);
		try {
			const payload = next.map((s) => ({
				id: s.id,
				skill: s.skill,
				position: s.position,
				dependsOn: s.dependsOn,
				isGate: s.isGate,
				provider: s.provider,
				model: s.model
			}));
			await api.saveStages(detail.id, payload);
			await reload();
			toast.success("Pipeline saved");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save the pipeline");
		} finally {
			setBusy(false);
		}
	};
	const patchAgent = async (body, message) => {
		if (!detail) return;
		setBusy(true);
		try {
			await api.updateAgent(detail.id, body);
			await reload();
			toast.success(message);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save");
		} finally {
			setBusy(false);
		}
	};
	const removeAgent = async () => {
		if (!detail) return;
		setBusy(true);
		try {
			await api.deleteAgent(detail.id);
			setSelectedSlug(null);
			setDetail(null);
			await router.invalidate();
			toast.success("Agent deleted");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not delete");
		} finally {
			setBusy(false);
		}
	};
	const stage = detail?.stages.find((s) => s.id === selectedStageId) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Agents",
		subtitle: "An agent is a pipeline of skills. Each stage can run on its own model.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
			open: createOpen,
			onOpenChange: setCreateOpen,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " New agent"] })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateAgentDialog, {
				choices,
				categories,
				onCreated: async (slug) => {
					setCreateOpen(false);
					await router.invalidate();
					setSelectedSlug(slug);
				}
			})]
		}),
		children: agents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel flex flex-col items-center gap-2 border-dashed p-10 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "size-6 text-primary" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "No agents yet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-md text-sm text-muted-foreground",
					children: "Create one here, or import a folder of skills from the Skills tab — an import builds the agent and its pipeline for you."
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[280px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-3",
				children: agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setSelectedSlug(agent.id),
					className: `panel w-full p-4 text-left transition-colors ${agent.id === selectedSlug ? "border-primary/60" : "hover:border-border/80"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "min-w-0 flex-1 truncate text-sm font-medium",
							children: agent.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: statusTone[agent.status],
							children: agent.status
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: [
							agent.skills.length,
							" stages · ",
							agent.runs,
							" runs"
						]
					})]
				}, agent.id))
			}), detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-semibold",
								children: detail.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: detail.role
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								disabled: busy,
								onClick: () => patchAgent({ status: detail.status === "active" ? "paused" : "active" }, detail.status === "active" ? "Agent paused" : "Agent activated"),
								children: detail.status === "active" ? "Pause" : "Activate"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								disabled: busy,
								onClick: removeAgent,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Delete"]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-3xl text-sm text-muted-foreground",
						children: detail.description
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					defaultValue: "pipeline",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "pipeline",
								children: "Pipeline"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "settings",
								children: "Settings"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "knowledge",
								children: "Knowledge"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: "references",
								children: "References"
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
							value: "pipeline",
							className: "mt-4 space-y-4",
							children: [
								detail.cycle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-3.5 shrink-0 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "These stages depend on each other in a loop and cannot run. Fix their dependencies below." })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineMap, {
									stages: detail.stages,
									levels: detail.levels,
									selectedId: selectedStageId,
									defaultModel: detail.defaultModel,
									onSelect: setSelectedStageId
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddStage, {
										skills,
										agentCategory: detail.category,
										used: detail.stages.map((s) => s.skill),
										disabled: busy,
										onAdd: (skillSlug) => {
											const last = detail.stages[detail.stages.length - 1];
											const next = [...detail.stages, {
												id: `new-${Date.now()}`,
												skill: skillSlug,
												skillName: skillSlug,
												description: "",
												position: (last?.position ?? 0) + 1,
												dependsOn: last ? [last.id] : [],
												isGate: false,
												provider: null,
												model: null,
												hasOverride: false
											}];
											saveStages(next);
										}
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Stages in the same column run in parallel."
									})]
								}),
								stage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StagePanel, {
									stage,
									allStages: detail.stages,
									choices,
									defaultModel: detail.defaultModel,
									busy,
									onClose: () => setSelectedStageId(null),
									onChange: (updated) => void saveStages(detail.stages.map((s) => s.id === updated.id ? updated : s)),
									onRemove: () => void saveStages(detail.stages.filter((s) => s.id !== stage.id))
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "settings",
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsTab, {
								detail,
								choices,
								categories,
								busy,
								onSave: patchAgent
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "knowledge",
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold",
										children: "Knowledge access"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Bases this agent may retrieve from during a run."
									}),
									knowledgeBases.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 text-sm text-muted-foreground",
										children: "No knowledge bases yet — create one on the Knowledge page."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-4 grid gap-3 sm:grid-cols-2",
										children: knowledgeBases.map((kb) => {
											const on = detail.knowledgeBases.includes(kb.id);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												disabled: busy,
												onClick: async () => {
													const next = on ? detail.knowledgeBases.filter((k) => k !== kb.id) : [...detail.knowledgeBases, kb.id];
													setBusy(true);
													try {
														await api.saveAgentKnowledgeBases(detail.id, next);
														await reload();
													} catch (e) {
														toast.error(e instanceof Error ? e.message : "Could not save");
													} finally {
														setBusy(false);
													}
												},
												className: `rounded-md border p-3 text-left transition-colors ${on ? "border-primary/60 bg-primary/5" : "border-border hover:border-border/80"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-medium",
													children: kb.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground",
													children: [
														kb.type,
														" · ",
														kb.docs,
														" docs"
													]
												})]
											}, kb.id);
										})
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "references",
							className: "mt-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "panel p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-semibold",
										children: "References"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Small curated documents injected into every prompt this agent runs — distinct from knowledge bases, which are retrieved from by similarity."
									}),
									detail.references.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-4 text-sm text-muted-foreground",
										children: "No references yet."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "mt-4 divide-y divide-border",
										children: detail.references.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-center justify-between py-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm",
												children: r.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-muted-foreground",
												children: [Math.max(1, Math.round(r.bodyMd.length / 1024)), " KB"]
											})]
										}, r.id))
									})
								]
							})
						})
					]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel flex items-center justify-center border-dashed p-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Select an agent."
				})
			})]
		})
	});
}
function StagePanel({ stage, allStages, choices, defaultModel, busy, onClose, onChange, onRemove }) {
	const value = stage.model ? `${stage.provider}::${stage.model}` : "__inherit__";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "panel p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: stage.skill
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"Stage ",
						stage.position,
						stage.hasOverride && " · uses an agent-specific version of this skill"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					size: "sm",
					onClick: onClose,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 grid gap-5 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Model" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value,
							onValueChange: (v) => {
								if (v === "__inherit__") {
									onChange({
										...stage,
										provider: null,
										model: null
									});
									return;
								}
								const [provider, model] = v.split("::");
								onChange({
									...stage,
									provider,
									model
								});
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: "__inherit__",
								children: ["Inherit — ", defaultModel ?? "no agent default set"]
							}), choices.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: `${c.provider}::${c.model}`,
								children: [
									c.model,
									" · ",
									c.provider
								]
							}, `${c.provider}::${c.model}`))] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Leave on inherit for cheap stages and override only where quality matters."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Gate" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "A failing gate sends work back instead of finishing the run."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: stage.isGate,
							disabled: busy,
							onCheckedChange: (isGate) => onChange({
								...stage,
								isGate
							})
						})]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Runs after" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: allStages.filter((s) => s.id !== stage.id).map((other) => {
							const on = stage.dependsOn.includes(other.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								disabled: busy,
								onClick: () => onChange({
									...stage,
									dependsOn: on ? stage.dependsOn.filter((d) => d !== other.id) : [...stage.dependsOn, other.id]
								}),
								className: `rounded-full border px-3 py-1 text-xs transition-colors ${on ? "border-primary/60 bg-primary/10 text-foreground" : "border-dashed border-border text-muted-foreground hover:border-primary/40"}`,
								children: [
									other.position,
									". ",
									other.skill
								]
							}, other.id);
						})
					}),
					stage.dependsOn.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: "No dependencies — this stage starts in the first level."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					size: "sm",
					disabled: busy,
					onClick: onRemove,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), " Remove stage"]
				})
			})
		]
	});
}
function SettingsTab({ detail, choices, categories, busy, onSave }) {
	const [guardrails, setGuardrails] = (0, import_react.useState)(detail.guardrails ?? "");
	const [role, setRole] = (0, import_react.useState)(detail.role);
	(0, import_react.useEffect)(() => {
		setGuardrails(detail.guardrails ?? "");
		setRole(detail.role);
	}, [
		detail.id,
		detail.guardrails,
		detail.role
	]);
	const value = detail.defaultModel ? `${detail.defaultProvider}::${detail.defaultModel}` : "__none__";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: "Default model"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Every stage uses this unless it sets its own."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 max-w-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value,
							onValueChange: (v) => {
								if (v === "__none__") {
									onSave({
										defaultProvider: null,
										defaultModel: null
									}, "Default cleared");
									return;
								}
								const [provider, model] = v.split("::");
								onSave({
									defaultProvider: provider,
									defaultModel: model
								}, "Default model set");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "__none__",
								children: "No default"
							}), choices.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
								value: `${c.provider}::${c.model}`,
								children: [
									c.model,
									" · ",
									c.provider
								]
							}, `${c.provider}::${c.model}`))] })]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: "Category"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Determines which skills are suggested first in the pipeline builder."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 max-w-md",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: detail.category ?? "__none__",
							onValueChange: (v) => onSave({ category: v === "__none__" ? null : v }, "Category saved"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: "__none__",
								children: "No category"
							}), categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: c.id,
								children: c.name
							}, c.id))] })]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-semibold",
					children: "Role"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex max-w-xl gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: role,
						onChange: (e) => setRole(e.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: busy || role === detail.role,
						onClick: () => onSave({ role }, "Role saved"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: "Guardrails"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "What this agent must not do. Carried into every stage's prompt."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						className: "mt-3 min-h-32",
						value: guardrails,
						onChange: (e) => setGuardrails(e.target.value),
						placeholder: "Writes copy only. Never implies a published page exists."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							disabled: busy || guardrails === (detail.guardrails ?? ""),
							onClick: () => onSave({ guardrails: guardrails || null }, "Guardrails saved"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), " Save"]
						})
					})
				]
			})
		]
	});
}
/**
* Skills matching the agent's category are listed first under "Suggested".
* Everything else stays available below rather than being filtered out — a
* cross-category skill like gather-context belongs in most pipelines.
*/
function AddStage({ skills, agentCategory, used, disabled, onAdd }) {
	const [value, setValue] = (0, import_react.useState)("");
	const available = skills.filter((s) => !used.includes(s.id));
	const suggested = agentCategory ? available.filter((s) => s.category === agentCategory) : [];
	const rest = available.filter((s) => !suggested.includes(s));
	if (skills.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-muted-foreground",
		children: "No skills in the library yet — add one on the Skills tab."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
			value,
			onValueChange: setValue,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
				className: "w-64",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Add a skill as a stage…" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [suggested.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 py-1.5 text-xs uppercase tracking-widest text-primary",
					children: "Suggested"
				}),
				suggested.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
					value: s.id,
					children: s.name
				}, s.id)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 border-t border-border px-2 pb-1.5 pt-2 text-xs uppercase tracking-widest text-muted-foreground",
					children: "All skills"
				})
			] }), rest.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
				value: s.id,
				children: [s.name, s.category ? ` · ${s.category}` : ""]
			}, s.id))] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "secondary",
			disabled: disabled || !value,
			onClick: () => {
				onAdd(value);
				setValue("");
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Add stage"]
		})]
	});
}
function CreateAgentDialog({ choices, categories, onCreated }) {
	const empty = {
		name: "",
		role: "",
		description: "",
		model: "",
		category: ""
	};
	const [draft, setDraft] = (0, import_react.useState)(empty);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const create = async () => {
		if (!draft.name.trim()) return;
		setBusy(true);
		try {
			const { id } = await api.createAgent({
				name: draft.name,
				role: draft.role || "Custom agent",
				description: draft.description,
				model: draft.model || null,
				category: draft.category || null
			});
			toast.success(`${draft.name} created`);
			setDraft(empty);
			await onCreated(id);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not create the agent");
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create an agent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Stages and knowledge can be added after." })] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "name",
						children: "Name"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "name",
						value: draft.name,
						onChange: (e) => setDraft({
							...draft,
							name: e.target.value
						}),
						placeholder: "Beacon"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "role",
						children: "Role"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "role",
						value: draft.role,
						onChange: (e) => setDraft({
							...draft,
							role: e.target.value
						}),
						placeholder: "Lifecycle email writer"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "desc",
						children: "What it does"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						id: "desc",
						value: draft.description,
						onChange: (e) => setDraft({
							...draft,
							description: e.target.value
						}),
						placeholder: "Writes onboarding sequences from product docs."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: draft.category,
							onValueChange: (category) => setDraft({
								...draft,
								category
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose a category" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: c.id,
								children: c.name
							}, c.id)) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Skills in this category are suggested first when you build the pipeline."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Default model" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: draft.model,
						onValueChange: (model) => setDraft({
							...draft,
							model
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose a model" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: choices.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
							value: c.model,
							children: [
								c.model,
								" · ",
								c.provider
							]
						}, `${c.provider}::${c.model}`)) })]
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			onClick: create,
			disabled: busy,
			children: busy ? "Creating…" : "Create agent"
		}) })
	] });
}
//#endregion
export { AgentsPage as component };
