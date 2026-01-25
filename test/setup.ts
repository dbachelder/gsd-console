import { mock } from 'bun/test';
import { fs } from 'memfs';

// Configure memfs to mock all node:fs and node:fs/promises operations
// This ensures tests use in-memory filesystem instead of real .planning/ directory
mock.module('node:fs', () => fs);
mock.module('node:fs/promises', () => fs.promises);

// Export vol (volume) for tests to populate with test fixtures
export { vol } from 'memfs';
