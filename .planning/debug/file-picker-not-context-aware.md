---
status: diagnosed
trigger: "on the roadmap screen the e key just brings up the roadmap file for editing regardless of the phase i'm on"
created: 2026-01-24T12:00:00Z
updated: 2026-01-24T12:00:01Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - getEditableFiles() has hardcoded logic that only returns ROADMAP.md for 'roadmap' tab
test: Traced code path from 'e' key to file determination
expecting: N/A - root cause found
next_action: Return diagnosis

## Symptoms

expected: When a phase is selected/expanded on the Roadmap tab, pressing 'e' should offer that phase's files (PLAN.md, CONTEXT.md, RESEARCH.md, etc.) via FilePicker
actual: Pressing 'e' on Roadmap view always opens ROADMAP.md regardless of which phase is selected
errors: none
reproduction: Go to Roadmap tab, select/expand a phase, press 'e' - it opens ROADMAP.md
started: unknown

## Eliminated

## Evidence

- timestamp: 2026-01-24T12:00:01Z
  checked: src/app.tsx - editorContext construction (lines 122-127)
  found: editorContext correctly includes selectedPhase from state
  implication: Context is being passed correctly to useExternalEditor

- timestamp: 2026-01-24T12:00:01Z
  checked: src/hooks/useExternalEditor.ts - getEditableFiles() function (lines 48-117)
  found: Case 'roadmap' (lines 52-56) IGNORES selectedPhase entirely - just returns ROADMAP.md
  implication: This is the root cause - the logic is hardcoded per-tab

- timestamp: 2026-01-24T12:00:01Z
  checked: src/hooks/useExternalEditor.ts - Case 'phase' (lines 58-99)
  found: Phase file logic exists but is only triggered when activeTab === 'phase'
  implication: The phase file discovery code exists, just not used for roadmap tab

- timestamp: 2026-01-24T12:00:01Z
  checked: src/components/roadmap/RoadmapView.tsx - selectedIndex tracking
  found: RoadmapView has local selectedIndex state but does NOT expose the selected phase number
  implication: Even if getEditableFiles checked selectedPhase, RoadmapView doesn't propagate selection up

## Resolution

root_cause: |
  Two issues combine to cause this bug:

  1. **getEditableFiles() ignores selectedPhase when activeTab is 'roadmap'**
     In src/hooks/useExternalEditor.ts lines 52-56:
     ```typescript
     case 'roadmap': {
       // Roadmap tab: ROADMAP.md
       const roadmapPath = join(planningDir, 'ROADMAP.md');
       return existsSync(roadmapPath) ? [roadmapPath] : [];
     }
     ```
     The selectedPhase is available in context but completely ignored.

  2. **RoadmapView doesn't propagate its selection to the parent**
     RoadmapView.tsx has a local `selectedIndex` from useVimNav, but this isn't
     lifted to App's `selectedPhaseNumber` state. The `onSelectPhase` callback
     is only called when Enter is pressed on an expanded phase (to navigate to
     Phase tab), not when navigating between phases with j/k.

fix:
verification:
files_changed: []
