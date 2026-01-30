---
phase: 08-comprehensive-fix-for-broken-background-tasks
plan: 02
subsystem: background-jobs
tags: opencode-sdk, job-queue, async, timeout-handling, model-configuration

# Dependency graph
requires:
  - phase: 04-opencode-integration
    provides: OpenCode SDK client, session management, sendPrompt function
provides:
  - Reliable background job execution with proper state transitions
  - 30-second timeout wrapper for sendPrompt to prevent hanging jobs
  - Model parameter passing to OpenCode SDK
  - In-progress job tracking to prevent duplicate starts
  - Proactive job startup for idle sessions
affects: future phases using background jobs (GSD commands, headless execution)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Timeout wrapper pattern for async operations"
    - "In-progress tracking for job state machine"
    - "Proactive startup pattern for idle sessions"

key-files:
  created: []
  modified:
    - src/hooks/useBackgroundJobs.ts
    - src/lib/opencode.ts

key-decisions:
  - "Use 'opencode/big-pickle' as default model for background GSD commands"
  - "Mark jobs as in-progress before sendPrompt to prevent duplicate starts"
  - "Add 30s timeout wrapper around sendPrompt to prevent hanging jobs"
  - "Parse model string into providerID/modelID format for SDK compatibility"

patterns-established:
  - "Pattern 1: Timeout wrapper with Promise.race for async operations"
  - "Pattern 2: In-progress ref tracking for job state machine"
  - "Pattern 3: Proactive startup effect for idle sessions"
  - "Pattern 4: Model string parsing for SDK compatibility"

# Metrics
duration: 6h 6min
completed: 2026-01-26
---

# Phase 08: Plan 02 Summary

**Background jobs with reliable pending→running→complete transitions, 30s sendPrompt timeout, and correct model parameter passing**

## Performance

- **Duration:** 6h 6min
- **Started:** 2026-01-26T14:28:37-08:00
- **Completed:** 2026-01-26T20:26:47-08:00
- **Tasks:** 8
- **Files modified:** 2

## Accomplishments

- Fixed sendPrompt hanging indefinitely with 30-second timeout wrapper
- Fixed jobs stuck in pending state with proactive startup for idle sessions
- Fixed inconsistent job transitions with in-progress tracking ref
- Fixed model parameter by adding parseModel helper and passing to SDK body
- Added debug logging for prompt content and job state changes
- Added 2-minute timeout for jobs stuck in running state
- Added sequential job processing documentation
- All background jobs now transition reliably from pending → running → complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Add error handling and debug logging** - `7b7c1f0` (fix)
2. **Task 2: Add 2-minute timeout for stuck background jobs** - `19897d1` (fix)
3. **Task 3: Force opencode model for GSD** - `acf305f` (fix)
4. **Task 4: Move status update after sendPrompt to prevent stuck jobs** - `e48e47e` (fix)
5. **Task 5: Document sequential job processing logic** - `b69559c` (docs)
6. **Task 6: Fix inconsistent job transitions and debug logs** - `4d75b9c` (fix)
7. **Task 7: Fix race condition and SDK compatibility** - `e77331d` (fix)
8. **Task 8: Fix model parameter and sendPrompt timeout** - `e01b4ef` (fix)

**Plan metadata:** (docs commit not yet created)

_Note: Some tasks required multiple iterations to fully resolve issues_

## Files Created/Modified

- `src/hooks/useBackgroundJobs.ts` - Added proactive job startup, timeout wrappers, in-progress tracking, debug logging
- `src/lib/opencode.ts` - Added parseModel helper, model parameter to SDK request body, sendPrompt timeout wrapper

## Decisions Made

- Use 'opencode/big-pickle' as default model for background GSD commands (forces GLM4.7 which is optimized for GSD)
- Track jobs in-progress using ref to prevent duplicate starts when useEffect re-runs during async job startup
- Add 30-second timeout wrapper around sendPrompt with Promise.race to prevent jobs hanging indefinitely
- Parse model string "provider/model" into providerID/modelID format for SDK compatibility
- Mark jobs as running only after sendPrompt succeeds (not before) to avoid stuck jobs on failure
- Proactive startup effect checks for pending jobs and starts them immediately instead of waiting for session.idle events that never fire for newly created sessions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed sendPrompt hanging indefinitely**

- **Found during:** Task 1 (Add error handling and debug logging)
- **Issue:** sendPrompt call never returned when OpenCode server was unresponsive or network issues occurred, causing jobs to hang forever
- **Fix:** Added sendPromptWithTimeout wrapper function using Promise.race with 30s timeout (e01b4ef, 3371049)
- **Files modified:** src/lib/opencode.ts, src/hooks/useBackgroundJobs.ts
- **Verification:** Job fails gracefully with timeout error message instead of hanging
- **Committed in:** e01b4ef, 3371049

