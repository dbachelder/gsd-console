# Phase 9: Name Change And Public Readiness - Research

**Researched:** 2026-01-27
**Domain:** npm package publishing, repository migration, codebase refactoring
**Confidence:** HIGH

## Summary

This phase involves renaming the project from "GSD Status TUI" to "GSD Console" and preparing it for public release. The research covers seven key areas: Bun package publishing to npm, GitHub repository renaming, comprehensive codebase rename tools, README best practices, CONTRIBUTING.md structure, license considerations, and semantic versioning.

The project already has an MIT license in place, which is the right choice for a JavaScript/TypeScript CLI tool. Bun has a native `bun publish` command that works seamlessly with npm registry. GitHub repository redirects are permanent (until overwritten by a new repo with the same name). For the codebase rename, `sd` (Rust-based find/replace) is the recommended tool due to its simpler syntax and cross-platform compatibility.

**Primary recommendation:** Use `bun publish` for npm publishing, `sd` for bulk find/replace, and follow the standard README structure with logo, badges, installation, usage, examples, and contributing sections.

## Standard Stack

The established tools for this domain:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| bun publish | 1.3.x | npm package publishing | Native Bun command, no npm required |
| sd | 1.0.0 | Find/replace across codebase | Simpler than sed, cross-platform |
| npm version | n/a | Semantic version bumping | Standard, creates git tags |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| rg (ripgrep) | 15.x | Search/verify text patterns | Verification after rename |
| fastmod | 0.4.x | Interactive bulk find/replace | When human review needed |
| gh | 2.x | GitHub CLI operations | Repository rename verification |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sd | sed + rg | More complex syntax, BSD/GNU differences |
| sd | fastmod | fastmod requires interactive mode for safety |
| sd | perl -pi | Works cross-platform but more verbose |

**Installation:**
```bash
# sd is available via cargo or homebrew
cargo install sd
# or
brew install sd
```

## Architecture Patterns

### Recommended Rename Workflow
```
1. Verify: Search for all occurrences of 'gsd-tui'
   rg 'gsd-tui' --files-with-matches

2. Replace: Use sd for bulk replacement
   sd 'gsd-tui' 'gsd-console' file1.ts file2.json ...

3. Verify: Confirm no occurrences remain
   rg 'gsd-tui'

4. Test: Run typecheck and tests
   bun run typecheck && bun test
```

### Package.json Structure for CLI Tool
```json
{
  "name": "gsd-console",
  "version": "1.0.0",
  "description": "Terminal UI for GSD project status",
  "license": "MIT",
  "type": "module",
  "bin": {
    "gsd-console": "./src/cli.tsx"
  },
  "files": [
    "src/**/*",
    "README.md",
    "LICENSE"
  ],
  "keywords": [
    "cli",
    "terminal",
    "tui",
    "gsd",
    "project-management"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/dnakov/gsd-console.git"
  },
  "author": "Dan Nakov",
  "engines": {
    "bun": ">=1.0.0"
  }
}
```

### README Structure for CLI Tool
```
1. ASCII art logo / project name
2. One-line description / tagline
3. Badges (npm version, license, build status)
4. Installation section
5. Quick start / usage examples
6. CLI options table
7. Keyboard shortcuts (for TUI)
8. Configuration
9. Development section
10. Contributing link
11. License
```

### Anti-Patterns to Avoid
- **Manual file-by-file renaming:** Error-prone, inconsistent
- **Using sed on macOS without checking BSD vs GNU syntax:** Different -i flag behavior
- **Renaming npm package before GitHub repo:** Causes 404s in README install instructions
- **Publishing before testing global install:** `bunx gsd-console` might fail unexpectedly

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Find/replace across files | Custom script | sd or rg + sed | Edge cases in regex, file encoding |
| Version bumping | Manual edit | npm version | Git tags, commit messages |
| Package publishing | Manual tarball | bun publish | Handles tarball, 2FA, registry config |
| README badges | Custom images | shields.io | Standard format, auto-updates |

**Key insight:** The rename is mechanical but must be thorough - use tools that can be verified rather than manual editing.

