---
status: diagnosed
trigger: "Diagnose root cause for Gap #2 in UAT - 'w' key works once then does nothing"
created: 2025-01-26T00:00:00.000Z
updated: 2025-01-26T00:00:03.000Z
---

## Current Focus
hypothesis: ROOT CAUSE CONFIRMED - 'w' key handler checks workQueue.queue.length > 0 BEFORE checking activeTab, so once any command is in queue, pressing 'w' only shows queue count, never adds more commands
test: Trace logic flow for first and second 'w' press
expecting: First press adds command and switches tab, second press shows queue count (no add)
next_action: Return diagnosis

## Symptoms
expected: In Roadmap or Phase tabs, pressing 'w' adds a plan-phase command for the selected phase to the queue, and this should work repeatedly for different phases
actual: 'w' key works for one phase, then subsequent presses do nothing (no response, no command added)
errors: None reported (silent failure)
reproduction:
  1. Navigate to Roadmap or Phase tab
  2. Select a phase
  3. Press 'w' - command added successfully
  4. Select a different phase or same phase
  5. Press 'w' - no response, no command added
started: Gap discovered during UAT after Phase 7 implementation added intelligent 'w' key handler

## Eliminated

## Evidence
- timestamp: 2025-01-26T00:00:01.000Z
  checked: App.tsx 'w' key handler (lines 309-332)
  found: Handler checks workQueue.queue.length > 0 FIRST, then checks activeTab === 'roadmap'/'phase'
  implication: After first 'w' press, queue.length is 1 and activeTab is 'workqueue', so first condition is true and only shows toast

- timestamp: 2025-01-26T00:00:01.000Z
  checked: useWorkQueue.ts implementation
  found: workQueue.add() correctly dispatches add action, hook implementation is fine
  implication: Issue is in the 'w' key handler logic in App.tsx, not in the queue mechanism

- timestamp: 2025-01-26T00:00:02.000Z
  checked: Logic flow trace
  found: First 'w' (roadmap): queue.length=0 → skip first condition → check roadmap → add command → setActiveTab('workqueue'). Second 'w' (workqueue): queue.length=1 → enter first condition → show toast "WorkQueue: 1 commands" → never reach roadmap/phase add branches
  implication: ROOT CAUSE: Condition order is wrong - checking queue.length before tab means once queue is non-empty, you can never add more commands

## Resolution
root_cause: The 'w' key handler in App.tsx (lines 309-332) has incorrect condition ordering. It checks `workQueue.queue.length > 0` BEFORE checking `activeTab === 'roadmap'` or `'phase'`. After the first 'w' press, the queue has 1 command and activeTab switches to 'workqueue'. On subsequent 'w' presses, the first condition (queue.length > 0) is true, so it only shows a toast about queue count and never reaches the code that adds new commands. This prevents adding multiple plan-phase commands to the queue.

fix: null
verification: null
files_changed: []
