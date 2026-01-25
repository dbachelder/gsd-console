/**
 * External Editor Hook
 * Opens files in the user's preferred editor ($EDITOR).
 * Handles alternate screen management for clean TUI resume.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Context needed to determine which files can be edited.
 */
export interface EditContext {
	activeTab: 'roadmap' | 'phase' | 'todos';
	selectedPhase?: number;
	selectedTodo?: string;
	planningDir: string;
}

/**
 * Find the phase directory for a given phase number.
 * Phase directories are named like "01-name", "02-name", etc.
 */
function findPhaseDir(planningDir: string, phaseNumber: number): string | null {
	const phasesDir = join(planningDir, 'phases');
	if (!existsSync(phasesDir)) return null;

	// Look for directory starting with the phase number
	const dirs = readdirSync(phasesDir, { withFileTypes: true });

	// Pad to 2 digits: 1 -> "01", 10 -> "10"
	const paddedNum = String(phaseNumber).padStart(2, '0');

	for (const dir of dirs) {
		if (dir.isDirectory() && dir.name.startsWith(`${paddedNum}-`)) {
			return join(phasesDir, dir.name);
		}
	}

	return null;
}

/**
 * Get list of editable files based on current context.
 * Returns file paths that exist and can be edited.
 */
export function getEditableFiles(context: EditContext): string[] {
	const { activeTab, selectedPhase, selectedTodo, planningDir } = context;

	switch (activeTab) {
		case 'roadmap': {
			// Roadmap tab: ROADMAP.md
			const roadmapPath = join(planningDir, 'ROADMAP.md');
			return existsSync(roadmapPath) ? [roadmapPath] : [];
		}

		case 'phase': {
			if (selectedPhase === undefined) return [];

			const phaseDir = findPhaseDir(planningDir, selectedPhase);
			if (!phaseDir) return [];

			// Check for common phase files
			const candidates = [
				`${String(selectedPhase).padStart(2, '0')}-CONTEXT.md`,
				`${String(selectedPhase).padStart(2, '0')}-PLAN.md`,
				`${String(selectedPhase).padStart(2, '0')}-RESEARCH.md`,
				'CONTEXT.md',
				'PLAN.md',
				'RESEARCH.md',
			];

			// Also check for numbered plan files like 03-01-PLAN.md
			const paddedNum = String(selectedPhase).padStart(2, '0');
			const planPattern = new RegExp(`^${paddedNum}-\\d{2}-PLAN\\.md$`);

			// Read directory for matching files
			const files = readdirSync(phaseDir);

			const editableFiles: string[] = [];

			// Add phase-specific plan files (like 03-01-PLAN.md, 03-02-PLAN.md)
			for (const file of files) {
				if (planPattern.test(file)) {
					editableFiles.push(join(phaseDir, file));
				}
			}

			// Add general files
			for (const candidate of candidates) {
				const filePath = join(phaseDir, candidate);
				if (existsSync(filePath) && !editableFiles.includes(filePath)) {
					editableFiles.push(filePath);
				}
			}

			return editableFiles;
		}

		case 'todos': {
			if (!selectedTodo) return [];

			// Todo IDs are like "pending-some-task.md" or "done-completed-task.md"
			const match = /^(pending|done)-(.+)$/.exec(selectedTodo);
			if (!match?.[1] || !match[2]) return [];

			const status = match[1];
			const filename = match[2];
			const todoPath = join(planningDir, 'todos', status, filename);
			return existsSync(todoPath) ? [todoPath] : [];
		}

		default:
			return [];
	}
}

/**
 * Open a file in the user's external editor.
 * Handles alternate screen management for clean terminal state.
 *
 * @param filePath - Absolute path to the file to edit
 * @returns true if editor exited successfully (status 0)
 */
export function openInEditor(filePath: string): boolean {
	// Get editor from environment
	const editor = process.env.EDITOR || process.env.VISUAL || 'vim';

	// Exit alternate screen (TUI screen) before spawning editor
	process.stdout.write('\x1b[?1049l');

	// Also clear screen and reset cursor for cleaner handoff
	process.stdout.write('\x1b[2J\x1b[H');

	try {
		// Spawn editor synchronously with inherited stdio
		const result = spawnSync(editor, [filePath], {
			stdio: 'inherit',
			env: process.env,
		});

		// Re-enter alternate screen (return to TUI)
		process.stdout.write('\x1b[?1049h');

		// Clear and redraw will happen via Ink's re-render
		process.stdout.write('\x1b[2J\x1b[H');

		return result.status === 0;
	} catch {
		// On error, still try to restore alternate screen
		process.stdout.write('\x1b[?1049h');
		process.stdout.write('\x1b[2J\x1b[H');
		return false;
	}
}

/**
 * Hook return type
 */
export interface UseExternalEditorReturn {
	/** List of files that can be edited in current context */
	files: string[];
	/** Open a file in editor. If no path provided, opens first file. */
	open: (path?: string) => boolean;
	/** True if multiple files available (picker needed) */
	needsPicker: boolean;
}

/**
 * Hook for external editor integration.
 * Provides list of editable files and open function based on context.
 *
 * @param context - Current view context (tab, selection)
 * @returns Files list, open function, and picker flag
 */
export function useExternalEditor(context: EditContext): UseExternalEditorReturn {
	const files = getEditableFiles(context);

	const open = (path?: string): boolean => {
		if (files.length === 0) return false;

		const firstFile = files[0];
		const targetPath = path ?? firstFile;
		if (!targetPath) return false;

		return openInEditor(targetPath);
	};

	return {
		files,
		open,
		needsPicker: files.length > 1,
	};
}
