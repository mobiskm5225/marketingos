import { n as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as Route$2, l as api } from "./router-CYsXxj1S.mjs";
import { _ as FileUp, c as Save, g as Github, i as Trash2, k as Blocks, n as Wrench, r as TriangleAlert, u as Plus } from "../_libs/lucide-react.mjs";
import { n as Badge, t as AppShell } from "./badge-DUy4Kh1K.mjs";
import { t as Button } from "./button-CuAW9m_P.mjs";
import { t as Input } from "./input-Z3vyt-AO.mjs";
import { t as Label } from "./label-DwooDaT2.mjs";
import { t as Textarea } from "./textarea-C1bEjhgl.mjs";
import { a as SelectValue, c as TabsList, i as SelectTrigger, l as TabsTrigger, n as SelectContent, o as Tabs, r as SelectItem, s as TabsContent, t as Select } from "./select-DKLhxk_L.mjs";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog } from "./dialog-DgLEsHYW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skills-BgmxMv71.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* A small markdown renderer for skill documents.
*
* It builds React elements directly rather than setting innerHTML, so a skill
* containing raw HTML or a script tag renders as text and cannot execute. That
* also keeps it safe under SSR, where a DOM-based sanitiser would need jsdom.
*
* Covers what SKILL.md files actually use: headings, ordered and unordered
* lists, fenced code, blockquotes, tables, horizontal rules, and inline
* bold/italic/code/links.
*/
function Markdown({ source }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "md space-y-3 text-sm",
		children: renderBlocks(source)
	});
}
function renderBlocks(source) {
	const lines = source.replace(/\r\n/g, "\n").split("\n");
	const out = [];
	let i = 0;
	let key = 0;
	while (i < lines.length) {
		const line = lines[i];
		if (line.trimStart().startsWith("```")) {
			const fence = [];
			i += 1;
			while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
				fence.push(lines[i]);
				i += 1;
			}
			i += 1;
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "overflow-x-auto rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: fence.join("\n") })
			}, key++));
			continue;
		}
		const heading = line.match(/^(#{1,6})\s+(.*)$/);
		if (heading) {
			const level = heading[1].length;
			const text = heading[2];
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `${[
					"text-xl font-semibold",
					"text-lg font-semibold",
					"text-base font-semibold",
					"text-sm font-semibold",
					"text-sm font-medium",
					"text-xs font-medium uppercase tracking-widest text-muted-foreground"
				][level - 1]} mt-4`,
				children: inline(text)
			}, key++));
			i += 1;
			continue;
		}
		if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: "border-border" }, key++));
			i += 1;
			continue;
		}
		if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
			const header = splitRow(line);
			i += 2;
			const rows = [];
			while (i < lines.length && lines[i].includes("|")) {
				rows.push(splitRow(lines[i]));
				i += 1;
			}
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full border-collapse text-left text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: header.map((cell, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "border-b border-border px-2 py-1.5 font-medium",
						children: inline(cell)
					}, n)) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row, r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: row.map((cell, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "border-b border-border/50 px-2 py-1.5 align-top",
						children: inline(cell)
					}, c)) }, r)) })]
				})
			}, key++));
			continue;
		}
		if (line.startsWith(">")) {
			const quote = [];
			while (i < lines.length && lines[i].startsWith(">")) {
				quote.push(lines[i].replace(/^>\s?/, ""));
				i += 1;
			}
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
				className: "border-l-2 border-primary/60 pl-3 text-muted-foreground",
				children: inline(quote.join(" "))
			}, key++));
			continue;
		}
		const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
		const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
		if (bullet || numbered) {
			const ordered = Boolean(numbered);
			const items = [];
			while (i < lines.length) {
				const m = ordered ? lines[i].match(/^\s*\d+[.)]\s+(.*)$/) : lines[i].match(/^\s*[-*+]\s+(.*)$/);
				if (!m) break;
				items.push(m[1]);
				i += 1;
			}
			const ListTag = ordered ? "ol" : "ul";
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListTag, {
				className: `space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"} marker:text-muted-foreground`,
				children: items.map((item, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(item) }, n))
			}, key++));
			continue;
		}
		if (line.trim() === "") {
			i += 1;
			continue;
		}
		const para = [];
		while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i])) {
			para.push(lines[i]);
			i += 1;
		}
		out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted-foreground",
			children: inline(para.join(" "))
		}, key++));
	}
	return out;
}
function isBlockStart(line) {
	return /^#{1,6}\s/.test(line) || line.trimStart().startsWith("```") || line.startsWith(">") || /^\s*[-*+]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line);
}
function splitRow(line) {
	return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}
