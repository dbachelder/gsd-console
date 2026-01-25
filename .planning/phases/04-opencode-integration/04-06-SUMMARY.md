---
phase: 04-opencode-integration
plan: 06
subsystem: ui
tags: [opencode, session-detection, footer, path-normalization]

# Dependency graph
requires:
  - phase: 04-01
    provides: OpenCode SDK client and session listing
provides:
  - Footer shows 'c' connect hint to users
  - Session detection works with normalized paths
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Path normalization: Remove trailing slashes before comparison"

key-files:
  created: []
  modified:
    - src/components/layout/Footer.tsx
    - src/lib/opencode.ts

key-decisions:
  - "Add connect hint to commonHints (global action like quit)"
  - "Normalize paths by removing trailing slashes for consistent comparison"

patterns-established:
  - "Global actions in commonHints array for footer visibility"

# Metrics
duration: 3min
completed: 2026-01-25
---

# Phase 4 Plan 6: Gap Closure - Footer and Session Detection

**Footer displays 'c' connect hint and session detection uses path normalization for reliable matching**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-25T08:48:00Z
- **Completed:** 2026-01-25T08:51:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Footer now shows 'c: connect' hint alongside other common hints
- Session detection normalizes paths by removing trailing slashes
- Both UAT gaps from phase 04-05 are now closed

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 'c' connect hint to Footer** - `e941a92` (feat)
2. **Task 2: Debug and fix session detection** - `4f97991` (fix)

## Files Created/Modified

- `src/components/layout/Footer.tsx` - Added 'c: connect' to commonHints array
- `src/lib/opencode.ts` - Path normalization in getProjectSessions

## Decisions Made

- Added connect hint to commonHints array (global actions visible at all times)
- Used trailing slash removal for path normalization (simple, effective)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both fixes were straightforward.

## Next Phase Readiness

- Footer hint gap closed
- Session detection gap closed
- One remaining gap: Tab completion with arguments (addressed in 04-07-PLAN.md)

---
*Phase: 04-opencode-integration*
*Completed: 2026-01-25*
