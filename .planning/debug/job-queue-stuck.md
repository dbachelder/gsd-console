# Root Cause Analysis: Job Queue Stuck

**Investigation Date:** 2026-01-26
**Debug Session:** .planning/debug/job-queue-stuck.md
**Gap from UAT:** "Jobs never process sequentially - they queue up but nothing moves forward"

## Problem Summary

When users queue multiple headless commands, jobs are added with status 'pending' but never transition to 'running' or 'complete'. The entire job queue remains stuck.

## Root Cause

**Jobs wait for `session.idle` event that never fires for newly created sessions.**

### Expected Flow

1. User queues headless command (e.g., "plan-phase 4")
2. System creates new OpenCode session via SDK
3. System adds job to queue with `status: 'pending'`
4. System subscribes to `session.idle` events for that session
5. When session goes idle, `handleIdle` is called
6. `handleIdle` finds pending job and starts it

### Actual Flow

1. User queues headless command ✓
2. System creates new OpenCode session ✓
3. System adds job to queue with `status: 'pending'` ✓
4. System subscribes to `session.idle` events ✓
5. **No idle event fires** ✗
6. **Job never starts** ✗

### The Core Issue

**Newly created sessions are already in idle state, so OpenCode doesn't emit a `session.idle` event.** The event subscription is listening for a state change that will never happen.

### Evidence from Code

**app.tsx (lines 211-223): Headless mode creates session then adds job**

```typescript
case 'headless':
  // Create new background session and add job to it
  {
    void (async () => {
      const formattedCommand = formatGsdCommand(fullCommand, target);
      const newSessionId = await createSession(formattedCommand); // Creates idle session
      if (newSessionId) {
        addBackgroundJob(formattedCommand, newSessionId); // Adds pending job
      }
    })();
  }
  break;
```

**useBackgroundJobs.ts (lines 214-220): Subscribes to idle events**

```typescript
// Subscribe to session events
useSessionEvents({
  sessionIds: jobSessionIds,
  onIdle: handleIdle,  // Only called when idle event fires
  onOutput: handleOutput,
  onError: handleError,
  enabled: jobSessionIds.length > 0,
});
```

**useSessionEvents.ts (lines 77-81): Only triggers on idle event**

```typescript
if (typedEvent.type === 'session.idle') {
  const eventSessionId = typedEvent.properties.sessionID;
  if (eventSessionId && sessionIdsSet.current.has(eventSessionId)) {
    onIdleRef.current?.(eventSessionId);  // Only fires on event
  }
}
```

**useBackgroundJobs.ts: No useEffect to check pending jobs**

There is no `useEffect` that periodically checks for pending jobs or triggers job startup. The ONLY trigger is the `session.idle` event.

## Why This Affects Multiple Jobs

When multiple jobs are queued rapidly:
1. Job 1: Creates session, adds pending job, no idle event → stuck at pending
2. Job 2: Creates session, adds pending job, no idle event → stuck at pending
3. Job 3: Creates session, adds pending job, no idle event → stuck at pending

Even when a job finishes and sends an idle event, the system is waiting for that event from the session that's already idle, creating a deadlock.

## Additional Issues

### 1. `handleIdle` assumes jobs are marked running prematurely

**useBackgroundJobs.ts (lines 107-154):**

```typescript
// Find next pending job - start it
const pendingJob = prev.find((j) => j.status === 'pending');
if (pendingJob) {
  // ... send prompt asynchronously ...

  // Mark as running IMMEDIATELY, before send completes
  return prev.map((j) =>
    j.id === pendingJob.id
      ? { ...j, status: 'running' as const, startedAt: Date.now() }
      : j,
  );
}
```

The job is marked 'running' before `sendPrompt()` even starts. If `sendPrompt()` fails (which it does for stuck jobs because the session was never started), the job remains 'running' forever.

### 2. Failed jobs block subsequent jobs

When `sendPrompt()` fails, the job is marked 'failed', but `handleIdle` returns the job state without checking for more pending jobs. The next `handleIdle` call will encounter the failed job first and return early, blocking all subsequent jobs.

## Suggested Fix Direction

### Option 1: Trigger job startup on add (Recommended)

Add an effect in `useBackgroundJobs` that starts pending jobs immediately:

```typescript
// When jobs array changes, check for pending jobs
useEffect(() => {
  const pendingJob = jobs.find((j) => j.status === 'pending');
  if (pendingJob && pendingJob.sessionId) {
    // Try to start the job (will fail if session not ready, but worth trying)
    void (async () => {
      const success = await sendPrompt(pendingJob.sessionId, pendingJob.command);
      if (!success) {
        // Job failed - don't block others
        setJobs((prev) => prev.filter((j) => j.id !== pendingJob.id));
      }
    })();
  }
}, [jobs]);
```

### Option 2: Poll for idle sessions

Add a polling mechanism that periodically checks for pending jobs and tries to start them. Less elegant but more robust.

### Option 3: Modify headless mode flow

Change headless mode to send prompt immediately instead of queueing:

```typescript
case 'headless':
  {
    void (async () => {
      const formattedCommand = formatGsdCommand(fullCommand, target);
      const newSessionId = await createSession(formattedCommand);
      if (newSessionId) {
        // Send prompt immediately, not via queue
        const success = await sendPrompt(newSessionId, formattedCommand);
        if (success) {
          // Add job as running, not pending
          addBackgroundJobAsRunning(formattedCommand, newSessionId);
        }
      }
    })();
  }
  break;
```

This would require a new `addBackgroundJobAsRunning` function that starts the job at 'running' status.

## Files Involved

- **src/hooks/useBackgroundJobs.ts:47-163** - Job queue and handleIdle logic
  - Line 214-220: Session events subscription (no proactive job startup)
  - Line 107-154: handleIdle marks job running before prompt succeeds
  - Line 225-240: add function creates pending jobs without trigger

- **src/hooks/useSessionEvents.ts:24-163** - Event subscription
  - Line 77-81: Only triggers on idle event, not initial state
  - Line 150: Subscription re-creates when sessionIds changes (correct, but not enough)

- **src/app.tsx:211-223** - Headless mode creates sessions and queues jobs
  - Creates idle session, then adds pending job (deadlock pattern)

## Verification

To confirm this root cause:

1. Run TUI with `GSD_DEBUG=1 bun run dev`
2. Queue a headless command
3. Check `/tmp/gsd-tui-debug.log` for session events
4. **Expected:** No `session.idle` event for the newly created session
5. **Actual:** Job remains pending forever

## Next Steps

Create a gap closure plan based on **Option 1** (trigger job startup on add) as it's the minimal change that solves the core issue without major refactoring.
