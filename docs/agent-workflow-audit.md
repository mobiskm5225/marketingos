# Agent + pipeline workflow audit

Findings from a pass over the agents page, the pipeline canvas, the stage API,
and the run executor. Only issues that break functionality, lose data, or make
the product unusable are listed — cosmetic and stylistic points are left out.

Verified against the running stack on 2026-08-19 (`docker compose`, backend on
`:8000`, frontend on `:3000`).

---

## 1. Adding a stage always fails — the pipeline cannot be built at all

**Severity: blocker**

`AddStage` gives a new stage a client-side id (`new-<timestamp>`,
[agents.tsx:396](../frontend/src/routes/agents.tsx#L396)) and `saveStages`
forwards it verbatim as `id` ([agents.tsx:162](../frontend/src/routes/agents.tsx#L162)).
The endpoint declares `id: z.string().uuid().optional()`
([agents.ts:327](../backend/src/routes/agents.ts#L327)), so the string is
rejected.

Reproduced against the live API:

```
PUT /api/agents/<slug>/stages   {"stages":[{"id":"new-1755", ...}]}  → HTTP 500
PUT /api/agents/<slug>/stages   {"stages":[{         "skill": ...}]} → HTTP 200
```

The user sees "Could not save the pipeline" and nothing is added. The backend
already supports client-side ids for `dependsOn` remapping — only the `id` field
itself rejects them.

**Fix direction:** either omit `id` for new stages in the client, or relax the
schema to `z.string()` and keep the existing local-id remapping (which already
handles non-uuid values).

## 2. Every validation error surfaces as "Internal server error"

**Severity: high**

`errorHandler` only special-cases `HttpError`
([error.ts:24](../backend/src/middleware/error.ts#L24)); a `ZodError` falls
through to a generic 500. The user is told the server broke when in fact their
input was rejected, and the actual field error is only in the container log.
This is what masks issue #1 as a crash.

**Fix direction:** map `ZodError` to 400 with the flattened field messages.

## 3. Saving the pipeline destroys per-stage skill overrides

**Severity: high — silent data loss**

`PUT /agents/:slug/stages` deletes every stage and re-inserts them
([agents.ts:384](../backend/src/routes/agents.ts#L384)), writing
`bodyOverride: stage.bodyOverride ?? null`
([agents.ts:398](../backend/src/routes/agents.ts#L398)). The client's
`StageWrite` never sends `bodyOverride`, so **any** pipeline edit — toggling a
gate, changing a model, adding a dependency — wipes the agent-specific skill
body that the folder/GitHub importer wrote
([skills.ts:330](../backend/src/routes/skills.ts#L330)).

The runner reads that field ([runner.ts:237](../backend/src/core/agent/runner.ts#L237)),
so the agent quietly starts running the generic library skill instead. Nothing
in the UI reports the change; only the `· uses an agent-specific version of this
skill` note disappears.

**Fix direction:** preserve `bodyOverride` server-side when the field is absent
from the payload, rather than treating absent as "clear".

## 4. Every edit re-issues new stage ids, closing the editor and breaking run history

**Severity: high**

Because the save is delete-and-reinsert, stage ids change on every write. Two
consequences:

- `selectedStageId` no longer matches any stage after a save, so the stage panel
  closes on every single change. Editing a stage's model, then its gate, then
  its dependencies means reopening the panel three times.
- `run_steps.agent_stage_id` is `ON DELETE SET NULL`
  ([schema.ts:394](../backend/src/core/db/schema.ts#L394)), so **all historical
  run steps lose their link to the stage** the moment anyone edits the pipeline.

**Fix direction:** update stages in place (insert new / update existing / delete
removed) instead of replacing the set.

## 5. Agent inputs cannot be created — runs cannot be given any input

**Severity: high — core workflow is unreachable**

`RunAgentDialog` renders `agent.inputs` and otherwise says "This agent has no
configured inputs". The API to define them exists
(`PUT /agents/:slug/inputs`, [agents.ts:457](../backend/src/routes/agents.ts#L457),
wrapped as `api.saveAgentInputs`) but is **never called anywhere in the UI** —
the agents page only uses `saveStages`, `saveAgentKnowledgeBases`,
`updateAgent`, `createAgent`, `deleteAgent`, `startRun`.

Live check: `website-pages-content` returns `inputs: []`, yet its first stage
(`gather-context`) is documented as reading a design PDF. There is no way to
hand it one.

**Fix direction:** an inputs editor on the Settings tab.

## 6. `file` and `select` inputs render as plain text boxes

**Severity: high (once #5 is fixed)**

`AgentInput.type` allows `text | textarea | file | url | select`
([api.ts:232](../frontend/src/lib/api.ts#L232)), but the dialog only branches on
`textarea` and `url` ([agents.tsx:1096](../frontend/src/routes/agents.tsx#L1096)) —
`file` and `select` fall through to `<Input type="text">`. A required file input
can be satisfied by typing anything, and the run then proceeds with a bogus
value.

## 7. References are read-only

**Severity: medium-high**

References are injected into every prompt the agent runs, and the References tab
lists them with no add, edit, remove, or reorder control
([agents.tsx:528](../frontend/src/routes/agents.tsx#L528)). They can only ever
arrive through an import, so a hand-built agent can never have any.

## 8. A gate cannot actually send work back

**Severity: high — the feature does not do what the UI promises**

The stage editor says "A failing gate sends work back instead of finishing the
run" ([agents.tsx:641](../frontend/src/routes/agents.tsx#L641)). The runner sets
`gateFailure = true`, breaks out of the level loop, and finishes the run as
`needs review` ([runner.ts:456](../backend/src/core/agent/runner.ts#L456)). There
is no retry, no re-run of upstream stages, no attempt counter — `runStages.attempt`
is never incremented anywhere.

For the seeded 10-stage pipeline this means a failing `editorial-qa` gate throws
away stages 1–8 of paid work with no path forward except a full re-run.

## 9. An unparseable gate response is treated as a pass

**Severity: high — quality control fails open**

If the gate's JSON cannot be parsed, the result defaults to
`{ pass: true, reason: 'Could not parse gate response — defaulting to pass' }`
([runner.ts:310](../backend/src/core/agent/runner.ts#L310)). A model that
rambles instead of emitting JSON silently passes the quality gate, and the run
is marked `complete`. A gate that cannot be read should fail closed, or at
minimum mark the run for review.

## 10. One failed stage kills the whole run, with no resume

**Severity: high**

A rejected stage promise is rethrown for the level
([runner.ts:449](../backend/src/core/agent/runner.ts#L449)) and the run is marked
failed. There is no per-stage retry (not even for a 429 or a socket hang-up),
and no endpoint to resume from the failed stage — `/runs/:slug/rerun` starts
over from stage 1. On a long pipeline a single transient provider error costs
the entire run.

## 11. A running run cannot be cancelled

**Severity: high**

`src/routes/runs.ts` exposes list, get, create, events, rerun, comments,
attachments, delete — no cancel or stop. A run that is looping, stuck, or simply
expensive has to be waited out; deleting the run row does not stop the in-flight
work.

## 12. Runs are lost on backend restart and stay "running" forever

**Severity: high**

Execution is fire-and-forget in the API process
([runner.ts:126](../backend/src/core/agent/runner.ts#L126)) with no persistence
of in-flight state and no reconciliation on boot. Every `docker compose up
--build` — the normal deploy path here — orphans any active run: the row stays
`running`/`pending` forever, and the run page's SSE connection waits on events
that will never arrive.

**Fix direction:** on startup, mark `running`/`pending` runs older than the
process start as `failed` ("interrupted by restart"), and surface that state.

## 13. Dependency fan-in silently includes every earlier stage

**Severity: medium-high**

When a stage has no explicit dependencies but earlier outputs exist, the runner
injects **all** of them into the prompt
([runner.ts:274](../backend/src/core/agent/runner.ts#L274)). On a wide pipeline
that is every upstream stage's full text in one request — unbounded token spend,
and a likely context-limit failure that reads as an opaque provider error. The
canvas shows the stage as having no dependencies, so the behaviour is invisible.

## 14. Knowledge retrieval is keyed on the skill text, not the task

**Severity: medium-high**

The retrieval query is the first 500 characters of the skill body
([runner.ts:280](../backend/src/core/agent/runner.ts#L280)) — usually the
frontmatter and the "When to use" heading. The user's actual input and the
upstream stage outputs are not part of the query, so a knowledge base returns
chunks matching the instructions rather than the subject. Attaching a knowledge
base largely does not do what the user expects.

## 15. Destructive actions have no confirmation

**Severity: medium-high**

"Delete" on an agent removes it and all its stages, references, inputs, and runs
(cascade, [agents.ts:303](../backend/src/routes/agents.ts#L303)) on a single
click. "Remove stage" is likewise immediate. Neither asks, and neither can be
undone.

## 16. The same skill cannot appear twice in one pipeline

**Severity: medium**

`AddStage` filters out every skill already used
([agents.tsx:845](../frontend/src/routes/agents.tsx#L845)). A pipeline that
legitimately runs a skill twice — a second QA pass, a per-section writer — cannot
be expressed, and the reason is not shown to the user.

## 17. Dependencies can only be edited as chips, not on the canvas

**Severity: medium**

The map is display-only (`nodesConnectable={false}`,
[PipelineMap.tsx](../frontend/src/components/PipelineMap.tsx)). New stages are
always appended after the last one, and any other shape has to be assembled by
clicking dependency chips in the side panel. For anything wider than a straight
line this is the slowest part of building an agent, and it is the one place the
canvas would pay for itself.

## 18. Concurrent edits overwrite each other silently

**Severity: medium**

`PUT /stages` replaces the whole pipeline with no version or `updatedAt` check.
Two tabs — or the same user after a stale load — will silently clobber one
another's work, last write wins.

## 19. Fullscreen: the exit button stops working if the browser refuses fullscreen

**Severity: medium**

`toggleWorkspaceFullscreen` decides what to do from `document.fullscreenElement`
([agents.tsx:119](../frontend/src/routes/agents.tsx#L119)). If the fullscreen
request is refused (permission policy, embedded context) the overlay still opens
but `document.fullscreenElement` stays null, so pressing the button again
re-enters instead of leaving. Escape is then the only way out.

## 20. Entering or leaving fullscreen discards unsaved tab state

**Severity: medium**

The workspace is portalled into `document.body` while fullscreen
(`FullscreenLayer`), which remounts the subtree. `SettingsTab` keeps `role` and
`guardrails` in local state, so text typed but not yet saved is lost the moment
the user expands or collapses the canvas.

---

## Suggested order

1. **#1, #2** — the pipeline builder is unusable until stages can be added and
   errors are legible.
2. **#3, #4** — stop the save path from destroying overrides and run history.
3. **#5, #6** — without inputs there is no way to actually run an agent on real
   work.
4. **#8, #9, #10, #11, #12** — the execution layer's correctness and recovery.
5. Everything else.
