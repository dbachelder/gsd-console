# Phase 8: Comprehensive Fix For Broken Background Tasks - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix broken background task execution in OpenCode integration. Background jobs are stuck in pending state and don't run properly. This phase fixes the headless job execution flow so that queued commands execute successfully using GLM4.7 as the default model.

Scope does NOT include:
- New background task features (those belong in Phase 4)
- OpenCode SDK changes (use their API as-is)
- New UI components for background view (already implemented in Phase 4)

</domain>

<decisions>
## Implementation Decisions

### Execution Flow
- **Create new session per job** — Each headless task creates its own OpenCode session via `createSession()`
- **Sequential processing** — Jobs run one at a time; next job starts when previous completes (session.idle event)
- **Stop all jobs on failure** — First job failure halts queue; no further jobs process until user intervention

### Model Configuration
- **GLM4.7 as default in OpenCode config** — Set `defaultProvider` and `defaultModel` in `opencode.json` (server-side)
- **All background jobs inherit default** — No per-job model override needed; GLM4.7 is the standard model

### User Interaction
- **Cancel with confirmation** — User can cancel running/pending jobs via background view (x or d key), with y/n confirmation prompt
- **Keep job history** — Completed jobs remain in list, pruned to last 5 success + 5 failed (existing behavior in `useBackgroundJobs.ts`)
- **Toast notifications for failures** — Background job errors trigger toast warning immediately; details available in expanded job view

### Claude's Discretion
- Exact error message format for toast notifications
- Session creation timing (eager vs lazy)
- Job retry mechanism (if any, not specified)

</decisions>

<specifics>
## Specific Ideas

- "GLM4.7 should be the default model for all sessions, not just background jobs"
- "Headless jobs creating new sessions is correct — each task gets isolated execution"
- "Stop all jobs on failure is safer than continuing blindly — user should review and decide"

</specifics>

<deferred>
## Deferred Ideas

- Per-job model selection (e.g., `--model` flag) — Phase 4 enhancement
- Parallel job execution (multiple concurrent jobs) — Phase 4 enhancement
- Persistent session status display in Footer (useSessionActivity hook) — documented in `.planning/debug/session-connection-unclear.md`, not part of Phase 8 scope

---

*Phase: 08-comprehensive-fix-for-broken-background-tasks*
*Context gathered: 2026-01-26*
