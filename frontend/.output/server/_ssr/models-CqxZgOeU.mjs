import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as Route$4 } from "./router-CYsXxj1S.mjs";
import { S as Cloud, o as Server } from "../_libs/lucide-react.mjs";
import { n as Badge, r as cn, t as AppShell } from "./badge-DUy4Kh1K.mjs";
import { t as Button } from "./button-CuAW9m_P.mjs";
import { t as Input } from "./input-Z3vyt-AO.mjs";
import { t as Label } from "./label-DwooDaT2.mjs";
import { t as Switch } from "./switch-BcuW7dHr.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/radix-ui__react-slider.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/models-CqxZgOeU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })]
}));
Slider.displayName = Slider$1.displayName;
function ModelsPage() {
	const { modelProviders } = Route$4.useLoaderData();
	const [temperature, setTemperature] = (0, import_react.useState)([.4]);
	const [fallback, setFallback] = (0, import_react.useState)(true);
	const [endpoint, setEndpoint] = (0, import_react.useState)("http://localhost:11434");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Models",
		subtitle: "Hosted APIs and open-source endpoints available to your agents.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[1fr_320px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: modelProviders.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex size-9 items-center justify-center rounded-md bg-secondary",
									children: p.kind === "Open source" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { className: "size-4 text-accent" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cloud, { className: "size-4 text-primary" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: p.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: p.kind
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: p.status === "connected" ? "secondary" : "outline",
								children: p.status
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 flex flex-wrap gap-1.5",
							children: p.models.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground",
								children: m
							}, m))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-4 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: p.note
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: p.status === "connected" ? "secondary" : "default",
								onClick: () => toast.success(`${p.name} settings opened`),
								children: p.status === "connected" ? "Configure" : "Add key"
							})]
						})
					]
				}, p.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-semibold",
						children: "Run defaults"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, { children: ["Temperature — ", temperature[0]?.toFixed(1)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
							className: "mt-3",
							value: temperature,
							onValueChange: setTemperature,
							min: 0,
							max: 1,
							step: .1
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Local fallback" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Use Ollama if a hosted API fails."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
								checked: fallback,
								onCheckedChange: setFallback
							})]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "Custom endpoint"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: "Any OpenAI-compatible URL — vLLM, LM Studio, llama.cpp."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							className: "mt-3",
							value: endpoint,
							onChange: (e) => setEndpoint(e.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-3 w-full",
							variant: "secondary",
							onClick: () => toast.success("Endpoint reachable · 3 models found"),
							children: "Test connection"
						})
					]
				})]
			})]
		})
	});
}
//#endregion
export { ModelsPage as component };
