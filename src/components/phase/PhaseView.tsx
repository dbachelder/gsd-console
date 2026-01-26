/**
 * PhaseView Component
 * Detailed view of a single phase with goal, criteria, and requirements.
 */

import { existsSync, readdirSync } from 'node:fs';
import { Box, Text, useInput } from 'ink';
import { useCallback, useMemo } from 'react';
import { useVimNav } from '../../hooks/useVimNav.ts';
import { getIndicatorIcons, getStatusColor, getStatusIcon } from '../../lib/icons.ts';
import { type PlanInfo, parsePlanFiles } from '../../lib/parser.ts';
import type { Phase } from '../../lib/types.ts';
import { CriteriaList } from './CriteriaList.tsx';
import { GoalSection } from './GoalSection.tsx';
import { RequirementsList } from './RequirementsList.tsx';

interface PhaseViewProps {
	phase: Phase | null;
	allPhases: Phase[];
	isActive: boolean;
	onPhaseChange?: (phaseNumber: number) => void;
	/** Controlled detail level (1-3) */
	detailLevel: number;
	/** Callback when detail level changes */
	onDetailLevelChange: (level: number) => void;
	/** Optional scroll offset for state restoration */
	scrollOffset?: number;
	/** Optional callback when scroll position changes */
	onScrollOffsetChange?: (offset: number) => void;
	/** Planning directory path */
	planningDir?: string;
}

// Detail levels
type DetailLevel = 1 | 2 | 3;

/**
 * Find the phase directory name (e.g., "01-core-tui" for phase 1)
 */
