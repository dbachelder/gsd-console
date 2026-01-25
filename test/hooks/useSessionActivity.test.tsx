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
	describe('initialization', () => {
		test('starts with null activity', () => {
			let capturedActivity: SessionActivity | null = null;

			const TestComponent = () => {
				const activity = useSessionActivity();
				capturedActivity = activity;
				return null;
			};

			render(<TestComponent />);

			// Initial state should be null
			expect(capturedActivity).toBeNull();
		});

		test('loads active session on mount', async () => {
			const mockActivity: SessionActivity = {
				sessionId: 'session-123',
				title: 'Phase 05: Test Coverage',
				directory: '/Users/dan/src/gsd-tui',
				isActive: true,
				currentActivity: 'gsd-plan-checker: running',
				lastUpdated: Date.now(),
			};

			(getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockActivity);

			let capturedActivity: SessionActivity | null = null;

			const TestComponent = () => {
				const activity = useSessionActivity();
				capturedActivity = activity;
				return null;
			};

			render(<TestComponent />);

			// Wait for async getActiveSession to resolve
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should have loaded session data
			expect(capturedActivity).not.toBeNull();
			expect(capturedActivity?.sessionId).toBe('session-123');
			expect(capturedActivity?.isActive).toBe(true);
			expect(capturedActivity?.currentActivity).toBe('gsd-plan-checker: running');
		});

		test('handles no active session', async () => {
			(getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			let capturedActivity: SessionActivity | null = null;

			const TestComponent = () => {
				const activity = useSessionActivity();
				capturedActivity = activity;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should remain null if no active session
			expect(capturedActivity).toBeNull();
		});

		test('identifies inactive sessions (updated > 60s ago)', async () => {
			const inactiveActivity: SessionActivity = {
				sessionId: 'session-123',
				title: 'Old session',
				directory: '/Users/dan/src/gsd-tui',
				isActive: false,
				currentActivity: 'idle',
				lastUpdated: Date.now() - 120000, // 2 minutes ago
			};

			(getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue(inactiveActivity);

			let capturedActivity: SessionActivity | null = null;

			const TestComponent = () => {
				const activity = useSessionActivity();
				capturedActivity = activity;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should capture inactive session correctly
			expect(capturedActivity?.isActive).toBe(false);
			expect(capturedActivity?.currentActivity).toBe('idle');
		});
	});
});
