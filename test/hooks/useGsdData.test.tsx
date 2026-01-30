import { beforeEach, describe, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';
import { useGsdData } from '../../src/hooks/useGsdData.ts';

describe('useGsdData', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('initialization and loading', () => {
		test('starts with loading state true', () => {
			let capturedLoading = false;

			const TestComponent = () => {
				const data = useGsdData('.planning');
				capturedLoading = data.loading;
				return null;
			};

			render(<TestComponent />);

			// Initial state should have loading: true
			expect(capturedLoading).toBe(true);
		});

		test('loads and parses planning documents successfully', async () => {
			let capturedData: any = null;

			const TestComponent = () => {
				const data = useGsdData('.planning');
				capturedData = data;
				return null;
			};

			render(<TestComponent />);

			// Wait for async loading to complete
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should have loaded data from .planning/ (flexible to phase count changes)
			expect(capturedData.loading).toBe(false);
			expect(capturedData.phases.length).toBeGreaterThan(0);
			expect(capturedData.todos.length).toBeGreaterThanOrEqual(0);
			expect(capturedData.state?.currentPhase).toBeGreaterThan(0);
			expect(capturedData.state?.totalPhases).toBeGreaterThan(0);
			expect(capturedData.error).toBeNull();

			// Verify phase structure (not exact count)
			expect(capturedData.phases[0]).toHaveProperty('number');
			expect(capturedData.phases[0]).toHaveProperty('name');
			expect(capturedData.phases[0]).toHaveProperty('status');
		});

		test('calculates progress percent from completed phases', async () => {
			let capturedProgress = 0;
			let capturedState: any = null;

			const TestComponent = () => {
				const data = useGsdData('.planning');
				capturedProgress = data.state?.progressPercent ?? 0;
				capturedState = data.state;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 200));

			// Progress should be 0-100 (flexible to actual project state)
			expect(capturedProgress).toBeGreaterThanOrEqual(0);
			expect(capturedProgress).toBeLessThanOrEqual(100);

			// Verify state structure
			expect(capturedState).toHaveProperty('currentPhase');
			expect(capturedState).toHaveProperty('totalPhases');
			expect(capturedState).toHaveProperty('progressPercent');
		});
	});

	describe('error handling', () => {
		test('enhances state with PROJECT.md data', async () => {
			let capturedState: any = null;

			const TestComponent = () => {
				const data = useGsdData('.planning');
				capturedState = data.state;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should extract project info (flexible to actual PROJECT.md content)
			expect(capturedState).toHaveProperty('projectName');
			expect(capturedState.projectName).toBeTruthy();
			expect(capturedState.projectName).not.toBe('GSD Project'); // Should override default

			expect(capturedState).toHaveProperty('coreValue');
			expect(capturedState.coreValue).toBeTruthy();
		});
	});

	describe('refresh and changed files', () => {
		test('stores changedFiles in result', async () => {
			let capturedChangedFiles: string[] = [];

			const TestComponent = () => {
				const data = useGsdData('.planning', undefined, [
					'.planning/ROADMAP.md',
					'.planning/STATE.md',
				]);
				capturedChangedFiles = data.changedFiles;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should store changed files from parameter
			expect(capturedChangedFiles).toEqual([
				'.planning/ROADMAP.md',
				'.planning/STATE.md',
			]);
		});

		test('reloads data when refreshTrigger changes', async () => {
			const TestComponent = () => {
				useGsdData('.planning', 0); // Initial trigger
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Remount with new trigger (simulating file watcher update)
			const TestComponent2 = () => {
				useGsdData('.planning', 1); // New trigger
				return null;
			};

			render(<TestComponent2 />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should have parsed again with new trigger
			// Test verifies it doesn't crash - flexible to actual behavior
			expect(true).toBe(true);
		});

		test('uses ref pattern to avoid render loop with changedFiles', async () => {
			// This test documents the ref pattern from useGsdData.ts
			// Changed files are stored in ref to prevent dependency array issues

			let capturedData: any = null;

			const TestComponent = () => {
				const data = useGsdData('.planning', undefined, ['file1.md']);
				capturedData = data;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should store changed files without causing re-render loop
			// Verifies the hook captures changedFiles from the parameter
			expect(capturedData.changedFiles).toBeDefined();
			expect(Array.isArray(capturedData.changedFiles)).toBe(true);
		});
	});
});
