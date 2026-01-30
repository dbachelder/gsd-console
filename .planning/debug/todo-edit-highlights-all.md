---
status: diagnosed
trigger: "Investigate why editing one todo highlights ALL todos instead of just the changed one."
created: 2026-01-24T00:00:00Z
updated: 2026-01-24T00:06:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - deriveAffectedItemIds marks all todos when any todo file changes
test: examined app.tsx lines 43-47
expecting: found the bug - loop marks every todo instead of extracting specific ID
next_action: document root cause and return diagnosis

## Symptoms

expected: Only the specific changed todo should highlight when edited
actual: Editing one todo makes all the todos go yellow (all todos highlight)
errors: None reported
reproduction: Edit any single todo item
started: Unknown - reported as current behavior
context: User mentions files src/app.tsx (deriveAffectedItemIds) and src/hooks/useChangeHighlight.ts

## Eliminated

## Evidence

- timestamp: 2026-01-24T00:01:00Z
  checked: app.tsx lines 26-52 (deriveAffectedItemIds function)
  found: Lines 43-47 handle todo file changes with a loop that marks ALL todos
  implication: When ANY file in todos/ changes, it loops through ALL todos and pushes every `todo-${t.id}` to the affected IDs array

- timestamp: 2026-01-24T00:02:00Z
  checked: Todo file naming pattern in .planning/todos/pending/
  found: Files named like "2026-01-24-display-actual-plan-files-in-tui.md"
  implication: The ID is the full filename, so we can extract the specific todo ID from the changed file path

- timestamp: 2026-01-24T00:03:00Z
  checked: useChangeHighlight.ts
  found: Hook works correctly - it highlights whatever IDs are passed to markChanged()
  implication: The bug is NOT in the highlighting mechanism, it's in deriveAffectedItemIds providing too many IDs

- timestamp: 2026-01-24T00:04:00Z
  checked: parser.ts lines 252-290 (parseTodos function)
  found: Todo IDs are formatted as `pending-${file}` or `done-${file}` where file is the filename
  implication: We can extract the specific todo ID by parsing the changed file path to get the filename and prefix

## Resolution

root_cause: In app.tsx lines 43-47, when any file in todos/ changes, deriveAffectedItemIds loops through ALL todos in data.todos and pushes every todo ID to the affected array. It should instead extract the specific todo ID from the changed file path by parsing the path to determine if it's in pending/ or done/, then constructing the ID as `pending-${filename}` or `done-${filename}`.
fix: Replace the loop in lines 43-47 with logic to extract the specific todo ID from the file path
verification: Edit a single todo and verify only that todo highlights (not all todos)
files_changed: []
