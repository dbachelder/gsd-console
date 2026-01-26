---
created: 2026-01-25T21:49
title: Remove duplicate keybinding hints from footer
area: ui
files:
  - src/components/Footer.tsx
  - src/components/PhaseView.tsx
---

## Problem

Footer on phase tab displays some items multiple times, like `[` and `]` shortcuts, making it cluttered and confusing.

## Solution

Deduplicate keybinding hints in footer so each shortcut appears only once.
