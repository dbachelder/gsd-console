import { beforeEach, describe, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';
import { useGsdData } from '../../src/hooks/useGsdData.ts';

// Mock parser functions
vi.mock('../../src/lib/parser.ts', () => ({
	parseRoadmap: vi.fn(),
	parseState: vi.fn(),
	parseTodos: vi.fn(),
	readPlanningFile: vi.fn(),
}));

// Mock fs operations (for directory existence check)
vi.mock('node:fs', () => ({
	existsSync: vi.fn(),
}));

// Import mocked modules
import { parseRoadmap, parseState, parseTodos, readPlanningFile } from '../../src/lib/parser.ts';
import { existsSync } from 'node:fs';

// Clear mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
});

describe('useGsdData', () => {
	// Test cases will go here
});
