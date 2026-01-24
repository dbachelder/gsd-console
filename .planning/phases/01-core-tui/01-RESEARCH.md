# Phase 1: Core TUI - Research

**Researched:** 2026-01-24
**Domain:** Terminal UI with Bun + Ink (React-like) + TypeScript
**Confidence:** HIGH

## Summary

This phase focuses on building a keyboard-navigable terminal interface for viewing GSD project status using the Bun runtime with Ink (React for CLIs) and TypeScript. The user has decided on specific technologies: Bun + Ink for runtime/UI, Biome for linting/formatting, Lefthook for git hooks, and Bun's built-in test runner.

Ink is the dominant terminal UI framework in the JavaScript ecosystem, used by Claude Code, Gemini CLI, GitHub Copilot CLI, Cloudflare Wrangler, and many others. It provides a React-like component model with Flexbox layouts via Yoga, making it ideal for developers familiar with React. The `@inkjs/ui` companion library provides pre-built components (Select, TextInput, ProgressBar, Spinner, etc.) that accelerate development.

**Primary recommendation:** Use `create-ink-app --typescript` as a scaffold, then customize with Biome, Lefthook, and Bun's test runner. Build tab navigation using `useFocus`/`useFocusManager` hooks, and implement Vim keybindings via the `useInput` hook.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bun | 1.x (latest) | Runtime, package manager, bundler, test runner | Fast all-in-one JS runtime with native TypeScript |
| ink | 5.x | React renderer for terminal UIs | Dominant TUI framework, used by Claude Code, Gemini CLI |
| react | 18.x | UI component model | Required peer dependency for Ink |
| @inkjs/ui | 2.x | Pre-built terminal UI components | Official companion to Ink with Select, Spinner, etc. |
| TypeScript | 5.x | Type system | Required for strict mode, better DX |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gray-matter | 4.0.3 | Parse YAML front matter from markdown | Parsing STATE.md, ROADMAP.md, etc. |
| chalk | 5.x | Terminal string styling | Ink uses chalk internally; available for custom styling |
| zustand | 5.x | Lightweight state management | If state complexity exceeds React useState |
| figures | 6.x | Unicode symbols for terminal | Cross-platform status indicators |

### Development Tools
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| @biomejs/biome | 2.x | Linting + formatting (replaces ESLint+Prettier) | 10-100x faster than ESLint, single config file |
| lefthook | 1.x | Git hooks manager | Fast (Go-based), parallel execution, single YAML config |
| @commitlint/cli | 19.x | Commit message validation | Enforces Conventional Commits format |
| @commitlint/config-conventional | 19.x | Conventional Commits ruleset | Standard ruleset for commitlint |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Ink | Bubble Tea (Go) | Better performance, but different language/ecosystem |
| Ink | Ratatui (Rust) | Better performance, but different language/ecosystem |
| Biome | ESLint + Prettier | More plugins available, but 10-100x slower |
| Lefthook | Husky | More popular, but slower (Node-based vs Go-based) |
| zustand | Redux | More features, but heavier for this use case |

**Installation:**
```bash
# Initialize project with Bun
bun init

# Core dependencies
bun add ink react @inkjs/ui gray-matter

# Dev dependencies
bun add -d typescript @types/react @types/node @biomejs/biome lefthook @commitlint/cli @commitlint/config-conventional
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app.tsx              # Main app entry point, renders root layout
  cli.tsx              # CLI argument parsing, renders App
  components/
    layout/
      TabLayout.tsx    # Tab container (Roadmap, Phase, Todos)
      Header.tsx       # App title, current view indicator
      Footer.tsx       # Keybinding hints
    roadmap/
      RoadmapView.tsx  # Roadmap tab content
      PhaseRow.tsx     # Single phase in roadmap list
      ProgressBar.tsx  # Phase completion indicator
    phase/
      PhaseView.tsx    # Phase detail tab content
      GoalSection.tsx  # Phase goal display
      CriteriaList.tsx # Success criteria list
    todos/
      TodosView.tsx    # Todos tab content
      TodoItem.tsx     # Single todo item
  hooks/
    useGsdData.ts      # Load and parse planning docs
    useVimNav.ts       # Vim keybinding handler (hjkl, gg, G, Ctrl+d/u)
    useTabNav.ts       # Tab/number key navigation between views
  lib/
    parser.ts          # Markdown/YAML parsing utilities
    types.ts           # TypeScript interfaces for GSD data
    icons.ts           # Emoji/Unicode status indicators
  state/
    store.ts           # Zustand store (if needed)
test/
  components/          # Component tests
  hooks/               # Hook tests
  lib/                 # Parser tests
```

