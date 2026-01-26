---
status: resolved
trigger: "headless-pending-after-primary"
created: 2025-01-25T00:00:00Z
updated: 2025-01-25T00:00:00Z
---

## Current Focus

hypothesis: useSessionEvents only subscribes to activeSessionId, but headless jobs have different session IDs
test: Trace session ID flow through App.tsx → useBackgroundJobs → useSessionEvents
expecting: Will find that headless jobs use new session IDs but events are filtered by activeSessionId
next_action: FIX IMPLEMENTED - Verify fix resolves the issue

## Symptoms

expected: Both commands should execute successfully
actual: Headless task shows 'pending' status and never starts
errors: No error messages, task just stays pending
reproduction: Send primary command, then send headless command
timeline: Always broken (never worked correctly)

## Eliminated

## Evidence

- timestamp: 2025-01-25T00:00:00Z
  checked: App.tsx execution mode handling
  found:
    - Primary mode: uses `activeSessionId`, calls `addBackgroundJob(formattedCommand)` without explicit session ID
    - Headless mode: creates new session via `createSession()`, calls `addBackgroundJob(formattedCommand, newSessionId)` with explicit new session ID
    - Both modes use the same `useBackgroundJobs` hook
  implication: Headless jobs have different session IDs than primary jobs

- timestamp: 2025-01-25T00:00:00Z
  checked: useBackgroundJobs.ts hook
  found:
    - Line 215: `const jobSessionId = explicitSessionId ?? sessionId;` - Uses explicit session ID if provided, otherwise uses hook's sessionId prop
    - Line 207: Subscribes to `sessionId` prop (which is `activeSessionId` from App.tsx)
    - Lines 238-241: Triggers `handleIdle()` when job added and session available
  implication: Hook subscribes to activeSessionId, not to individual job session IDs

- timestamp: 2025-01-25T00:00:00Z
  checked: useSessionEvents.ts event filtering
  found:
    - Line 73-76: Filters `session.idle` events by `sessionId` prop
    - Line 77-116: Filters `session.error` events by `sessionId` prop
    - Events only trigger callbacks if `typedEvent.properties.sessionID === sessionId`
  implication: Events from headless job sessions (different session ID) will be filtered out

- timestamp: 2025-01-25T00:00:00Z
  checked: Bug scenario trace
  found:
    1. User connects to session "primary-123" → `activeSessionId = "primary-123"`
    2. User sends primary command → Job added with `sessionId: "primary-123"` ✓
       - useSessionEvents subscribes to "primary-123" ✓
       - Events flow correctly, job completes ✓
    3. User sends headless command:
       - Creates new session "headless-456"
       - Job added with `sessionId: "headless-456"` ✓
       - useSessionEvents STILL subscribed to "primary-123" (NOT "headless-456") ✗
       - Events from "headless-456" are filtered out ✗
       - `handleIdle` never called ✗
       - Job stays "pending" forever ✗
  implication: Root cause confirmed

- timestamp: 2025-01-25T00:00:00Z
  checked: Test suite execution
  found: All 116 tests pass after API updates
    - useBackgroundJobs tests: 8 pass ✓
    - useSessionEvents tests: 8 pass ✓
    - All other hook tests: pass ✓
  implication: No regressions introduced

## Resolution

root_cause: useBackgroundJobs subscribes to a single sessionId (activeSessionId), but headless jobs create new sessions with different IDs. Events from headless job sessions are filtered out, so handleIdle is never called, leaving jobs in "pending" state.
fix: Modified useSessionEvents to accept an array of sessionIds and modified useBackgroundJobs to collect all job session IDs and pass them to useSessionEvents. Now events from all job sessions (primary and headless) are received correctly.
verification:
  - TypeScript typecheck passes ✓
  - All 116 tests pass ✓
  - Code review confirms correct behavior:
    * jobSessionIds computed from pending/running jobs ✓
    * useSessionEvents subscribed to all active job sessions ✓
    * handleIdle and handleError match jobs by sessionId ✓
    * Jobs sent to correct sessions via sendPrompt ✓
files_changed:
- src/hooks/useSessionEvents.ts: Changed from single sessionId to array of sessionIds
  - Updated interface: `sessionIds?: string[]`
  - Updated callbacks: `onIdle` and `onError` now include sessionId parameter
  - Added session ID filtering logic to process events from all subscribed sessions
- src/hooks/useBackgroundJobs.ts: Updated to pass all job session IDs to useSessionEvents
  - Added `jobSessionIds` computed from all pending/running jobs
  - Updated `handleIdle` to accept `idleSessionId` parameter and match jobs by session ID
  - Updated `handleError` to accept `errorSessionId` parameter and match jobs by session ID
  - Changed `useSessionEvents` call to use `sessionIds` instead of `sessionId`
  - Removed unused `hasRunningJob` variable
  - Added clarifying comment for cross-session job processing
- test/hooks/useSessionEvents.test.tsx: Updated tests for new API
  - Changed `sessionId` prop to `sessionIds` array
  - Updated callback signatures to include sessionId parameter

## Resolution

root_cause:
fix:
verification:
files_changed:
