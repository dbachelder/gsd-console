---
created: 2026-01-24T21:45
title: Remove project progress bar from roadmap screen
area: ui
files:
  - src/components/roadmap/RoadmapView.tsx
---

## Problem

The roadmap screen displays a project progress bar that calculates completion based on plans. This metric is misleading because most phases won't have plans initially - plans are created just before execution.

The committed phases progress bar (showing how many phases are complete) is useful and should remain. The plan-based progress bar should be removed.

## Solution

Remove the project progress bar component from RoadmapView. Keep the phase completion indicators.