### Pattern 1: useInput Hook for Keyboard Handling
**What:** Ink's `useInput` hook captures keyboard events including arrow keys, modifier keys, and character input.
**When to use:** All keyboard navigation and shortcuts.
**Example:**
```typescript
// Source: https://github.com/vadimdemedes/ink
import { useInput, useApp } from 'ink';

const VimNavigation = () => {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  useInput((input, key) => {
    // Quit
    if (input === 'q') exit();

    // Vim navigation
    if (input === 'j' || key.downArrow) setSelectedIndex(i => i + 1);
    if (input === 'k' || key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
    if (input === 'g' && key.shift) scrollToEnd(); // G
    if (input === 'g') scrollToStart(); // gg (needs double-tap detection)

    // Ctrl+d/u for half-page scroll
    if (key.ctrl && input === 'd') setScrollOffset(o => o + 10);
    if (key.ctrl && input === 'u') setScrollOffset(o => Math.max(0, o - 10));

    // Tab switching with number keys
    if (input === '1') setActiveTab('roadmap');
    if (input === '2') setActiveTab('phase');
    if (input === '3') setActiveTab('todos');
  });

  // ...
};
```

### Pattern 2: useFocus for Tab Navigation
**What:** Ink's focus management system handles Tab/Shift+Tab navigation between focusable components.
**When to use:** Navigation between major UI areas.
**Example:**
```typescript
// Source: https://github.com/vadimdemedes/ink
import { useFocus, useFocusManager } from 'ink';

const FocusablePanel = ({ id, children }) => {
  const { isFocused } = useFocus({ id });

  return (
    <Box borderStyle={isFocused ? 'bold' : 'single'}>
      {children}
    </Box>
  );
};

const App = () => {
  const { focusNext, focusPrevious, focus } = useFocusManager();

  useInput((input, key) => {
    if (key.tab && key.shift) focusPrevious();
    else if (key.tab) focusNext();

    // Direct focus by ID
    if (input === '1') focus('roadmap');
    if (input === '2') focus('phase');
    if (input === '3') focus('todos');
  });

  return (
    <Box>
      <FocusablePanel id="roadmap">...</FocusablePanel>
      <FocusablePanel id="phase">...</FocusablePanel>
      <FocusablePanel id="todos">...</FocusablePanel>
    </Box>
  );
};
```

