---
phase: 03-actions-and-editing
plan: 02
subsystem: ui
tags: [editor, external-editor, file-picker, keybindings, footer]

# Dependency graph
requires:
  - phase: 03-01
    provides: Toast notification system for user feedback
provides:
  - External editor integration with $EDITOR support
  - File picker for multi-file selection
  - Updated help overlay with new keybindings
  - Cleaner footer hints using arrow symbols
affects: [phase-4-execution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lifted state pattern for cross-component coordination
    - Alternate screen escape sequences for editor handoff
    - spawnSync for synchronous external process spawning

key-files:
  created:
    - src/hooks/useExternalEditor.ts
    - src/components/picker/FilePicker.tsx
  modified:
    - src/app.tsx
    - src/components/layout/TabLayout.tsx
    - src/components/layout/HelpOverlay.tsx
    - src/components/layout/Footer.tsx
    - src/components/todos/TodosView.tsx

key-decisions:
  - "Use alternate screen escape sequences (\x1b[?1049l/h) for clean editor handoff"
  - "Lift selection state to App.tsx for editor context awareness"
  - "Use arrow symbols in footer instead of j/k for cleaner appearance"
  - "Remove 1/2/3 tab jump hints from footer to reduce clutter"

patterns-established:
  - "Selection state lifted to App level when multiple components need it"
  - "External process spawning with stdio: inherit for full terminal control"

# Metrics
duration: 5min
completed: 2026-01-24
---

# Phase 03 Plan 02: External Editor Integration Summary

**External editor via `e` key with $EDITOR support, file picker for multi-file selection, and cleaner footer with arrow navigation hints**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-25T04:11:59Z
- **Completed:** 2026-01-25T04:17:49Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- External editor opens with `e` key, respects $EDITOR environment variable
- Alternate screen handling ensures clean TUI resume after editor exits
- File picker overlay when multiple files available (numbered selection 1-9)
- Help overlay reorganized with new Actions section showing `:` and `e` keybindings
- Footer uses arrow symbols for navigation, removed 1/2/3 tab jump hints
- Selection state lifted to App.tsx enabling editor context awareness

## Task Commits

Each task was committed atomically:

1. **Task 1: Create external editor hook and file picker** - `b77b6bb` (feat)
2. **Task 2: Update HelpOverlay with new keybindings** - `1f8bdeb` (feat)
3. **Task 3: Lift selection state and wire editor to App** - `28a017f` (feat)

**Plan metadata:** Will be committed with this summary

## Files Created/Modified

- `src/hooks/useExternalEditor.ts` - Hook for editor spawning with alternate screen handling
- `src/components/picker/FilePicker.tsx` - Overlay for multi-file selection
- `src/app.tsx` - Editor integration, file picker state, lifted selection state
- `src/components/layout/TabLayout.tsx` - Accept lifted selection state props
- `src/components/layout/HelpOverlay.tsx` - New Actions section with `:` and `e` keybindings
- `src/components/layout/Footer.tsx` - Arrow symbols, command palette hint, removed 1/2/3
- `src/components/todos/TodosView.tsx` - Report selection changes to parent via callback

## Decisions Made

1. **Alternate screen escape sequences** - Used `\x1b[?1049l` to exit and `\x1b[?1049h` to re-enter alternate screen, ensuring editor gets full terminal control and TUI resumes cleanly
2. **Selection state lifting** - Moved `selectedPhaseNumber` from TabLayout to App.tsx so editor hook can know current context; added `selectedTodoId` with callback pattern
3. **Footer simplification** - Removed `1/2/3` jump hints (rarely used), replaced `j/k` with arrow symbols for cleaner appearance, added `:` hint for command palette

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- External editor feature complete and working
- Ready for Phase 4 command execution implementation
- All success criteria met: `e` key opens editor, picker shows for multiple files, help updated, footer cleaned

---
*Phase: 03-actions-and-editing*
*Completed: 2026-01-24*
