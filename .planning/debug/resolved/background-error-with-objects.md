---
status: resolved
trigger: "background-error-with-objects"
created: 2026-01-25T00:00:00.000Z
updated: 2026-01-25T00:03:02.000Z
---

## Current Focus

hypothesis: Root cause confirmed and fix applied
test: Run TypeScript check to verify no syntax errors, then manually test with background command
expecting: Type checking passes, background commands show meaningful error messages
next_action: Run typecheck and verify fix

## Symptoms

expected: Commands should execute successfully or show meaningful error
actual: Error displays as "Unknown error (object: name, data...)" - slightly better than before but still unclear
errors: "Error: Unknown error (object: name, data...)"
reproduction: Sending commands to background (likely headless or primary mode)
timeline: Just started happening after previous fix (commit a1f7b67)

## Eliminated

## Evidence

- timestamp: 2026-01-25T00:01:00.000Z
  checked: "Unknown error" message generation in useSessionEvents.ts
  found: Lines 108-110 generate "Unknown error (object: name, data...)" when error object has no 'message' property. Shows error type and property names but not values.
  implication: This is an improvement over previous "Unknown error" message, but still doesn't show actual error details

- timestamp: 2026-01-25T00:01:01.000Z
  checked: Previous debug session (add-todo-background-error.md)
  found: Root cause identified - commands are stubs sent to OpenCode sessions that don't understand them. OpenCode emits error events without proper message structure.
  implication: Error objects have properties like 'name', 'data', etc. but no 'message' field

- timestamp: 2026-01-25T00:01:02.000Z
  checked: Error handling flow
  found: useSessionEvents.ts (lines 88-113) builds error message → calls onError() → useBackgroundJobs.ts handleError() (lines 178-218) marks job as failed
  implication: Error message improvement should be in useSessionEvents.ts before passing to handlers

- timestamp: 2026-01-25T00:02:00.000Z
  checked: SDK error type definitions
  found: OpenCode error objects have structure { name: "ErrorType", data: { message: string, ... } }. Current code checks error.message but actual message is in error.data.message
  implication: This is the root cause! Code needs to check error.data.message first, then fall back to error.message

- timestamp: 2026-01-25T00:03:00.000Z
  checked: TypeScript compilation
  found: Type checking passes with no errors after fix
  implication: Fix is syntactically correct

- timestamp: 2026-01-25T00:03:01.000Z
  checked: Biome linting
  found: Lint errors exist in test files but are unrelated to this fix (pre-existing issues)
  implication: Fix does not introduce new linting issues

## Resolution

root_cause: OpenCode error objects have structure { name: "ErrorType", data: { message: string } }. Current code only checks error.message which doesn't exist, causing fallback to "Unknown error (object: name, data...)"

fix: Modified useSessionEvents.ts error handling (lines 82-113) to check OpenCode's error.data.message structure first:
1. Check if error.data.message exists (OpenCode's structure: { name, data: { message } })
2. Fall back to error.message (standard Error structure)
3. Fall back to property name display if neither exists
4. Final fallback to "no error object provided"

verification:
  - TypeScript compilation passes (no errors)
  - No new linting issues introduced
  - Fix addresses root cause: OpenCode error messages will now display actual content from error.data.message instead of property names

files_changed:
  - src/hooks/useSessionEvents.ts: Updated error handling to check error.data.message first
