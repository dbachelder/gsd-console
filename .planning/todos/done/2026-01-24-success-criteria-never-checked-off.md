---
created: 2026-01-24T21:46
title: Success criteria on phase tab never checked off
area: ui
files:
  - src/components/phase/PhaseView.tsx
  - src/lib/parser.ts
---

## Problem

The Phase tab displays success criteria from CONTEXT.md but they always appear unchecked, even when the phase is complete. The checkboxes don't reflect actual completion status.

Need to determine how success criteria completion is tracked (if at all) in GSD files and update the display logic accordingly.

## Solution

TBD - Need to investigate:
1. How GSD tracks success criteria completion (VERIFICATION.md? SUMMARY.md?)
2. Whether criteria have individual completion states or just phase-level completion
3. Update parser and PhaseView to reflect actual status
