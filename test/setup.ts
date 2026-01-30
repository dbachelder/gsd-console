// Testing infrastructure for Phase 05: Test Coverage
//
// IMPORTANT: All tests must use memfs for 'node:fs' mocking to prevent
// competing vi.mock() calls.
//
// Pattern for each test file:
//
// import { vi } from 'bun:test';
// import { fs as memfs } from 'memfs';
//
// vi.mock('node:fs', () => memfs);
// vi.mock('node:fs/promises', () => memfs.promises);
//
// Then in beforeEach():
// - For parser tests: use vol.fromJSON() to set up virtual filesystem
// - For hook tests: use vol.reset() and mock individual functions as needed

// Export vol for test fixtures (used with vol.fromJSON())
export { fs as memfs, vol } from 'memfs';
