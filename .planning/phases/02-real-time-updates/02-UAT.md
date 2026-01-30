---
status: diagnosed
phase: 02-real-time-updates
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-01-25T02:50:00Z
updated: 2026-01-25T03:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Auto-refresh on file change
expected: With TUI running, modifying .planning/ROADMAP.md causes TUI to reload and display updated data automatically
result: pass

### 2. Spinner during refresh
expected: When file change is detected, a spinner appears next to "GSD Status" in the header during the brief reload period
result: issue
reported: "the spinner is always running"
severity: major

### 3. Debounced rapid saves
expected: Running `for i in 1 2 3; do echo "" >> .planning/STATE.md; sleep 0.1; done` causes a single refresh (no flicker), not multiple rapid updates
result: issue
reported: "there is already flicker without even doing that test"
severity: major

### 4. Phase highlight on change
expected: When a phase-related file changes (e.g., ROADMAP.md or phase directory files), affected phase rows show a yellow/amber background highlight
result: issue
reported: "editing phase 1 title in ROADMAP.md makes all the phases yellow"
severity: major

### 5. Todo highlight on change
expected: When STATE.md or a file in todos/ changes, affected todo items show a yellow/amber background highlight
result: issue
reported: "editing one todo makes all the todos go yellow"
severity: major

### 6. Highlight fade after 5 seconds
expected: Yellow highlight on changed items fades to a dimmer shade and then disappears after approximately 5 seconds
result: pass

## Summary

total: 6
passed: 2
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Spinner appears only during file refresh, not constantly"
  status: failed
  reason: "User reported: the spinner is always running"
  severity: major
  test: 2
  root_cause: "Inline onError callback in app.tsx creates new reference each render, causing useEffect in useFileWatcher to re-run continuously. Cleanup clears debounce timer before setIsRefreshing(false) can execute."
  artifacts:
    - path: "src/app.tsx"
      issue: "Inline arrow function for onError creates unstable reference"
    - path: "src/hooks/useFileWatcher.ts"
      issue: "useEffect depends on onError, triggering re-runs"
  missing:
    - "Wrap onError in useCallback to stabilize reference"
  debug_session: ".planning/debug/resolved/spinner-always-running.md"

- truth: "TUI displays without flicker during normal operation"
  status: failed
  reason: "User reported: there is already flicker without even doing that test"
  severity: major
  test: 3
  root_cause: "useGsdData has changedFiles in dependency array (line 127). Arrays are compared by reference - new array instance on each file change triggers effect re-run, causing setData() and App re-render loop."
  artifacts:
    - path: "src/hooks/useGsdData.ts"
      issue: "changedFiles in dependency array causes unnecessary re-renders"
  missing:
    - "Remove changedFiles from useEffect dependency array - refreshTrigger is the proper reload trigger"
  debug_session: ".planning/debug/tui-display-flicker.md"

- truth: "Only the specific changed phase highlights, not all phases"
  status: failed
  reason: "User reported: editing phase 1 title in ROADMAP.md makes all the phases yellow"
  severity: major
  test: 4
  root_cause: "deriveAffectedItemIds in app.tsx (lines 30-35) intentionally loops through ALL phases when ROADMAP.md changes. Conservative heuristic, but not granular enough for typical single-phase edits."
  artifacts:
    - path: "src/app.tsx"
      issue: "Lines 30-35 mark all phases for any ROADMAP.md change"
  missing:
    - "For ROADMAP.md: accept that all phases highlight (conservative) OR implement content diffing to identify specific changed phase"
  debug_session: ".planning/debug/roadmap-all-phases-highlight.md"

- truth: "Only the specific changed todo highlights, not all todos"
  status: failed
  reason: "User reported: editing one todo makes all the todos go yellow"
  severity: major
  test: 5
  root_cause: "deriveAffectedItemIds in app.tsx (lines 43-47) loops through ALL todos when any file in todos/ changes, instead of extracting the specific todo ID from the file path."
  artifacts:
    - path: "src/app.tsx"
      issue: "Lines 43-47 mark all todos instead of specific changed todo"
  missing:
    - "Extract filename from changed file path and construct specific todo ID (pending-filename or done-filename)"
  debug_session: ".planning/debug/todo-edit-highlights-all.md"
