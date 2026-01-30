---
created: 2026-01-24T21:44
title: Add arrow key and fuzzy navigation to file picker
area: ui
files:
  - src/components/FilePicker.tsx
---

## Problem

The file picker overlay (used for 'e' edit command) only supports number key selection (1-9, 0). This breaks down when there are more than 10 files - numbers beyond 10 aren't accessible via single keypress.

Additionally, there's no way to navigate the list with arrow keys or filter with fuzzy search, which would be more natural for larger file lists.

## Solution

Two potential enhancements:
1. **Arrow key navigation** - Add j/k or up/down arrow support to move selection, Enter to confirm
2. **Fuzzy filtering** - Integrate fuzzy search (project already uses @nozbe/microfuzz) to filter the file list as user types

Could also consider both: arrow keys for navigation + typing to fuzzy filter (like fzf).
