# Phase 9: Name Change And Public Readiness - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename the project from "GSD Status TUI" to "GSD Console" and prepare it for public release. This includes rebranding, documentation, package publishing, and repository migration. New capabilities (website, multi-platform packaging, marketing) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### New name and branding
- **Project name:** GSD Console
- **Tagline:** "Terminal UI for GSD project status" (simple description)
- **Logo:** Text-based logo using ASCII art or styled text version of "GSD Console"
- **Color palette:** Terminal-native monochrome (white, gray, terminal green)

### Public readiness scope
- **Documentation:** Essentials only — README, installation guide, basic usage, contributing guide
- **Package publishing:** Bun only (no npm, no Homebrew)
- **Versioning:** Semantic versioning starting at v1.0.0 (major.minor.patch)
- **Website:** GitHub README only (no external website or landing page)

### Migration strategy
- **npm package name:** Rename to gsd-console (not published yet, no backwards compatibility concern)
- **Git repository:** Rename from gsd-tui to gsd-console with GitHub redirect for old links
- **Codebase rename:** Comprehensive — all occurrences of 'gsd-tui' changed to 'gsd-console' (files, directories, docs, comments)
- **Internal references:** Automated search and replace (find/replace across all files)

### Claude's Discretion
- ASCII art logo design for GSD Console
- Exact styling and formatting in README and documentation
- Search/replace tool selection (sed, ripgrep, custom script)

</decisions>

<specifics>
## Specific Ideas

- Not published yet, so no need to care about backwards compatibility with old package name
- Rename comprehensively - all occurrences, not just public-facing files
- Keep branding terminal-native to match the tool's aesthetic

</specifics>

<deferred>
## Deferred Ideas

- Multi-platform package publishing (npm, Homebrew) — future phase if demand exists
- External website or landing page — GitHub README sufficient for now
- Marketing materials or promotional channels — not in scope for public readiness

</deferred>

---

*Phase: 09-name-change-and-public-readiness*
*Context gathered: 2026-01-27*
