---
status: diagnosed
trigger: "Investigate why pressing 'l' twice switches to the second tab instead of expanding a phase in the Roadmap view."
created: 2026-01-24T00:00:00Z
updated: 2026-01-24T00:00:00Z
---

## Current Focus

hypothesis: Both useTabNav and useVimNav are listening to 'l' key with isActive=true, causing input collision
test: Checked hook activation conditions in TabLayout and RoadmapView
expecting: Found isActive overlap
next_action: return diagnosis

## Symptoms

expected: Pressing 'l' should expand a phase to show indicator icons. For unstarted phases, placeholder indicators (empty squares with faded text) should be shown.
actual: Pressing 'l' twice switches to the second tab instead of expanding the selected phase. No indicators shown for unstarted phases.
errors: None
reproduction: Navigate to Roadmap view, press 'l' twice (or right arrow twice)
started: User reported issue

## Eliminated

## Evidence

- timestamp: 2026-01-24T00:05:00Z
  checked: RoadmapView.tsx useVimNav hook
  found: useVimNav listens to 'l' key and calls onSelect callback (line 138), which toggles phase expansion (line 68)
  implication: This handler should expand phases

- timestamp: 2026-01-24T00:06:00Z
  checked: TabLayout.tsx useTabNav hook activation
  found: useTabNav is active when `isActive && !isOnlyMode` (line 33). In TabLayout, isActive defaults to true (line 23)
  implication: useTabNav is listening for input in parallel with RoadmapView

- timestamp: 2026-01-24T00:07:00Z
  checked: useTabNav.ts input handler
  found: useTabNav does NOT listen to 'l' key, only Tab/Shift+Tab and number keys (lines 80-102)
  implication: Tab switching is not directly caused by 'l' key

- timestamp: 2026-01-24T00:08:00Z
  checked: Number key handling in useTabNav
  found: Any number key (1-9) jumps to that tab (lines 94-99). Key '2' switches to Phase tab
  implication: If 'l' is being interpreted as '2', that would switch tabs

- timestamp: 2026-01-24T00:09:00Z
  checked: RoadmapView onSelect callback behavior
  found: onSelect toggles expansion AND calls onSelectPhase if phase is already expanded (lines 68-73). onSelectPhase switches to phase tab (TabLayout line 48)
  implication: First 'l' expands, second 'l' on expanded phase switches to tab 2 (Phase view)

- timestamp: 2026-01-24T00:10:00Z
  checked: getIndicatorIcons function in icons.ts
  found: Returns empty string when all indicators are false (lines 76-90). Function only adds text for true indicators
  implication: Not-started phases with no indicators show nothing when expanded

## Resolution

root_cause: Double-'l' press is working as designed but confusing. First 'l' expands phase, second 'l' on expanded phase calls onSelectPhase which switches to Phase tab. For not-started phases, no indicators are shown because getIndicatorIcons returns empty string when all indicators are false.
fix: Two issues need addressing - (1) Second 'l' on expanded phase shouldn't switch tabs, only Enter should. (2) getIndicatorIcons should show placeholder indicators for false values.
verification:
files_changed: []
