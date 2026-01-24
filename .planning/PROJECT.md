# GSD Status Panel for OpenCode

## What This Is

A sidebar or panel integrated with opencode that displays GSD project status in real-time. It watches `.planning/` files and renders roadmap progress, phase status, and todos — updating live as the main agent works. It can also trigger GSD workflows via a secondary agent without interrupting the primary coding session.

## Core Value

See and manage GSD project state without leaving the coding context.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Display current phase and overall roadmap progress
- [ ] Show phase status (pending, in progress, complete)
- [ ] List todos from planning docs
- [ ] Update in real-time as `.planning/` files change
- [ ] Allow reading planning docs inline
- [ ] Allow light editing of planning docs
- [ ] Trigger GSD workflows (add-todo, add-phase, etc.) via secondary agent
- [ ] Secondary agent runs without interrupting main agent's work

### Out of Scope

- Full GSD workflow engine reimplementation — use existing GSD commands
- Standalone app — must integrate with opencode
- Mobile interface — desktop TUI/web only

## Context

**Repos available locally:**
- GSD: `../get-shit-done/` — the workflow system this integrates with
- OpenCode: `../opencode/` — the AI coding tool to extend

**OpenCode resources:**
- API docs: https://opencode.ai/docs
- Plugin system: https://opencode.ai/docs/plugins/

**Key unknowns (require research):**
- What extension points does opencode provide?
- Is the TUI extensible (add panels/sidebars)?
- Is the plugin system UI-capable or backend-only?
- What can we do via the API (file watching, agent spawning)?
- Is web UI more extensible than TUI?

**User preference:** TUI if extensible, web UI as fallback.

## Constraints

- **Platform**: Must work within opencode's extension model — can't fork/patch opencode itself
- **Architecture**: Use existing GSD commands rather than reimplementing logic
- **Preference**: TUI over web UI if both are viable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Research opencode extensibility first | Can't scope requirements without knowing what's possible | — Pending |
| Prefer TUI over web UI | User preference, but flexible based on feasibility | — Pending |
| Secondary agent for GSD commands | Keeps main agent focused, maintains GSD workflow guarantees | — Pending |

---
*Last updated: 2025-01-24 after initialization*
