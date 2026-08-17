import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as Route$1 } from "./router-CYsXxj1S.mjs";
import { C as Clock, x as Cpu, y as FileChartColumnIncreasing } from "../_libs/lucide-react.mjs";
import { n as Badge, t as AppShell } from "./badge-DUy4Kh1K.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/runs.index-BUVvU8BO.js
var import_jsx_runtime = require_jsx_runtime();
function RunsPage() {
	const { runs } = Route$1.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Results",
		subtitle: "What the agents produced, and what still needs a human.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [runs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel flex flex-col items-center gap-2 border-dashed p-10 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileChartColumnIncreasing, { className: "size-6 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: "No results yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-sm text-sm text-muted-foreground",
						children: "Every agent run lands here with its report, the sources it used and any review comments. Run an agent to see the first one."
					})
				]
			}), runs.map((run) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/runs/$runId",
				params: { runId: run.id },
				className: "panel block p-5 transition-colors hover:border-primary/50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: run.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted-foreground",
						children: run.summary
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: run.status === "complete" ? "secondary" : "outline",
						children: run.status
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: run.agent }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cpu, { className: "size-3" }),
								" ",
								run.model
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }),
								" ",
								run.started,
								" · ",
								run.duration
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [run.comments.length, " comments"] })
					]
				})]
			}, run.id))]
		})
	});
}
//#endregion
export { RunsPage as component };