### Pattern 3: Flexbox Layout with Box Component
**What:** Ink uses Yoga (Facebook's Flexbox engine) for terminal layouts.
**When to use:** All layout structure.
**Example:**
```typescript
// Source: https://github.com/vadimdemedes/ink
import { Box, Text } from 'ink';

const Layout = () => (
  <Box flexDirection="column" height="100%">
    {/* Header */}
    <Box paddingX={1} borderStyle="single">
      <Text bold>GSD Status</Text>
    </Box>

    {/* Main content - takes remaining space */}
    <Box flexGrow={1} flexDirection="row">
      <Box width="50%" borderStyle="single">
        <Text>Left panel</Text>
      </Box>
      <Box width="50%" borderStyle="single">
        <Text>Right panel</Text>
      </Box>
    </Box>

    {/* Footer */}
    <Box paddingX={1}>
      <Text dimColor>Tab: switch | q: quit | ?: help</Text>
    </Box>
  </Box>
);
```

### Pattern 4: State Loading with Custom Hook
**What:** Encapsulate GSD data loading and parsing in a custom hook.
**When to use:** Loading and refreshing planning document data.
**Example:**
```typescript
import { useState, useEffect } from 'react';
import matter from 'gray-matter';
import { readFile } from 'fs/promises';

interface GsdData {
  roadmap: Phase[];
  state: ProjectState;
  todos: Todo[];
  loading: boolean;
  error: Error | null;
}

const useGsdData = (planningDir: string): GsdData => {
  const [data, setData] = useState<GsdData>({
    roadmap: [],
    state: null,
    todos: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const roadmapRaw = await readFile(`${planningDir}/ROADMAP.md`, 'utf-8');
        const stateRaw = await readFile(`${planningDir}/STATE.md`, 'utf-8');

        const { data: roadmapMeta, content: roadmapContent } = matter(roadmapRaw);
        const { data: stateMeta, content: stateContent } = matter(stateRaw);

        // Parse content...
        setData({
          roadmap: parseRoadmap(roadmapContent),
          state: parseState(stateMeta, stateContent),
          todos: parseTodos(planningDir),
          loading: false,
          error: null,
        });
      } catch (error) {
        setData(d => ({ ...d, loading: false, error }));
      }
    };

    loadData();
  }, [planningDir]);

  return data;
};
```

### Anti-Patterns to Avoid
- **Nested focus handlers:** Don't have multiple active `useInput` hooks competing for the same keys. Use the `isActive` option to conditionally enable/disable.
- **Blocking renders:** Don't do synchronous file I/O in render functions. Use effects and loading states.
- **Deep component nesting:** Ink's layout engine works best with shallow component trees. Keep nesting under 5 levels.
- **Raw terminal escape codes:** Don't write ANSI codes directly. Use Ink's Text component with style props.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown front matter parsing | Custom YAML regex | `gray-matter` | Edge cases with multi-line values, delimiters |
| Terminal colors/styles | ANSI escape codes | Ink's `<Text>` props or `chalk` | Cross-terminal compatibility |
| Flexbox layout | Manual position calculation | Ink's `<Box>` component | Yoga handles edge cases |
| Focus management | Custom focus tracking | `useFocus`/`useFocusManager` | Tab order, focus cycling handled |
| Spinner animation | setInterval with frames | `@inkjs/ui` Spinner | Proper cleanup, performance |
| Select list | Custom list with selection state | `@inkjs/ui` Select | Keyboard nav, scrolling, theming |
| Progress bar | Custom percentage rendering | `@inkjs/ui` ProgressBar | Character width, Unicode support |
| Git hooks setup | Manual .git/hooks scripts | `lefthook` | Cross-platform, parallel execution |
| Linting + formatting | ESLint + Prettier config | `biome` | Single tool, 100x faster |

**Key insight:** The Ink ecosystem has mature solutions for common TUI patterns. Building custom versions wastes time and misses edge cases (terminal compatibility, Unicode width, focus order).

## Common Pitfalls

### Pitfall 1: Double-key Detection (gg for scroll-to-top)
**What goes wrong:** Vim's `gg` command requires detecting two consecutive 'g' presses.
**Why it happens:** `useInput` fires for each keypress individually.
**How to avoid:** Track last key and timestamp; if 'g' pressed twice within 300ms, trigger scroll-to-top.
**Warning signs:** Users report `gg` not working or triggering unexpectedly.

```typescript
const [lastKey, setLastKey] = useState({ key: '', time: 0 });

useInput((input) => {
  const now = Date.now();
  if (input === 'g') {
    if (lastKey.key === 'g' && now - lastKey.time < 300) {
      scrollToTop();
      setLastKey({ key: '', time: 0 });
    } else {
      setLastKey({ key: 'g', time: now });
    }
  } else {
    setLastKey({ key: '', time: 0 });
  }
});
```

### Pitfall 2: Terminal Resize Handling
**What goes wrong:** Layout breaks when terminal is resized.
**Why it happens:** Ink uses fixed dimensions at render time.
**How to avoid:** Use `useStdout` hook to get terminal dimensions, re-render on resize.
**Warning signs:** Content overflows or truncates unexpectedly after resize.

```typescript
import { useStdout } from 'ink';

const App = () => {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState({
    columns: stdout.columns,
    rows: stdout.rows,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ columns: stdout.columns, rows: stdout.rows });
    };
    stdout.on('resize', handleResize);
    return () => stdout.off('resize', handleResize);
  }, [stdout]);

  // Use dimensions for layout
};
```

### Pitfall 3: Emoji Width Calculation
**What goes wrong:** Emojis cause misaligned columns in tables/lists.
**Why it happens:** Many emojis are 2 characters wide, but `string.length` returns 1.
**How to avoid:** Use a library like `string-width` for accurate width calculation, or use consistent-width Unicode symbols from `figures`.
**Warning signs:** Status indicators cause text to wrap unexpectedly or columns don't align.

### Pitfall 4: Bun Test Coverage Limitation
**What goes wrong:** Coverage reports show 0% for files not imported during tests.
**Why it happens:** Bun only tracks coverage for files actually loaded during test execution.
**How to avoid:** Import all source modules in a test setup file or use dynamic imports.
**Warning signs:** Coverage numbers seem too low despite having tests.

```typescript
// test/setup.ts - Force loading all modules
import '../src/lib/parser';
import '../src/hooks/useGsdData';
// ... import all modules
```

### Pitfall 5: Ctrl+Key Detection Inconsistency
**What goes wrong:** Ctrl+d/u for page scrolling doesn't work.
**Why it happens:** Some terminals intercept Ctrl combinations before they reach the app.
**How to avoid:** Provide alternative keybindings (Page Up/Down, Shift+j/k) and document which terminals are supported.
**Warning signs:** Works in some terminals but not others.

## Code Examples

Verified patterns from official sources:

### CLI Entry Point with Argument Parsing
```typescript
// Source: create-ink-app scaffold pattern
#!/usr/bin/env node
import { render } from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(`
  Usage
    $ gsd-tui [options]

  Options
    --only, -o  Show only one view (roadmap|phase|todos)
    --phase, -p Phase number for --only phase mode
    --help      Show this help

  Examples
    $ gsd-tui
    $ gsd-tui --only roadmap
    $ gsd-tui --only phase --phase 2
`, {
  importMeta: import.meta,
  flags: {
    only: { type: 'string', shortFlag: 'o' },
    phase: { type: 'number', shortFlag: 'p', default: 1 },
  },
});

render(<App flags={cli.flags} />);
```

### Text Styling with Ink
```typescript
// Source: https://github.com/vadimdemedes/ink
import { Text, Box } from 'ink';

const StatusIndicators = () => (
  <Box flexDirection="column">
    <Text color="green">Complete</Text>
    <Text color="yellow">In Progress</Text>
    <Text color="red">Blocked</Text>
    <Text dimColor>Not Started</Text>
    <Text bold>Current Phase</Text>
    <Text backgroundColor="blue" color="white"> Active Tab </Text>
  </Box>
);
```

### Select Component from @inkjs/ui
```typescript
// Source: https://github.com/vadimdemedes/ink-ui
import { Select } from '@inkjs/ui';

const PhaseSelector = ({ phases, onSelect }) => (
  <Select
    options={phases.map(p => ({
      label: `${p.number}. ${p.name}`,
      value: p.number,
    }))}
    onChange={onSelect}
  />
);
```

### Biome Configuration
```json
// biome.json
// Source: https://biomejs.dev/
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

### Lefthook Configuration
```yaml
# lefthook.yml
# Source: https://lefthook.dev/
pre-commit:
  parallel: true
  commands:
    biome-check:
      glob: "*.{ts,tsx,js,jsx,json}"
      run: bunx biome check --write {staged_files}
      stage_fixed: true

    typecheck:
      glob: "*.{ts,tsx}"
      run: bunx tsc --noEmit

commit-msg:
  commands:
    commitlint:
      run: bunx commitlint --edit {1}
```

### Commitlint Configuration
```javascript
// commitlint.config.js
// Source: https://commitlint.js.org/
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'build', 'ci', 'chore', 'revert'
    ]],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
