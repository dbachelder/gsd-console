---
phase: 04-opencode-integration
plan: 01
subsystem: integration
tags: [opencode, sdk, react-hooks, typescript]

# Dependency graph
requires:
  - phase: 03.1-ui-polish
    provides: Complete TUI with command palette
provides:
  - OpenCode SDK client factory (createClient)
  - Server detection utility (detectServer)
  - React connection hook (useOpencodeConnection)
  - OpencodeConnectionState type
affects: [04-02, 04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: ["@opencode-ai/sdk@1.1.35"]
  patterns: ["SDK client factory", "async server detection", "connection state hook"]

key-files:
  created:
    - src/hooks/useOpencodeConnection.ts
  modified:
    - package.json
    - bun.lock
    - src/lib/opencode.ts
    - src/lib/types.ts

key-decisions:
  - "Use session.list() for server detection (SDK has no health endpoint)"
  - "Connection hook checks on mount with manual recheck option"
  - "Client is null when disconnected (not undefined)"

patterns-established:
  - "SDK client factory pattern: createClient(baseUrl?) returns configured instance"
  - "Server detection pattern: try API call, catch all errors, return boolean"
  - "Connection hook pattern: state + client + checkConnection() triplet"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 04 Plan 01: SDK Setup Summary

**OpenCode SDK installed with typed client factory, server detection, and React connection hook for integration foundation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T08:05:56Z
- **Completed:** 2026-01-25T08:08:25Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Installed @opencode-ai/sdk@1.1.35 for type-safe OpenCode API access
- Created createClient() factory with configurable baseUrl
- Added detectServer() async function using session.list() for availability check
- Built useOpencodeConnection hook with automatic detection and manual recheck

## Task Commits

Each task was committed atomically:

1. **Task 1: Install OpenCode SDK** - `7e986d5` (chore)
2. **Task 2: Create OpenCode client wrapper** - `3eb6daf` (feat)
3. **Task 3: Add types and create connection hook** - `7d29407` (feat)

## Files Created/Modified

- `package.json` - Added @opencode-ai/sdk dependency
- `bun.lock` - Lock file updated
- `src/lib/opencode.ts` - SDK client factory, server detection, spawn helper
- `src/lib/types.ts` - Added OpencodeConnectionState interface
- `src/hooks/useOpencodeConnection.ts` - Connection management hook

## Decisions Made

1. **Used session.list() for detection** - SDK lacks a health endpoint; session.list() is lightweight and confirms server is responding
2. **Client as null when disconnected** - Explicit null (not undefined) for clearer "not connected" semantics
3. **Preserved spawnOpencodeSession** - Terminal handoff function retained for fallback/direct CLI usage

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SDK API differs from research docs**
- **Found during:** Task 2 (Create client wrapper)
- **Issue:** Research showed `client.global.health()` but SDK has no health method on Global class
- **Fix:** Changed to `client.session.list()` for server detection - returns error if server unavailable
- **Files modified:** src/lib/opencode.ts
- **Verification:** TypeScript compiles, detectServer returns boolean correctly
- **Committed in:** 3eb6daf (Task 2 commit)

**2. [Rule 3 - Blocking] SDK client config has no timeout option**
- **Found during:** Task 2 (Create client wrapper)
- **Issue:** Research showed timeout option but SDK Config type doesn't include it
- **Fix:** Removed timeout from createOpencodeClient() call
- **Files modified:** src/lib/opencode.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 3eb6daf (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking - SDK API differences)
**Impact on plan:** Minor adaptation to actual SDK API. No scope creep. Detection still works reliably.

## Issues Encountered

- Pre-existing test failures in parser.test.ts (unrelated to this plan) - tests failing before and after changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SDK client infrastructure ready for Plan 02 (command integration)
- Connection hook can be used in App.tsx to track OpenCode availability
- detectServer() available for conditional behavior based on server status

---
*Phase: 04-opencode-integration*
*Completed: 2026-01-25*
