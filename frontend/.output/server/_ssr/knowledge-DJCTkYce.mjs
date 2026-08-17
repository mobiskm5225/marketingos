import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { l as api, o as Route$5 } from "./router-CYsXxj1S.mjs";
import { O as Bot, _ as FileUp, b as Database, h as Globe, i as Trash2, l as RefreshCw, p as Layers, u as Plus, v as FileText } from "../_libs/lucide-react.mjs";
import { n as Badge, r as cn, t as AppShell } from "./badge-DUy4Kh1K.mjs";
import { t as Button } from "./button-CuAW9m_P.mjs";
import { t as Input } from "./input-Z3vyt-AO.mjs";
import { a as SelectValue, c as TabsList, i as SelectTrigger, l as TabsTrigger, n as SelectContent, o as Tabs, r as SelectItem, s as TabsContent, t as Select } from "./select-DKLhxk_L.mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/knowledge-DJCTkYce.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
var iconMap = {
	Database,
	FileText,
	Globe
};
var getIcon = (name) => iconMap[name] || Bot;
function KnowledgePage() {
	const { knowledgeBases, integrations, memory } = Route$5.useLoaderData();
	const router = useRouter();
	const [name, setName] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [target, setTarget] = (0, import_react.useState)(knowledgeBases[0]?.id ?? "");
	const [documents, setDocuments] = (0, import_react.useState)([]);
	const memoryLayers = memory.layers;
	const maxLayerCount = Math.max(1, ...memoryLayers.map((l) => l.count));
	const reload = async () => {
		await router.invalidate();
		if (target) setDocuments(await api.getDocuments(target).catch(() => []));
	};
	(0, import_react.useEffect)(() => {
		if (!target) return;
		api.getDocuments(target).then(setDocuments).catch(() => setDocuments([]));
	}, [target]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Knowledge",
		subtitle: "Sources, uploads and the layered memory your agents actually read.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			onClick: () => toast.success("Sync started for all sources"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), " Sync all"]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "bases",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "bases",
						children: "Bases"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "integrations",
						children: "Integrations"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "memory",
						children: "Memory builder"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "files",
						children: "Files"
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "bases",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [knowledgeBases.map((kb) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex size-9 items-center justify-center rounded-md bg-secondary",
											children: (() => {
												const Icon = getIcon(kb.icon);
												return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-primary" });
											})()
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium",
											children: kb.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: kb.source
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										children: kb.type
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 grid grid-cols-3 gap-3 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-xs",
											children: "Docs"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium",
											children: kb.docs
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-xs",
											children: "Chunks"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium",
											children: kb.chunks.toLocaleString()
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-xs",
											children: "Updated"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium",
											children: kb.updated
										})] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-xs text-muted-foreground",
									children: kb.usedBy.length > 0 ? `Used by ${kb.usedBy.join(", ")}` : "Not used by any agent yet"
								})
							]
						}, kb.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel flex flex-col items-start justify-center gap-3 border-dashed p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-5 text-primary" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: "New knowledge base"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex w-full gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: name,
										onChange: (e) => setName(e.target.value),
										placeholder: "e.g. Customer interviews"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										disabled: busy,
										onClick: async () => {
											if (!name.trim()) return;
											setBusy(true);
											try {
												const { id } = await api.createKnowledgeBase({ name });
												toast.success(`${name} created`);
												setName("");
												setTarget(id);
												await reload();
											} catch (e) {
												toast.error(e instanceof Error ? e.message : "Could not create");
											} finally {
												setBusy(false);
											}
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
									})]
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "integrations",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: integrations.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel flex items-start justify-between gap-4 p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: i.name
									}), i.status === "connected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-primary" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: i.blurb
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted-foreground",
									children: i.detail
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: i.status === "connected" ? "secondary" : "default",
								onClick: () => toast.success(i.status === "connected" ? `${i.name} re-synced` : `Connect ${i.name}`),
								children: i.status === "connected" ? "Manage" : "Connect"
							})]
						}, i.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "memory",
					className: "mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel hero-gradient p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold",
								children: "Layered memory"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 max-w-2xl text-sm text-muted-foreground",
								children: "Raw files are not a knowledge base. Sources get summarised into notes, get distilled into deduped facts, and only the essentials stay in core memory that every agent carries into every run."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4",
							children: memoryLayers.map((layer, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "panel p-5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs uppercase tracking-widest text-primary",
										children: ["Layer ", idx + 1]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 font-medium",
										children: layer.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm text-muted-foreground",
										children: layer.blurb
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-4 text-sm font-medium",
										children: [
											layer.count.toLocaleString(),
											" ",
											layer.unit
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
										value: maxLayerCount ? layer.count / maxLayerCount * 100 : 0,
										className: "mt-2"
									})
								]
							}, layer.key))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "panel mt-4 flex flex-wrap items-center justify-between gap-3 p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground",
								children: [memory.lastDistillation ? `Last pass: ${memory.lastDistillation.status} · ${memory.lastDistillation.factsAdded} new facts, ${memory.lastDistillation.conflictsResolved} conflicts resolved.` : "No distillation pass has run yet.", !memory.embeddingsAvailable && " Embeddings are unavailable, so retrieval falls back to keyword search."]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								disabled: busy,
								onClick: async () => {
									setBusy(true);
									try {
										const result = await api.distill();
										if (result.skipped) toast.error(result.skipped);
										else toast.success(`${result.notesWritten} notes, ${result.factsAdded} facts, ${result.conflictsResolved} conflicts resolved`);
										await reload();
									} catch (e) {
										toast.error(e instanceof Error ? e.message : "Distillation failed");
									} finally {
										setBusy(false);
									}
								},
								children: busy ? "Running…" : "Run distillation"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "files",
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "panel p-5",
						children: knowledgeBases.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm text-muted-foreground",
							children: "Create a knowledge base first — uploads are indexed into one."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-4 flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs uppercase tracking-widest text-muted-foreground",
									children: "Index into"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: target,
									onValueChange: setTarget,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "w-64",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: knowledgeBases.map((kb) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: kb.id,
										children: kb.name
									}, kb.id)) })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "size-5 text-primary" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium",
										children: busy ? "Indexing…" : "Drop documents"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted-foreground",
										children: "PDF, DOCX, XLSX, CSV, MD, TXT — parsed, chunked and embedded"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										multiple: true,
										className: "hidden",
										disabled: busy || !target,
										onChange: async (e) => {
											const picked = Array.from(e.target.files ?? []);
											if (picked.length === 0) return;
											setBusy(true);
											try {
												const result = await api.uploadDocuments(target, picked);
												toast.success(`${result.indexed} indexed · ${result.chunks} chunks` + (result.embeddingsAvailable && !result.embedded ? " · embeddings unavailable, keyword search only" : ""));
												await reload();
											} catch (err) {
												toast.error(err instanceof Error ? err.message : "Upload failed");
											} finally {
												setBusy(false);
												e.target.value = "";
											}
										}
									})
								]
							}),
							documents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-center text-sm text-muted-foreground",
								children: "No files in this base yet."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-4 divide-y divide-border",
								children: documents.map((doc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-3 py-3 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "min-w-0 flex-1 truncate",
											children: doc.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs text-muted-foreground",
											children: [
												doc.chunks,
												" chunk",
												doc.chunks === 1 ? "" : "s"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: doc.status === "error" ? "border-destructive/50 text-destructive" : "",
											title: doc.error ?? void 0,
											children: doc.status
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											"aria-label": `Delete ${doc.name}`,
											disabled: busy,
											onClick: async () => {
												setBusy(true);
												try {
													await api.deleteDocument(doc.id);
													await reload();
												} catch (err) {
													toast.error(err instanceof Error ? err.message : "Could not delete");
												} finally {
													setBusy(false);
												}
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5 text-muted-foreground hover:text-foreground" })
										})
									]
								}, doc.id))
							})
						] })
					})
				})
			]
		})
	});
}
//#endregion
export { KnowledgePage as component };
