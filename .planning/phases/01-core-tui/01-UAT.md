---
status: diagnosed
phase: 01-core-tui
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md]
started: 2026-01-25T00:10:00Z
updated: 2026-01-25T00:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. TUI Starts Without Errors
expected: Run `bun run dev` - TUI displays header, tab bar, and footer without errors
result: pass

### 2. Header Shows Project Info
expected: Header displays project name ("GSD Status TUI") and progress bar showing overall completion
result: issue
reported: "the project name is there but the progress bar shows 100% complete"
severity: major

### 3. Tab Switching with Tab Key
expected: Pressing Tab cycles through tabs (Roadmap → Phase → Todos → Roadmap). Active tab should be visually highlighted.
result: pass

### 4. Tab Switching with Number Keys
expected: Pressing 1, 2, or 3 jumps directly to that tab (1=Roadmap, 2=Phase, 3=Todos)
result: pass

### 5. Roadmap View Shows Phase List
expected: Roadmap tab shows all 4 phases with status icons, names, and mini progress bars showing plans complete
result: issue
reported: "yes, I'd like the progress bars to be right aligned, and remove the word 'plans'"
severity: cosmetic

### 6. Phase Expand/Collapse
expected: In Roadmap tab, pressing l or Enter on selected phase expands to show indicator icons. Pressing h collapses.
result: issue
reported: "pass, but I'd like the icons to have text to them, they're not clear enough on their own"
severity: cosmetic

### 7. Vim Navigation j/k
expected: Pressing j moves selection down, k moves selection up in any list view
result: pass

### 8. Vim Navigation gg/G
expected: Pressing gg (two g's quickly) jumps to first item. Pressing G (shift+g) jumps to last item.
result: pass

### 9. Phase View Shows Details
expected: Phase tab shows current phase with: Goal section, Success Criteria list, Requirements list
result: issue
reported: "pass, there are some [ ] characters that are missaligned, 3 and 4 have extra space in the beginning"
severity: cosmetic

### 10. Phase Navigation with [/]
expected: In Phase view, pressing [ goes to previous phase, ] goes to next phase
result: pass

### 11. Todos View Shows Items
expected: Todos tab shows todo items with checkbox indicators ([ ] or [x] for completed)
result: skipped
reason: no todos in project to test with

### 12. Filter Toggle in Todos
expected: Pressing f in Todos view toggles showing/hiding completed todos
result: pass

### 13. Detail Level Toggle
expected: Pressing d in any view toggles detail level (more/less information shown)
result: pass

### 14. Help Overlay
expected: Pressing ? shows full-screen help overlay with all keyboard shortcuts. Any key dismisses it.
result: pass

### 15. Quit with q
expected: Pressing q exits the TUI cleanly
result: issue
reported: "q makes the ui stop responding to commands, but doesn't drop me back to the shell"
severity: major

### 16. Footer Context-Sensitive Hints
expected: Footer shows different keybinding hints depending on active tab (e.g., "l: expand" in Roadmap, "[/]: switch phase" in Phase)
result: pass

### 17. --only Flag
expected: Running `bun start --only roadmap` shows only the roadmap view without tab bar
result: issue
reported: "it works, but does not fill the terminal pane.. so it looks bad"
severity: cosmetic

## Summary

total: 17
passed: 10
issues: 6
pending: 0
skipped: 1
skipped: 0

## Gaps

- truth: "Progress bar shows accurate overall completion percentage"
  status: failed
  reason: "User reported: the project name is there but the progress bar shows 100% complete"
  severity: major
  test: 2
  root_cause: "useGsdData.ts calculates progress as completedPlans/totalPlans, but phases 2-4 have 'TBD' for plan count which parses to 0. So totalPlans=2 (phase 1 only), completedPlans=2, progress=100%. Should calculate based on phases or handle TBD plans."
  artifacts:
    - path: "src/hooks/useGsdData.ts"
      issue: "Progress calculation counts only phases with defined plans"
  missing:
    - "Calculate progress as phases complete / total phases, or count TBD phases as having 1 plan"
  debug_session: ""

- truth: "Phase list progress bars are right-aligned and concise"
  status: failed
  reason: "User reported: yes, I'd like the progress bars to be right aligned, and remove the word 'plans'"
  severity: cosmetic
  test: 5
  root_cause: "PhaseRow.tsx renders progress bar and count inline without flexbox justification. Need to use justifyContent='space-between' to push progress to the right."
  artifacts:
    - path: "src/components/roadmap/PhaseRow.tsx"
      issue: "Progress bar and count not right-aligned, includes 'plans' text"
  missing:
    - "Use flexbox justifyContent='space-between' to right-align progress"
    - "Change '{n}/{m} plans' to '{n}/{m}' format"
  debug_session: ""

- truth: "Phase indicator icons have text labels for clarity"
  status: failed
  reason: "User reported: pass, but I'd like the icons to have text to them, they're not clear enough on their own"
  severity: cosmetic
  test: 6
  root_cause: "getIndicatorIcons() in icons.ts returns only emoji characters. PhaseRow.tsx expanded view displays just the icons without labels."
  artifacts:
    - path: "src/lib/icons.ts"
      issue: "getIndicatorIcons returns only emoji, no labels"
    - path: "src/components/roadmap/PhaseRow.tsx"
      issue: "Expanded view shows raw icon string without labels"
  missing:
    - "Add text labels next to each indicator icon (e.g., '📝 Plan' instead of just '📝')"
  debug_session: ""

- truth: "Success criteria checkboxes are consistently aligned"
  status: failed
  reason: "User reported: pass, there are some [ ] characters that are missaligned, 3 and 4 have extra space in the beginning"
  severity: cosmetic
  test: 9
  root_cause: "ROADMAP.md success criteria for items 3 and 4 have leading whitespace that's not being trimmed by the parser. parseRoadmap regex captures whitespace in numbered list items."
  artifacts:
    - path: "src/lib/parser.ts"
      issue: "Success criteria regex doesn't trim leading whitespace from numbered items"
    - path: ".planning/ROADMAP.md"
      issue: "Items 3 and 4 may have inconsistent indentation"
  missing:
    - "Trim whitespace from criteria text after extraction"
  debug_session: ""

- truth: "Pressing q exits the TUI cleanly back to shell"
  status: failed
  reason: "User reported: q makes the ui stop responding to commands, but doesn't drop me back to the shell"
  severity: major
  test: 15
  root_cause: "app.tsx uses Ink's useApp().exit() which unmounts the React app but doesn't call process.exit(). The terminal is left in a hung state because the Bun process is still running."
  artifacts:
    - path: "src/app.tsx"
      issue: "exit() from useApp() doesn't terminate the Bun process"
  missing:
    - "Call process.exit(0) after exit() or use a different exit strategy"
  debug_session: ""

- truth: "--only mode fills the terminal pane properly"
  status: failed
  reason: "User reported: it works, but does not fill the terminal pane.. so it looks bad"
  severity: cosmetic
  test: 17
  root_cause: "TabLayout.tsx single view mode renders without height or flexGrow props. Ink Box defaults to content-sized, not filling available space."
  artifacts:
    - path: "src/components/layout/TabLayout.tsx"
      issue: "Single view Box doesn't set height or flexGrow to fill terminal"
  missing:
    - "Add flexGrow={1} or height='100%' to single view container"
  debug_session: ""
