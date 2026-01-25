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
	describe('initialization and loading', () => {
		test('starts with loading state true', () => {
			let capturedLoading = false;
			let capturedData: any = null;

			const TestComponent = () => {
				const data = useGsdData('.planning');
				capturedLoading = data.loading;
				capturedData = data;
				return null;
			};

			render(<TestComponent />);

			// Initial state should have loading: true
			expect(capturedLoading).toBe(true);
		});

		test('loads and parses planning documents successfully', async () => {
			(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

			// Mock parser functions to return test data
			(parseRoadmap as ReturnType<typeof vi.fn>).mockReturnValue([
				{ number: 1, name: 'Core TUI', status: 'complete' },
			]);

			(parseState as ReturnType<typeof vi.fn>).mockReturnValue({
				projectName: 'Test Project',
				coreValue: 'Test value',
				currentPhase: 1,
				totalPhases: 1,
			});

			(parseTodos as ReturnType<typeof vi.fn>).mockReturnValue([
				{ id: 'pending-1.md', text: 'Test todo', completed: false },
			]);

			(readPlanningFile as ReturnType<typeof vi.fn>).mockReturnValue({
				content: 'mock content',
			});

			let capturedData: any = null;

			const TestComponent = () => {
				const data = useGsdData('.planning');
				capturedData = data;
				return null;
			};

			render(<TestComponent />);

			// Wait for async loading to complete
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Should have loaded data
			expect(capturedData.loading).toBe(false);
			expect(capturedData.phases).toHaveLength(1);
			expect(capturedData.todos).toHaveLength(1);
			expect(capturedData.state?.projectName).toBe('Test Project');
			expect(capturedData.error).toBeNull();
		});

		test('calculates progress percent from completed phases', async () => {
			(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
			(readPlanningFile as ReturnType<typeof vi.fn>).mockReturnValue({
				content: 'mock',
			});

			// 2 phases, 1 complete = 50% progress
			(parseRoadmap as ReturnType<typeof vi.fn>).mockReturnValue([
				{ number: 1, name: 'Phase 1', status: 'complete' },
				{ number: 2, name: 'Phase 2', status: 'in-progress' },
			]);

			(parseState as ReturnType<typeof vi.fn>).mockReturnValue({
				projectName: 'Test',
				currentPhase: 1,
				totalPhases: 0, // Will be overwritten
			});

			(parseTodos as ReturnType<typeof vi.fn>).mockReturnValue([]);

			let capturedProgress = 0;

			const TestComponent = () => {
				const data = useGsdData('.planning');
				capturedProgress = data.state?.progressPercent ?? 0;
				return null;
			};

			render(<TestComponent />);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 1 of 2 phases complete = 50%
			expect(capturedProgress).toBe(50);
		});
	});
});
