---
status: diagnosed
trigger: "Investigate why --only mode doesn't fill the terminal pane height."
created: 2026-01-24T00:00:00Z
updated: 2026-01-24T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: View components (RoadmapView, PhaseView, TodosView) don't have flexGrow, causing them to size to content instead of filling available space
test: Check if other view components also lack flexGrow
expecting: Confirm that view components need flexGrow={1} to fill parent container
next_action: Check PhaseView and TodosView for flexGrow

## Symptoms

expected: Running `bun start --only roadmap` should fill the entire terminal pane height
actual: Shows only content-sized view, not filling the terminal pane
errors: None reported
reproduction: Run `bun start --only roadmap`
started: Known issue, fix attempted with flexGrow={1} in TabLayout.tsx and app.tsx but didn't work

## Eliminated

## Evidence

- timestamp: 2026-01-24T00:05:00Z
  checked: TabLayout.tsx lines 52-68 (--only mode rendering)
  found: Box with flexGrow={1} wraps the single view
  implication: FlexGrow is set at TabLayout level, but may need propagation down

- timestamp: 2026-01-24T00:05:30Z
  checked: app.tsx lines 81-86 (main container)
  found: Main app Box has flexGrow={1}, passes through TabLayout
  implication: FlexGrow exists in app container

- timestamp: 2026-01-24T00:06:00Z
  checked: cli.tsx line 62 (Ink render call)
  found: render(<App flags={flags} />) - no fullscreen or patchConsole options
  implication: Ink render doesn't explicitly request fullscreen mode

- timestamp: 2026-01-24T00:06:30Z
  checked: RoadmapView.tsx line 94 (view container)
  found: Box flexDirection="column" paddingX={1} - NO flexGrow
  implication: View components don't have flexGrow, so they size to content

- timestamp: 2026-01-24T00:07:00Z
  checked: PhaseView.tsx line 98 (view container)
  found: Box flexDirection="column" paddingX={1} - NO flexGrow
  implication: Confirmed - PhaseView also lacks flexGrow

- timestamp: 2026-01-24T00:07:15Z
  checked: TodosView.tsx line 61 (view container)
  found: Box flexDirection="column" paddingX={1} - NO flexGrow
  implication: Confirmed - TodosView also lacks flexGrow

## Resolution

root_cause: All three view components (RoadmapView, PhaseView, TodosView) are missing flexGrow={1} on their root Box components. While TabLayout.tsx and app.tsx correctly have flexGrow={1} on their containers, the flexbox grow behavior doesn't propagate to children automatically in Ink. Each view component needs its own flexGrow={1} to fill the available space provided by its parent container.
fix: N/A (diagnosis only mode)
verification: N/A (diagnosis only mode)
files_changed:
  - src/components/roadmap/RoadmapView.tsx (line 94: add flexGrow={1})
  - src/components/phase/PhaseView.tsx (line 98: add flexGrow={1})
  - src/components/todos/TodosView.tsx (line 61: add flexGrow={1})
