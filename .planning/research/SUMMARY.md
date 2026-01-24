# Project Research Summary

**Project:** GSD Status Panel for OpenCode
**Domain:** Terminal UI / Plugin Development
**Researched:** 2026-01-24
**Confidence:** HIGH

## Executive Summary

The OpenCode plugin system is comprehensive for backend integrations but has a critical limitation: **plugins cannot add UI components**. While plugins can register custom tools, hook into events, and execute shell commands, they cannot render sidebar panels or persistent visual elements in the TUI. This limitation is explicitly confirmed by multiple GitHub issues (#5971, #10400, #6521) with no implementation timeline.

Given this constraint, building a GSD status panel requires one of three approaches: (1) build a standalone TUI that runs alongside OpenCode in a separate terminal pane, (2) fork OpenCode's TUI to add a GSD sidebar section, or (3) build a hybrid solution with a minimal plugin for OpenCode integration and an external TUI for visualization. The standalone TUI approach is recommended as it avoids maintenance burden of forking while providing full UI control.

The key risk is UX fragmentation — users must manage two separate applications (OpenCode + GSD panel) instead of a unified interface. This can be mitigated by using OpenCode's SDK for coordination, implementing a shared state file for communication, and designing the TUI to feel like a natural companion rather than a separate tool.

## Key Findings

### Recommended Stack

OpenCode is built on Bun (JavaScript runtime), TypeScript, and SolidJS for UI rendering. The TUI uses OpenTUI, a proprietary terminal rendering framework with a Zig backend for performance. The web UI uses standard SolidJS + Vite + TailwindCSS. OpenCode exposes a REST/SSE API that both UIs consume, making it possible for external tools to integrate via the SDK.

**Core technologies:**
- **Bun 1.3.5**: Runtime and package manager — fast, TypeScript-native
- **OpenTUI (@opentui/solid)**: Terminal rendering framework — 60+ FPS via Zig backend
- **SolidJS**: Reactive UI framework — shared between TUI and web UI
- **Hono**: HTTP server framework — lightweight REST/SSE API
- **@opencode-ai/sdk**: Generated API client — type-safe access to all features

For a standalone GSD panel:
- **Ratatui (Rust)**: Mature TUI framework — performance, native binaries, crossterm compatibility
- **Bubble Tea (Go)**: Alternative TUI framework — simpler, faster development, good ecosystem
- **Ink (Node/TypeScript)**: React-based TUI — rapid prototyping, reuse React patterns

### Expected Features

Research identified that the original vision (sidebar in OpenCode) is not achievable via plugins. The feature set must be revised to account for the standalone TUI architecture.

**Must have (table stakes):**
- Display current roadmap phase and overall progress
- Show phase status (pending, in progress, complete)
- List todos from `.planning/` files
- Auto-refresh when planning docs change
- Read planning docs inline (show full content)

**Should have (competitive):**
- Trigger GSD workflows via OpenCode secondary agent
- Detect when main OpenCode session is working on GSD-related tasks
- Show diffs of planning doc changes
- Keyboard shortcuts for common actions
- Coordination with OpenCode via SDK/shared state

**Defer (v2+):**
- Light editing of planning docs (modify in editor, TUI displays)
- Full two-way sync with OpenCode sessions
- Visual roadmap charts/graphs
- Multi-project support

### Architecture Approach

OpenCode uses a client-server architecture where the server exposes a REST/SSE API and multiple UI clients connect to it. This pattern enables external tools like the GSD panel to integrate via the SDK. The recommended architecture is a standalone TUI that watches `.planning/` files directly and optionally communicates with OpenCode through the SDK or a shared state file.

**Major components:**
1. **GSD TUI (standalone)** — Terminal UI displaying planning status, runs in separate pane
2. **File watcher** — Monitors `.planning/` directory for changes, triggers UI refresh
3. **Planning doc parser** — Reads and parses ROADMAP.md, phase files, todos
4. **OpenCode bridge (optional)** — SDK client or shared state file for coordination
5. **GSD CLI wrapper** — Executes GSD commands and captures output

**Component interaction:**
```
.planning/ files <-- File Watcher --> GSD TUI <-- Keyboard Input
                                        |
                                        v
                                   GSD CLI Commands
                                        |
                                        v (optional)
                              OpenCode SDK / Shared State
```

### Critical Pitfalls

1. **No UI panel API** — Plugins cannot render custom UI components. The only workaround is building a standalone TUI or forking OpenCode. Avoid spending time trying to extend the TUI via plugins; it's architecturally impossible until #5971 is implemented.

2. **File watcher overhead** — OpenCode already uses `@parcel/watcher` which has known performance issues (high CPU, massive disk usage in snapshot directory). Adding another file watcher for `.planning/` files could compound this. Use polling with debounce or a lightweight file watcher like `notify-rs` instead of real-time watching.

3. **Plugin load order dependencies** — If building a plugin component, tool names and event handlers can conflict with other plugins. Always use a unique namespace (e.g., `gsd_` prefix) and design hooks to be idempotent. Test with multiple plugins installed.

4. **Coordination complexity** — Running two separate processes (OpenCode + GSD TUI) requires coordination. If the TUI needs to trigger OpenCode actions, it must use the SDK or a shared state file. Don't assume the processes can communicate via stdin/stdout — they run in separate terminal panes.

5. **Version compatibility** — OpenCode's plugin API has no semantic versioning guarantee. If building a plugin component, pin the OpenCode version in documentation and test with each update. Keep plugin logic minimal to reduce breaking change surface area.

## Implications for Roadmap

Based on the critical finding that OpenCode does not support UI plugins, the roadmap must pivot from "sidebar panel in OpenCode" to "standalone TUI alongside OpenCode."

### Phase 1: Core TUI (Standalone Display)
**Rationale:** Validate the standalone TUI approach without OpenCode integration complexity. Prove that a separate TUI can provide value by showing planning status in a clear, auto-refreshing interface.

**Delivers:**
- Terminal UI showing current phase, overall progress, phase statuses
- File watcher for `.planning/` directory
- Parser for ROADMAP.md and phase files
- Inline display of planning doc content

**Addresses:** Must-have features (display, auto-refresh, read docs)

**Avoids:** File watcher overhead (use polling with debounce, not real-time watching)

### Phase 2: GSD Command Integration
**Rationale:** Add ability to trigger GSD workflows from the TUI. This phase validates the "GSD CLI wrapper" component and proves the TUI can be more than just read-only.

**Delivers:**
- Keyboard shortcuts to trigger GSD commands (`add-todo`, `complete-phase`, etc.)
- Command execution feedback in the TUI
- Refresh UI after command execution
- Error handling for failed commands

**Uses:** GSD CLI (already installed, mature)

**Implements:** GSD CLI wrapper component

**Avoids:** Reimplementing GSD logic (use existing commands, not custom parsers)

### Phase 3: OpenCode Coordination (Optional)
**Rationale:** Enhance UX by detecting when OpenCode is working on GSD-related tasks and showing relevant context in the panel. This phase is optional because Phases 1-2 deliver a functional standalone tool.

**Delivers:**
- OpenCode SDK client integration
- Detect when main session references planning docs
- Show active session context in TUI
- Optional: spawn secondary OpenCode agent from TUI

**Addresses:** Should-have feature (coordination with OpenCode)

**Avoids:** Assuming SDK stability (pin versions, handle errors gracefully)

### Phase Ordering Rationale

- **Phase 1 first** because it validates the standalone TUI approach with minimal dependencies. If users find the read-only panel useful, it justifies investing in command integration.
- **Phase 2 second** because it depends on Phase 1's UI foundation and adds write capabilities without external dependencies (GSD CLI is already available).
- **Phase 3 last** because it's the highest-risk phase (SDK stability, coordination complexity) and is optional for core functionality.

This ordering front-loads value delivery — Phase 1 ships a usable tool, Phase 2 makes it interactive, Phase 3 adds polish.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (OpenCode SDK):** OpenCode's SDK is well-documented but the event system is complex. Research session event types, SSE streaming patterns, and SDK error handling before implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (TUI):** Terminal UIs have established patterns (Ratatui, Bubble Tea). Standard file watching and parsing.
- **Phase 2 (CLI):** Shell command execution is straightforward. Standard input/output capture.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct source code analysis of OpenCode, verified package versions |
| Features | MEDIUM | Original sidebar vision infeasible, revised features based on standalone TUI |
| Architecture | HIGH | Standalone TUI pattern is proven, file watching is standard |
| Pitfalls | HIGH | GitHub issues verified, plugin limitation confirmed by multiple sources |

**Overall confidence:** HIGH

The research conclusively established that the original vision (sidebar in OpenCode) is not achievable with current plugin API. The pivot to standalone TUI is well-supported by evidence and follows established patterns.

### Gaps to Address

- **TUI framework choice**: Research compared Ratatui (Rust), Bubble Tea (Go), and Ink (Node). Choice affects development speed vs performance. Recommend prototyping in Bubble Tea (fast dev) then porting to Ratatui if performance is critical.

- **Coordination mechanism**: Research identified two options (SDK client vs shared state file) but didn't test either. During Phase 3 planning, prototype both and measure latency/reliability.

- **File watcher strategy**: Research warned about performance but didn't benchmark polling vs real-time watching. During Phase 1 planning, test both approaches with realistic `.planning/` directory sizes.

## Sources

### Primary (HIGH confidence)
- OpenCode source code: `/Users/dan/src/opencode/` — plugin system, TUI architecture, event bus
- GitHub Issues: #5971, #10400, #6521 — confirmed no UI plugin API
- OpenAPI spec: `packages/sdk/openapi.json` — full API surface
- Plugin types: `packages/plugin/src/index.ts` — complete hook interface

### Secondary (MEDIUM confidence)
- OpenCode docs: https://opencode.ai/docs/plugins/ — official plugin guide
- Community examples: `.opencode/tool/` in repos — real-world plugin patterns
- GitHub Issues: #8887, #9358 — file watcher performance concerns

### Tertiary (LOW confidence)
- OpenTUI architecture: Inferred from source, not officially documented
- Future plugin API: #5971 timeline unknown, may never be implemented

---
*Research completed: 2026-01-24*
*Ready for roadmap: yes*
