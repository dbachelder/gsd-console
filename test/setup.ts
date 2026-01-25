// Testing infrastructure for Phase 05: Test Coverage
//
// IMPORTANT: Bun's preload mechanism cannot import from 'bun/test' directly.
// Module mocking must be done PER TEST FILE using vi.mock():
//
// In each test file that needs filesystem mocking:
//
// import { vi } from 'bun:test';
// import { fs } from 'memfs';
//
// vi.mock('node:fs', () => fs);
// vi.mock('node:fs/promises', () => fs.promises);
//
// Then use vol.fromJSON() in tests to populate filesystem:
//
// beforeEach(() => {
//   vol.reset();
//   vol.fromJSON({
//     '.planning/ROADMAP.md': '### Phase 1: Test',
//   });
// });
//
// See Pattern 3 in 05-RESEARCH.md for complete examples.
// This follows Pitfall 1: Don't mock after imports

// Export vol for test fixtures (used with vol.fromJSON())
export { vol } from 'memfs';
