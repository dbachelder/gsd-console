/**
 * PhaseView Component
 * Detailed view of a single phase with goal, criteria, and requirements.
 */

import { Box, Text, useInput } from 'ink';
import { useCallback } from 'react';
import { useVimNav } from '../../hooks/useVimNav.ts';
import { getIndicatorIcons, getStatusColor, getStatusIcon } from '../../lib/icons.ts';
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
}

// Detail levels
type DetailLevel = 1 | 2 | 3;

export function PhaseView({
	phase,
	allPhases,
	isActive,
	onPhaseChange,
	detailLevel,
	onDetailLevelChange,
	scrollOffset: _scrollOffset,
	onScrollOffsetChange: _onScrollOffsetChange,
}: PhaseViewProps) {
	// Cast to DetailLevel type (1-3) for internal use
	const currentDetailLevel = (detailLevel as DetailLevel) || 1;

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
						| {phase.plansComplete}/{phase.plansTotal} plans complete
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
				<CriteriaList criteria={phase.successCriteria} />

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