## Common Pitfalls

### Pitfall 1: BSD vs GNU sed Syntax
**What goes wrong:** sed -i 's/foo/bar/g' fails on macOS
**Why it happens:** BSD sed requires empty string argument: sed -i '' 's/foo/bar/g'
**How to avoid:** Use `sd` which has consistent syntax across platforms
**Warning signs:** "extra characters after command" error

### Pitfall 2: Incomplete Rename
**What goes wrong:** Some files still reference old name after rename
**Why it happens:** Binary files, lock files, or hidden directories skipped
**How to avoid:** Run `rg 'gsd-tui'` after rename to verify, include bun.lock
**Warning signs:** TypeScript errors, broken imports, test failures

### Pitfall 3: GitHub Redirect Conflicts
**What goes wrong:** Old links stop working
**Why it happens:** Created a new repo with the old name
**How to avoid:** Never reuse 'gsd-tui' as a repository name
**Warning signs:** 404 errors on old bookmarks

### Pitfall 4: npm Publish Without Dry Run
**What goes wrong:** Wrong files published, missing files, wrong version
**Why it happens:** Didn't verify package contents before publish
**How to avoid:** Always run `bun publish --dry-run` first
**Warning signs:** Package size unexpected, users report missing files

### Pitfall 5: Forgetting to Update Git Remote
**What goes wrong:** Local clone still pushes to old URL
**Why it happens:** GitHub redirects work but remote URL unchanged
**How to avoid:** Run `git remote set-url origin NEW_URL` after rename
**Warning signs:** Confusing output from git remote -v

### Pitfall 6: Publishing v1.0.0 Without Testing Install
**What goes wrong:** Global install fails, bunx doesn't work
**Why it happens:** Untested bin entry or missing files
**How to avoid:** Test `bun install -g .` locally before publish
**Warning signs:** "command not found" after install

## Code Examples

### Bulk Rename with sd
```bash
# Source: https://github.com/chmln/sd

# Find files containing the old name
rg 'gsd-tui' --files-with-matches > files_to_rename.txt

# Replace in all found files
cat files_to_rename.txt | xargs sd 'gsd-tui' 'gsd-console'

# Also replace in specific case variations
sd 'GSD TUI' 'GSD Console' README.md CLAUDE.md
sd 'GSD Status TUI' 'GSD Console' README.md CLAUDE.md
sd 'gsd_tui' 'gsd_console' **/*.ts  # if underscores used

# Verify no occurrences remain
rg 'gsd-tui'
```

### npm Version Bumping
```bash
# Source: https://docs.npmjs.com/cli/v7/commands/npm-version/

# For first public release
npm version 1.0.0 -m "Release v%s"

# This automatically:
# 1. Updates version in package.json
# 2. Creates git commit with message "Release v1.0.0"
# 3. Creates git tag v1.0.0

# Future releases
npm version patch -m "Bump to %s"  # 1.0.0 -> 1.0.1
npm version minor -m "Bump to %s"  # 1.0.1 -> 1.1.0
npm version major -m "Bump to %s"  # 1.1.0 -> 2.0.0
```

### Bun Publish
```bash
# Source: https://bun.com/docs/pm/cli/publish

# Dry run first - see what would be published
bun publish --dry-run

# Publish to npm registry
bun publish --access public

# With 2FA enabled, prompted for OTP
bun publish --access public --auth-type web

# In CI with NPM_CONFIG_TOKEN
NPM_CONFIG_TOKEN=$NPM_TOKEN bun publish --access public
```

### Update Git Remote After GitHub Rename
```bash
# Check current remote
git remote -v

# Update origin to new URL
git remote set-url origin https://github.com/dnakov/gsd-console.git

# Verify
git remote -v
```

