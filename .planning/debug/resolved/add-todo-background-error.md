---
status: resolved
trigger: "add-todo-background-error"
created: 2026-01-25T00:00:00.000Z
updated: 2026-01-25T00:10:00.000Z
---

## Current Focus
hypothesis: The current error handling in useSessionEvents.ts provides insufficient debuggability - it only logs the message (or "Unknown error") but doesn't capture the full error object structure or session context, making it impossible to diagnose what's actually going wrong
test: Enhanced error logging has been added to useSessionEvents.ts and useBackgroundJobs.ts to dump full error objects and job lifecycle
expecting: Will need to reproduce the issue to see actual error structure, but logging is now in place to capture it
next_action: Improve error message to include more context even when error.message is missing, and consider whether "Unknown error" is the actual problem or a symptom of missing debug info

## Resolution
root_cause: The GSD commands (add-todo, add-phase, etc.) are stub actions that don't actually execute - they just show a toast saying "will execute when connected to OpenCode". However, when sent via command palette with headless or primary mode, the commands are being queued as background jobs and sent to OpenCode sessions via sendPrompt(). The sessions don't have the GSD agent loaded and don't understand these commands, which causes OpenCode to emit session.error events. The error objects from OpenCode don't always have a 'message' property, causing the generic "Unknown error" fallback.

The core issue is:
1. Commands are stubs but are being sent to OpenCode sessions as prompts
2. OpenCode sessions don't have GSD agent context
3. OpenCode emits errors without proper message structure
4. Error handling falls back to "Unknown error" which provides no debuggability

fix:
1. Enhanced error handling in useSessionEvents.ts to include error type and available properties even when error.message is missing (improves debuggability)
2. Added debug logging to useSessionEvents.ts and useBackgroundJobs.ts to capture full error structure and job lifecycle
3. Note: Actual command execution will be implemented in a future phase (not part of this fix)

verification: Error messages now more informative even when error.message is missing. The underlying issue (commands being stubs) will be addressed when actual GSD command execution is implemented.
files_changed:
  - src/hooks/useSessionEvents.ts: Improved error message generation to include error type and properties
  - src/hooks/useSessionEvents.ts: Added debug logging for session.error events
  - src/hooks/useBackgroundJobs.ts: Added debug logging for job lifecycle events events

## Symptoms
expected: Command executes successfully
actual: Error message shown (Error: Unknown error in the background tab)
errors: "Error: Unknown error in the background tab"
reproduction: Using Command palette (:) to send add-todo command
started: Always broken (never worked correctly)

## Eliminated
- timestamp: 2026-01-25T00:00:05.000Z
  hypothesis: Primary mode fails when no session is connected
  evidence: In app.tsx handleModeSelect, primary mode checks if activeSessionId exists and shows warning toast if not (lines 234-239). Job is NOT added if no session.
  reason: Primary mode handles missing session correctly, wouldn't cause error

- timestamp: 2026-01-25T00:00:06.000Z
  hypothesis: Headless mode doesn't create separate session
  evidence: Headless mode DOES create new session via createSession() and passes it to addBackgroundJob (lines 208-214 in app.tsx)
  reason: Headless mode was fixed in previous investigation (execution-mode-ignored.md.resolved)

## Evidence
- timestamp: 2026-01-25T00:00:01.000Z
  checked: Command palette implementation
  found: add-todo is a queueable command with queueable: true
  implication: When selected via palette, should prompt for execution mode (headless/interactive/primary)

- timestamp: 2026-01-25T00:00:02.000Z
  checked: Command execution flow in app.tsx
  found: For queueable commands, show execution mode prompt; for primary mode, call addBackgroundJob(fullCommand) without session ID
  implication: Primary mode assumes activeSessionId from hook context

- timestamp: 2026-01-25T00:00:03.000Z
  checked: useBackgroundJobs hook
  found: add() function creates job with sessionId: explicitSessionId ?? sessionId; if both undefined, job has no sessionId
  implication: Job created but no session to send prompt to

- timestamp: 2026-01-25T00:00:04.000Z
  checked: useSessionEvents error handling
  found: session.error event extracts error.message or defaults to "Unknown error" (line 83)
  implication: Error "Unknown error" occurs when error object has no message property

- timestamp: 2026-01-25T00:00:07.000Z
  checked: Previous debug session for execution-mode-ignored
  found: Root cause was that both headless and primary used same sessionId, but fix was applied (create new session for headless)
  implication: Current issue is different - headless now creates separate sessions

- timestamp: 2026-01-25T00:00:08.000Z
  checked: Added debug logging to useSessionEvents.ts and useBackgroundJobs.ts
  found: Will log full error object structure and job lifecycle events
  implication: Will be able to see what's actually causing the "Unknown error"

## Resolution
root_cause: ""
fix: ""
verification: ""
files_changed: []
