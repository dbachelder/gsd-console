---
status: diagnosing
trigger: "When commands are queued, press 'w' anywhere to open Work Queue tab and view the queue"
created: 2025-01-26T00:00:00.000Z
updated: 2025-01-26T00:01:00.000Z
---

## Current Focus

hypothesis: 'w' handler updates App's activeTab state, but TabLayout uses useTabNav's activeTab for rendering
test: Compare activeTab sources in App.tsx and TabLayout.tsx
expecting: Find that TabLayout's rendering is controlled by useTabNav, not App's state
next_action: Verify root cause and prepare diagnosis

## Symptoms

expected: Pressing 'w' should open Work Queue tab (tab 4)
actual: Pressing '5' opens Work Queue tab, pressing 'w' does nothing
errors: None
reproduction: Start the TUI, press 'w' key, observe no tab change
started: Phase 7 integration (new feature)

## Eliminated

- timestamp: 2025-01-26T00:00:18.000Z
  hypothesis: useTabNav is intercepting 'w' key
  evidence: useTabNav only handles Tab, Shift+Tab, and number keys 1-9
  implication: useTabNav is NOT the cause

- timestamp: 2025-01-26T00:00:30.000Z
  hypothesis: 'w' key handler is not being called at all
  evidence: Handler code exists and is correctly registered
  implication: Handler IS being called, but affects wrong state

## Evidence

- timestamp: 2025-01-26T00:00:05.000Z
  checked: App.tsx lines 279-335
  found: 'w' key handler is correctly implemented at lines 309-332
  implication: Handler logic is correct, so issue is elsewhere

- timestamp: 2025-01-26T00:00:08.000Z
  checked: TabLayout.tsx line 71-75
  found: useTabNav hook is used with number key handling
  implication: useTabNav may be intercepting keys before App's handler

- timestamp: 2025-01-26T00:00:10.000Z
  checked: useTabNav.ts lines 94-99
  found: Number keys 1-9 handled by useTabNav jumpToTab
  implication: '5' works because useTabNav correctly handles number keys

- timestamp: 2025-01-26T00:00:15.000Z
  checked: All useInput hooks in codebase (useVimNav, RoadmapView, TodosView, BackgroundView, etc.)
  found: None handle 'w' key
  implication: No component is consuming 'w' before App's handler

- timestamp: 2025-01-26T00:00:30.000Z
  checked: App.tsx lines 125-126 (activeTab state)
  found: App has useState activeTab that is NOT used for tab rendering
  implication: App's activeTab is only used for Footer display, not content rendering

- timestamp: 2025-01-26T00:00:35.000Z
  checked: TabLayout.tsx lines 71-75, 175-225
  found: TabLayout renders views based on useTabNav's activeTab, not App's activeTab
  implication: Tab content is controlled by TabLayout's useTabNav, completely separate from App's state

- timestamp: 2025-01-26T00:00:40.000Z
  checked: App.tsx lines 309-332 ('w' handler)
  found: Handler calls setActiveTab which updates App's local state, not TabLayout's useTabNav
  implication: 'w' key updates the wrong state - it should update TabLayout's useTabNav, not App's activeTab

## Resolution

root_cause: 'w' key handler in App.tsx updates App's local activeTab state (line 125), but TabLayout renders views based on its own useTabNav activeTab (line 71). These are two separate state sources. When 'w' is pressed, it updates App's state (which only affects Footer display), but TabLayout's useTabNav state remains unchanged, so no tab switch occurs.

fix: App.tsx 'w' handler should use TabLayout's tab navigation mechanism instead of its own setActiveTab. Options: (1) Lift useTabNav to App level so 'w' can call it, (2) Pass setActiveTab callback from TabLayout to App so App can trigger tab changes, or (3) Use ref-based callback pattern.

verification:
files_changed: []
