---
phase: quick
plan: 003
type: execute
wave: 1
depends_on: []
files_modified: [src/components/roadmap/RoadmapView.tsx, src/components/roadmap/PhaseRow.tsx]
autonomous: true
user_setup: []

must_haves:
  truths:
    - "All phase titles start and end at same vertical positions"
    - "Phase names with different lengths are properly aligned"
    - "Alignment is calculated dynamically from phase data"
  artifacts:
    - path: "src/components/roadmap/RoadmapView.tsx"
      provides: "Max phase title width calculation and prop passing"
    - path: "src/components/roadmap/PhaseRow.tsx"
      provides: "Phase title padding to max width"
  key_links:
    - from: "RoadmapView.tsx"
      to: "PhaseRow.tsx"
      via: "phaseTitleWidth prop"
      pattern: "phaseTitleWidth=\\{phaseTitleWidth\\}"
---

<objective>
Calculate max phase title width across all phases and pad phase titles to align vertically.

Purpose: Ensure phase titles of different lengths ("Phase 1: Core TUI" vs "Phase 3.1: UI polish") start and end at the same vertical positions for visual alignment.

Output: Phase titles aligned to maximum width, dynamic calculation from phase data
</objective>

<execution_context>
@~/.config/opencode/get-shit-done/workflows/execute-plan.md
@~/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Existing patterns in PhaseRow and RoadmapView:
- RoadmapView calculates fractionWidth for progress fraction alignment (lines 41-44)
- PhaseRow uses padStart to right-align fractions (line 73)
- PhaseRow renders "Phase {phase.number}: {phase.name}" without padding (lines 62-64)
- Follow same pattern: calculate max width in parent, pad in child

# Current issue from planning_context:
- Phase titles vary in length: "Phase 1: Core TUI" (23 chars) to "Phase 3.1: UI polish (INSERTED)" (36 chars)
- No current padding causes titles to end at different positions
- Solution: calculate max "Phase {number}: {name}" width and pad all titles to that width
</context>

<tasks>

<task type="auto">
  <name>Task 1: Calculate and pass max phase title width</name>
  <files>src/components/roadmap/RoadmapView.tsx</files>
  <action>
Add phaseTitleWidth calculation after fractionWidth (around line 44):

```typescript
// Calculate max phase title width for alignment
const phaseTitleWidth =
  phases.length > 0
    ? Math.max(...phases.map((p) => `Phase ${p.number}: ${p.name}`.length))
    : 0;
```

Pass phaseTitleWidth to PhaseRow in the map (around line 156):
Add `phaseTitleWidth={phaseTitleWidth}` to PhaseRow props
</action>
  <verify>
Read RoadmapView.tsx and verify:
1. phaseTitleWidth calculation exists (lines ~46-49)
2. phaseTitleWidth prop passed to PhaseRow component
</verify>
  <done>RoadmapView calculates max phase title width and passes it to PhaseRow</done>
</task>

<task type="auto">
  <name>Task 2: Pad phase titles to max width in PhaseRow</name>
  <files>src/components/roadmap/PhaseRow.tsx</files>
  <action>
Update PhaseRow interface (around line 11):
Add `phaseTitleWidth?: number;` to PhaseRowProps interface

Update function signature (around line 22):
Add `phaseTitleWidth,` to destructured props

Update phase name rendering (lines 62-64):
Replace:
```typescript
<Text bold={isSelected}>
  Phase {phase.number}: {phase.name}
</Text>
```
With:
```typescript
<Text bold={isSelected}>
  {`Phase ${phase.number}: ${phase.name}`.padEnd(phaseTitleWidth ?? 0, ' ')}
</Text>
```

Use padEnd (not padStart) because we want left-aligned titles that extend to the same right edge
</action>
  <verify>
Run `bun run dev` and observe:
1. All phase titles start at same position (left-aligned, already true)
2. All phase titles end at same position (new alignment)
3. "Phase 1: Core TUI" shows extra spacing to match longer titles
4. "Phase 3.1: UI polish (INSERTED)" has no extra spacing (is the longest)
</verify>
  <done>Phase titles aligned to maximum width, all ending at same vertical position</done>
</task>

</tasks>

<verification>
1. Visual verification: Run `bun run dev` and confirm all phase titles align vertically
2. Code verification: Check that phaseTitleWidth calculation matches fractionWidth pattern
3. Dynamic verification: Add a test phase with very long name, verify alignment still works
</verification>

<success_criteria>
- All phase titles start and end at same vertical positions
- PhaseTitleWidth calculated dynamically from actual phase data
- Code follows existing fractionWidth pattern in RoadmapView
- No hard-coded width values
</success_criteria>

<output>
After completion, create `.planning/quick/003-align-phase-titles/003-SUMMARY.md`
</output>