function findPhaseDirectory(phasesDir: string, phaseNumber: number): string | null {
	if (!existsSync(phasesDir)) return null;

	const dirs = readdirSync(phasesDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	// Look for directory starting with phase number (01-, 03.1-, etc.)
	// All phases < 10 need zero-padding (both integer and decimal)
	const paddedNumber = phaseNumber < 10 ? `0${phaseNumber}` : `${phaseNumber}`;
	const numPrefix = `${phaseNumber}`;

	for (const dir of dirs) {
		if (dir.startsWith(`${paddedNumber}-`) || dir.startsWith(`${numPrefix}-`)) {
			return dir;
		}
	}

	return null;
}

export function PhaseView({
	phase,
	allPhases,
	isActive,
	onPhaseChange,
	detailLevel,
	onDetailLevelChange,
	scrollOffset: _scrollOffset,
	onScrollOffsetChange: _onScrollOffsetChange,
	planningDir = '.planning',
}: PhaseViewProps) {
	// Cast to DetailLevel type (1-3) for internal use
	const currentDetailLevel = (detailLevel as DetailLevel) || 1;

	// Calculate max plans complete width for alignment
	const maxPlansWidth =
		allPhases.length > 0 ? Math.max(...allPhases.map((p) => String(p.plansComplete).length)) : 2;

	// Parse plan files for this phase
	const planInfos: PlanInfo[] = useMemo(() => {
		if (!phase) return [];
		const phasesDir = `${planningDir}/phases`;
		const phaseDirName = findPhaseDirectory(phasesDir, phase.number);
		if (!phaseDirName) return [];
		// Derive phaseId for ROADMAP lookup - e.g., "03.1" for decimal, "01" for integer
		// All phases < 10 need zero-padding (both integer and decimal)
		const phaseId = phase.number < 10 ? `0${phase.number}` : String(phase.number);
		return parsePlanFiles(`${phasesDir}/${phaseDirName}`, phase.number, planningDir, phaseId);
	}, [phase, planningDir]);

	// Find current phase index
	const currentIndex = phase ? allPhases.findIndex((p) => p.number === phase.number) : -1;

	// Navigate to previous/next phase
	const navigatePrev = useCallback(() => {
		if (currentIndex > 0) {
			const prevPhase = allPhases[currentIndex - 1];
			if (prevPhase) {
				onPhaseChange?.(prevPhase.number);
			}
		}
	}, [currentIndex, allPhases, onPhaseChange]);

	const navigateNext = useCallback(() => {
		if (currentIndex < allPhases.length - 1) {
			const nextPhase = allPhases[currentIndex + 1];
			if (nextPhase) {
				onPhaseChange?.(nextPhase.number);
			}
		}
	}, [currentIndex, allPhases, onPhaseChange]);

	// Calculate content lines for scrolling
	const contentLines = phase
		? [
				...(phase.goal ? [phase.goal] : []),
				...phase.successCriteria,
				...(detailLevel >= 2 ? phase.requirements : []),
			]
		: [];

	// Vim navigation for scrolling (scrollOffset used for future scroll rendering)
	useVimNav({
		itemCount: Math.max(contentLines.length, 1),
		pageSize: 15,
		isActive,
		onSelect: () => {}, // No action on select in phase view
		onBack: () => {}, // No action on back in phase view
	});

	// Handle [ and ] keys for phase navigation, d for detail toggle
	useInput(
		(input) => {
			if (input === '[') {
				navigatePrev();
			} else if (input === ']') {
				navigateNext();
			} else if (input === 'd') {
				const nextLevel = ((currentDetailLevel % 3) + 1) as DetailLevel;
				onDetailLevelChange?.(nextLevel);
			}
		},
		{ isActive },
	);

	// No phase selected
	if (!phase) {
		return (
			<Box flexDirection="column" paddingX={1}>
				<Box borderStyle="single" paddingX={1}>
					<Text dimColor>No phase selected. Use [/] to navigate phases.</Text>
				</Box>
			</Box>
		);
	}

	const statusIcon = getStatusIcon(phase.status);
	const statusColor = getStatusColor(phase.status);
	const indicators = getIndicatorIcons(phase.indicators);
	const hasActiveIndicators = indicators.some((ind) => ind.active);

	return (
		<Box flexDirection="column" paddingX={1} flexGrow={1}>
			{/* Phase header */}
			<Box flexDirection="column" marginBottom={1}>
				<Box>
					<Text bold color="cyan">
						Phase {phase.number}: {phase.name}
					</Text>
				</Box>
				<Box>
					<Text color={statusColor}>
						{statusIcon} {phase.status}
					</Text>
					<Text dimColor>
						{' '}
						| {String(phase.plansComplete).padStart(maxPlansWidth, ' ')}/{phase.plansTotal} plans
						complete
					</Text>
				</Box>
				{hasActiveIndicators && (
					<Box>
						<Text dimColor>Indicators: </Text>
						{indicators
							.filter((ind) => ind.active)
							.map((ind, i, arr) => (
								<Text key={ind.label}>
									{ind.icon} {ind.label}
									{i < arr.length - 1 ? '  ' : ''}
								</Text>
							))}
					</Box>
				)}
			</Box>

			{/* Phase content */}
			<Box flexDirection="column" borderStyle="single" paddingX={1}>
				{/* Level 1: Goal + Success Criteria */}
				<GoalSection goal={phase.goal} />

				{/* Plan list (inside the box, below goal) */}
				{planInfos.length > 0 && (
					<Box flexDirection="column" marginBottom={1}>
						<Text bold color="yellow">
							Plans:
						</Text>
						{planInfos.map((plan) => (
							<Box key={plan.id} flexDirection="column" paddingLeft={2}>
								<Box>
									<Text color={plan.completed ? 'green' : undefined}>
										[{plan.completed ? '✓' : ' '}]{' '}
									</Text>
									<Text>{plan.summary}</Text>
								</Box>
								{/* Wave/task info on second line at detail level 2+ */}
								{detailLevel >= 2 && (
									<Box paddingLeft={4}>
										<Text dimColor>
											(Wave {plan.wave}, {plan.taskCount} task{plan.taskCount !== 1 ? 's' : ''})
										</Text>
									</Box>
								)}
							</Box>
						))}
					</Box>
				)}

				{/* Success Criteria (secondary) */}
				<CriteriaList
					criteria={phase.successCriteria}
					phaseComplete={phase.status === 'complete'}
				/>

				{/* Level 2: Requirements + Dependencies */}
				{detailLevel >= 2 && (
					<>
						<RequirementsList requirements={phase.requirements} />
						{phase.dependsOn && (
							<Box marginBottom={1}>
								<Text bold color="yellow">
									Depends on:{' '}
								</Text>
								<Text>{phase.dependsOn}</Text>
							</Box>
						)}
					</>
				)}

				{/* Level 3: Additional context (placeholder for future) */}
				{detailLevel >= 3 && (
					<Box marginBottom={1}>
						<Text dimColor italic>
							(Additional context would appear here if available)
						</Text>
					</Box>
				)}
			</Box>

			{/* Navigation hints */}
			<Box marginTop={1}>
				<Text dimColor>
					Phase {currentIndex + 1}/{allPhases.length} | Detail level: {detailLevel}/3 | [: prev | ]:
					next | d: toggle detail
				</Text>
			</Box>
		</Box>
	);
}
