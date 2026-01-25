# Roadmap: GSD Status TUI

## Overview

Build a standalone terminal UI that displays GSD project status in real-time alongside OpenCode. Start with a read-only display that parses planning docs, add file watching for live updates, then layer on GSD command execution and inline editing. OpenCode SDK integration is an optional final phase for enhanced coordination.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Core TUI** - Display roadmap, phases, and todos with keyboard navigation
- [x] **Phase 2: Real-time Updates** - Watch .planning/ files and refresh on changes
- [x] **Phase 3: Actions and Editing** - Execute GSD commands and edit todos inline
- [ ] **Phase 4: OpenCode Integration** - Spawn sessions and queue commands
- [ ] **Phase 5: Test Coverage** - Reproducible tests with mocked filesystem to reach 80%+ coverage

## Phase Details

### Phase 1: Core TUI
**Goal**: User can view GSD project status in a keyboard-navigable terminal interface
**Depends on**: Nothing (first phase)
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04, NAV-01, NAV-02, NAV-03, TECH-01, TECH-02, TECH-03
**Success Criteria** (what must be TRUE):
  1. User sees roadmap overview with phase list and progress percentage
  2. User can expand a phase to see its goal, requirements, and success criteria
  3. User sees todos list from planning docs
  4. User can navigate between panels using Tab and arrow keys
  5. User can scroll content using Vim keybindings (hjkl, gg, G, Ctrl+d/u)
  6. Each phase shows visual indicators (has plan, has context, needs verification, blocked, etc.)
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md - Project setup, tooling, types, parser, and app shell
- [x] 01-02-PLAN.md - Roadmap/Phase/Todos views with Vim navigation
- [x] 01-03-PLAN.md - UAT gap closure (6 fixes)
- [x] 01-04-PLAN.md - UAT gap closure round 2 (3 fixes)

### Phase 2: Real-time Updates
**Goal**: TUI automatically refreshes when planning docs change
**Depends on**: Phase 1
**Requirements**: RT-01, RT-02, RT-03
**Success Criteria** (what must be TRUE):
  1. TUI refreshes automatically when any .planning/ file is saved
  2. Rapid file saves do not cause flicker (debounced)
  3. Recently changed items show a visual indicator (e.g., highlight, icon)
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md - File watcher and change highlight hooks
- [x] 02-02-PLAN.md - UI integration (spinner, highlights, wiring)
- [x] 02-03-PLAN.md - UAT gap closure (spinner, flicker, highlight fixes)

### Phase 3: Actions and Editing
**Goal**: User can execute GSD commands and edit todos without leaving TUI
**Depends on**: Phase 2
**Requirements**: ACT-01, ACT-02, ACT-03, EDIT-01, EDIT-02
**Success Criteria** (what must be TRUE):
  1. User can run GSD commands (add-todo, progress, etc.) from command palette
  2. User can open planning files in $EDITOR with a keyboard shortcut
  3. User can add/complete todos inline without leaving TUI
  4. User can reorder phases with keyboard shortcuts
  5. Command palette supports fuzzy search
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md - Toast system and command palette with fuzzy search
- [x] 03-02-PLAN.md - External editor integration and help/footer updates
- [x] 03-03-PLAN.md - Inline editing stubs (todo toggle, reorder mode)
- [x] 03-04-PLAN.md - UAT gap closure (overlay backgrounds, editor context)

### Phase 03.1: UI polish (INSERTED)

**Goal**: UI refinement for existing TUI — addressing visual polish and state issues from earlier phases
**Depends on**: Phase 3
**Plans**: 5 plans

Plans:
- [x] 03.1-01-PLAN.md — Sticky footer, tab styling, and header sizing fixes (Wave 1, 3 tasks)
- [x] 03.1-02-PLAN.md — Tab state persistence and detail toggle removal (Wave 2, 3 tasks)
- [x] 03.1-03-PLAN.md — Plan file display (summary, task count, wave info) (Wave 3, 3 tasks)
- [x] 03.1-04-PLAN.md — Roadmap state persistence fix (Wave 1, 3 tasks) [gap closure]
- [ ] 03.1-05-PLAN.md — File picker navigation, progress bar removal, success criteria fix (Wave 2, 3 tasks) [gap closure]

### Phase 4: OpenCode Integration
**Goal**: TUI can spawn and coordinate with OpenCode sessions
**Depends on**: Phase 3
**Requirements**: ACT-04, ACT-05
**Success Criteria** (what must be TRUE):
  1. User can spawn an OpenCode session from TUI for complex workflows
  2. User can queue multiple GSD commands for sequential execution in OpenCode
  3. User can connect to an existing OpenCode session
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Test Coverage
**Goal**: Reproducible tests with mocked filesystem to reach 80%+ line coverage
**Depends on**: Phase 4
**Requirements**: None (quality improvement)
**Success Criteria** (what must be TRUE):
  1. All tests pass consistently (no flaky tests)
  2. Tests use mocked filesystem, not real .planning/ directory
  3. Line coverage reaches 80% or higher
  4. Parser functions have comprehensive test cases
  5. Hook functions have test coverage where feasible
**Plans**: TBD

Plans:
- [ ] 05-01: TBD (run /gsd:plan-phase 5 to break down)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core TUI! | 4/4 | Complete | 2026-01-25 |
| 2. Real-time Updates | 3/3 | Complete | 2026-01-24 |
| 3. Actions and Editing | 4/4 | Complete | 2026-01-25 |
| 03.1: UI polish (INSERTED) | 5/5 | Complete | 2026-01-25 |
| 4. OpenCode Integration | 0/1 | Not started | - |
| 5. Test Coverage | 0/1 | Not started | - |