```

### Bun Test Configuration
```toml
# bunfig.toml
# Source: https://bun.com/docs/test/coverage
[test]
coverage = true
coverageThreshold = 0.8
coverageReporter = ["text", "lcov"]
coverageDir = "coverage"
coverageSkipTestFiles = true
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| blessed/neo-blessed | Ink (React-based) | 2019 | React skills transfer to CLI development |
| ESLint + Prettier | Biome | 2023-2025 | 100x faster, single config file |
| Husky git hooks | Lefthook | 2022 | Faster (Go-based), parallel execution |
| Node.js runtime | Bun runtime | 2023-2024 | Faster startup, built-in TypeScript, bundler, test runner |
| Jest testing | Bun test runner | 2024 | Faster, zero config for TypeScript |
| create-react-app | create-ink-app | N/A (different domain) | Purpose-built for CLI apps |

**Deprecated/outdated:**
- **blessed/neo-blessed**: Event-driven API, not component-based. Use Ink instead.
- **vorpal/commander.js alone**: For simple CLIs only, not interactive TUIs.
- **ESLint + Prettier**: Works but slower than Biome, requires two tools and configs.
- **Husky + lint-staged**: Works but Lefthook is faster and simpler.

## Open Questions

Things that couldn't be fully resolved:

1. **Scrollable containers in Ink**
   - What we know: Ink has a `<Static>` component for large lists, but it renders items permanently (can't update them).
   - What's unclear: Best pattern for a scrollable, updatable list within a fixed-height container.
   - Recommendation: Start with state-based offset slicing (render items[offset:offset+pageSize]), investigate ink-scrollable-box or custom solution if needed.

2. **Hot reload during development**
   - What we know: Bun has `--watch` mode for scripts.
   - What's unclear: How well this works with Ink's render cycle.
   - Recommendation: Use `bun --watch src/cli.tsx` and test behavior. May need to clear terminal on reload.

3. **Terminal compatibility matrix**
   - What we know: Ink works with most modern terminals.
   - What's unclear: Specific behavior in iTerm2, WezTerm, zellij, Windows Terminal.
   - Recommendation: Test on target terminals early; document known issues.

## Sources

### Primary (HIGH confidence)
- [Ink GitHub Repository](https://github.com/vadimdemedes/ink) - Core framework documentation
- [Ink UI GitHub Repository](https://github.com/vadimdemedes/ink-ui) - Component library
- [Biome Documentation](https://biomejs.dev/) - Linter/formatter configuration
- [Bun Test Runner Docs](https://bun.com/docs/test/coverage) - Coverage configuration
- [Lefthook Documentation](https://lefthook.dev/) - Git hooks configuration
- [gray-matter GitHub](https://github.com/jonschlinkert/gray-matter) - Markdown front matter parsing

### Secondary (MEDIUM confidence)
- [LogRocket: Using Ink UI](https://blog.logrocket.com/using-ink-ui-react-build-interactive-custom-clis/) - Tutorial verified against official docs
- [Medium: Creating terminal app with Ink](https://medium.com/@pixelreverb/creating-a-terminal-application-with-ink-react-typescript-an-introduction-da49f3c012a8) - Project structure patterns
- [Biome Migration Guide](https://dev.to/pockit_tools/biome-the-eslint-and-prettier-killer-complete-migration-guide-for-2026-27m) - Performance comparisons

### Tertiary (LOW confidence)
- General React architecture patterns - Applied from web React, may need terminal-specific adjustments

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Ink is dominant, used by Claude Code, Gemini CLI; Biome/Lefthook are documented
- Architecture: MEDIUM - Patterns adapted from React web; terminal-specific patterns from tutorials
- Pitfalls: MEDIUM - Some from documentation, some from community reports

**Research date:** 2026-01-24
**Valid until:** 60 days (Ink ecosystem is stable; Biome 2.x is current)
