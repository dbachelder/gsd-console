# Roadmap: GSD Status TUI

## Overview

Build a standalone terminal UI that displays GSD project status in real-time alongside OpenCode. Start with a read-only display that parses planning docs, add file watching for live updates, then layer on GSD command execution and inline editing. OpenCode SDK integration is an optional final phase for enhanced coordination.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Core TUI** - Display roadmap, phases, and todos with keyboard navigation
- [ ] **Phase 2: Real-time Updates** - Watch .planning/ files and refresh on changes
- [ ] **Phase 3: Actions and Editing** - Execute GSD commands and edit todos inline
- [ ] **Phase 4: OpenCode Integration** - Spawn sessions and queue commands

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
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

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
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core TUI | 4/4 | Complete | 2026-01-25 |
| 2. Real-time Updates | 0/1 | Not started | - |
| 3. Actions and Editing | 0/2 | Not started | - |
| 4. OpenCode Integration | 0/1 | Not started | - |
