/**
 * GSD Document Parser
 * Utilities for parsing ROADMAP.md, STATE.md, and other planning docs.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import type { Phase, PhaseIndicators, PhaseStatus, ProjectState, Todo } from './types.ts';

/**
 * Parse ROADMAP.md into an array of Phases
 */
export function parseRoadmap(content: string, phasesDir: string): Phase[] {
	const phases: Phase[] = [];

	// Split into phase sections (### Phase N: Name)
	const goalPattern = /\*\*Goal\*\*:\s*(.+?)(?=\n)/;
	const dependsPattern = /\*\*Depends on\*\*:\s*(.+?)(?=\n)/;
	const requirementsPattern = /\*\*Requirements\*\*:\s*(.+?)(?=\n)/;
	const successCriteriaPattern = /\*\*Success Criteria\*\*[\s\S]*?(?=\*\*Plans|###|$)/;
	const plansPattern = /\*\*Plans\*\*:\s*(\d+)\s*plans?/;

	// Find all phase sections
	const sections = content.split(/(?=###\s+Phase)/);

	for (const section of sections) {
		const headerMatch = /###\s+Phase\s+([\d.]+):\s+(.+?)(?=\n)/.exec(section);
		if (!headerMatch) continue;

		const phaseNumber = parseFloat(headerMatch[1] ?? '0');
		const phaseName = headerMatch[2]?.trim() ?? '';

		// Extract goal
		const goalMatch = goalPattern.exec(section);
		const goal = goalMatch?.[1]?.trim() ?? '';

		// Extract depends on
		const dependsMatch = dependsPattern.exec(section);
		const dependsOn = dependsMatch?.[1]?.trim() ?? null;

		// Extract requirements (comma-separated IDs)
		const reqMatch = requirementsPattern.exec(section);
		const requirements = reqMatch?.[1] ? reqMatch[1].split(',').map((r) => r.trim()) : [];

		// Extract success criteria (numbered list)
		const criteriaMatch = successCriteriaPattern.exec(section);
		const successCriteria: string[] = [];
		if (criteriaMatch) {
			// Match numbered lines, accounting for possible leading whitespace
			const criteriaLines = criteriaMatch[0].match(/^\s*\d+\.\s+.+$/gm);
			if (criteriaLines) {
				for (const line of criteriaLines) {
					// Remove leading whitespace, number prefix, and trailing whitespace
					const text = line.replace(/^\s*\d+\.\s+/, '').trim();
					if (text) successCriteria.push(text);
				}
			}
		}

		// Extract plans count
		const plansMatch = plansPattern.exec(section);
		const plansTotal = plansMatch ? parseInt(plansMatch[1] ?? '0', 10) : 0;

		// Determine phase directory name
		const phaseDirName = findPhaseDirectory(phasesDir, phaseNumber, phaseName);
		const indicators = phaseDirName
			? scanPhaseDirectory(`${phasesDir}/${phaseDirName}`, phaseNumber)
			: {
					hasContext: false,
					hasPlan: false,
					hasResearch: false,
					uatComplete: false,
				};

		// Count completed plans by checking for SUMMARY files
		const plansComplete = phaseDirName
			? countCompletedPlans(`${phasesDir}/${phaseDirName}`, phaseNumber)
			: 0;

		// Determine status based on indicators and progress
		const status = determinePhaseStatus(plansComplete, plansTotal, indicators);

		phases.push({
			number: phaseNumber,
			name: phaseName,
			goal,
			status,
			requirements,
			successCriteria,
			dependsOn: dependsOn === 'Nothing (first phase)' ? null : dependsOn,
			indicators,
			plansTotal,
			plansComplete,
		});
	}

	return phases;
}

/**
 * Find the phase directory name (e.g., "01-core-tui" for phase 1)
 */
function findPhaseDirectory(
	phasesDir: string,
	phaseNumber: number,
	_phaseName: string,
): string | null {
	if (!existsSync(phasesDir)) return null;

	const dirs = readdirSync(phasesDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	// Look for directory starting with phase number (01-, 1.1-, etc.)
	const paddedNumber = phaseNumber < 10 ? `0${phaseNumber}` : `${phaseNumber}`;
	const numPrefix = `${phaseNumber}`;

	for (const dir of dirs) {
		if (dir.startsWith(`${paddedNumber}-`) || dir.startsWith(`${numPrefix}-`)) {
			return dir;
		}
	}

	return null;
}

/**
 * Scan a phase directory to determine indicator flags
 */
export function scanPhaseDirectory(phaseDir: string, phaseNumber: number): PhaseIndicators {
	const indicators: PhaseIndicators = {
		hasContext: false,
		hasPlan: false,
		hasResearch: false,
		uatComplete: false,
	};

	if (!existsSync(phaseDir)) return indicators;

	const files = readdirSync(phaseDir);
	const paddedNumber = phaseNumber < 10 ? `0${phaseNumber}` : `${phaseNumber}`;

	for (const file of files) {
		const lowerFile = file.toLowerCase();
		if (lowerFile.includes('context.md') || lowerFile === `${paddedNumber}-context.md`) {
			indicators.hasContext = true;
		}
		if (lowerFile.includes('plan.md') && !lowerFile.includes('summary')) {
			indicators.hasPlan = true;
		}
		if (lowerFile.includes('research.md')) {
			indicators.hasResearch = true;
		}
		// Check UAT files for status: passed/complete (e.g., 01-UAT.md, 01-UAT-retest.md)
		if (lowerFile.includes('-uat') && lowerFile.endsWith('.md')) {
			const { data } = readPlanningFile(`${phaseDir}/${file}`);
			if (data.status === 'passed' || data.status === 'complete') {
				indicators.uatComplete = true;
			}
		}
	}

	return indicators;
}

/**
 * Count completed plans in a phase directory by counting SUMMARY files
 */
function countCompletedPlans(phaseDir: string, phaseNumber: number): number {
	if (!existsSync(phaseDir)) return 0;

	const files = readdirSync(phaseDir);
	const paddedNumber = phaseNumber < 10 ? `0${phaseNumber}` : `${phaseNumber}`;

	// Count files matching pattern XX-NN-SUMMARY.md
	let count = 0;
	for (const file of files) {
		if (file.startsWith(paddedNumber) && file.toUpperCase().includes('SUMMARY.MD')) {
			count++;
		}
	}

	return count;
}

/**
 * Determine phase status based on progress and indicators
 */
function determinePhaseStatus(
	plansComplete: number,
	plansTotal: number,
	indicators: PhaseIndicators,
): PhaseStatus {
	if (plansTotal > 0 && plansComplete >= plansTotal) {
		return 'complete';
	}
	if (plansComplete > 0 || indicators.hasPlan) {
		return 'in-progress';
	}
	if (indicators.hasContext || indicators.hasResearch) {
		return 'in-progress';
	}
	return 'not-started';
}

/**
 * Parse STATE.md into ProjectState
 */
export function parseState(content: string): ProjectState {
	const state: ProjectState = {
		currentPhase: 1,
		totalPhases: 4,
		projectName: 'GSD Project',
		coreValue: '',
		progressPercent: 0,
		lastActivity: '',
	};

	// Extract current phase from "Phase: X of Y"
	const phaseMatch = /Phase:\s*(\d+)\s*of\s*(\d+)/i.exec(content);
	if (phaseMatch) {
		state.currentPhase = parseInt(phaseMatch[1] ?? '1', 10);
		state.totalPhases = parseInt(phaseMatch[2] ?? '4', 10);
	}

	// Extract progress percentage from progress bar or explicit percentage
	const progressMatch = /Progress:\s*\[([^\]]+)\]\s*(\d+)%/i.exec(content);
	if (progressMatch) {
		state.progressPercent = parseInt(progressMatch[2] ?? '0', 10);
	}

	// Extract last activity
	const activityMatch = /Last activity:\s*(.+?)(?=\n|$)/i.exec(content);
	if (activityMatch) {
		state.lastActivity = activityMatch[1]?.trim() ?? '';
	}

	// Extract core value
	const coreValueMatch = /\*\*Core value:\*\*\s*(.+?)(?=\n|$)/i.exec(content);
	if (coreValueMatch) {
		state.coreValue = coreValueMatch[1]?.trim() ?? '';
	}

	// Try to extract project name from "Current focus:" or heading
	const focusMatch = /\*\*Current focus:\*\*\s*(.+?)(?=\n|$)/i.exec(content);
	if (focusMatch) {
		// Extract just the phase name without "Phase X - "
		const focusText = focusMatch[1]?.trim() ?? '';
		const cleanName = focusText.replace(/Phase\s*\d+\s*-?\s*/i, '').trim();
		if (cleanName) state.projectName = cleanName;
	}

	return state;
}

/**
 * Extract todos from .planning/todos/pending/ and .planning/todos/done/ directories
 */
export function parseTodos(_stateContent: string, planningDir?: string): Todo[] {
	const todos: Todo[] = [];
	const baseDir = planningDir ?? '.planning';

	// Read pending todos
	const pendingDir = `${baseDir}/todos/pending`;
	if (existsSync(pendingDir)) {
		const files = readdirSync(pendingDir).filter((f) => f.endsWith('.md'));
		for (const file of files) {
			const filePath = `${pendingDir}/${file}`;
			const { data } = readPlanningFile(filePath);
			if (data.title) {
				const area = data.area ? ` (${data.area})` : '';
				todos.push({
					id: `pending-${file}`,
					text: `${data.title}${area}`,
					completed: false,
					source: filePath,
				});
			}
		}
	}

	// Read done todos
	const doneDir = `${baseDir}/todos/done`;
	if (existsSync(doneDir)) {
		const files = readdirSync(doneDir).filter((f) => f.endsWith('.md'));
		for (const file of files) {
			const filePath = `${doneDir}/${file}`;
			const { data } = readPlanningFile(filePath);
			if (data.title) {
				const area = data.area ? ` (${data.area})` : '';
				todos.push({
					id: `done-${file}`,
					text: `${data.title}${area}`,
					completed: true,
					source: filePath,
				});
			}
		}
	}

	return todos;
}

/**
 * Read and parse a GSD planning file safely
 */
export function readPlanningFile(filePath: string): {
	content: string;
	data: Record<string, unknown>;
} {
	if (!existsSync(filePath)) {
		return { content: '', data: {} };
	}

	try {
		const raw = readFileSync(filePath, 'utf-8');
		const { data, content } = matter(raw);
		return { content, data: data as Record<string, unknown> };
	} catch {
		return { content: '', data: {} };
	}
}

/**
 * Plan information extracted from PLAN.md files
 */
export interface PlanInfo {
	id: string; // Plan number like "01", "02"
	summary: string;
	taskCount: number;
	wave: number;
}

/**
 * Extract plan summaries from ROADMAP.md
 * Plan summaries live in ROADMAP.md (format: `- [ ] XX-YY-PLAN.md — Summary`),
 * not in PLAN.md frontmatter.
 */
function readRoadmapPlans(roadmapPath: string, phaseId: string): Map<string, string> {
	const summaryMap = new Map<string, string>();

	try {
		const roadmapContent = readFileSync(roadmapPath, 'utf-8');

		// Find the phase section (handles both integer and decimal phases like "03.1")
		// Escape dots in phaseId for regex matching
		const escapedPhaseId = phaseId.replace(/\./g, '\\.');
		const sectionRegex = new RegExp(`Phase ${escapedPhaseId}:.*?Plans:[\\s\\S]*?(?=###|$)`, 'i');
		const section = roadmapContent.match(sectionRegex)?.[0] ?? '';

		// Match plan lines: `- [x] 03.1-01-PLAN.md — Summary text`
		const planRegex = /- \[.\] ([\d.]+-\d+-PLAN\.md)\s*[—-]\s*(.+)/g;
		const matches = section.matchAll(planRegex);

		for (const match of matches) {
			const planFile = match[1] ?? ''; // e.g., "03.1-01-PLAN.md"
			const summary = match[2] ?? ''; // e.g., "Sticky footer, tab styling..."
			// Extract plan number from filename
			const planIdMatch = planFile.match(/-(\d+)-PLAN\.md$/);
			const planId = planIdMatch?.[1] ?? '';
			if (planId && summary) summaryMap.set(planId, summary);
		}
	} catch {
		// Return empty map if ROADMAP.md doesn't exist or parsing fails
	}

	return summaryMap;
}

/**
 * Count task elements in PLAN.md content
 */
function parseTaskCount(content: string): number {
	// Count <task> tags in PLAN.md content
	const taskMatches = content.match(/<task/g);
	return taskMatches?.length ?? 0;
}

/**
 * Parse PLAN.md files in a phase directory to extract summary, task count, and wave info.
 * Summaries come from ROADMAP.md, task count and wave come from PLAN.md files.
 */
export function parsePlanFiles(
	phaseDir: string,
	phaseNumber: number,
	planningDir?: string,
	phaseId?: string,
): PlanInfo[] {
	const plans: PlanInfo[] = [];
	const baseDir = planningDir ?? '.planning';

	try {
		// Determine phaseId for ROADMAP lookup
		// For decimal phases like 03.1, use the full ID; for integer phases, use padded number
		const effectivePhaseId =
			phaseId ?? (phaseNumber < 10 ? `0${phaseNumber}` : String(phaseNumber));

		// Get plan summaries from ROADMAP.md
		const roadmapPath = `${baseDir}/ROADMAP.md`;
		const summaryMap = readRoadmapPlans(roadmapPath, effectivePhaseId);

		// Find all PLAN.md files in phase directory
		if (!existsSync(phaseDir)) return [];
		const files = readdirSync(phaseDir);

		// Match files like "01-01-PLAN.md", "03.1-02-PLAN.md"
		const planFileRegex = /^[\d.]+-(\d+)-PLAN\.md$/i;

		for (const file of files) {
			const match = planFileRegex.exec(file);
			if (!match) continue;

			const planId = match[1] ?? ''; // e.g., "01", "02"
			if (!planId) continue;

			const filePath = `${phaseDir}/${file}`;
			const { content, data } = readPlanningFile(filePath);

			plans.push({
				id: planId,
				summary: summaryMap.get(planId) ?? 'No summary available',
				taskCount: parseTaskCount(content),
				wave: typeof data.wave === 'number' ? data.wave : 1,
			});
		}
	} catch {
		// Return empty array if phase directory doesn't exist or parsing fails
		return [];
	}

	// Sort by plan ID
	return plans.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
}
