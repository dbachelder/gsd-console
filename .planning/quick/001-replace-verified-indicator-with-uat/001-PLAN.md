---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/types.ts
  - src/lib/icons.ts
  - src/lib/parser.ts
autonomous: true
---

<objective>
Replace "verified" indicator with "UAT" indicator.

The current indicator shows automated verification status (VERIFICATION.md exists with status: passed).
This is less interesting than UAT completion - user wants to see which phases have passed UAT.

UAT completion is tracked in `.planning/phases/XX-*/XX-UAT.md` files with a `status: passed` frontmatter.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Update types, icons, and parser</name>
  <files>src/lib/types.ts, src/lib/icons.ts, src/lib/parser.ts</files>
  <action>
1. **Update `src/lib/types.ts`:**
   - Change `isVerified: boolean` to `uatComplete: boolean` in PhaseIndicators interface
   - Update comment to explain: "UAT.md exists with status: passed"

2. **Update `src/lib/icons.ts`:**
   - Rename `isVerified` icon to `uatComplete`
   - Change icon from ✅ (verification check) to 🧪 (test tube - represents UAT)
   - Update `getIndicatorIcons()` function:
     - Change `isVerified` key to `uatComplete`
     - Change label from "Verified" to "UAT"

3. **Update `src/lib/parser.ts`:**
   - Change all `isVerified` references to `uatComplete`
   - Change detection logic:
     - Look for `*-UAT.md` or `uat.md` files instead of `*verification*.md`
     - Still check for `status: passed` in frontmatter
  </action>
  <verify>
    - `bun run typecheck` passes
    - `bun run lint` passes
  </verify>
  <done>Indicator renamed from "verified" to "UAT" with appropriate detection logic</done>
</task>

</tasks>

<success_criteria>
- [ ] PhaseIndicators uses `uatComplete` instead of `isVerified`
- [ ] Icon changed to test tube emoji (🧪)
- [ ] Label shows "UAT" not "Verified"
- [ ] Parser detects UAT.md files with status: passed
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
</success_criteria>

<output>
After completion, create `.planning/quick/001-replace-verified-indicator-with-uat/001-SUMMARY.md`
</output>
