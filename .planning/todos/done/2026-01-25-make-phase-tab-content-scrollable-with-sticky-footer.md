---
created: 2026-01-25T21:48
title: Make phase tab content scrollable with sticky footer
area: ui
files:
  - src/components/PhaseView.tsx
  - src/components/TabLayout.tsx
---

## Problem

Phase tab content pushes footer off the screen when it gets long instead of becoming scrollable.

## Solution

Make content area scrollable while keeping footer visible and stuck to bottom of screen.
