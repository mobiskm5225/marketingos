import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useRouter, c as HeadContent, d as Outlet, f as lazyRouteComponent, h as Link, j as notFound, m as createRootRouteWithContext, p as createFileRoute, s as Scripts, u as createRouter$1 } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as z } from "../_libs/next-themes.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import processModule from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/api-BiX56OTJ.js
var API_BASE = typeof window === "undefined" ? processModule.env.INTERNAL_API_URL ?? "http://localhost:8000/api" : "http://localhost:8000/api";
var api = {
	getAgents: async () => {
		const res = await fetch(`${API_BASE}/agents`);
		if (!res.ok) throw new Error("Failed to fetch agents");
		return res.json();
	},
	getKnowledgeBases: async () => {
		const res = await fetch(`${API_BASE}/knowledge-bases`);
		if (!res.ok) throw new Error("Failed to fetch knowledge bases");
		return res.json();
	},
	getModels: async () => {
		const res = await fetch(`${API_BASE}/models`);
		if (!res.ok) throw new Error("Failed to fetch models");
		return res.json();
	},
	getIntegrations: async () => {
		const res = await fetch(`${API_BASE}/integrations`);
		if (!res.ok) throw new Error("Failed to fetch integrations");
		return res.json();
	},
	getRuns: async () => {
		const res = await fetch(`${API_BASE}/runs`);
		if (!res.ok) throw new Error("Failed to fetch runs");
		return res.json();
	},
	getRun: async (slug) => {
		const res = await fetch(`${API_BASE}/runs/${slug}`);
		if (!res.ok) throw new Error("Failed to fetch run");
		return res.json();
	},
	getActivity: async () => {
		const res = await fetch(`${API_BASE}/activity`);
		if (!res.ok) throw new Error("Failed to fetch activity");
		return res.json();
	},
	getAgent: async (slug) => {
		const res = await fetch(`${API_BASE}/agents/${slug}`);
		if (!res.ok) throw new Error(await errorMessage(res));
		return res.json();
	},
	getCategories: async () => {
		const res = await fetch(`${API_BASE}/categories`);
		if (!res.ok) throw new Error("Failed to fetch categories");
		return res.json();
	},
	createAgent: (body) => send("POST", "/agents", body),
	updateAgent: (slug, body) => send("PATCH", `/agents/${slug}`, body),
	deleteAgent: (slug) => send("DELETE", `/agents/${slug}`),
	saveStages: (slug, stages) => send("PUT", `/agents/${slug}/stages`, { stages }),
	saveAgentKnowledgeBases: (slug, kbSlugs) => send("PUT", `/agents/${slug}/knowledge-bases`, { kbSlugs }),
	saveAgentInputs: (slug, inputs) => send("PUT", `/agents/${slug}/inputs`, { inputs }),
	getMemoryLayers: async () => {
		const res = await fetch(`${API_BASE}/memory/layers`);
		if (!res.ok) throw new Error("Failed to fetch memory layers");
		return res.json();
	},
	createKnowledgeBase: (body) => send("POST", "/knowledge-bases", body),
	deleteKnowledgeBase: (slug) => send("DELETE", `/knowledge-bases/${slug}`),
	getDocuments: async (slug) => {
		const res = await fetch(`${API_BASE}/knowledge-bases/${slug}/documents`);
		if (!res.ok) throw new Error(await errorMessage(res));
		return res.json();
	},
	uploadDocuments: async (slug, files) => {
		const body = new FormData();
		for (const file of files) body.append("files", file);
		const res = await fetch(`${API_BASE}/knowledge-bases/${slug}/documents`, {
			method: "POST",
			body
		});
		if (!res.ok) throw new Error(await errorMessage(res));
		return res.json();
	},
	deleteDocument: (id) => send("DELETE", `/documents/${id}`),
	distill: (kb) => send("POST", "/memory/distill", { kb: kb ?? null }),
	getSkills: async () => {
		const res = await fetch(`${API_BASE}/skills`);
		if (!res.ok) throw new Error("Failed to fetch skills");
		return res.json();
	},
	getSkill: async (slug) => {
		const res = await fetch(`${API_BASE}/skills/${slug}`);
		if (!res.ok) throw new Error("Failed to fetch skill");
		return res.json();
	},
	createSkill: (bodyMd, category) => send("POST", "/skills", {
		bodyMd,
		category: category ?? null
	}),
	updateSkill: (slug, bodyMd, category) => send("PATCH", `/skills/${slug}`, {
		bodyMd,
		category: category ?? null
	}),
	deleteSkill: (slug) => send("DELETE", `/skills/${slug}`),
	importFromFolder: async (file) => {
		const body = new FormData();
		body.append("file", file);
		const res = await fetch(`${API_BASE}/skills/import/folder`, {
			method: "POST",
			body
		});
		if (!res.ok) throw new Error(await errorMessage(res));
		return res.json();
	},
	importFromGithub: (url) => send("POST", "/skills/import/github", { url }),
	commitImport: (preview, source, sourceRef) => send("POST", "/skills/import/commit", {
		...preview,
		source,
		sourceRef
	})
};
/** Surfaces the backend's `{ error }` message instead of a bare status code. */
async function errorMessage(res) {
	try {
		const body = await res.json();
		if (body?.error) return body.error;
	} catch {}
	return `Request failed (${res.status})`;
}
async function send(method, path, body) {
	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers: body === void 0 ? void 0 : { "content-type": "application/json" },
		body: body === void 0 ? void 0 : JSON.stringify(body)
	});
	if (!res.ok) throw new Error(await errorMessage(res));
	if (res.status === 204) return void 0;
	return res.json();
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-CYsXxj1S.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var styles_default = "/assets/styles-Jm36vSjm.css";
function reportLovableError(error, metadata) {
	console.error("Lovable Error:", error, metadata);
}
var Toaster$1 = ({ ...props }) => {
	const { theme = "system" } = z();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		theme,
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$8 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Marketing OS" },
			{
				name: "description",
				content: "Agents, knowledge bases and models for a small marketing team."
			},
			{
				property: "og:title",
				content: "Marketing OS"
			},
			{
				property: "og:description",
				content: "Agents, knowledge bases and models for a small marketing team."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@Lovable"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$8.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {})]
	});
}
var $$splitComponentImporter$7 = () => import("./routes-BDravzI9.mjs");
var Route$7 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Marketing OS — Agent workspace overview" },
		{
			name: "description",
			content: "Build marketing agents, wire them to knowledge bases and models, and review every result in one workspace."
		},
		{
			property: "og:title",
			content: "Marketing OS — Agent workspace overview"
		},
		{
			property: "og:description",
			content: "Agents, knowledge bases, models and reports for a small marketing team."
		}
	] }),
	loader: async () => {
		const [agents, knowledgeBases, modelProviders, runs, activity] = await Promise.all([
			api.getAgents(),
			api.getKnowledgeBases(),
			api.getModels(),
			api.getRuns(),
			api.getActivity()
		]);
		return {
			agents,
			knowledgeBases,
			modelProviders,
			runs,
			activity
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./agents-C5lKWCH0.mjs");
var Route$6 = createFileRoute("/agents")({
	head: () => ({ meta: [
		{ title: "Agents — Marketing OS" },
		{
			name: "description",
			content: "Build an agent as a pipeline of skills, and choose which model runs at each stage."
		},
		{
			property: "og:title",
			content: "Agents — Marketing OS"
		},
		{
			property: "og:description",
			content: "Compose skills into a pipeline and route each stage to its own model."
		}
	] }),
	loader: async () => {
		const [agents, knowledgeBases, modelProviders, skills, categories] = await Promise.all([
			api.getAgents(),
			api.getKnowledgeBases(),
			api.getModels(),
			api.getSkills(),
			api.getCategories()
		]);
		return {
			agents,
			knowledgeBases,
			modelProviders,
			skills,
			categories
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
/** Every model across every provider, tagged so a stage can pick one. */
/**
* Skills matching the agent's category are listed first under "Suggested".
* Everything else stays available below rather than being filtered out — a
* cross-category skill like gather-context belongs in most pipelines.
*/
var $$splitComponentImporter$5 = () => import("./knowledge-DJCTkYce.mjs");
var Route$5 = createFileRoute("/knowledge")({
	head: () => ({ meta: [
		{ title: "Knowledge base — Marketing OS" },
		{
			name: "description",
			content: "Connect Notion, Obsidian and Microsoft Office, upload files, and build layered agent memory."
		},
		{
			property: "og:title",
			content: "Knowledge base — Marketing OS"
		},
		{
			property: "og:description",
			content: "Connect Notion, Obsidian and Office, upload files, build layered agent memory."
		}
	] }),
	loader: async () => {
		const [knowledgeBases, integrations, memory] = await Promise.all([
			api.getKnowledgeBases(),
			api.getIntegrations(),
			api.getMemoryLayers()
		]);
		return {
			knowledgeBases,
			integrations,
			memory
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./models-CqxZgOeU.mjs");
var Route$4 = createFileRoute("/models")({
	head: () => ({ meta: [
		{ title: "Models — Marketing OS" },
		{
			name: "description",
			content: "Connect Claude, ChatGPT, Gemini or a self-hosted open-source model and set run defaults."
		},
		{
			property: "og:title",
			content: "Models — Marketing OS"
		},
		{
			property: "og:description",
			content: "Hosted APIs and open-source endpoints your agents can run on."
		}
	] }),
	loader: async () => {
		return { modelProviders: await api.getModels() };
	},
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./runs-BDF5m37B.mjs");
var Route$3 = createFileRoute("/runs")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./skills-BgmxMv71.mjs");
var Route$2 = createFileRoute("/skills")({
	head: () => ({ meta: [
		{ title: "Skills — Marketing OS" },
		{
			name: "description",
			content: "Author reusable skills as markdown, or import them from a folder or a GitHub repository."
		},
		{
			property: "og:title",
			content: "Skills — Marketing OS"
		},
		{
			property: "og:description",
			content: "The skill library your agents are built from."
		}
	] }),
	loader: async () => {
		const [skills, categories] = await Promise.all([api.getSkills(), api.getCategories()]);
		return {
			skills,
			categories
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
/** The scaffold a new skill starts from — the section contract agents rely on. */
/**
* Groups stages into execution levels the same way the runtime will: a level
* contains only stages whose dependencies are already satisfied, so everything
* shown side by side can run in parallel.
*/
var $$splitComponentImporter$1 = () => import("./runs.index-BUVvU8BO.mjs");
var Route$1 = createFileRoute("/runs/")({
	head: () => ({ meta: [
		{ title: "Results — Marketing OS" },
		{
			name: "description",
			content: "Every agent run, its report, sources, attachments and review comments."
		},
		{
			property: "og:title",
			content: "Results — Marketing OS"
		},
		{
			property: "og:description",
			content: "Every agent run, its report, sources, attachments and review comments."
		}
	] }),
	loader: async () => {
		return { runs: await api.getRuns() };
	},
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./runs._runId-Bq9aR9cN.mjs");
var Route = createFileRoute("/runs/$runId")({
	loader: async ({ params }) => {
		try {
			return { run: await api.getRun(params.runId) };
		} catch (e) {
			throw notFound();
		}
	},
	head: ({ loaderData }) => {
		const title = loaderData ? `${loaderData.run.title} — Marketing OS` : "Result — Marketing OS";
		const description = loaderData?.run.summary ?? "Agent run report.";
		return { meta: [
			{ title },
			{
				name: "description",
				content: description
			},
			{
				property: "og:title",
				content: title
			},
			{
				property: "og:description",
				content: description
			}
		] };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var IndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$8
});
var AgentsRoute = Route$6.update({
	id: "/agents",
	path: "/agents",
	getParentRoute: () => Route$8
});
var KnowledgeRoute = Route$5.update({
	id: "/knowledge",
	path: "/knowledge",
	getParentRoute: () => Route$8
});
var ModelsRoute = Route$4.update({
	id: "/models",
	path: "/models",
	getParentRoute: () => Route$8
});
var RunsRoute = Route$3.update({
	id: "/runs",
	path: "/runs",
	getParentRoute: () => Route$8
});
var SkillsRoute = Route$2.update({
	id: "/skills",
	path: "/skills",
	getParentRoute: () => Route$8
});
var RunsIndexRoute = Route$1.update({
	id: "/",
	path: "/",
	getParentRoute: () => RunsRoute
});
var RunsRouteChildren = {
	RunsRunIdRoute: Route.update({
		id: "/$runId",
		path: "/$runId",
		getParentRoute: () => RunsRoute
	}),
	RunsIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AgentsRoute,
	KnowledgeRoute,
	ModelsRoute,
	RunsRoute: RunsRoute._addFileChildren(RunsRouteChildren),
	SkillsRoute
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({
	createRouter: () => createRouter,
	getRouter: () => getRouter
});
var createRouter = () => {
	const queryClient = new QueryClient();
	return createRouter$1({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
var getRouter = createRouter;
//#endregion
export { Route$4 as a, Route$7 as c, Route$2 as i, api as l, Route as n, Route$5 as o, Route$1 as r, Route$6 as s, router_exports as t };
