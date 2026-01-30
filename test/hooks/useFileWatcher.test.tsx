/**
 * useFileWatcher Tests
 * Tests for file watcher hook with mocked fs.watch.
 */

import { beforeEach, describe, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';
import { useFileWatcher } from '../../src/hooks/useFileWatcher.ts';

// Track mock callbacks and error handlers
let watchCallback: any = null;
let errorHandler: any = null;

// Mock fs.watch to simulate file change events without real filesystem
vi.mock('node:fs', () => ({
	watch: vi.fn((path: string, options: any, callback: any) => {
		// Store callback for tests to trigger
		watchCallback = callback;

		// Return mock watcher with close() method and on() for error handling
		const mockWatcher: any = {
			close: vi.fn(),
		};
		mockWatcher.on = vi.fn((_event: string, handler: any) => {
			errorHandler = handler;
		});
		return mockWatcher;
	}),
}));

describe('useFileWatcher', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		watchCallback = null;
		errorHandler = null;
	});

	test('emits changed files on watch event', async () => {
		let capturedFiles: string[] = [];

		const TestComponent = () => {
			const { changedFiles } = useFileWatcher({
				path: '.planning',
				debounceMs: 100,
			});
			capturedFiles = changedFiles;
			return null;
		};

		render(<TestComponent />);

		// Simulate file change event
		watchCallback?.('change', 'ROADMAP.md');

		// Wait for debounce (100ms + buffer)
		await new Promise((resolve) => setTimeout(resolve, 150));

		expect(capturedFiles).toContain('ROADMAP.md');
	});

	test('debounces rapid changes', async () => {
		let capturedFiles: string[] = [];

		const TestComponent = () => {
			const { changedFiles } = useFileWatcher({
				path: '.planning',
				debounceMs: 100,
			});
			capturedFiles = changedFiles;
			return null;
		};

		render(<TestComponent />);

		// Trigger multiple rapid changes within debounce window
		watchCallback?.('change', 'file1.md');
		watchCallback?.('change', 'file2.md');
		watchCallback?.('change', 'file3.md');

		// Wait for debounce + processing
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Should only emit once with all changes
		expect(capturedFiles.length).toBe(3);
		expect(capturedFiles).toContain('file1.md');
		expect(capturedFiles).toContain('file2.md');
		expect(capturedFiles).toContain('file3.md');
	});

	test('handles watch errors via onError callback', async () => {
		let capturedError: Error | null = null;

		const TestComponent = () => {
			const { changedFiles } = useFileWatcher({
				path: '.planning',
				debounceMs: 100,
				onError: (error) => {
					capturedError = error;
				},
			});
			void changedFiles; // Mark as used
			return null;
		};

		render(<TestComponent />);

		// Simulate watcher error
		const testError = new Error('Watcher error');
		// vi.mock typing issue, but tests work at runtime
		errorHandler?.(testError);

		expect(capturedError).toBe(testError);
	});

	test('initializes isRefreshing to false', () => {
		let capturedIsRefreshing = false;

		const TestComponent = () => {
			const { isRefreshing } = useFileWatcher({
				path: '.planning',
				debounceMs: 100,
			});
			capturedIsRefreshing = isRefreshing;
			return null;
		};

		render(<TestComponent />);

		// Initially not refreshing
		expect(capturedIsRefreshing).toBe(false);
	});

	test('initializes lastRefresh to null', () => {
		let capturedLastRefresh: number | null = null;

		const TestComponent = () => {
			const { lastRefresh } = useFileWatcher({
				path: '.planning',
				debounceMs: 100,
			});
			capturedLastRefresh = lastRefresh;
			return null;
		};

		render(<TestComponent />);

		// Initially no refresh timestamp
		expect(capturedLastRefresh).toBeNull();
	});

	test('ignores null filename from watcher', async () => {
		let capturedFiles: string[] = [];

		const TestComponent = () => {
			const { changedFiles } = useFileWatcher({
				path: '.planning',
				debounceMs: 100,
			});
			capturedFiles = changedFiles;
			return null;
		};

		render(<TestComponent />);

		// Simulate null filename (some watcher implementations do this)
		watchCallback?.('change', null);
		await new Promise((resolve) => setTimeout(resolve, 150));

		// Should not add anything to changedFiles
		expect(capturedFiles).toHaveLength(0);
	});
});
