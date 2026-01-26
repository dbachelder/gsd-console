---
status: diagnosed
trigger: "Investigate why editing one phase in ROADMAP.md highlights ALL phases instead of just the changed one."
created: 2026-01-24T00:00:00Z
updated: 2026-01-24T00:00:15Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - deriveAffectedItemIds intentionally marks ALL phases when ROADMAP.md changes
test: examined deriveAffectedItemIds function in src/app.tsx
expecting: root cause confirmed
next_action: document root cause and suggest fix

## Symptoms

expected: Only the specific changed phase should highlight when editing that phase's title in ROADMAP.md
actual: All phases turn yellow when editing any single phase title in ROADMAP.md
errors: none
reproduction: Edit one phase title in ROADMAP.md, observe all phases highlight
started: User report - appears to be consistent behavior

## Eliminated

## Evidence

- timestamp: 2026-01-24T00:00:00Z
  checked: src/app.tsx lines 26-52 (deriveAffectedItemIds function)
  found: Lines 30-35 explicitly mark ALL phases when ROADMAP.md changes - "if (file.includes('ROADMAP.md')) { for (const p of data.phases) { ids.push(`phase-${p.number}`); } }"
  implication: This is intentional behavior, not a bug - function assumes any change to ROADMAP.md affects all phases

- timestamp: 2026-01-24T00:00:01Z
  checked: src/hooks/useChangeHighlight.ts
  found: Hook is working correctly - it highlights whatever item IDs are passed to markChanged()
  implication: The problem is upstream in deriveAffectedItemIds, not in the highlight mechanism itself

- timestamp: 2026-01-24T00:00:02Z
  checked: src/app.tsx lines 75-82
  found: useEffect calls deriveAffectedItemIds(changedFiles, data) and marks whatever IDs are returned
  implication: All phases are marked because deriveAffectedItemIds returns all phase IDs for any ROADMAP.md change

## Resolution

root_cause: |
  In src/app.tsx lines 30-35, the deriveAffectedItemIds function intentionally marks ALL phases
  as changed whenever ROADMAP.md is modified. The code explicitly loops through all phases:

  ```typescript
  if (file.includes('ROADMAP.md')) {
    for (const p of data.phases) {
      ids.push(`phase-${p.number}`);
    }
  }
  ```

  This was likely implemented as a simple heuristic: "any change to ROADMAP.md could affect any phase,
  so highlight them all." However, in practice, users typically edit one phase at a time (e.g., updating
  a phase title, adding success criteria, etc.), and want to see which specific phase was modified.

fix: |
  The file watcher only provides the filename that changed (ROADMAP.md), not the specific line numbers
  or content changes. To highlight only the changed phase, we would need to:

  **Option 1: Content diffing (recommended)**
  - When ROADMAP.md changes, read the file and parse phase titles/content
  - Compare with previous version (cached in memory or re-parsed)
  - Identify which phase section(s) actually changed
  - Mark only those phase IDs

  **Option 2: Accept current behavior**
  - Document that ROADMAP.md changes highlight all phases
  - This is conservative but simple - ensures user notices all potentially affected phases

  **Implementation sketch for Option 1:**
  - Add a ref to cache previous ROADMAP.md content
  - On ROADMAP.md change, diff old vs new to find changed sections
  - Parse changed sections to extract phase numbers
  - Mark only those phase IDs

verification: Not applicable (diagnosis-only mode)
files_changed: []
