---
status: diagnosed
phase: 01-core-tui
source: [01-03-SUMMARY.md]
started: 2026-01-25T00:45:00Z
updated: 2026-01-25T00:55:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Progress Bar Shows 25%
expected: Run `bun run dev`. Header shows progress bar at 25% (1/4 phases complete).
result: pass

### 2. q Key Exits to Shell
expected: Press q. TUI exits immediately and you're back at the shell prompt (not frozen).
result: pass

### 3. Progress Bars Right-Aligned
expected: In Roadmap tab, phase progress bars are right-aligned. Format shows "2/2" not "2/2 plans".
result: pass

### 4. Icon Labels Visible
expected: Press l on a phase to expand. Indicator icons have text labels (e.g., "📝 Plan", "📋 Context").
result: issue
reported: "pressing it twice (or right arrow) switches to the second tab. for phases that are not started there are no indicators. seems like we'd want placeholders.. maybe empty squares where the icons will go.. and the text should be faded, but when the indicator is met, the icon will be brighter."
severity: major

### 5. Checkboxes Aligned
expected: In Phase tab, all success criteria checkboxes are consistently aligned (no extra leading space on items 3-4).
result: issue
reported: "no, criteria 3 and 4 have a leading space making them look indented."
severity: cosmetic

### 6. --only Mode Fills Terminal
expected: Run `bun start --only roadmap`. The view fills the terminal pane height (not just content-sized).
result: issue
reported: "no, it's only content-sized"
severity: cosmetic

## Summary

total: 6
passed: 3
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Indicator icons have text labels and expand on l key press"
  status: failed
  reason: "User reported: pressing it twice (or right arrow) switches to the second tab. for phases that are not started there are no indicators. seems like we'd want placeholders.. maybe empty squares where the icons will go.. and the text should be faded, but when the indicator is met, the icon will be brighter."
  severity: major
  test: 4
  root_cause: "First 'l' expands phase, but second 'l' on expanded phase triggers onSelectPhase which switches to Phase tab. Also, getIndicatorIcons returns empty string when all flags are false."
  artifacts:
    - path: "src/components/roadmap/RoadmapView.tsx"
      issue: "onSelect callback logic triggers tab switch on expanded phases"
    - path: "src/lib/icons.ts"
      issue: "getIndicatorIcons returns empty string for phases with no active indicators"
  missing:
    - "Separate expand/collapse from navigation: l toggles expansion, Enter navigates"
    - "Add placeholder indicators showing faded/empty icons when flags are false"
  debug_session: ".planning/debug/roadmap-l-key-expands-phase.md"

- truth: "Success criteria checkboxes are consistently aligned"
  status: failed
  reason: "User reported: no, criteria 3 and 4 have a leading space making them look indented."
  severity: cosmetic
  test: 5
  root_cause: "Ink's Box with multiple Text children has inconsistent spacing when text wraps. Items that wrap lose the space after the period, creating visual inconsistency."
  artifacts:
    - path: "src/components/phase/CriteriaList.tsx"
      issue: "Multiple Text components rely on Ink Box positioning which fails on wrap"
  missing:
    - "Combine all parts into single Text component for consistent spacing"
  debug_session: ""

- truth: "--only mode fills the terminal pane height"
  status: failed
  reason: "User reported: no, it's only content-sized"
  severity: cosmetic
  test: 6
  root_cause: "View components (RoadmapView, PhaseView, TodosView) are missing flexGrow={1} on their root Box. TabLayout has it but flexbox grow doesn't propagate to children in Ink."
  artifacts:
    - path: "src/components/roadmap/RoadmapView.tsx"
      issue: "Root Box at line 94 needs flexGrow={1}"
    - path: "src/components/phase/PhaseView.tsx"
      issue: "Root Box at line 98 needs flexGrow={1}"
    - path: "src/components/todos/TodosView.tsx"
      issue: "Root Box at line 61 needs flexGrow={1}"
  missing:
    - "Add flexGrow={1} to root Box in all three view components"
  debug_session: ".planning/debug/only-mode-height.md"
