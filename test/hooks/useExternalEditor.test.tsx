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

describe('findPhaseDir', () => {
	test('finds phase directory with padded number', () => {
		// Mock phases directory structure
		(readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([
			{ isDirectory: () => true, name: '01-core-tui' },
			{ isDirectory: () => true, name: '02-real-time-updates' },
			{ isDirectory: () => false, name: 'README.md' },
		]);

		// Mock existsSync to return true for phases dir
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

		// Import function (private, test via useExternalEditor behavior)
		const { files } = useExternalEditor({
			activeTab: 'phase',
			selectedPhase: 1,
			planningDir: '.planning',
		});

		// Should find "01-core-tui" for phase 1
		expect(files.length).toBeGreaterThan(0);
		expect(files[0]).toContain('01');
	});

	test('returns empty array when phases directory does not exist', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

		const { files } = useExternalEditor({
			activeTab: 'phase',
			selectedPhase: 1,
			planningDir: '.planning',
		});

		expect(files).toEqual([]);
	});

	test('handles phase 10+ (double digit numbers)', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
		(readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([
			{ isDirectory: () => true, name: '10-test-phase' },
		]);

		const { files } = useExternalEditor({
			activeTab: 'phase',
			selectedPhase: 10,
			planningDir: '.planning',
		});

		expect(files.length).toBeGreaterThan(0);
		expect(files[0]).toContain('10-');
	});

	test('ignores directories not matching phase number', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
		(readdirSync as ReturnType<typeof vi.fn>).mockReturnValue([
			{ isDirectory: () => true, name: '01-core-tui' },
			{ isDirectory: () => true, name: '02-wrong-phase' },
			{ isDirectory: () => true, name: 'other-directory' },
		]);

		const { files } = useExternalEditor({
			activeTab: 'phase',
			selectedPhase: 1,
			planningDir: '.planning',
		});

		// Should only find phase 1 directory
		expect(files.length).toBeGreaterThan(0);
		expect(files.every((f) => f.includes('01'))).toBe(true);
	});
});
