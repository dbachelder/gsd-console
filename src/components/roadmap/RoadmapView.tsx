/**
 * RoadmapView Component
 * Displays all phases with navigation and expandable details.
 */

import { Box, Text, useInput } from 'ink';
import { useCallback, useState } from 'react';
import { useVimNav } from '../../hooks/useVimNav.ts';
import type { Phase } from '../../lib/types.ts';
import { PhaseRow } from './PhaseRow.tsx';
import { ProgressBar } from './ProgressBar.tsx';

interface RoadmapViewProps {
	phases: Phase[];
	isActive: boolean;
	onSelectPhase?: (phaseNumber: number) => void;
}

export function RoadmapView({ phases, isActive, onSelectPhase }: RoadmapViewProps) {
	// Track which phases are expanded
	const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());

	// Track detail level (d key toggles)
	const [showIndicators, setShowIndicators] = useState(true);

	// Toggle expansion for selected phase
	const toggleExpand = useCallback(
		(index: number) => {
			const phase = phases[index];
			if (!phase) return;

			setExpandedPhases((prev) => {
				const next = new Set(prev);
				if (next.has(phase.number)) {
					next.delete(phase.number);
				} else {
					next.add(phase.number);
				}
				return next;
			});
		},
		[phases],
	);

	// Collapse selected phase
	const collapseSelected = useCallback(
		(index: number) => {
			const phase = phases[index];
			if (!phase) return;

			if (expandedPhases.has(phase.number)) {
				setExpandedPhases((prev) => {
					const next = new Set(prev);
					next.delete(phase.number);
					return next;
				});
			}
		},
		[phases, expandedPhases],
	);

	// Vim navigation
	const { selectedIndex } = useVimNav({
		itemCount: phases.length,
		pageSize: 10,
		isActive,
		onSelect: () => {
			toggleExpand(selectedIndex);
		},
		onBack: () => collapseSelected(selectedIndex),
	});

	// Handle Enter key for navigating to Phase tab
	useInput(
		(_input, key) => {
			if (key.return) {
				const phase = phases[selectedIndex];
				if (phase && expandedPhases.has(phase.number)) {
					onSelectPhase?.(phase.number);
				}
			}
		},
		{ isActive },
	);

	// Handle d key for detail toggle
	useInput(
		(input) => {
			if (input === 'd') {
				setShowIndicators((prev) => !prev);
			}
		},
		{ isActive },
	);

	// Calculate overall project progress
	const totalPlans = phases.reduce((sum, p) => sum + p.plansTotal, 0);
	const completedPlans = phases.reduce((sum, p) => sum + p.plansComplete, 0);
	const overallPercent = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : 0;

	return (
		<Box flexDirection="column" paddingX={1} flexGrow={1}>
			{/* Overall progress header */}
			<Box marginBottom={1}>
				<Text bold>Project Progress: </Text>
				<ProgressBar percent={overallPercent} width={20} />
				<Text dimColor>
					{' '}
					({completedPlans}/{totalPlans} plans)
				</Text>
			</Box>

			{/* Phase list */}
			<Box flexDirection="column" borderStyle="single" paddingX={1}>
				{phases.length === 0 ? (
					<Text dimColor>No phases found</Text>
				) : (
					phases.map((phase, index) => (
						<PhaseRow
							key={phase.number}
							phase={phase}
							isSelected={index === selectedIndex}
							isExpanded={expandedPhases.has(phase.number)}
							showIndicators={showIndicators}
						/>
					))
				)}
			</Box>

			{/* Detail toggle hint */}
			<Box marginTop={1}>
				<Text dimColor>Indicators: {showIndicators ? 'shown' : 'hidden'} (press d to toggle)</Text>
			</Box>
		</Box>
	);
}
