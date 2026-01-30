---
status: diagnosed
trigger: "session-connection-unclear"
created: 2026-01-25T00:00:00Z
updated: 2026-01-25T00:00:00Z
---

## Current Focus

hypothesis: Session connection succeeds but lacks persistent visual feedback; only brief toast shown (3 seconds) then UI unchanged
test: Verify Footer doesn't display session status, check if useSessionActivity hook is used
expecting: Footer doesn't show session connection status; useSessionActivity exists but isn't integrated
next_action: Document findings and formulate root cause

## Symptoms

expected: Press 'c' to open session picker. If OpenCode sessions exist, they appear in a list with ID, directory, and last command. Use vim navigation (j/k, Enter) to select a session.
actual: User reports: "it looks like it connected.. but I can't tell."
reproduction: User presses 'c' to connect to existing OpenCode session
started: Unknown timing

## Eliminated

## Evidence

- timestamp: 2026-01-25T00:00:00Z
  checked: SessionPicker.tsx component
  found: When user selects session (line 90), calls onSelect(sessionId). Connection handler in App.tsx (line 395-398) sets activeSessionId, closes picker, and calls showToast with success message
  implication: Connection logic is correct and provides temporary feedback via toast

- timestamp: 2026-01-25T00:00:00Z
  checked: useToast hook (3000ms dismiss timer)
  found: Toast notifications auto-dismiss after 3 seconds by default
  implication: Connection feedback is temporary and disappears quickly

- timestamp: 2026-01-25T00:00:00Z
  checked: Footer.tsx component
  found: Footer shows keybinding hints including "c: connect" but has no session connection status display. Does not receive activeSessionId prop, does not use useSessionActivity hook
  implication: No persistent visual indicator of connected session

- timestamp: 2026-01-25T00:00:00Z
  checked: Footer.session-activity.example.tsx
  found: Example exists showing how to integrate useSessionActivity hook into Footer to show "● [activity] |" when session is active
  implication: Hook exists but not used in actual Footer component

- timestamp: 2026-01-25T00:00:00Z
  checked: useSessionActivity hook implementation
  found: Hook tracks active session, provides sessionId, title, directory, isActive, currentActivity, lastUpdated. Monitors SSE events for real-time updates
  implication: All session data available but not displayed in UI

## Resolution

root_cause: SessionPicker successfully connects to OpenCode session and displays a brief toast notification ("Connected to session {id}...") for 3 seconds, but there's no persistent visual indicator in the UI showing session connection status. The Footer component does not use the available useSessionActivity hook or display session information, so after the toast disappears, the user has no way to tell if they're connected or which session they're connected to.

fix: Integrate useSessionActivity hook into Footer component to display persistent session status indicator (e.g., "● Connected: [session]" or show current activity when session is active). Update Footer to receive activeSessionId or use the hook directly to show connection status.

verification: files_changed: []
