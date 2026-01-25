---
status: resolved
trigger: "Investigate why the spinner in the GSD TUI header is always running instead of only showing during file refresh."
created: 2026-01-24T00:00:00Z
updated: 2026-01-24T00:12:00Z
---

## Current Focus

hypothesis: CONFIRMED - onError callback creates new function reference on every render, causing useEffect to re-run and clear timer before callback executes
test: Verified onError is inline arrow function in app.tsx (line 62)
expecting: This causes infinite re-render loop clearing the timer
next_action: Document root cause and fix

## Symptoms

expected: Spinner should only appear briefly when files change and data is reloading
actual: Spinner is always running
errors: None
reproduction: Run the TUI and observe header spinner
started: Unknown - user reports current behavior

## Eliminated

## Evidence

- timestamp: 2026-01-24T00:01:00Z
  checked: useFileWatcher.ts initialization
  found: isRefreshing is initialized to false (line 38)
  implication: State should start as false

- timestamp: 2026-01-24T00:01:30Z
  checked: useFileWatcher.ts state flow
  found: setIsRefreshing(true) called when fs.watch fires (line 71), setIsRefreshing(false) called after debounce timeout (line 86)
  implication: Requires file change event to trigger true state

- timestamp: 2026-01-24T00:02:00Z
  checked: Header.tsx rendering
  found: Spinner rendered when isRefreshing is true (line 34)
  implication: Correctly gated by isRefreshing prop

- timestamp: 2026-01-24T00:02:30Z
  checked: app.tsx prop passing
  found: isRefreshing passed from useFileWatcher to Header (line 137, 147)
  implication: No state transformation between hook and render

- timestamp: 2026-01-24T00:03:00Z
  checked: useFileWatcher state transitions
  found: isRefreshing starts as false (line 38), only set to true when fs.watch callback fires (line 71), only set to false after timeout (line 86)
  implication: On mount, isRefreshing is false. Should remain false until first file change.

- timestamp: 2026-01-24T00:03:30Z
  checked: Initial state on mount
  found: useState(false) means isRefreshing = false initially
  implication: Spinner should NOT show on initial render

- timestamp: 2026-01-24T00:04:00Z
  checked: Potential for initial file system events
  found: fs.watch can fire immediately for existing files in some environments
  implication: If .planning directory has files, watcher might fire on setup

- timestamp: 2026-01-24T00:05:00Z
  checked: useFileWatcher cleanup function
  found: cleanup() clears timerRef.current with clearTimeout (line 49), called on effect cleanup (line 106)
  implication: Timer is cleared when effect re-runs

- timestamp: 2026-01-24T00:06:00Z
  checked: useEffect dependencies
  found: useEffect depends on [path, debounceMs, onError, cleanup] (line 107)
  implication: Effect re-runs if any dependency changes

- timestamp: 2026-01-24T00:07:00Z
  checked: cleanup dependency
  found: cleanup is created with useCallback and has empty deps array (line 47-56)
  implication: cleanup function reference is stable, won't cause re-renders

- timestamp: 2026-01-24T00:08:00Z
  checked: onError callback in app.tsx
  found: onError is inline arrow function (err) => console.error('File watcher error:', err) on line 62
  implication: Creates new function reference on EVERY App component render

- timestamp: 2026-01-24T00:09:00Z
  checked: useEffect dependency array in useFileWatcher
  found: Dependencies are [path, debounceMs, onError, cleanup] (line 107)
  implication: Effect re-runs whenever onError changes (which is every render!)

- timestamp: 2026-01-24T00:10:00Z
  checked: Effect cleanup behavior
  found: Effect calls cleanup() on re-run (line 60), which clears timerRef (line 49)
  implication: Timer is cleared before setTimeout callback can execute

- timestamp: 2026-01-24T00:11:00Z
  checked: setIsRefreshing(false) location
  found: Only called inside setTimeout callback (line 86)
  implication: If timer is cleared before callback runs, isRefreshing never resets to false

## Resolution

root_cause: The onError callback passed to useFileWatcher is an inline arrow function created on every App component render (app.tsx:62). Since onError is in the useEffect dependency array (useFileWatcher.ts:107), the effect re-runs on every render. Each re-run calls cleanup() which clears the debounce timer before the setTimeout callback can execute. This prevents setIsRefreshing(false) from ever being called, leaving the spinner permanently on after the first file change.

fix: Wrap the onError callback in useCallback with an empty dependency array to create a stable function reference, or remove onError from the useEffect dependencies if it doesn't need to trigger re-runs.

verification: Not applied (diagnosis only mode)

files_changed:
  - src/app.tsx: onError callback needs useCallback wrapper
  - src/hooks/useFileWatcher.ts: Could alternatively remove onError from useEffect deps
