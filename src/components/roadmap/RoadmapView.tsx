/**
 * RoadmapView Component
 * Displays all phases with navigation and expandable details.
 */

import { Box, Text, useInput } from 'ink';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useVimNav } from '../../hooks/useVimNav.ts';
import type { Phase } from '../../lib/types.ts';
import { PhaseRow } from './PhaseRow.tsx';

interface RoadmapViewProps {
	phases: Phase[];
	isActive: boolean;
	onSelectPhase?: (phaseNumber: number) => void;
	onPhaseNavigate?: (phaseNumber: number) => void;
	isPhaseHighlighted?: (phaseNumber: number) => boolean;
	isPhaseFading?: (phaseNumber: number) => boolean;
	showToast?: (message: string, type?: 'info' | 'success' | 'warning') => void;
	/** Initial expanded phases for state restoration */
	initialExpandedPhases?: number[];
	/** Initial selected index for state restoration */
	initialSelectedIndex?: number;
	/** Callback to save state on unmount (should not trigger re-renders) */
	onSaveState?: (state: { expandedPhases: number[]; selectedIndex: number }) => void;
}

export function RoadmapView({
	phases,
	isActive,
	onSelectPhase,
	onPhaseNavigate,
	isPhaseHighlighted,
	isPhaseFading,
	showToast,
	initialExpandedPhases,
	initialSelectedIndex,
	onSaveState,
}: RoadmapViewProps) {
	// Calculate max fraction width for right-alignment
	const fractionWidth =
		phases.length > 0
			? Math.max(...phases.map((p) => `${p.plansComplete}/${p.plansTotal}`.length))
			: 5;
	// Calculate max "N: Title" width for left-alignment (including colon and space)
	const phaseTitleWidth =
		phases.length > 0 ? Math.max(...phases.map((p) => `${p.number}: ${p.name}`.length)) : 0;
	// Track which phases are expanded - initialize from props
	const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
		() => new Set(initialExpandedPhases ?? []),
	);

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

			setExpandedPhases((prev) => {
				if (prev.has(phase.number)) {
					const next = new Set(prev);
					next.delete(phase.number);
					return next;
				}
				return prev;
			});
		},
		[phases],
	);

	// Vim navigation - initialize from props
	const { selectedIndex } = useVimNav({
		itemCount: phases.length,
		pageSize: 10,
		isActive,
		initialIndex: initialSelectedIndex ?? 0,
		onSelect: () => {
			toggleExpand(selectedIndex);
		},
		onBack: () => collapseSelected(selectedIndex),
	});

	// Track current state in refs for unmount save
	const expandedRef = useRef(expandedPhases);
	const selectedIndexRef = useRef(selectedIndex);
	expandedRef.current = expandedPhases;
	selectedIndexRef.current = selectedIndex;

	// Save state on unmount (ref-based, no re-renders)
	useEffect(() => {
		return () => {
			onSaveState?.({
				expandedPhases: [...expandedRef.current],
				selectedIndex: selectedIndexRef.current,
			});
		};
	}, [onSaveState]);

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
				if (phase && expandedPhases.has(phase.number)) {
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

	return (
		<Box flexDirection="column" paddingX={1} flexGrow={1}>
			{/* Phase list header */}
			<Text bold>Phases:</Text>
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
							showIndicators={true}
							isHighlighted={isPhaseHighlighted?.(phase.number)}
							isFading={isPhaseFading?.(phase.number)}
							fractionWidth={fractionWidth}
							phaseTitleWidth={phaseTitleWidth}
						/>
					))
				)}
			</Box>
		</Box>
	);
}
