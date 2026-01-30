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

describe('getEditableFiles', () => {
	test('roadmap tab with phase selected returns phase files + ROADMAP', () => {
		// Mock phases directory with Dirent objects (for findPhaseDir)
		// Mock phase files directory with string array (for file listing)
		(readdirSync as ReturnType<typeof vi.fn>).mockImplementation((path, options) => {
			if (options?.withFileTypes) {
				// Return Dirent objects for phases directory
				return [{ isDirectory: () => true, name: '01-core-tui' }];
			}
			// Return string array for phase file listing
			return ['01-01-PLAN.md', '01-CONTEXT.md', 'SUMMARY.md'];
		});

		(existsSync as ReturnType<typeof vi.fn>).mockImplementation((path) => {
			// Mock ROADMAP.md and phase files existing
			return typeof path === 'string' && (path.includes('ROADMAP') || path.includes('01-') || path.includes('phases'));
		});

		const { files } = useExternalEditor({
			activeTab: 'roadmap',
			selectedPhase: 1,
			planningDir: '.planning',
		});

		// Should include plan files, context files, and ROADMAP
		expect(files.length).toBeGreaterThan(0);
		expect(files.some((f) => f.includes('ROADMAP.md'))).toBe(true);
		expect(files.some((f) => f.includes('01-'))).toBe(true);
	});

	test('roadmap tab without phase returns only ROADMAP', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockImplementation((path) => {
			return typeof path === 'string' && path.includes('ROADMAP');
		});

		const { files } = useExternalEditor({
			activeTab: 'roadmap',
			selectedPhase: undefined,
			planningDir: '.planning',
		});

		expect(files).toEqual([expect.stringContaining('ROADMAP.md')]);
	});

	test('phase tab returns phase files only', () => {
		// Mock phases directory with Dirent objects (for findPhaseDir)
		// Mock phase files directory with string array (for file listing)
		(readdirSync as ReturnType<typeof vi.fn>).mockImplementation((path, options) => {
			if (options?.withFileTypes) {
				// Return Dirent objects for phases directory
				return [{ isDirectory: () => true, name: '01-core-tui' }];
			}
			// Return string array for phase file listing
			return ['01-01-PLAN.md', '01-CONTEXT.md', 'README.md'];
		});

		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

		const { files } = useExternalEditor({
			activeTab: 'phase',
			selectedPhase: 1,
			planningDir: '.planning',
		});

		// Should include phase files (01-*.md, CONTEXT.md, PLAN.md, etc.)
		expect(files.length).toBeGreaterThan(0);
		expect(
			files.every((f) => f.includes('01') || f.includes('CONTEXT') || f.includes('PLAN'))
		).toBe(true);
	});

	test('todos tab returns todo file path if exists', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockImplementation((path) => {
			return (
				typeof path === 'string' &&
				path.includes('todos/pending') &&
				path.includes('test-task.md')
			);
		});

		const { files } = useExternalEditor({
			activeTab: 'todos',
			selectedTodo: 'pending-test-task.md',
			planningDir: '.planning',
		});

		expect(files).toEqual([expect.stringContaining('todos/pending/test-task.md')]);
	});

	test('todos tab returns empty array when todo file does not exist', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

		const { files } = useExternalEditor({
			activeTab: 'todos',
			selectedTodo: 'pending-test-task.md',
			planningDir: '.planning',
		});

		expect(files).toEqual([]);
	});

	test('todos tab returns empty array for invalid todo ID', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

		const { files } = useExternalEditor({
			activeTab: 'todos',
			selectedTodo: 'invalid-todo-id',
			planningDir: '.planning',
		});

		expect(files).toEqual([]);
	});

	test('background tab returns empty array', () => {
		const { files } = useExternalEditor({
			activeTab: 'background',
			planningDir: '.planning',
		});

		expect(files).toEqual([]);
	});

	test('handles missing phase directory gracefully', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

		const { files } = useExternalEditor({
			activeTab: 'phase',
			selectedPhase: 99, // Non-existent phase
			planningDir: '.planning',
		});

		expect(files).toEqual([]);
	});

	test('phase tab with no selected phase returns empty array', () => {
		const { files } = useExternalEditor({
			activeTab: 'phase',
			selectedPhase: undefined,
			planningDir: '.planning',
		});

		expect(files).toEqual([]);
	});
});

