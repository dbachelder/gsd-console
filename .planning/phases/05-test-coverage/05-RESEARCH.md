# Phase 05: Test Coverage - Research

**Researched:** 2026-01-25
**Domain:** Testing strategy for Ink TUI apps with Bun
**Confidence:** HIGH

## Summary

This phase requires implementing comprehensive test coverage for a GSD Status TUI built with Ink (React for terminals). The project uses Bun as the runtime and test runner, with existing test coverage at ~23% lines. The research identifies the standard testing stack for this ecosystem: Bun's built-in Jest-compatible test runner with coverage, ink-testing-library for component testing, and memfs for filesystem mocking. Key challenges include testing custom hooks without DOM, mocking file system access for the parser, and reaching 80%+ line coverage.

**Primary recommendation:** Use Bun's native test runner with `vi` for mocking, ink-testing-library for components, and memfs for filesystem isolation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bun test | Bun v1.3.6+ | Test runner with coverage, mocking, watch mode | Built into Bun, Jest-compatible, fast, TypeScript support |
| ink-testing-library | 4.0.0+ | Render and assert Ink component output | Official testing utility from Ink creator, 3.4k+ dependents |
| vi (from bun:test) | Built-in | Vitest-compatible mocking API | Provides `vi.fn`, `vi.spyOn`, `vi.mock` for Jest/Vitest compatibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| memfs | 4.0.0+ | In-memory filesystem for mocking fs operations | When testing code that reads/writes files (parser, useGsdData) |
| happy-dom | 15.0.0+ | Lightweight DOM environment for browser-like tests | If testing components that use Web APIs (not needed for pure Ink) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ink-testing-library | @testing-library/react | Ink components don't render to DOM, need terminal output |
| memfs | Manual vi.mock for fs | Hard to maintain, memfs provides complete fs API |
| Bun test runner | Vitest | Bun test is faster and built-in, no install needed |
| vi from bun:test | jest.fn from jest | Same API, vi is official Bun/Vitest alias |

**Installation:**
```bash
# Core testing stack
bun add -D ink-testing-library

# Filesystem mocking (for parser tests)
bun add -D memfs

# Coverage is built into Bun - no install needed
```

## Architecture Patterns

### Recommended Project Structure
```
test/
├── setup.ts              # Preload script for fs mocks (optional)
├── lib/
│   ├── parser.test.ts   # Parser function tests with memfs
│   └── opencode.test.ts # OpenCode SDK tests with mocked API
├── hooks/
│   ├── useVimNav.test.ts     # Hook tests via component render
│   ├── useTabNav.test.ts      # Hook tests via component render
│   └── useFileWatcher.test.ts # Hook tests with mocked fs.watch
├── components/
│   ├── RoadmapView.test.ts   # Component tests with ink-testing-library
│   ├── PhaseView.test.ts     # Component tests with ink-testing-library
│   └── TodosView.test.ts     # Component tests with ink-testing-library
└── fixtures/
    ├── roadmap.md             # Sample planning documents
    ├── state.md
    └── phases/
        └── 01-core-tui/
```

### Pattern 1: Testing Ink Components with ink-testing-library

Render components in test environment and assert on terminal output strings.

**What:** Render Ink component, capture output with `lastFrame()`, assert on text content

**When to use:** Testing any Ink component (views, layouts, UI components)

**Example:**
```typescript
import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { Text } from 'ink';

import RoadmapView from '../../src/components/roadmap/RoadmapView.tsx';

// Source: https://github.com/vadimdemedes/ink-testing-library
describe('RoadmapView', () => {
  test('renders phase list', () => {
    const mockPhases = [
      { number: 1, name: 'Core TUI', status: 'done' },
      { number: 2, name: 'Real-time Updates', status: 'in-progress' },
    ];

    const { lastFrame } = render(
      <RoadmapView phases={mockPhases} expandedPhases={new Set([1])} />
    );

    expect(lastFrame()).toContain('Core TUI');
    expect(lastFrame()).toContain('Real-time Updates');
  });

  test('expands phase on Enter key', () => {
    const { lastFrame, stdin } = render(
      <RoadmapView phases={mockPhases} expandedPhases={new Set()} />
    );

    // Simulate keyboard input
    stdin.write('\r'); // Enter key

    expect(lastFrame()).toContain('Goal:');
  });
});
```

