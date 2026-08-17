import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as Route$7 } from "./router-CYsXxj1S.mjs";
import { A as ArrowRight, D as Brain, O as Bot, x as Cpu, y as FileChartColumnIncreasing } from "../_libs/lucide-react.mjs";
import { n as Badge, t as AppShell } from "./badge-DUy4Kh1K.mjs";
import { t as Button } from "./button-CuAW9m_P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BDravzI9.js
var import_jsx_runtime = require_jsx_runtime();
function Index() {
	const { agents, knowledgeBases, modelProviders, runs, activity } = Route$7.useLoaderData();
	const stats = [
		{
			label: "Agents",
			value: agents.length,
			icon: Bot,
			to: "/agents"
		},
		{
			label: "Knowledge bases",
			value: knowledgeBases.length,
			icon: Brain,
			to: "/knowledge"
		},
		{
			label: "Model providers",
			value: modelProviders.filter((m) => m.status === "connected").length,
			icon: Cpu,
			to: "/models"
		},
		{
			label: "Runs this week",
			value: runs.length,
			icon: FileChartColumnIncreasing,
			to: "/runs"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Overview",
		subtitle: "Everything your marketing agents know, use and produce.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/agents",
				children: "New agent"
			})
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel hero-gradient p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs uppercase tracking-widest text-primary",
							children: "Northstar workspace"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 max-w-2xl text-2xl font-semibold",
							children: "Your agents, your knowledge, one place to review the work."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-2xl text-sm text-muted-foreground",
							children: "Give an agent skills, point it at the memory you trust, pick a model, then read the report and comment inline where it needs a twist."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
					children: stats.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: s.to,
						className: "panel p-4 transition-colors hover:border-primary/50",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, { className: "size-4 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-2xl font-semibold",
								children: s.value
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: s.label
							})
						]
					}, s.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-6 lg:grid-cols-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel p-5 lg:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-semibold",
								children: "Latest results"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/runs",
								className: "flex items-center gap-1 text-sm text-primary",
								children: ["All results ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" })]
							})]
						}), runs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm text-muted-foreground",
							children: "No runs yet. Create an agent and run it — its report will appear here."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 divide-y divide-border",
							children: runs.map((run) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/runs/$runId",
								params: { runId: run.id },
								className: "flex items-center justify-between gap-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-medium",
										children: run.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [
											run.agent,
											" · ",
											run.started,
											" · ",
											run.duration
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: run.status === "complete" ? "secondary" : "outline",
									children: run.status
								})]
							}) }, run.id))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "Activity"
						}), activity.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm text-muted-foreground",
							children: "Nothing has happened yet."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 space-y-4",
							children: activity.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: a.text }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: a.time
								})] })]
							}, a.id))
						})]
					})]
				})
			]
		})
	});
}
//#endregion
export { Index as component };