### README Badges
```markdown
# Source: https://shields.io

[![npm version](https://img.shields.io/npm/v/gsd-console.svg)](https://www.npmjs.com/package/gsd-console)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm publish | bun publish | Bun 1.0 (2023) | Native Bun command, simpler workflow |
| sed for find/replace | sd | 2020+ | Cross-platform, simpler syntax |
| Manual changelog | conventional commits | 2019+ | Automated from commit history |
| npm login | NPM_CONFIG_TOKEN | 2020+ | Better for CI/CD automation |

**Deprecated/outdated:**
- `npm login` interactive mode in CI - use token instead
- Creating tarball manually - bun publish handles it
- BSD-specific sed scripts - use sd for portability

## Bun Package Publishing Details

### Required package.json Fields
| Field | Required | Purpose |
|-------|----------|---------|
| name | Yes | Package name on npm |
| version | Yes | Semantic version |
| license | Recommended | MIT for this project |
| bin | Yes for CLI | Maps command to entry file |
| files | Recommended | What gets published |
| type | Recommended | "module" for ESM |

### bun publish Options
| Flag | Purpose | Default |
|------|---------|---------|
| --dry-run | Preview without publishing | - |
| --access | public or restricted | public for unscoped |
| --tag | npm dist-tag | latest |
| --auth-type | 2FA method: web or legacy | web |
| --otp | One-time password for 2FA | - |
| --tolerate-republish | Exit 0 if version exists | false |

### Authentication
- Respects `.npmrc` and `bunfig.toml` for registry config
- Uses `NPM_CONFIG_TOKEN` environment variable for CI/CD
- Supports 2FA with web or legacy OTP methods

## GitHub Repository Rename

### Process
1. Go to repository Settings
2. Change "Repository name" field
3. Click "Rename"

### What Gets Redirected
- All web traffic to repository
- All `git clone`, `git fetch`, `git push` operations
- Issues, wikis, stars, followers

### What Does NOT Redirect
- GitHub Pages URLs (use custom domain to avoid)
- GitHub Actions workflow calls to the old name

### Redirect Duration
- Redirects are **permanent/indefinite**
- Only break if a new repo is created with the old name
- Only break if owner requests removal via GitHub support

### Post-Rename Tasks
1. Update local clone: `git remote set-url origin NEW_URL`
2. Update any hardcoded URLs in documentation
3. Update CI/CD configurations if they reference repo by name
4. Do NOT create a new repo named 'gsd-tui'

## README Best Practices

### Essential Sections for CLI Tool
1. **Logo/Name** - ASCII art or text logo
2. **One-liner** - What the tool does in one sentence
3. **Badges** - npm version, license, build status
4. **Installation** - Clear install commands
5. **Quick Start** - Minimal example to get started
6. **Usage/CLI Options** - Complete reference
7. **Keyboard Shortcuts** - For TUI applications
8. **Development** - How to contribute
9. **License** - Link to LICENSE file

### Best Practices
- Keep it scannable - use tables, code blocks, headings
- Lead with value - what does this solve?
- Include GIFs/screenshots for visual tools
- Provide copy-paste commands
- Link to detailed docs if needed

## CONTRIBUTING.md Best Practices

### Essential Sections
1. **Welcome** - Brief intro, thank contributors
2. **Ways to Contribute** - Issues, PRs, docs, testing
3. **Development Setup** - How to run locally
4. **Code Style** - Link to linting config (Biome)
5. **Testing** - How to run tests
6. **Pull Request Process** - What to include, review expectations
7. **Commit Messages** - Conventional commits format

### For TypeScript/Bun Project
```markdown
## Development Setup

```bash
# Clone the repo
git clone https://github.com/dnakov/gsd-console.git
cd gsd-console

# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Type check
bun run typecheck

# Lint
bun run lint
```

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting.
Run `bun run lint:fix` to auto-fix issues.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(scope): add new feature`
- `fix(scope): fix bug`
- `docs: update readme`
```

## License Considerations

### Current State
- Project already has MIT License
- Copyright: Dan Nakov, 2025

### MIT vs Apache 2.0 for CLI Tools
| Aspect | MIT | Apache 2.0 |
|--------|-----|------------|
| Simplicity | 3 paragraphs | Much longer |
| Patent protection | Implicit/none | Explicit grant |
| Modification notice | Not required | Required |
| Ecosystem fit | 53% of npm | More common in Java/Python |

