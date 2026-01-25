/**
 * useGsdData Hook
 * Load and parse GSD planning documents into typed data structures.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { useEffect, useRef, useState } from 'react';
import { parseRoadmap, parseState, parseTodos, readPlanningFile } from '../lib/parser.ts';
import type { GsdData, ProjectState } from '../lib/types.ts';

const defaultState: ProjectState = {
	currentPhase: 1,
	totalPhases: 0,
	projectName: 'GSD Project',
	coreValue: '',
	progressPercent: 0,
	lastActivity: '',
};

const defaultData: GsdData = {
	phases: [],
	todos: [],
	state: defaultState,
	loading: true,
	error: null,
	changedFiles: [],
};

/**
 * Hook to load and manage GSD planning data
 * @param planningDir Path to the .planning directory (default: '.planning')
 * @param refreshTrigger Timestamp that triggers data reload when changed
 * @param changedFiles Array of files that changed (from file watcher)
 */
export function useGsdData(
	planningDir = '.planning',
	refreshTrigger?: number,
	changedFiles: string[] = [],
): GsdData {
	const [data, setData] = useState<GsdData>(defaultData);
	// Use ref to store changedFiles, update outside effect to avoid dependency
	// This prevents the render loop caused by changedFiles array reference changing
	const changedFilesRef = useRef<string[]>([]);
	changedFilesRef.current = changedFiles;

	useEffect(() => {
		// refreshTrigger is intentionally used only as a dependency to force re-runs
		// when file changes are detected by the file watcher
		void refreshTrigger;

		const loadData = async () => {
			try {
				const absDir = join(process.cwd(), planningDir);

				// Check if planning directory exists
				if (!existsSync(absDir)) {
					setData({
						...defaultData,
						loading: false,
						error: new Error(`Planning directory not found: ${planningDir}`),
					});
					return;
				}

				// Read ROADMAP.md
				const roadmapPath = join(absDir, 'ROADMAP.md');
				const { content: roadmapContent } = readPlanningFile(roadmapPath);

				// Read STATE.md
				const statePath = join(absDir, 'STATE.md');
				const { content: stateContent } = readPlanningFile(statePath);

				// Read PROJECT.md for project name and core value
				const projectPath = join(absDir, 'PROJECT.md');
				const { content: projectContent } = readPlanningFile(projectPath);

				// Parse phases from roadmap
				const phasesDir = join(absDir, 'phases');
				const phases = parseRoadmap(roadmapContent, phasesDir);

				// Parse state
				let state = parseState(stateContent);

				// Enhance state with project info
				if (projectContent) {
					const nameMatch = /^#\s+(.+?)$/m.exec(projectContent);
					const coreValueMatch = /\*\*?Core Value\*\*?:?\s*(.+?)(?=\n|$)/i.exec(projectContent);

					if (nameMatch) {
						state = { ...state, projectName: nameMatch[1]?.trim() ?? state.projectName };
					}
					if (coreValueMatch) {
						state = { ...state, coreValue: coreValueMatch[1]?.trim() ?? state.coreValue };
					}
				}

				// Update total phases from parsed roadmap
				state = { ...state, totalPhases: phases.length };

				// Calculate progress based on completed phases (not plans)
				// This gives 25% per phase (1/4 = 25%, 2/4 = 50%, etc.)
				const completedPhases = phases.filter((p) => p.status === 'complete').length;
				state = {
					...state,
					progressPercent:
						phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0,
				};

				// Parse todos
				const todos = parseTodos(stateContent, absDir);

				setData({
					phases,
					todos,
					state,
					loading: false,
					error: null,
					changedFiles: changedFilesRef.current,
				});
			} catch (error) {
				setData({
					...defaultData,
					loading: false,
					error: error instanceof Error ? error : new Error('Failed to load planning data'),
				});
			}
		};

		loadData();
	}, [planningDir, refreshTrigger]); // changedFiles removed - use ref instead to avoid render loop

	return data;
}

export default useGsdData;
