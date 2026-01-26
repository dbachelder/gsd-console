---
created: 2026-01-26T10:18
title: Rename project to GSD Console
area: general
files:
  - package.json:package name
  - README.md:project title
  - CLAUDE.md:project overview
  - .planning/PROJECT.md:project name references
  - .planning/ROADMAP.md:project title
  - .planning/REQUIREMENTS.md:project value
  - .planning/STATE.md:project name
  - bin/gsd-tui:binary name
---

## Problem

Project is currently named "GSD Status TUI" throughout the codebase, documentation, and branding. User wants to rename it to "GSD Console" with the installed command being `gsdc` instead of the current name.

This requires updating:
- Package name and binary name (gsd-tui → gsdc)
- All references to "GSD Status TUI" → "GSD Console"
- Documentation titles and descriptions
- Project metadata

## Solution

Search and replace across the codebase:

1. Update package.json: name "gsd-tui" → "gsdc"
2. Update README.md title and description
3. Update CLAUDE.md project overview
4. Update all planning documents (.planning/*) with new name
5. Update PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md
6. Update any configuration files referencing the old name
7. Update bin/gsd-tui to bin/gsdc (or rename executable)

Consider using a global find/replace tool for consistency, but verify each file manually for context.