describe('openInEditor and hook returns', () => {
	test('openInEditor uses EDITOR env var', () => {
		const originalEditor = process.env.EDITOR;
		process.env.EDITOR = 'vim';

		(spawnSync as ReturnType<typeof vi.fn>).mockReturnValue({ status: 0 });

		// Setup mocks for file listing
		(readdirSync as ReturnType<typeof vi.fn>).mockImplementation((path, options) => {
			if (options?.withFileTypes) {
				return [{ isDirectory: () => true, name: '01-core-tui' }];
			}
			return ['ROADMAP.md'];
		});

		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

		// Test openInEditor via hook open function
		const { open } = useExternalEditor({
			activeTab: 'roadmap',
			selectedPhase: 1,
			planningDir: '.planning',
		});

		const result = open();

		expect(spawnSync).toHaveBeenCalledWith(
			'vim',
			[expect.any(String)],
			{ stdio: 'inherit', env: process.env }
		);
		expect(result).toBe(true);

		process.env.EDITOR = originalEditor;
	});

	test('openInEditor falls back to VISUAL if EDITOR not set', () => {
		const originalEditor = process.env.EDITOR;
		const originalVisual = process.env.VISUAL;
		delete process.env.EDITOR;
		process.env.VISUAL = 'nano';

		(spawnSync as ReturnType<typeof vi.fn>).mockReturnValue({ status: 0 });

		// Setup mocks
		(readdirSync as ReturnType<typeof vi.fn>).mockReturnValue(['ROADMAP.md']);
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

		const { open } = useExternalEditor({
			activeTab: 'roadmap',
			planningDir: '.planning',
		});

		const result = open();

		expect(spawnSync).toHaveBeenCalledWith('nano', expect.any(Array), expect.any(Object));
		expect(result).toBe(true);

		process.env.EDITOR = originalEditor;
		process.env.VISUAL = originalVisual;
	});

	test('openInEditor falls back to vim if no env vars set', () => {
		const originalEditor = process.env.EDITOR;
		const originalVisual = process.env.VISUAL;
		delete process.env.EDITOR;
		delete process.env.VISUAL;

		(spawnSync as ReturnType<typeof vi.fn>).mockReturnValue({ status: 0 });

		// Setup mocks
		(readdirSync as ReturnType<typeof vi.fn>).mockReturnValue(['ROADMAP.md']);
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

		const { open } = useExternalEditor({
			activeTab: 'roadmap',
			planningDir: '.planning',
		});

		const result = open();

		expect(spawnSync).toHaveBeenCalledWith('vim', expect.any(Array), expect.any(Object));
		expect(result).toBe(true);

		process.env.EDITOR = originalEditor;
		process.env.VISUAL = originalVisual;
	});

	test('openInEditor handles editor errors gracefully', () => {
		(spawnSync as ReturnType<typeof vi.fn>).mockReturnValue({ status: 1 });

		// Setup mocks
		(readdirSync as ReturnType<typeof vi.fn>).mockReturnValue(['ROADMAP.md']);
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

		const { open } = useExternalEditor({
			activeTab: 'roadmap',
			planningDir: '.planning',
		});

		const result = open();

		expect(result).toBe(false);
	});

	test('openInEditor returns false when no files available', () => {
		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

		const { open } = useExternalEditor({
			activeTab: 'roadmap',
			planningDir: '.planning',
		});

		const result = open();

		expect(result).toBe(false);
		expect(spawnSync).not.toHaveBeenCalled();
	});

	test('hook returns needsPicker true when multiple files', () => {
		// Setup mocks for phase files directory
		(readdirSync as ReturnType<typeof vi.fn>).mockImplementation((path, options) => {
			if (options?.withFileTypes) {
				return [{ isDirectory: () => true, name: '01-core-tui' }];
			}
			// Return multiple phase files
			return ['01-01-PLAN.md', '01-02-PLAN.md', '01-CONTEXT.md'];
		});

		(existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

		const { needsPicker } = useExternalEditor({
			activeTab: 'phase',
			selectedPhase: 1,
			planningDir: '.planning',
		});

		expect(needsPicker).toBe(true);
	});

	test('hook returns empty files array and false needsPicker for background tab', () => {
		const { files, needsPicker } = useExternalEditor({
			activeTab: 'background',
			planningDir: '.planning',
		});

		expect(files).toEqual([]);
		expect(needsPicker).toBe(false);
	});
});