**2. [Rule 2 - Missing Critical] Fixed model parameter missing from SDK request**

- **Found during:** Task 8 (Fix model parameter)
- **Issue:** OpenCode SDK expects model field in request body as {providerID, modelID} format, but we weren't passing it, causing "GPT model" error toast
- **Fix:** Added parseModel helper function to convert "provider/model" string to SDK format, added model field to request body
- **Files modified:** src/lib/opencode.ts
- **Verification:** No more "GPT model" error toasts, jobs execute with correct model
- **Committed in:** e01b4ef

**3. [Rule 1 - Bug] Fixed jobs stuck in pending state for newly created sessions**

- **Found during:** Task 4 (Move status update after sendPrompt)
- **Issue:** Newly created OpenCode sessions start in idle state and never emit session.idle events, so handleIdle never fired and pending jobs never started
- **Fix:** Added proactive startup useEffect that checks for pending jobs and starts them immediately instead of waiting for session.idle events
- **Files modified:** src/hooks/useBackgroundJobs.ts
- **Verification:** Jobs transition from pending → running immediately when added for idle sessions
- **Committed in:** e48e47e, b69559c, 4d75b9c

**4. [Rule 1 - Bug] Fixed inconsistent job transitions with duplicate starts**

- **Found during:** Task 6 (Fix inconsistent job transitions)
- **Issue:** useEffect re-ran during async job startup, causing multiple sendPrompt calls for the same job and confusing state transitions
- **Fix:** Added jobsInProgressRef to track jobs being started, skip if already in-progress
- **Files modified:** src/hooks/useBackgroundJobs.ts
- **Verification:** Only one sendPrompt call per job, consistent pending → running → complete transitions
- **Committed in:** 4d75b9c

**5. [Rule 2 - Missing Critical] Added debug logging for job state changes**

- **Found during:** Task 1 (Add error handling and debug logging)
- **Issue:** Debug logs were not showing prompt content or job state transitions, making it impossible to diagnose stuck jobs
- **Fix:** Added debugLog calls throughout job lifecycle (pending, in-progress, sendPrompt, running, complete, failed)
- **Files modified:** src/hooks/useBackgroundJobs.ts, src/lib/opencode.ts
- **Verification:** Debug log shows full job lifecycle with timestamps and prompt content
- **Committed in:** 7b7c1f0, 4d75b9c, e01b4ef

**6. [Rule 1 - Bug] Fixed jobs stuck in running state forever**

- **Found during:** Task 2 (Add 2-minute timeout for stuck background jobs)
- **Issue:** If a job started but the session never went idle (e.g., OpenCode crashed), the job stayed in running state forever
- **Fix:** Added 2-minute timeout effect that marks job as failed if it doesn't go idle within 2 minutes
- **Files modified:** src/hooks/useBackgroundJobs.ts
- **Verification:** Jobs timeout after 2 minutes with descriptive error message
- **Committed in:** 19897d1

**7. [Rule 3 - Blocking] Fixed sendPrompt SDK compatibility**

- **Found during:** Task 8 (Fix model parameter)
- **Issue:** Original sendPrompt call didn't handle timeout and model parameter correctly, needed to be wrapped for timeout support
- **Fix:** Created sendPromptWithTimeout wrapper with Promise.race, proper error handling, and model parameter passing
- **Files modified:** src/lib/opencode.ts, src/hooks/useBackgroundJobs.ts
- **Verification:** sendPromptWithTimeout returns false on timeout, jobs handle failure gracefully
- **Committed in:** e01b4ef, 3371049

---

**Total deviations:** 7 auto-fixed (6 bugs, 1 missing critical, 1 blocking)
**Impact on plan:** All auto-fixes essential for correctness and reliability. Plan was reactive bug fixing rather than planned feature development. Deviations uncovered deeper issues with OpenCode SDK integration that needed comprehensive fixes.

## Issues Encountered

- **Issue:** sendPrompt hanging indefinitely - Resolved with Promise.race timeout wrapper
- **Issue:** Jobs stuck in pending state - Resolved with proactive startup effect for idle sessions
- **Issue:** "GPT model" error toast appearing - Resolved by adding model field to SDK request body
- **Issue:** Duplicate sendPrompt calls for same job - Resolved with in-progress tracking ref
- **Issue:** Debug logs not showing prompt content - Resolved by adding debugLog calls throughout job lifecycle
- **Issue:** Jobs stuck in running state forever - Resolved with 2-minute timeout effect
- **Issue:** New sessions being created mysteriously - Investigation showed this was expected behavior for headless mode creating dedicated background sessions

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Background job execution is now reliable with proper state transitions and timeout handling
- All UAT gaps from Phase 8 have been resolved
- Ready for Phase 9: Name Change And Public Readiness

---
*Phase: 08-comprehensive-fix-for-broken-background-tasks*
*Completed: 2026-01-26*
