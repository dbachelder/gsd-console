---
created: 2026-01-24T20:16
title: Remove detail toggle from roadmap
area: ui
files:
  - src/views/RoadmapView.tsx
  - src/hooks/useVimNav.ts
---

## Problem

The 'd' key is currently bound to toggling detail levels on the roadmap, but we need to repurpose it for the '/gsd-discuss-phase' command. The detail toggle functionality should be removed from the roadmap view.

## Solution

Remove the detail toggle (d key) from RoadmapView and useVimNav hooks. The 'd' keybinding will be used for /gsd-discuss-phase command instead. Consider whether detail viewing is still needed through a different mechanism or if it can be removed entirely.