### Recommendation
**Keep MIT License** - It's already in place, appropriate for npm ecosystem, and provides maximum adoption with minimal friction. The project doesn't have patent concerns that would require Apache 2.0's explicit patent grant.

## Semantic Versioning

### Version Format
`MAJOR.MINOR.PATCH` (e.g., 1.0.0)
- MAJOR: Breaking changes
- MINOR: New features, backwards compatible
- PATCH: Bug fixes, backwards compatible

### Starting Version
- v1.0.0 for initial public release (as decided in CONTEXT.md)
- Pre-1.0 (0.x.y) typically means API unstable

### Version Management Commands
```bash
# Set initial version
npm version 1.0.0 -m "Release v%s"

# Bump versions
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.1 -> 1.1.0
npm version major  # 1.1.0 -> 2.0.0

# Git integration (automatic)
# - Updates package.json
# - Creates commit with version message
# - Creates git tag (v1.0.0)
```

### Scripts for Release
```json
{
  "scripts": {
    "release:patch": "npm version patch -m 'Bump to %s' && git push && git push --tags",
    "release:minor": "npm version minor -m 'Bump to %s' && git push && git push --tags",
    "release:major": "npm version major -m 'Bump to %s' && git push && git push --tags"
  }
}
```

## Files Requiring Rename

Based on grep analysis, these files contain 'gsd-tui':

### Core Files
- package.json (name, bin)
- README.md (title, install commands, examples)
- CLAUDE.md (project description)
- src/cli.tsx (help text, usage examples)

### Planning/Debug Files
- .planning/phases/* (various references)
- .planning/debug/* (references in debug notes)
- bun.lock (will auto-update on install)

### Test Files
- test/hooks/*.test.tsx
- test/components/*.test.tsx

## Open Questions

Things that couldn't be fully resolved:

1. **npm Account Setup**
   - What we know: bun publish uses npm registry, needs auth token
   - What's unclear: Whether npm account already exists for this user
   - Recommendation: Verify npm account exists before publish phase

2. **GitHub Repository URL**
   - What we know: Current remote is not set (no origin in .git/config)
   - What's unclear: Exact GitHub username/org for repository
   - Recommendation: Confirm dnakov/gsd-console as target

3. **CI/CD for Publishing**
   - What we know: Can use NPM_CONFIG_TOKEN for automation
   - What's unclear: Whether GitHub Actions should be set up
   - Recommendation: Manual first release, automate later if needed

## Sources

### Primary (HIGH confidence)
- [Bun publish documentation](https://bun.com/docs/pm/cli/publish) - Package publishing details
- [GitHub docs: Renaming repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository) - Rename process
- [npm version documentation](https://docs.npmjs.com/cli/v7/commands/npm-version/) - Version bumping
- [sd GitHub repository](https://github.com/chmln/sd) - Find/replace tool

### Secondary (MEDIUM confidence)
- [GitHub community discussions on redirects](https://github.com/orgs/community/discussions/22669) - Redirect duration
- [ripgrep + sed patterns](https://dev.to/webduvet/efficiently-finding-and-replacing-text-in-multiple-files-using-ripgrep-and-sed-3anl) - Rename workflow
- [README best practices](https://github.com/jehna/readme-best-practices) - Documentation structure
- [MIT vs Apache 2.0 comparison](https://www.oreateai.com/blog/navigating-the-open-source-landscape-apache-license-20-vs-mit/778287bd46fe254068ed557a368a724f) - License selection

### Tertiary (LOW confidence)
- WebSearch results on CONTRIBUTING.md patterns - Various templates consulted

## Metadata

**Confidence breakdown:**
- Bun publishing: HIGH - Official documentation verified
- GitHub rename: HIGH - Official documentation verified
- Codebase rename tools: HIGH - Multiple sources, tool docs verified
- README structure: MEDIUM - Community best practices
- CONTRIBUTING.md: MEDIUM - Community patterns
- License: HIGH - Already in place, ecosystem standard
- Version management: HIGH - npm docs verified

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable domain)
