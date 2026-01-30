---
phase: 04-opencode-integration
plan: 05
subsystem: ui
tags: [opencode, background-jobs, execution-modes, tabs]

# Dependency graph
requires:
  - phase: 04-02
    provides: spawnOpencodeSession for terminal handoff
  - phase: 04-03
    provides: Session picker and activeSessionId state
  - phase: 04-04
    provides: useBackgroundJobs hook for job management
provides:
  - Background as 4th tab in TabLayout
  - ExecutionModePrompt for headless/interactive/primary selection
  - BackgroundView with expandable job entries
  - JobEntry component with cancel confirmation
  - Context-sensitive footer hints
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Execution mode selection overlay
    - Expandable list entries with confirmation dialogs
    - 4-tab navigation

key-files:
  created:
    - src/components/background/ExecutionModePrompt.tsx
    - src/components/background/BackgroundView.tsx
    - src/components/background/JobEntry.tsx
  modified:
    - src/lib/types.ts
    - src/lib/commands.ts
    - src/hooks/useTabState.ts
    - src/components/layout/TabLayout.tsx
    - src/components/layout/Footer.tsx
    - src/app.tsx

key-decisions:
  - "Queueable flag on commands to determine which show mode prompt"
  - "Three execution modes: headless (background), interactive (spawn), primary (send)"
  - "Expandable job entries with inline cancel confirmation"

patterns-established:
  - "Execution mode prompt pattern for command routing"
  - "Inline confirmation pattern (y/n) for destructive actions"

# Metrics
duration: 6min
completed: 2026-01-25
---

# Phase 04 Plan 05: Background UI Summary

**Background tab with execution mode selection, expandable job entries, and cancel confirmation**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-25T08:22:00Z
- **Completed:** 2026-01-25T08:28:00Z
- **Tasks:** 6 (5 auto + 1 checkpoint)
- **Files modified:** 10

## Accomplishments

- Added ExecutionMode type and queueable flag to commands
- Created ExecutionModePrompt component with h/i/p key bindings
- Created BackgroundView and JobEntry components with vim navigation
- Added Background as 4th tab in TabLayout
- Integrated useBackgroundJobs hook into App.tsx
- Updated Footer with context-sensitive hints for Background tab

## Task Commits

Each task was committed atomically:

1. **Task 1: Update types and mark queueable commands** - `b3b5e47` (feat)
2. **Task 2: Create ExecutionModePrompt component** - `8304909` (feat)
3. **Task 3: Create BackgroundView and JobEntry components** - `492cfeb` (feat)
4. **Task 4: Update TabLayout for 4th tab** - `867f0ae` (feat)
5. **Task 5: Integrate execution mode prompt and background jobs into App** - `6bf6b40` (feat)

## Files Created/Modified

- `src/lib/types.ts` - Added ExecutionMode type
- `src/lib/commands.ts` - Added queueable flag to GSD commands
- `src/components/background/ExecutionModePrompt.tsx` - Mode selection overlay
- `src/components/background/BackgroundView.tsx` - Job list with vim nav
- `src/components/background/JobEntry.tsx` - Expandable job display
- `src/hooks/useTabState.ts` - Added 'background' to TabId
- `src/components/layout/TabLayout.tsx` - 4th tab integration
- `src/components/layout/Footer.tsx` - Background tab hints
- `src/app.tsx` - Mode prompt state and background jobs integration

## Decisions Made

- Queueable commands (add-todo, plan-phase, etc.) show mode prompt; spawn-opencode and connect-session do not
- Primary mode currently treats as headless (sends to background) since direct session prompting needs more work
- Inline y/n confirmation for cancel instead of modal dialog

## Gaps Identified (for follow-up)

### Gap 1: Tab completion with arguments
**Issue:** Command palette should allow Tab to complete command name and let user type arguments (e.g., `plan-phase 4`) that get passed to the agent.
**Current behavior:** Commands execute immediately on Enter with no argument support.
**Impact:** Users cannot pass phase numbers or other arguments to commands.

### Gap 2: Session detection not working
**Issue:** User pressed 'c' but "no sessions found" even though an OpenCode session is open.
**Root cause:** The `listSessions()` function may not be finding sessions correctly - could be SDK API issue, port mismatch, or OpenCode server not running in serve mode.
**Impact:** Cannot connect to existing sessions, so Primary mode is unusable.

### Gap 3: Footer missing 'c' hint
**Issue:** The 'c' key for connecting to sessions isn't shown in footer hints.
**Impact:** Users don't know the feature exists.

## Deviations from Plan

None - plan executed as written. Gaps identified during UAT checkpoint.

## Issues Encountered

- Pre-existing test failures (not caused by this plan)

## User Setup Required

- OpenCode CLI must be installed for interactive mode
- OpenCode server must be running (`opencode serve`) for session connection

## Next Phase Readiness

Phase 04 complete with gaps noted. Gaps should be addressed via `/gsd:plan-phase 4 --gaps` before moving to Phase 5.

---
*Phase: 04-opencode-integration*
*Completed: 2026-01-25*