### Pattern 2: Testing Custom Hooks via Component Rendering

Hooks can't be tested directly in React - wrap them in test components that render with ink-testing-library.

**What:** Create wrapper component that uses the hook, render it, verify state changes via re-renders

**When to use:** Testing custom hooks (useVimNav, useTabNav, useToast, etc.)

**Example:**
```typescript
import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { useVimNav } from '../../src/hooks/useVimNav.ts';

// Source: Standard React testing pattern
describe('useVimNav', () => {
  test('moves selection with j/k keys', () => {
    let capturedState: any = null;

    const TestComponent = () => {
      const nav = useVimNav({
        itemCount: 5,
        pageSize: 10,
        isActive: true,
      });
      capturedState = nav;
      return null; // Don't render anything
    };

    const { lastFrame, stdin } = render(<TestComponent />);

    expect(capturedState.selectedIndex).toBe(0);

    // Press j to move down
    stdin.write('j');

    expect(capturedState.selectedIndex).toBe(1);

    // Press k to move up
    stdin.write('k');

    expect(capturedState.selectedIndex).toBe(0);
  });

  test('jumps to bottom with G key', () => {
    const TestComponent = () => {
      const nav = useVimNav({
        itemCount: 10,
        pageSize: 5,
        isActive: true,
      });
      capturedState = nav;
      return null;
    };

    const { stdin } = render(<TestComponent />);

    // Press Shift+G
    stdin.write('G');

    expect(capturedState.selectedIndex).toBe(9);
  });
});
```

### Pattern 3: Mocking Filesystem with memfs

Replace real fs operations with in-memory filesystem to avoid touching `.planning/` directory.

**What:** Create __mocks__/fs.cjs and __mocks__/fs/promises.cjs, use vi.mock to enable, populate with vol.fromJSON

**When to use:** Testing parser functions, useGsdData hook, any code that reads/writes files

**Example:**
```typescript
import { beforeEach, expect, test, vi } from 'bun:test';
import { vol } from 'memfs';
import { parseRoadmap } from '../../src/lib/parser.ts';

// Tell Bun to use memfs for all fs operations
vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('parseRoadmap with mocked filesystem', () => {
  beforeEach(() => {
    // Reset in-memory filesystem before each test
    vol.reset();
  });

  test('parses ROADMAP.md from mocked fs', () => {
    const roadmapContent = `
### Phase 1: Core TUI
**Goal:** Build terminal UI with Ink
**Depends on:** None
**Success Criteria:**
1. App renders without errors
`;

    // Write to in-memory filesystem
    vol.fromJSON({
      '.planning/ROADMAP.md': roadmapContent,
    });

    const phases = parseRoadmap(roadmapContent, '.planning/phases');

    expect(phases).toHaveLength(1);
    expect(phases[0]?.name).toBe('Core TUI');
    expect(phases[0]?.goal).toBe('Build terminal UI with Ink');
  });

  test('handles missing phase directory', () => {
    vol.fromJSON({
      '.planning/ROADMAP.md': '### Phase 1: Test',
      // Note: no .planning/phases directory created
    });

    const phases = parseRoadmap('', '.planning/phases');

    expect(phases).toHaveLength(1);
    expect(phases[0]?.indicators).toBeUndefined();
  });
});
```

### Pattern 4: Mocking fs.watch for File Watcher Hook

Mock the file watcher to simulate file change events without actual filesystem activity.

**What:** Use vi.mock on 'node:fs' to replace watch() with a mock that calls callbacks

**When to use:** Testing useFileWatcher hook or any file watching logic

