---
phase: 04-opencode-integration
plan: 04
subsystem: api
tags: [opencode, sse, events, background-jobs, hooks]

# Dependency graph
requires:
  - phase: 04-01
    provides: OpenCode SDK client and detectServer function
  - phase: 04-03
    provides: Session management and sessionId state in App.tsx
provides:
  - BackgroundJob and BackgroundJobsState types
  - sendPrompt function for session prompts
  - createSession function for new sessions
  - useSessionEvents hook for SSE subscription
  - useBackgroundJobs hook for job management
affects: [04-05, background-panel-view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SSE event subscription with AbortController cleanup
    - Job retention with automatic pruning (5 success + 5 failed)
    - Sequential job processing on session.idle events

key-files:
  created:
    - src/hooks/useSessionEvents.ts
    - src/hooks/useBackgroundJobs.ts
  modified:
    - src/lib/types.ts
    - src/lib/opencode.ts

key-decisions:
  - "Use find() instead of findIndex() for cleaner TypeScript narrowing in job state updates"
  - "Accumulate output via ref during job execution, attach to job on completion"
  - "Enable event subscription only when pending jobs exist or job running (not always on)"

patterns-established:
  - "SSE subscription: mounted ref + AbortController for clean cleanup"
  - "Job status transitions: pending -> running -> complete/failed/cancelled"
  - "Retention pruning: keep active + last 5 success + last 5 failed"

# Metrics
duration: 3min
completed: 2026-01-25
---

# Phase 04 Plan 04: Background Jobs Summary

**Background job management with SSE-based session monitoring and automatic retention pruning**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-25T08:18:19Z
- **Completed:** 2026-01-25T08:21:25Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added BackgroundJob types and prompt/session functions to SDK wrapper
- Created useSessionEvents hook for SSE subscription with proper cleanup
- Created useBackgroundJobs hook with retention, cancellation, and toast notifications

## Task Commits

Each task was committed atomically:

1. **Task 1: Add background job types and prompt function** - `6d6fde9` (feat)
2. **Task 2: Create session events hook** - `14b0832` (feat)
3. **Task 3: Create background jobs hook with retention** - `121db88` (feat)

## Files Created/Modified
- `src/lib/types.ts` - Added BackgroundJob, BackgroundJobStatus, BackgroundJobsState types
- `src/lib/opencode.ts` - Added sendPrompt and createSession functions
- `src/hooks/useSessionEvents.ts` - SSE subscription hook with idle/output/error callbacks
- `src/hooks/useBackgroundJobs.ts` - Job management with add/cancel/clear and retention

## Decisions Made
- Used find() instead of findIndex() for job lookups - cleaner TypeScript narrowing
- Event subscription enabled conditionally (only when jobs need processing) to avoid unnecessary resource usage
- Output accumulated in ref during execution, attached to job on completion for expandable display

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Background job hooks ready for integration with BackgroundView in Plan 05
- useBackgroundJobs exposes add/cancel/clear/jobs for UI consumption
- Toast notifications wired through showToast prop

---
*Phase: 04-opencode-integration*
*Completed: 2026-01-25*
