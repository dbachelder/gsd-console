---
created: 2026-01-24T18:06
title: Pin help bar to bottom and improve styling
area: ui
files:
  - src/components/layout/Footer.tsx
---

## Problem

The help/footer bar floats at the bottom of content rather than being pinned to the bottom of the terminal screen. With fullscreen mode now enabled, the footer should anchor to the absolute bottom of the terminal viewport regardless of content height.

Additionally, the footer styling could be improved for better visual hierarchy and readability.

## Solution

- Use flexbox layout to push footer to bottom (marginTop: 'auto' or flex container with flexGrow on content area)
- Review footer styling: consider border, background contrast, or spacing improvements
- Test with varying content heights to ensure footer stays anchored



