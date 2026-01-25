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

	describe('activity monitoring', () => {
		test('registers callback with monitorSessionActivity', async () => {
			(getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			let mockCallback: ((activity: SessionActivity) => void) | null = null;

			(monitorSessionActivity as ReturnType<typeof vi.fn>).mockImplementation((callback) => {
				mockCallback = callback;
				return () => {}; // Cleanup function
			});

			const TestComponent = () => {
				useSessionActivity();
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should have registered callback
			expect(monitorSessionActivity).toHaveBeenCalled();
			expect(mockCallback).not.toBeNull();
		});

		test('updates state when callback receives new activity', async () => {
			(getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			let capturedActivity: SessionActivity | null = null;
			let mockCallback: ((activity: SessionActivity) => void) | null = null;

			(monitorSessionActivity as ReturnType<typeof vi.fn>).mockImplementation((callback) => {
				mockCallback = callback;
				return () => {};
			});

			const TestComponent = () => {
				const activity = useSessionActivity();
				capturedActivity = activity;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Simulate new activity from callback
			const newActivity: SessionActivity = {
				sessionId: 'session-456',
				title: 'New session',
				directory: '/Users/dan/src/gsd-tui',
				isActive: true,
				currentActivity: 'gsd-execute: running',
				lastUpdated: Date.now(),
			};

			if (mockCallback) {
				mockCallback(newActivity);
			}

			// Wait for state update
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Should have updated activity
			expect(capturedActivity).not.toBeNull();
			expect(capturedActivity?.sessionId).toBe('session-456');
			expect(capturedActivity?.currentActivity).toBe('gsd-execute: running');
		});

		test('handles session becoming inactive', async () => {
			const initialActivity: SessionActivity = {
				sessionId: 'session-123',
				title: 'Active session',
				directory: '/Users/dan/src/gsd-tui',
				isActive: true,
				currentActivity: 'running',
				lastUpdated: Date.now(),
			};

			(getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue(initialActivity);

			let capturedActivity: SessionActivity | null = initialActivity;
			let mockCallback: ((activity: SessionActivity) => void) | null = null;

			(monitorSessionActivity as ReturnType<typeof vi.fn>).mockImplementation((callback) => {
				mockCallback = callback;
				return () => {};
			});

			const TestComponent = () => {
				const activity = useSessionActivity();
				capturedActivity = activity;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Simulate session becoming inactive
			const inactiveActivity: SessionActivity = {
				...initialActivity,
				isActive: false,
				lastUpdated: Date.now() - 120000,
			};

			if (mockCallback) {
				mockCallback(inactiveActivity);
			}

			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(capturedActivity?.isActive).toBe(false);
		});
	});

	describe('cleanup', () => {
		test('calls cleanup function on unmount', async () => {
			(getActiveSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

			let cleanupCalled = false;

			const mockCleanup = () => {
				cleanupCalled = true;
			};

			(monitorSessionActivity as ReturnType<typeof vi.fn>).mockReturnValue(mockCleanup);

			const TestComponent = () => {
				useSessionActivity();
				return null;
			};

			const { unmount } = render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Unmount component
			unmount();

			// Cleanup should have been called
			expect(cleanupCalled).toBe(true);
		});
	});
});
