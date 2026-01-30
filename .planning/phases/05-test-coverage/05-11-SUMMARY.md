---
phase: 05-test-coverage
plan: 11
subsystem: testing
tags: [react-hooks, test-cleanup, fake-timers, bun-test-runner, test-flakiness]

# Dependency graph
requires:
  - phase: 05-06
    provides: useChangeHighlight tests with timer mocking
provides:
  - useChangeHighlight tests without setState-during-render warnings
  - Proper timer cleanup to prevent test runner hanging
  - Full test suite execution (246 tests run successfully)
affects: [05-12, 05-13, 05-14, 05-15, 05-16, 05-17, 05-18]

# Tech tracking
tech-stack:
  added: []
  patterns: [test cleanup with afterEach, avoiding React state updates during render, rerender pattern for state capture]

key-files:
  created: []
  modified: [test/hooks/useChangeHighlight.test.tsx]

key-decisions:
  - "Use rerender() after timer advances to capture updated state without calling functions during render"
  - "Restore real timers in afterEach hook to prevent test runner from hanging"

patterns-established:
  - "Pattern: Move state-changing calls outside render body, capture functions, then call after render"
  - "Pattern: Use rerender() to trigger state updates before capturing test assertions"
  - "Pattern: Always cleanup vi.useFakeTimers() with afterEach(() => vi.useRealTimers())"

# Metrics
duration: 10 min
completed: 2026-01-25
---

# Phase 5 Plan 11: Fix useChangeHighlight React Warnings Summary

**Eliminated React setState warnings and Bun test runner hanging by moving markChanged() calls outside render body and adding proper timer cleanup**

## Performance

- **Duration:** 10 min
- **Started:** 2026-01-25T17:23:30Z
- **Completed:** 2026-01-25T17:33:34Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Fixed useChangeHighlight tests to avoid calling markChanged() during component render
  - Moved markChanged() calls outside TestComponent render body
  - Used closure variables to capture markChanged reference
  - Added rerender() after timer advances to capture updated state
- Added proper timer cleanup to prevent test runner hanging
  - Added afterEach hook with vi.useRealTimers()
  - Restores real timers after each test completes
- Full test suite now runs successfully
  - 246 tests across 26 files complete in 3.86 seconds
  - No test runner hanging issues

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix useChangeHighlight tests to avoid setState during render** - `3ab9a3c` (fix)
2. **Task 2: Verify full test suite runs without hanging** - `c78375b` (fix)

## Files Created/Modified

- `test/hooks/useChangeHighlight.test.tsx` - Fixed useChangeHighlight tests
  - Moved markChanged() calls outside render body (tests "isFading returns true..." and "item removed after hold...")
  - Added rerender() after timer advances to capture updated state
  - Added afterEach hook to restore real timers and prevent hanging
  - Imported afterEach from bun:test for cleanup

## Deviations from Plan

None - plan executed exactly as specified.

## Issues Encountered

**Issue 1: Capturing stale state after moving markChanged() outside render**
- **Problem:** After calling markChanged() outside render, subsequent state checks returned stale data from initial render
- **Root cause:** Component doesn't automatically re-render when state changes occur outside of render
- **Solution:** Used rerender() from ink-testing-library to force re-render after timer advances, capturing updated state for assertions
- **Verification:** All 6 useChangeHighlight tests pass with this pattern

**Issue 2: Test runner hanging when running full suite**
- **Problem:** Bun test runner v1.3.6 hung indefinitely when running full test suite after fix
- **Root cause:** vi.useFakeTimers() was never cleaned up with vi.useRealTimers(), causing subsequent tests to hang
- **Solution:** Added afterEach(() => vi.useRealTimers()) to restore real timers after each test
- **Verification:** Full test suite (246 tests) now completes in 3.86 seconds without hanging

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full test suite can now run to completion without hanging
- React setState-during-render warnings eliminated from useChangeHighlight tests
- Test runner properly cleans up fake timers between test files
- Ready for 05-12: Fix 5 failing parser tests

---

*Phase: 05-test-coverage*
*Completed: 2026-01-25*
