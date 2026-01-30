---
status: diagnosed
trigger: "Investigate why the GSD TUI has display flicker during normal operation."
created: 2026-01-24T00:00:00Z
updated: 2026-01-24T00:10:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: useGsdData has changedFiles in dependency array causing infinite loop
test: Analyzing useEffect dependencies in useGsdData.ts
expecting: changedFiles array changes identity on every file watcher event, triggering reload
next_action: Verify root cause and document solution

## Symptoms

expected: TUI should display stably without flicker during normal operation
actual: Display flickers even without rapid file changes (user reports "there is already flicker without even doing that test")
errors: None reported
reproduction: Run TUI and observe - flicker occurs during normal operation
started: Unknown - present in current implementation

## Eliminated

## Evidence

- timestamp: 2026-01-24T00:05:00Z
  checked: useGsdData.ts lines 36-127
  found: useEffect has changedFiles in dependency array (line 127)
  implication: changedFiles is a new array instance on every render, even if empty

- timestamp: 2026-01-24T00:06:00Z
  checked: app.tsx lines 59-66
  found: useFileWatcher returns changedFiles as state (line 37 in useFileWatcher.ts)
  implication: Every file change creates new array via setChangedFiles, triggering useGsdData reload

- timestamp: 2026-01-24T00:07:00Z
  checked: Data flow chain
  found: useFileWatcher sets isRefreshing(true) → setChangedFiles(files) → triggers useGsdData reload → setData() → app re-renders → file watcher still active → cycle continues
  implication: Even without actual file changes, the file watcher may emit events (node fs.watch is noisy)

- timestamp: 2026-01-24T00:08:00Z
  checked: React dependency array behavior with arrays
  found: In JavaScript/React, arrays are compared by reference, not content. Even if changedFiles contains the same filenames, it's a new array instance each time setChangedFiles() is called
  implication: Every file change creates a new array reference, causing useGsdData's useEffect to re-run even though changedFiles is only used for metadata storage, not as a reload trigger

- timestamp: 2026-01-24T00:09:00Z
  checked: app.tsx lines 75-82 useEffect
  found: useEffect depends on both changedFiles AND data. When changedFiles changes → data reloads → data changes → useEffect could run again if React sees data as changed
  implication: Second potential loop source, though less severe since it's guarded by changedFiles.length > 0 and !data.loading

## Resolution

root_cause: |
  useGsdData has `changedFiles` in its dependency array (line 127), causing re-renders on every file change.

  The problem chain:
  1. useFileWatcher emits changedFiles (new array instance) when files change
  2. App.tsx passes changedFiles to useGsdData
  3. useGsdData has changedFiles in dependency array → re-runs effect
  4. Effect calls setData() → App re-renders
  5. App re-renders → new changedFiles array passed → effect re-runs again

  Additionally, app.tsx has a useEffect (lines 75-82) that depends on changedFiles AND data,
  creating a potential loop: changedFiles changes → data reloads → useEffect runs →
  data changes → useEffect runs again (because data is in deps).

  The changedFiles is only used for display purposes (storing in GsdData for reference),
  not for triggering reloads. The actual reload trigger is refreshTrigger (lastRefresh timestamp).

fix: |
  Remove changedFiles from the useEffect dependency array in useGsdData.ts line 127.

  Change:
    }, [planningDir, refreshTrigger, changedFiles]);

  To:
    }, [planningDir, refreshTrigger]);

  This allows changedFiles to be stored in the data object for reference purposes
  without triggering unnecessary reloads. The refreshTrigger (lastRefresh timestamp)
  is the proper reload trigger since it only changes when the debounced file watcher
  completes a batch of changes.

  Optional secondary fix: Consider removing 'data' from the app.tsx useEffect deps (line 82)
  and only depend on changedFiles and markChanged, or use a ref to track the previous
  changedFiles length to avoid potential re-runs when data updates.

verification:
files_changed: []