**Example:**
```typescript
import { beforeEach, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';
import { useFileWatcher } from '../../src/hooks/useFileWatcher.ts';

// Mock fs module before importing code that uses it
vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs');
  return {
    ...actual,
    watch: vi.fn((path, options, callback) => {
      // Return mock watcher that has close() method
      return {
        close: vi.fn(),
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            // Store error handler for tests to call
            (callback as any).errorHandler = handler;
          }
        }),
      };
    }),
  };
});

describe('useFileWatcher', () => {
  test('emits changed files on watch event', async () => {
    const TestComponent = () => {
      const { changedFiles } = useFileWatcher({
        path: '.planning',
        debounceMs: 100,
      });
      return null;
    };

    render(<TestComponent />);

    // Get the watch mock to trigger callbacks
    const watch = vi.mocked(require('node:fs').watch);

    // Simulate file change event
    const watchCallback = watch.mock.calls[0]?.[2];
    watchCallback?.('change', 'ROADMAP.md');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(changedFiles).toContain('ROADMAP.md');
  });
});
```

### Pattern 5: Coverage Configuration with bunfig.toml

Configure coverage thresholds and reporting in project configuration.

**What:** Add [test] section to bunfig.toml with coverage settings

**When to use:** Setting up coverage requirements for the project

**Example:**
```toml
# bunfig.toml
[test]
# Coverage configuration
coverage = true
coverageReporter = ["text", "lcov"]
coverageDir = "./coverage"

# Source: https://bun.com/docs/test/code-coverage.md
# Require 80% line coverage for Phase 5 success criteria
coverageThreshold = { lines = 0.8, functions = 0.75, statements = 0.8 }

# Don't count test files toward coverage
coverageSkipTestFiles = true

# Ignore generated files or test helpers
coveragePathIgnorePatterns = [
  "**/*.test.ts",
  "**/*.spec.ts",
  "test/**"
]
```

### Anti-Patterns to Avoid

- **Testing via DOM rendering:** Ink components don't render to DOM, use ink-testing-library for terminal output
- **Direct hook imports:** Cannot test hooks directly, must wrap in component that uses the hook
- **Real filesystem access:** Never read/write real .planning/ files in tests, always mock with memfs
- **Over-complex mocks:** Mocks should be simple and focused, test code behavior not implementation
- **Testing private implementation details:** Test public interfaces and observable outputs, not internal state

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Terminal output capture | Custom stdout capturing | ink-testing-library's `lastFrame()` | Handles ANSI codes, colors, multi-frame rendering |
| Filesystem mocking | Manual vi.mock for fs.readFile | memfs + vol.fromJSON | Provides complete fs API (readdir, existsSync, watch), handles edge cases |
| Mock watcher implementation | Custom event emitter | memfs doesn't support watch - mock fs.watch with vi.fn | fs.watch is platform-specific, hard to mock completely |
| Component render helpers | Custom render function | ink-testing-library's `render()` | Handles Ink-specific lifecycle, stdin/stdout simulation |
| Assertion helpers | Custom text matching | Bun's `expect()` with Jest matchers | Full matcher library (toContain, toMatchObject, etc.) |
| Spy implementation | Manual call tracking | `vi.spyOn(obj, 'method') | Tracks calls, arguments, return values automatically |

**Key insight:** Testing infrastructure already exists for this stack - use established libraries rather than building custom utilities. Filesystem mocking and component testing for Ink are well-solved problems.

## Common Pitfalls

### Pitfall 1: Module Mocking After Import

**What goes wrong:** Calling `vi.mock('fs')` after the code under test has already imported `fs`, so side effects from real fs module still happen

**Why it happens:** Bun evaluates modules on first import. Mocking after import doesn't undo side effects.

**How to avoid:** Use `--preload` flag or put mocks in `test/setup.ts` and configure in `bunfig.toml`

**Warning signs:** Tests write files to real disk, tests are order-dependent, fixtures are created in .planning/

**Example:**
```typescript
// test/setup.ts - Preload this file
import { mock } from 'bun:test';
import { fs } from 'memfs';

