globalThis.__nitro_main__ = import.meta.url;
import { n as HTTPError, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/assets/agents-DLioOiRN.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"3c35-lFaZK5XKLiA1ueePpWy3ZyWmewg\"",
		"mtime": "2026-08-16T07:04:55.767Z",
		"size": 15413,
		"path": "../public/assets/agents-DLioOiRN.css"
	},
	"/assets/button-B3WvknYB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"fcc-K3KzwHmAyBeDnH5WqwBzhGqfCYg\"",
		"mtime": "2026-08-16T07:04:55.762Z",
		"size": 4044,
		"path": "../public/assets/button-B3WvknYB.js"
	},
	"/assets/dialog-BxA3zJHN.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1cfa-TYqLGodGwww4fapZAjEBKokCmT0\"",
		"mtime": "2026-08-16T07:04:55.763Z",
		"size": 7418,
		"path": "../public/assets/dialog-BxA3zJHN.js"
	},
	"/assets/file-up-CzAynEEk.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"156-r5us7khDE71r9MC5sTcWwErVkoU\"",
		"mtime": "2026-08-16T07:04:55.763Z",
		"size": 342,
		"path": "../public/assets/file-up-CzAynEEk.js"
	},
	"/assets/badge-CBwACq1o.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"889f-kyM/4Ohw42GXdezV0f6XNS3UfBs\"",
		"mtime": "2026-08-16T07:04:55.762Z",
		"size": 34975,
		"path": "../public/assets/badge-CBwACq1o.js"
	},
	"/assets/dist-D7YjQHEM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3550-yrgxMHTSDWkYbepE/jLb6SKQfaY\"",
		"mtime": "2026-08-16T07:04:55.763Z",
		"size": 13648,
		"path": "../public/assets/dist-D7YjQHEM.js"
	},
	"/assets/label-DoG17clM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2ab-efd03/l/dqPT+Qb+KLS6E4iZs2Y\"",
		"mtime": "2026-08-16T07:04:55.763Z",
		"size": 683,
		"path": "../public/assets/label-DoG17clM.js"
	},
	"/assets/knowledge-Ddy52KrY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2eb2-yQmIinjabWomT+pwern41wbMfCY\"",
		"mtime": "2026-08-16T07:04:55.763Z",
		"size": 11954,
		"path": "../public/assets/knowledge-Ddy52KrY.js"
	},
	"/assets/models-CTS_FcXj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"34f9-wQX/mCi63nJn/vMJjOnI4NPySBM\"",
		"mtime": "2026-08-16T07:04:55.763Z",
		"size": 13561,
		"path": "../public/assets/models-CTS_FcXj.js"
	},
	"/assets/routes-BGm5Ercj.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"e2d-k874/SHrzm2fPf1+rpqxqsLIKK0\"",
		"mtime": "2026-08-16T07:04:55.763Z",
		"size": 3629,
		"path": "../public/assets/routes-BGm5Ercj.js"
	},
	"/assets/runs-BwyK4cEK.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8a-9iwEjN1zYVqYMeEgfkbN6Y1Kc1E\"",
		"mtime": "2026-08-16T07:04:55.764Z",
		"size": 138,
		"path": "../public/assets/runs-BwyK4cEK.js"
	},
	"/assets/file-text-CnYmIkG7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"176-V7AnHptk/DertSqetsUbSTzomug\"",
		"mtime": "2026-08-16T07:04:55.763Z",
		"size": 374,
		"path": "../public/assets/file-text-CnYmIkG7.js"
	},
	"/assets/runs._runId-1i_eorUo.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1816-ovI/MY507O1uLhOYlW2u9Bg5KfU\"",
		"mtime": "2026-08-16T07:04:55.764Z",
		"size": 6166,
		"path": "../public/assets/runs._runId-1i_eorUo.js"
	},
	"/assets/skills-Cp_P573S.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c74-RA5NPhriDkXO3PAVDuxLtWTx/BA\"",
		"mtime": "2026-08-16T07:04:55.766Z",
		"size": 15476,
		"path": "../public/assets/skills-Cp_P573S.js"
	},
	"/assets/switch-C4GKVlU2.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"10b9-jwaPmrX2A1X3FVNQcxpR2HAbEbI\"",
		"mtime": "2026-08-16T07:04:55.766Z",
		"size": 4281,
		"path": "../public/assets/switch-C4GKVlU2.js"
	},
	"/assets/runs.index-Cxntx0z_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"760-+VmvlLkXJnajd4Q+zqq5vV8Xq1s\"",
		"mtime": "2026-08-16T07:04:55.765Z",
		"size": 1888,
		"path": "../public/assets/runs.index-Cxntx0z_.js"
	},
	"/assets/textarea-DqEfZ2da.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"205-1Fu7eHLywOX+Ey+PJ5YEtPOJ8KE\"",
		"mtime": "2026-08-16T07:04:55.766Z",
		"size": 517,
		"path": "../public/assets/textarea-DqEfZ2da.js"
	},
	"/assets/styles-Jm36vSjm.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"ae75-fctQSuW3LddhkCzbrp9Dhu2RP90\"",
		"mtime": "2026-08-16T07:04:55.767Z",
		"size": 44661,
		"path": "../public/assets/styles-Jm36vSjm.css"
	},
	"/assets/useStore-C5eeDSvu.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6e23-g8c1UwlqDvF1WMLua6TBqyCL6UE\"",
		"mtime": "2026-08-16T07:04:55.766Z",
		"size": 28195,
		"path": "../public/assets/useStore-C5eeDSvu.js"
	},
	"/assets/agents-ChyR7WzL.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"2fa1f-yXDkxZMIuTup9JqMyE1KdHhFqK8\"",
		"mtime": "2026-08-16T07:04:55.761Z",
		"size": 195103,
		"path": "../public/assets/agents-ChyR7WzL.js"
	},
	"/assets/select-BSD6jqCW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"13b19-o1nijkTA+kTpY0l9GdjjR/WUNAg\"",
		"mtime": "2026-08-16T07:04:55.765Z",
		"size": 80665,
		"path": "../public/assets/select-BSD6jqCW.js"
	},
	"/assets/index-BDIjQZH_.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"58434-VS3xdaLdcsqdlFvB6XPsT+yYj+k\"",
		"mtime": "2026-08-16T07:04:55.761Z",
		"size": 361524,
		"path": "../public/assets/index-BDIjQZH_.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_UWKLKP = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_UWKLKP
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
