# GSD Status TUI

## What This Is

A standalone terminal UI application that displays GSD project status in real-time. It watches `.planning/` files and renders roadmap progress, phase status, and todos — updating live as work happens. Designed to run alongside OpenCode (or any AI coding tool) in a split terminal pane. Can trigger GSD workflows via CLI commands or optionally coordinate with OpenCode via its SDK.

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
- [ ] Trigger GSD workflows (add-todo, add-phase, etc.)
- [ ] Keyboard-driven navigation

### Out of Scope

- Native OpenCode sidebar (plugin API doesn't support UI extensions)
- Full GSD workflow engine reimplementation — use existing GSD CLI
- Mobile interface — desktop TUI only
- Forking/patching OpenCode

## Context

**Repos available locally:**
- GSD: `../get-shit-done/` — the workflow system this displays status for
- OpenCode: `../opencode/` — reference for optional SDK coordination

**Research findings (.planning/research/):**
- OpenCode plugin system does NOT support UI extensions
- Plugins can: define tools, watch files, spawn agents, execute commands
- Plugins cannot: add sidebars, panels, or custom UI components
- GitHub issue #5971 proposes sidebar API but is NOT implemented
- Standalone TUI is the recommended approach

**TUI framework options:**
- Ratatui (Rust) — proven, fast, good docs
- Bubble Tea (Go) — popular, good UX patterns
- Ink (TypeScript/React) — familiar if staying in TS ecosystem

## Constraints

- **Architecture**: Standalone TUI, not an OpenCode plugin
- **Integration**: Use existing GSD CLI commands rather than reimplementing logic
- **Coordination**: Optional OpenCode SDK integration for enhanced UX

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Standalone TUI over OpenCode plugin | Research confirmed plugins cannot add UI extensions | ✓ Good |
| Watch .planning/ files for state | GSD already writes state to files, just need to read/parse | — Pending |
| GSD CLI for workflows | Maintains GSD guarantees, no reimplementation | — Pending |
| TUI framework choice | Need to evaluate Ratatui vs Bubble Tea vs Ink | — Pending |

---
*Last updated: 2025-01-24 after research phase*