// Configure mocks before any tests import modules
mock.module('node:fs', () => fs);
mock.module('node:fs/promises', () => fs.promises);
```

```toml
# bunfig.toml
[test]
preload = ["./test/setup.ts"]
```

### Pitfall 2: Not Resetting memfs Between Tests

**What goes wrong:** Test 1 writes files to memfs, Test 2 sees those files and fails with unexpected state

**Why it happens:** memfs maintains state in memory across tests unless explicitly reset

**How to avoid:** Always call `vol.reset()` in `beforeEach()` hook

**Warning signs:** Flaky tests that pass when run alone but fail in suite, tests finding files they didn't create

**Example:**
```typescript
import { beforeEach } from 'bun:test';
import { vol } from 'memfs';

beforeEach(() => {
  vol.reset(); // Clear all files from previous tests
});
```

### Pitfall 3: Hook Tests Not Updating State

**What goes wrong:** Wrapper component renders hook but state changes aren't reflected because component doesn't re-render

**Why it happens:** React hooks trigger re-renders, but if component returns null, no output change to detect

**How to avoid:** Have wrapper component render state or use callback refs to capture state changes

**Warning signs:** State assertions always see initial value, key presses don't affect state

**Example:**
```typescript
import { useRef } from 'react';

test('useVimNav updates state', () => {
  const stateRef = useRef<any>(null);

  const TestComponent = () => {
    const nav = useVimNav({ itemCount: 5, pageSize: 10, isActive: true });
    stateRef.current = nav; // Always update ref on re-render
    return null;
  };

  const { stdin } = render(<TestComponent />);

  stdin.write('j');

  // Small delay to let re-render happen
  await new Promise(resolve => setTimeout(resolve, 10));

  expect(stateRef.current?.selectedIndex).toBe(1);
});
```

### Pitfall 4: Ignoring Error Paths

**What goes wrong:** Tests only cover happy paths, coverage percentage high but actual error handling untested

**Why it happens:** Writing test fixtures for error cases is tedious, developers focus on normal flow

**How to avoid:** Review uncovered lines in coverage report, explicitly test each error branch

**Warning signs:** Coverage gaps in error handling code, production errors in untested paths

**Example:**
```typescript
test('parseState handles malformed input', () => {
  const badContent = 'Phase: invalid';
  const state = parseState(badContent);

  expect(state.currentPhase).toBe(1); // Should default to 1
  expect(state.totalPhases).toBe(4); // Should default to 4
});

test('parseRoadmap throws on invalid phase number', () => {
  const content = '### Phase ABC: Invalid';

  expect(() => parseRoadmap(content, '/phases')).toThrow();
});
```

### Pitfall 5: Mocking Implementation Instead of Behavior

**What goes wrong:** Tests verify that a function calls `fs.readFile` rather than that it returns correct parsed data

**Why it happens:** Easier to spy on internal calls than to write proper test fixtures

**How to avoid:** Test outputs and side effects, not implementation details. Use integration-style tests with mocked fs.

**Warning signs:** Tests break when refactoring, multiple assertions on internal calls

**Example:**
```typescript
// BAD: Tests implementation
test('parser reads ROADMAP.md', () => {
  const readFileSpy = vi.spyOn(fs, 'readFileSync');
  parseRoadmap('', '/phases');
  expect(readFileSpy).toHaveBeenCalledWith('.planning/ROADMAP.md');
});

// GOOD: Tests behavior
test('parser extracts phases from ROADMAP.md', () => {
  vol.fromJSON({
    '.planning/ROADMAP.md': '### Phase 1: Test\n**Goal:** Do it',
  });

  const phases = parseRoadmap('.planning/ROADMAP.md', '/phases');

  expect(phases[0]?.name).toBe('Test');
  expect(phases[0]?.goal).toBe('Do it');
});
```

## Code Examples

Verified patterns from official sources:

### Basic Bun Test with Mocks

```typescript
// Source: https://bun.com/docs/test/mocks.md
import { test, expect, mock, beforeEach, afterEach } from 'bun:test';

const mockFn = mock(() => 42);

beforeEach(() => {
  mockFn.mockClear(); // Clear call history before each test
});

afterEach(() => {
  mockFn.mockRestore(); // Restore original implementation
});

