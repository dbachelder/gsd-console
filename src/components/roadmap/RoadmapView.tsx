/**
 * RoadmapView Component
 * Displays all phases with navigation and expandable details.
 */

import { Box, Text, useInput } from 'ink';
import { useCallback, useEffect, useState } from 'react';
import { useVimNav } from '../../hooks/useVimNav.ts';
import type { Phase } from '../../lib/types.ts';
import { PhaseRow } from './PhaseRow.tsx';
import { ProgressBar } from './ProgressBar.tsx';

interface RoadmapViewProps {
	phases: Phase[];
	isActive: boolean;
	onSelectPhase?: (phaseNumber: number) => void;
	onPhaseNavigate?: (phaseNumber: number) => void;
	isPhaseHighlighted?: (phaseNumber: number) => boolean;
	isPhaseFading?: (phaseNumber: number) => boolean;
	showToast?: (message: string, type?: 'info' | 'success' | 'warning') => void;
	/** Optional selected phase number for state restoration */
	selectedPhaseNumber?: number;
	/** Optional scroll offset for state restoration */
	scrollOffset?: number;
	/** Optional callback when scroll position changes */
	onScrollOffsetChange?: (offset: number) => void;
	/** Controlled expanded phases state */
	expandedPhases?: number[];
	/** Callback when expanded phases change */
	onExpandedPhasesChange?: (phases: number[]) => void;
	/** Controlled selected index state */
	selectedIndex?: number;
	/** Callback when selected index changes */
	onSelectedIndexChange?: (index: number) => void;
}

export function RoadmapView({
	phases,
	isActive,
	onSelectPhase,
	onPhaseNavigate,
	isPhaseHighlighted,
	isPhaseFading,
	showToast,
	selectedPhaseNumber: _selectedPhaseNumber,
	scrollOffset: _scrollOffset,
	onScrollOffsetChange: _onScrollOffsetChange,
	expandedPhases: expandedPhasesProp,
	onExpandedPhasesChange,
	selectedIndex: selectedIndexProp,
	onSelectedIndexChange,
}: RoadmapViewProps) {
	// Track which phases are expanded (internal state if not controlled)
	const [internalExpandedPhases, setInternalExpandedPhases] = useState<Set<number>>(new Set());

	// Use controlled state if provided, else internal
	const expandedSet =
		expandedPhasesProp !== undefined ? new Set(expandedPhasesProp) : internalExpandedPhases;

	// Toggle expansion for selected phase
	const toggleExpand = useCallback(
		(index: number) => {
			const phase = phases[index];
			if (!phase) return;

			const next = new Set(expandedSet);
			if (next.has(phase.number)) {
				next.delete(phase.number);
			} else {
				next.add(phase.number);
			}

			// Report to parent if controlled
			onExpandedPhasesChange?.([...next]);
			// Update internal if uncontrolled
			if (expandedPhasesProp === undefined) {
				setInternalExpandedPhases(next);
			}
		},
		[phases, expandedSet, expandedPhasesProp, onExpandedPhasesChange],
	);

	// Collapse selected phase
	const collapseSelected = useCallback(
		(index: number) => {
			const phase = phases[index];
			if (!phase) return;

			if (expandedSet.has(phase.number)) {
				const next = new Set(expandedSet);
				next.delete(phase.number);

				// Report to parent if controlled
				onExpandedPhasesChange?.([...next]);
				// Update internal if uncontrolled
				if (expandedPhasesProp === undefined) {
					setInternalExpandedPhases(next);
				}
			}
		},
		[phases, expandedSet, expandedPhasesProp, onExpandedPhasesChange],
	);

	// Vim navigation with controlled index support
	const { selectedIndex } = useVimNav({
		itemCount: phases.length,
		pageSize: 10,
		isActive,
		initialIndex: selectedIndexProp ?? 0,
		onIndexChange: onSelectedIndexChange,
		onSelect: () => {
			toggleExpand(selectedIndex);
		},
		onBack: () => collapseSelected(selectedIndex),
	});

	// Notify parent of phase navigation for editor context
	useEffect(() => {
		const phase = phases[selectedIndex];
		if (phase) {
			onPhaseNavigate?.(phase.number);
		}
	}, [selectedIndex, phases, onPhaseNavigate]);

	// Handle Enter key for navigating to Phase tab
	useInput(
		(_input, key) => {
			if (key.return) {
				const phase = phases[selectedIndex];
				if (phase && expandedSet.has(phase.number)) {
					onSelectPhase?.(phase.number);
				}
			}
		},
		{ isActive },
	);

	// Handle r key for reorder mode stub
	// Note: 'd' key is reserved for future /gsd-discuss-phase command
	useInput(
		(input) => {
			if (input === 'r') {
				// Reorder mode stub - will be implemented in Phase 4
				showToast?.('Phase reorder mode - will be implemented in Phase 4', 'info');
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
							isExpanded={expandedSet.has(phase.number)}
							showIndicators={true}
							isHighlighted={isPhaseHighlighted?.(phase.number)}
							isFading={isPhaseFading?.(phase.number)}
						/>
					))
				)}
			</Box>
		</Box>
	);
}