/** Inline spans: `code`, **bold**, *italic*, [text](url). */
function inline(text) {
	return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g).filter((p) => p !== void 0 && p !== "").map((part, n) => {
		if (part.startsWith("`") && part.endsWith("`")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em]",
			children: part.slice(1, -1)
		}, n);
		if (part.startsWith("**") && part.endsWith("**")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
			className: "font-semibold text-foreground",
			children: part.slice(2, -2)
		}, n);
		if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: part.slice(1, -1) }, n);
		const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
		if (link) {
			const href = link[2];
			return /^https?:\/\//i.test(href) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href,
				target: "_blank",
				rel: "noreferrer noopener",
				className: "text-primary underline underline-offset-2",
				children: link[1]
			}, n) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: link[1] }, n);
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: part }, n);
	});
}
/** The scaffold a new skill starts from — the section contract agents rely on. */
var TEMPLATE = `---
name: my-skill
description: One sentence on what this skill does and when the pipeline should reach for it.
---

# My Skill

## When to use

## Inputs

## Preconditions

## Process

1.

## Output contract

## Done when
`;
var sourceTone = {
	manual: "border-border text-muted-foreground",
	folder: "border-primary/40 text-primary",
	github: "border-accent/40 text-accent"
};
function SkillsPage() {
	const { skills, categories } = Route$2.useLoaderData();
	const router = useRouter();
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [body, setBody] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)("");
	const [filterCategory, setFilterCategory] = (0, import_react.useState)("__all__");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [importOpen, setImportOpen] = (0, import_react.useState)(false);
	const filtered = skills.filter((s) => {
		const matchesQuery = `${s.name} ${s.description} ${s.category ?? ""}`.toLowerCase().includes(query.toLowerCase());
		const matchesCategory = filterCategory === "__all__" || s.category === filterCategory;
		return matchesQuery && matchesCategory;
	});
	const open = async (slug) => {
		try {
			const skill = await api.getSkill(slug);
			setSelected(slug);
			setBody(skill.bodyMd);
			setCategory(skill.category ?? "");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not open that skill");
		}
	};
	const startNew = () => {
		setSelected("");
		setBody(TEMPLATE);
		setCategory("");
	};
	const save = async () => {
		setBusy(true);
		try {
			if (selected) {
				await api.updateSkill(selected, body, category || null);
				toast.success("Skill saved");
			} else {
				const { id } = await api.createSkill(body, category || null);
				setSelected(id);
				toast.success("Skill created");
			}
			await router.invalidate();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save");
		} finally {
			setBusy(false);
		}
	};
	const remove = async () => {
		if (!selected) return;
		setBusy(true);
		try {
			await api.deleteSkill(selected);
			setSelected(null);
			setBody("");
			toast.success("Skill deleted");
			await router.invalidate();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not delete");
		} finally {
			setBusy(false);
		}
	};
	const editing = selected !== null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Skills",
		subtitle: "The reusable units agents are built from. Each one is a markdown document with its own contract.",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
				open: importOpen,
				onOpenChange: setImportOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "size-4" }), " Import"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportDialog, { onDone: async () => {
					setImportOpen(false);
					await router.invalidate();
				} })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: startNew,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " New skill"]
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[340px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search skills…"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: filterCategory,
						onValueChange: setFilterCategory,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: "__all__",
							children: "All categories"
						}), categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
							value: c.id,
							children: c.name
						}, c.id))] })]
					}),
					skills.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel flex flex-col items-center gap-2 border-dashed p-8 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-5 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: "No skills yet"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Import an agent folder or a GitHub repository, or write one by hand."
							})
						]
					}),
					filtered.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => open(skill.id),
						className: `panel w-full p-4 text-left transition-colors ${skill.id === selected ? "border-primary/60" : "hover:border-border/80"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: skill.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: sourceTone[skill.source],
									children: skill.source
								})]
							}),
							skill.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1.5 line-clamp-2 text-xs text-muted-foreground",
								children: skill.description
							}),
							skill.category && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs uppercase tracking-widest text-primary",
								children: skill.category
							})
						]
					}, skill.id)),
					skills.length > 0 && filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground",
						children: [
							"Nothing matches “",
							query,
							"”."
						]
					})
				]
			}), editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "panel flex flex-wrap items-center justify-between gap-3 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: selected || "New skill"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"The frontmatter ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "font-mono",
								children: "name"
							}),
							" becomes the skill’s identity."
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: category || "__none__",
								onValueChange: (v) => setCategory(v === "__none__" ? "" : v),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "w-44",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Category" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "__none__",
									children: "No category"
								}), categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: c.id,
									children: c.name
								}, c.id))] })]
							}),
							selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								onClick: remove,
								disabled: busy,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Delete"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: save,
								disabled: busy,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }),
									" ",
									busy ? "Saving…" : "Save"
								]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 xl:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs uppercase tracking-widest text-muted-foreground",
							children: "Markdown"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							value: body,
							onChange: (e) => setBody(e.target.value),
							spellCheck: false,
							className: "mt-2 min-h-[520px] font-mono text-xs leading-relaxed"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							className: "text-xs uppercase tracking-widest text-muted-foreground",
							children: "Preview"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 max-h-[520px] overflow-y-auto pr-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { source: body })
						})]
					})]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Blocks, { className: "size-6 text-primary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: "Pick a skill to edit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-sm text-sm text-muted-foreground",
						children: "A skill states when to use it, what it takes in, what it produces, and when it is done. Agents chain them into a pipeline."
					})
				]
			})]
		})
	});
}
function ImportDialog({ onDone }) {
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [source, setSource] = (0, import_react.useState)("folder");
	const [sourceRef, setSourceRef] = (0, import_react.useState)("");
	const [url, setUrl] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const runImport = async (fn, kind, ref) => {
		setBusy(true);
		try {
			const result = await fn();
			setPreview(result);
			setSource(kind);
			setSourceRef(ref);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Import failed");
		} finally {
			setBusy(false);
		}
	};
	const commit = async () => {
		if (!preview) return;
		setBusy(true);
		try {
			const result = await api.commitImport(preview, source, sourceRef);
			toast.success(`Imported ${result.agent} — ${result.skillsCreated} new skills, ${result.skillsReused} reused`);
			setPreview(null);
			await onDone();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not save the import");
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: "max-w-3xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Import skills" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Nothing is saved until you review the proposed pipeline below." })] }), preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewPane, {
			preview,
			busy,
			onBack: () => setPreview(null),
			onCommit: commit
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "folder",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "folder",
					children: "Folder"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
					value: "github",
					children: "GitHub"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "folder",
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "size-5 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: busy ? "Reading…" : "Choose a .zip of the agent folder"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted-foreground",
								children: [
									"Expects ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "font-mono",
										children: "skills/<name>/SKILL.md"
									}),
									". An AGENT.md and references/ are used when present, and a parent agent is generated when there isn’t one."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: ".zip",
								className: "hidden",
								disabled: busy,
								onChange: (e) => {
									const file = e.target.files?.[0];
									if (file) runImport(() => api.importFromFolder(file), "folder", file.name);
								}
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
					value: "github",
					className: "mt-4 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "repo",
								children: "Repository or folder URL"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "repo",
								value: url,
								onChange: (e) => setUrl(e.target.value),
								placeholder: "https://github.com/owner/repo/tree/main/agents/my-agent"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							disabled: busy || !url.trim(),
							onClick: () => void runImport(() => api.importFromGithub(url), "github", url),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "size-4" }),
								" ",
								busy ? "Fetching…" : "Fetch skills"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								"Public repositories only. Set ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "font-mono",
									children: "GITHUB_TOKEN"
								}),
								" on the backend to raise the rate limit."
							]
						})
					]
				})
			]
		})]
	});
}
/**
* Groups stages into execution levels the same way the runtime will: a level
* contains only stages whose dependencies are already satisfied, so everything
* shown side by side can run in parallel.
*/
function toLevels(stages) {
	const remaining = new Map(stages.map((s) => [s.position, s]));
	const done = /* @__PURE__ */ new Set();
	const levels = [];
	while (remaining.size > 0) {
		const ready = [...remaining.values()].filter((s) => s.dependsOn.every((d) => done.has(d) || !remaining.has(d)));
		if (ready.length === 0) break;
		ready.forEach((s) => remaining.delete(s.position));
		ready.forEach((s) => done.add(s.position));
		levels.push(ready.sort((a, b) => a.position - b.position));
	}
	if (remaining.size > 0) levels.push([...remaining.values()]);
	return levels;
}
function PreviewPane({ preview, busy, onBack, onCommit }) {
	const levels = toLevels(preview.stages);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "panel p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: preview.agent.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							preview.skills.length,
							" skills · ",
							preview.references.length,
							" references ·",
							" ",
							preview.stages.length,
							" stages"
						]
					})] }), preview.agent.generated && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "outline",
						children: "AGENT.md generated"
					})]
				})
			}),
			preview.warnings.map((warning) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 rounded-md border border-accent/40 bg-accent/5 p-3 text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-3.5 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: warning })]
			}, warning)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "panel max-h-[320px] overflow-y-auto p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-widest text-muted-foreground",
						children: "Proposed pipeline"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 space-y-3",
						children: levels.map((level, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mt-1 w-16 shrink-0 text-xs text-muted-foreground",
								children: ["Level ", i + 1]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-1 flex-wrap gap-2",
								children: level.map((stage) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `rounded-md border px-2.5 py-1.5 text-xs ${stage.isGate ? "border-accent/50 bg-accent/5" : "border-border bg-secondary/40"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground",
											children: [stage.position, "."]
										}),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: stage.skillSlug
										}),
										stage.isGate && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1.5 text-accent",
											children: "gate"
										}),
										stage.dependsOn.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "ml-1.5 text-muted-foreground",
											children: ["← ", stage.dependsOn.join(", ")]
										})
									]
								}, stage.position))
							})]
						}, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-muted-foreground",
						children: "Stages on the same level have no dependency on each other and run in parallel."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "secondary",
					onClick: onBack,
					disabled: busy,
					children: "Back"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: onCommit,
					disabled: busy,
					children: busy ? "Saving…" : `Import ${preview.skills.length} skills`
				})]
			})
		]
	});
}
//#endregion
export { SkillsPage as component };
