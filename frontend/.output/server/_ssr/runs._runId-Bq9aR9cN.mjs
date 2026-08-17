import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Route } from "./router-CYsXxj1S.mjs";
import { d as Paperclip, j as ArrowLeft, m as Image, s as Send, v as FileText } from "../_libs/lucide-react.mjs";
import { n as Badge, t as AppShell } from "./badge-DUy4Kh1K.mjs";
import { t as Button } from "./button-CuAW9m_P.mjs";
import { t as Textarea } from "./textarea-C1bEjhgl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/runs._runId-Bq9aR9cN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RunDetail() {
	const { run } = Route.useLoaderData();
	const [comments, setComments] = (0, import_react.useState)(run.comments);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [attachments, setAttachments] = (0, import_react.useState)(run.attachments);
	const post = () => {
		if (!draft.trim()) return;
		setComments((prev) => [...prev, {
			id: `c${prev.length + 1}`,
			author: "You",
			initials: "YO",
			time: "just now",
			body: draft
		}]);
		setDraft("");
		toast.success("Comment added — agent will re-run affected sections");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: run.title,
		subtitle: `${run.agent} · ${run.model} · ${run.started} · ${run.duration}`,
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "secondary",
				asChild: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/runs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " All results"]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => toast.success("Re-run queued with the latest comments"),
				children: "Re-run with edits"
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[1fr_340px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel hero-gradient p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: run.status === "complete" ? "secondary" : "outline",
									children: run.status
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: run.id
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-3xl text-sm",
								children: run.summary
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
								children: run.metrics.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-md border border-border bg-card/70 p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: m.label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-lg font-semibold",
											children: m.value
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: m.hint
										})
									]
								}, m.label))
							})
						]
					}),
					run.sections.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-semibold",
								children: section.heading
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground",
								children: section.body
							}),
							section.bullets && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-2 text-sm",
								children: section.bullets.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-2 size-1.5 shrink-0 rounded-full bg-primary" }), b]
								}, b))
							}),
							comments.some((c) => c.anchor === section.heading) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs text-primary",
								children: [comments.filter((c) => c.anchor === section.heading).length, " comment on this section"]
							})
						]
					}, section.heading)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "Sources used"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 divide-y divide-border text-sm",
							children: run.sources.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: s.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									children: s.kind
								})]
							}, s.name))
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel flex flex-col p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-semibold",
							children: "Comments"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: "Twist the output — the agent reads these on the next run."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-4 space-y-4",
							children: [comments.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium",
									children: c.initials
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: [
												c.author,
												" · ",
												c.time
											]
										}),
										c.anchor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 border-l-2 border-primary/60 pl-2 text-xs text-primary",
											children: [
												"on \"",
												c.anchor,
												"\""
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm",
											children: c.body
										})
									]
								})]
							}, c.id)), comments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "text-sm text-muted-foreground",
								children: "No comments yet."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							className: "mt-4",
							value: draft,
							onChange: (e) => setDraft(e.target.value),
							placeholder: "Ask for a change…"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paperclip, { className: "size-3.5" }),
									" Attach",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										multiple: true,
										className: "hidden",
										onChange: (e) => {
											const added = Array.from(e.target.files ?? []).map((f) => ({
												name: f.name,
												kind: f.type.startsWith("image/") ? "image" : "doc",
												size: `${Math.max(1, Math.round(f.size / 1024))} KB`
											}));
											if (added.length) {
												setAttachments((prev) => [...prev, ...added]);
												toast.success(`${added.length} file(s) attached`);
											}
										}
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								size: "sm",
								onClick: post,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-3.5" }), " Comment"]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-semibold",
						children: "Attachments"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-2 text-sm",
						children: [attachments.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-2 rounded-md border border-border p-2.5",
							children: [
								a.kind === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-4 text-accent" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4 text-primary" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 truncate",
									children: a.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: a.size
								})
							]
						}, a.name)), attachments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-sm text-muted-foreground",
							children: "Nothing attached yet."
						})]
					})]
				})]
			})]
		})
	});
}
//#endregion
export { RunDetail as component };
