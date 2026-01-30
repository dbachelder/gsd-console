---
status: diagnosed
phase: 04-opencode-integration
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md, 04-06-SUMMARY.md, 04-07-SUMMARY.md
started: 2026-01-26T03:57:16Z
updated: 2026-01-26T04:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Spawn OpenCode session
expected: Press ':' to open command palette, type 'spawn-opencode', press Enter. TUI exits alternate screen, opens OpenCode CLI session in terminal. After session exits, TUI re-enters alternate screen and resumes.
result: pass

### 2. Connect to existing session via 'c' key
expected: Press 'c' to open session picker. If OpenCode sessions exist, they appear in a list with ID, directory, and last command. Use vim navigation (j/k, Enter) to select a session.
result: issue
reported: "it looks like it connected.. but I can't tell."
severity: minor
root_cause: SessionPicker successfully connects to OpenCode session and displays a brief toast notification ("Connected to session {id}...") for 3 seconds, but there's no persistent visual indicator in the UI showing session connection status. The Footer component does not use the available useSessionActivity hook or display session information, so after the toast disappears, the user has no way to tell if they're connected or which session they're connected to.

### 3. Session picker empty state
expected: If no sessions exist, session picker shows empty state message with option to spawn new session.
result: pass

### 4. Background tab exists (4th tab)
expected: Press Tab key to cycle through tabs. Background tab should appear as 4th tab (Roadmap / Phase / Todos / Background).
result: pass

### 5. Execution mode prompt appears
expected: In command palette, type a queueable command (e.g., 'add-todo'), press Enter. Execution mode prompt appears with 3 options: (h)eadless, (i)nteractive, (p)rimary.
result: issue
reported: "I did Headless and it still sent's command to primary"
severity: major
root_cause: In `app.tsx`, both headless and primary execution modes call `addBackgroundJob(fullCommand)`, which sends commands to the same `activeSessionId`. The `useBackgroundJobs` hook is initialized with `sessionId: activeSessionId` (line 158), so both modes send commands to the primary session, making headless and primary functionally identical.

### 6. Background view shows jobs
expected: Navigate to Background tab. Shows list of background jobs with status (pending/running/complete/failed), command name, and output.
result: pass

### 7. Expand job entry and cancel
expected: In Background tab, expand a job entry with Enter. Press 'c' to cancel, confirm with 'y'. Job status updates to 'cancelled'.
result: pass

### 8. Footer shows 'c: connect' hint
expected: Look at footer. 'c: connect' hint should be visible among other common hints.
result: pass

### 9. Session detection works
expected: With OpenCode server running and a session in the current project directory, press 'c'. Session picker should list session correctly.
result: pass

### 10. Tab completion in command palette
expected: In command palette, type partial command name (e.g., 'add-t'), press Tab. Command completes to 'add-todo ' with trailing space for arguments.
result: pass

## Summary

total: 10
passed: 8
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "Press 'c' to open session picker. If OpenCode sessions exist, they appear in a list with ID, directory, and last command. Use vim navigation (j/k, Enter) to select a session."
  status: failed
  reason: "User reported: it looks like it connected.. but I can't tell."
  severity: minor
  test: 2
  root_cause: "SessionPicker successfully connects to OpenCode session and displays a brief toast notification ("Connected to session {id}...") for 3 seconds, but there's no persistent visual indicator in the UI showing session connection status. The Footer component does not use the available useSessionActivity hook or display session information, so after the toast disappears, the user has no way to tell if they're connected or which session they're connected to."
  artifacts:
    - path: "src/components/layout/Footer.tsx"
      issue: "Missing session status display, should use useSessionActivity hook"
    - path: "src/components/layout/Footer.session-activity.example.tsx"
      issue: "Example exists showing how to integrate useSessionActivity hook into Footer"
  missing:
    - "Integrate useSessionActivity hook into Footer component to display persistent session status indicator"
  debug_session: ".planning/debug/session-connection-unclear.md"

- truth: "In command palette, type a queueable command (e.g., 'add-todo'), press Enter. Execution mode prompt appears with 3 options: (h)eadless, (i)nteractive, (p)rimary."
  status: failed
  reason: "User reported: I did Headless and it still sent's command to primary"
  severity: major
  test: 6
  root_cause: "In `app.tsx`, both headless and primary execution modes call `addBackgroundJob(fullCommand)`, which sends commands to the same `activeSessionId`. The `useBackgroundJobs` hook is initialized with `sessionId: activeSessionId` (line 158), so both modes send commands to the primary session, making headless and primary functionally identical."
  artifacts:
    - path: "src/app.tsx"
      issue: "Both headless and primary modes call addBackgroundJob(fullCommand), sending commands to same activeSessionId"
    - path: "src/hooks/useBackgroundJobs.ts"
      issue: "Hook initialized with sessionId: activeSessionId, causing both modes to send to primary"
    - path: "src/hooks/useBackgroundJobs.ts"
      issue: "add() function uses sessionId from closure, not checking execution mode"
  missing:
    - "For headless mode in handleModeSelect, create a new background session via createSession() and pass that session ID to a separate background job queue"
  debug_session: ".planning/debug/execution-mode-ignored.md"
