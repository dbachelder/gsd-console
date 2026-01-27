---
status: resolved
trigger: "roadmap-denominator-zero"
created: 2025-01-26T00:00:00.000Z
updated: 2025-01-26T00:00:00.000Z
---

## Current Focus

hypothesis: ROADMAP.md has inconsistent formatting for Plans lines, and parser regex doesn't match either format
test: Found that ROADMAP.md uses `**Plans**: N plans` (most lines) and `**Plans:** N plans` (line 165), but parser regex is `/\*\*Plans:\s*(\d+)\s*plans?/` which expects `**Plans:` (no closing asterisks before colon)
expecting: Updating regex to match both formats (`\*\*Plans\*\*:\s*(\d+)\s*plans?|\*\*Plans:\*\*\s*(\d+)\s*plans?`) will fix the issue
next_action: Fix the parser regex pattern to match both ROADMAP.md formats

## Symptoms

expected: Number of plans in phase
actual: Always shows 0
errors: No errors
reproduction: Run `bun run dev` and look at roadmap
timeline: Just started today

## Eliminated

## Evidence

- timestamp: 2025-01-26T00:00:00.000Z
  checked: Parser test output showing plansTotal always 0
  found: All phases show plansTotal=0 while plansComplete is correct (Phase 1: 0/4, Phase 2: 0/3, etc.)
  implication: The plansTotal extraction is failing in the parser

- timestamp: 2025-01-26T00:00:00.000Z
  checked: Parser regex pattern `/\*\*Plans:\s*(\d+)\s*plans?/`
  found: Regex returns null when tested against actual ROADMAP.md content
  implication: The pattern does not match the actual text format in ROADMAP.md

- timestamp: 2025-01-26T00:00:00.000Z
  checked: Raw bytes of ROADMAP.md line 35: `2a2a 506c 616e 732a 2a3a` = "**Plans**:"
  found: Actual format is "**Plans**: 4 plans" (two asterisks, Plans, two asterisks, colon, space, number)
  implication: Parser regex expects "**Plans:" (no closing asterisks before colon), causing all matches to fail

- timestamp: 2025-01-26T00:00:00.000Z
  checked: All Plans lines in ROADMAP.md
  found: Lines 35-149: "**Plans**: N plans" (7 phases), Line 165: "**Plans:** 3 plans" (Phase 7) - inconsistent formatting
  implication: Parser regex needs to match both formats to extract plan counts correctly

- timestamp: 2025-01-26T00:00:00.000Z
  checked: Updated parser with OR regex pattern
  found: All phases now have correct plansTotal values (Phase 1: 4/4, Phase 2: 3/3, Phase 3: 4/4, Phase 3.1: 5/5, Phase 4: 9/9, Phase 5: 18/18, Phase 6: 6/6, Phase 7: 3/3)
  implication: Fix successfully extracts plan counts from both ROADMAP.md formats

## Resolution

root_cause: Parser regex pattern `/\*\*Plans:\s*(\d+)\s*plans?/` does not match ROADMAP.md formats. ROADMAP.md uses "**Plans**: 4 plans" (colon after closing **) for most phases, and "**Plans:** 3 plans" (colon inside closing **) for Phase 7, but the regex expects "**Plans:" with no closing asterisks before the colon.
fix: Updated regex pattern in src/lib/parser.ts line 21 from `/\*\*Plans:\s*(\d+)\s*plans?/` to `/\*\*Plans\*\*:\s*(\d+)\s*plans?|\*\*Plans:\*\*\s*(\d+)\s*plans?/` and updated line 68 to check both capture groups: `parseInt((plansMatch[1] ?? plansMatch[2]) ?? '0', 10)`
verification:
  1. Parser test confirms all 8 phases now have correct plansTotal values (Phase 1: 4/4, Phase 2: 3/3, Phase 3: 4/4, Phase 3.1: 5/5, Phase 4: 9/9, Phase 5: 18/18, Phase 6: 6/6, Phase 7: 3/3)
  2. All 27 existing parser tests pass (0 failures)
  3. Parser coverage remains at 98.23% (no regression)
files_changed: ["src/lib/parser.ts"]
