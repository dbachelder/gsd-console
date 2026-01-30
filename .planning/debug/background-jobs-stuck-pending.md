# Debug Session: Background jobs stuck in pending state

**Gap:** Jobs transition from pending → running → complete without getting stuck
**UAT Test:** 1
**Severity:** Blocker
**User Report:** "the job is created as pending, but nothing seems to happen then..."

## Investigation Summary

**Issue:** Headless mode creates OpenCode sessions, queues jobs, but jobs never execute. Jobs remain stuck in "pending" state forever.

## Root Cause

**Newly created OpenCode sessions never emit `session.idle` events, causing jobs to remain stuck in pending state.** The job processing system is entirely event-driven and only starts jobs when a `session.idle` event is received, but newly created sessions start in idle state and don't emit this initial event.

## Evidence Summary

1. **Event-Only Job Processing:** Jobs only start when `handleIdle()` is called (useBackgroundJobs.ts:74-164), which is triggered exclusively by `session.idle` events via `useSessionEvents` hook (useBackgroundJobs.ts:216).

2. **Session.idle Event Behavior:** In useSessionEvents.ts:77-81, code only triggers `onIdle` callback when a `session.idle` event is received. This event type represents a **transition** from busy→idle, not a state.

3. **Headless Job Creation Flow:** When user selects headless mode (app.tsx:211-223):
   - Line 216: Creates new OpenCode session
   - Line 218: Adds job to queue with that session ID
   - Session is created in idle state (no transition)
   - No `session.idle` event is emitted
   - Job stays pending forever

4. **Missing Initial State Check:** The `add()` function in useBackgroundJobs.ts:225-240 only adds a job to state. It doesn't check if the associated session is idle and start the job immediately. The system relies entirely on future events.

## Files Involved

**src/hooks/useBackgroundJobs.ts** (lines 225-240): `add()` function lacks initial session state check

The function:
```typescript
const add = useCallback(
  (command: string, explicitSessionId?: string) => {
    const jobSessionId = explicitSessionId ?? sessionId;
    const job: BackgroundJob = {
      id: generateJobId(),
      command,
      status: 'pending',
      queuedAt: Date.now(),
      sessionId: jobSessionId,
    };

    setJobs((prev) => pruneJobs([...prev, job]));
    showToast?.(`Background: ${command} queued`, 'info');

    // If session is available and no job running, trigger processing
    // The next idle event will pick up the pending job
    if (jobSessionId && !isProcessing) {
      // Trigger idle check - if session is already idle, this will start the job
      handleIdle(jobSessionId);
    }
  },
  [sessionId, isProcessing, showToast, handleIdle],
);
```

The premature `handleIdle(jobSessionId)` call was removed per Plan 08-01, but without it, jobs wait forever for idle events that never come.

**src/hooks/useBackgroundJobs.ts** (lines 214-220): Session event subscription only handles events, not initial state

**src/app.tsx** (lines 211-223): Headless mode creates new session but doesn't trigger job processing

The headless flow:
```typescript
case 'headless':
  // Create new background session and add job to it
  {
    void (async () => {
      const formattedCommand = formatGsdCommand(fullCommand, target);
      const newSessionId = await createSession(formattedCommand);
      if (newSessionId) {
        addBackgroundJob(formattedCommand, newSessionId);
      } else {
        showToast('Failed to create background session', 'warning');
      }
    })();
  }
  break;
```

## Suggested Fix Direction

**Add an initial session state check when adding jobs to the queue.** After calling `add()`, check if the session is idle (via SDK `session.get()` or by checking if it's a newly created session) and if so, trigger `handleIdle()` immediately to start the job.

Two possible approaches:

**Option 1: Check session state on job addition**
- When `add()` is called, check if the session is in idle state
- If idle, call `handleIdle()` immediately to start the job
- If busy, wait for `session.idle` event (as designed)

**Option 2: Send initial prompt to newly created sessions**
- After creating a session with `createSession()`, immediately call `sendPrompt()` with a minimal prompt
- This triggers the session lifecycle (will eventually generate an idle event)
- Then queue the actual job

**Recommendation:** Option 1 is cleaner and aligns with existing architecture. Add session state checking logic to `add()` function or use a `useEffect` to proactively start pending jobs when their sessions are idle.
