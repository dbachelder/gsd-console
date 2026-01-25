import { beforeEach, describe, expect, test, vi } from 'bun:test';
import { useExternalEditor } from '../../src/hooks/useExternalEditor.ts';

// Mock fs operations
vi.mock('node:fs', () => ({
	existsSync: vi.fn(),
	readdirSync: vi.fn(),
}));

// Mock process operations
vi.mock('node:child_process', () => ({
	spawnSync: vi.fn(),
}));

// Get mocked modules
import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Clear mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
});

describe('useExternalEditor', () => {
	// Test cases will go here
});
