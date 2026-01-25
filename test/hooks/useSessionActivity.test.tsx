import { beforeEach, describe, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';
import { useSessionActivity } from '../../src/hooks/useSessionActivity.ts';

// Mock sessionActivity functions
vi.mock('../../src/lib/sessionActivity.ts', () => ({
	getActiveSession: vi.fn(),
	monitorSessionActivity: vi.fn(),
}));

// Import mocked modules
import {
	getActiveSession,
	monitorSessionActivity,
	type SessionActivity,
} from '../../src/lib/sessionActivity.ts';

// Clear mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
});

describe('useSessionActivity', () => {
	// Test cases will go here
});