test('mock function behavior', () => {
  const result = mockFn();

  expect(result).toBe(42);
  expect(mockFn).toHaveBeenCalled();
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

### Spy on Object Methods

```typescript
// Source: https://bun.com/docs/test/mocks.md
import { spyOn } from 'bun:test';

const service = {
  getData: () => 'real data',
};

test('spy tracks calls without changing behavior', () => {
  const spy = spyOn(service, 'getData');

  service.getData();

  expect(spy).toHaveBeenCalled();
  expect(service.getData()).toBe('real data'); // Original still works
});
```

### Module Mocking

```typescript
// Source: https://bun.com/docs/test/mocks.md
import { mock } from 'bun:test';

mock.module('./api', () => ({
  fetchUser: mock(async (id: string) => ({ id, name: `User ${id}` })),
}));

test('uses mocked API', async () => {
  const { fetchUser } = await import('./api');
  const user = await fetchUser('123');

  expect(user.name).toBe('User 123');
});
```

### Coverage Threshold Configuration

```toml
# Source: https://bun.com/docs/test/code-coverage.md
[test]
coverageThreshold = { lines = 0.8, functions = 0.75, statements = 0.8 }
```

### Ink Component Render with Input

```typescript
// Source: https://github.com/vadimdemedes/ink-testing-library
import { render } from 'ink-testing-library';
import { useInput, Text } from 'ink';

const Test = () => {
  const [input, setInput] = useState('');

  useInput((char) => {
    setInput((prev) => prev + char);
  });

  return <Text>{input}</Text>;
};

const { lastFrame, stdin } = render(<Test />);

stdin.write('hello');
expect(lastFrame()).toBe('hello');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest with jsdom | Bun test with ink-testing-library | 2023-2024 | Bun test is faster, no DOM needed for Ink |
| Manual fs stubs | memfs with vi.mock | 2024 | memfs provides complete fs API, easier setup |
| Custom hook testing libraries | Component wrapper pattern | 2020+ | React hooks require component context to test |

**Deprecated/outdated:**
- jsdom: Too heavy for Ink testing, happy-dom preferred if DOM needed (not needed for this project)
- jest.mock with __mocks__ directory: Bun doesn't support auto-mocking, use vi.mock() inline
- enzyme: React testing library pattern is current standard

## Open Questions

1. **How to test file watcher debounce timing?**
   - What we know: useFileWatcher has 300ms default debounce for rapid saves
   - What's unclear: How to test timing-dependent behavior without actual timers
   - Recommendation: Use `vi.useFakeTimers()` if available in Bun, or add explicit delay in tests

2. **How to test OpenCode SDK integration?**
   - What we know: useOpencodeConnection and useBackgroundJobs use @opencode-ai/sdk
   - What's unclear: SDK provides real API client, need to mock HTTP calls
   - Recommendation: Use `mock.module('@opencode-ai/sdk') to return mock client, or use vi.spyOn on SDK methods

3. **How to test terminal resize handling?**
   - What we know: Ink components may respond to terminal size changes
   - What's unclear: ink-testing-library may not support resize events
   - Recommendation: Skip resize testing initially, focus on core functionality; add if needed

## Sources

### Primary (HIGH confidence)
- /oven-sh/bun - Core test API, mocks, coverage, vi object (Jest/Vitest compatibility)
- /vadimdemedes/ink - useFocus, useInput hooks for interactive testing
- /vitest-dev/vitest - memfs integration patterns for filesystem mocking

### Secondary (MEDIUM confidence)
- https://bun.com/docs/test - Official Bun test documentation (migrated from bun.sh)
- https://github.com/vadimdemedes/ink-testing-library - Official Ink testing library documentation
- https://github.com/streamich/memfs - memfs documentation and examples

### Tertiary (LOW confidence)
- None - All research based on official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Bun test runner and ink-testing-library are established standards, verified with official docs
- Architecture: HIGH - Component testing pattern verified with ink-testing-library docs, hook testing via wrappers is standard React pattern
- Pitfalls: HIGH - Module mocking timing and memfs reset issues documented in official sources

**Research date:** 2026-01-25
**Valid until:** 30 days - Bun ecosystem is stable but may release new features
