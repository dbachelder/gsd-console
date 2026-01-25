/**
 * TabLayout Component
 * Manages tab navigation and renders active view.
 */

import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import { useTabNav } from '../../hooks/useTabNav.ts';
import type { CliFlags, GsdData } from '../../lib/types.ts';
import { PhaseView } from '../phase/PhaseView.tsx';
import { RoadmapView } from '../roadmap/RoadmapView.tsx';
import { TodosView } from '../todos/TodosView.tsx';

type TabId = 'roadmap' | 'phase' | 'todos';

interface TabLayoutProps {
	data: GsdData;
	flags: CliFlags;
	isActive?: boolean;
	onTabChange?: (tab: TabId) => void;
	isPhaseHighlighted?: (phaseNumber: number) => boolean;
	isPhaseFading?: (phaseNumber: number) => boolean;
	isTodoHighlighted?: (todoId: string) => boolean;
	isTodoFading?: (todoId: string) => boolean;
}

export function TabLayout({
	data,
	flags,
	isActive = true,
	onTabChange,
	isPhaseHighlighted,
	isPhaseFading,
	isTodoHighlighted,
	isTodoFading,
}: TabLayoutProps) {
	const isOnlyMode = Boolean(flags.only);

	// Track selected phase number (for Phase view navigation)
	const [selectedPhaseNumber, setSelectedPhaseNumber] = useState<number>(flags.phase ?? 1);

	// Tab navigation using hook
	const { activeTab, setActiveTab } = useTabNav<TabId>({
		tabs: ['roadmap', 'phase', 'todos'],
		initialTab: flags.only ?? 'roadmap',
		isActive: isActive && !isOnlyMode,
	});

	// Notify parent of tab changes
	useEffect(() => {
		onTabChange?.(activeTab);
	}, [activeTab, onTabChange]);

	// Get selected phase object
	const selectedPhase =
		data.phases.find((p) => p.number === selectedPhaseNumber) ?? data.phases[0] ?? null;

	// Handle phase selection from roadmap
	const handleSelectPhase = (phaseNumber: number) => {
		setSelectedPhaseNumber(phaseNumber);
		setActiveTab('phase');
	};

	// Single view mode (--only flag) - fill terminal height
	if (flags.only) {
		return (
			<Box flexDirection="column" flexGrow={1}>
				{flags.only === 'roadmap' && (
					<RoadmapView
						phases={data.phases}
						isActive={isActive}
						onSelectPhase={handleSelectPhase}
						isPhaseHighlighted={isPhaseHighlighted}
						isPhaseFading={isPhaseFading}
					/>
				)}
				{flags.only === 'phase' && (
					<PhaseView
						phase={selectedPhase}
						allPhases={data.phases}
						isActive={isActive}
						onPhaseChange={setSelectedPhaseNumber}
					/>
				)}
				{flags.only === 'todos' && (
					<TodosView
						todos={data.todos}
						isActive={isActive}
						isTodoHighlighted={isTodoHighlighted}
						isTodoFading={isTodoFading}
					/>
				)}
			</Box>
		);
	}

	// Full tabbed layout
	return (
		<Box flexDirection="column">
			{/* Tab bar */}
			<TabBar activeTab={activeTab} />

			{/* Active view content */}
			<Box flexDirection="column">
				{activeTab === 'roadmap' && (
					<RoadmapView
						phases={data.phases}
						isActive={isActive}
						onSelectPhase={handleSelectPhase}
						isPhaseHighlighted={isPhaseHighlighted}
						isPhaseFading={isPhaseFading}
					/>
				)}
				{activeTab === 'phase' && (
					<PhaseView
						phase={selectedPhase}
						allPhases={data.phases}
						isActive={isActive}
						onPhaseChange={setSelectedPhaseNumber}
					/>
				)}
				{activeTab === 'todos' && (
					<TodosView
						todos={data.todos}
						isActive={isActive}
						isTodoHighlighted={isTodoHighlighted}
						isTodoFading={isTodoFading}
					/>
				)}
			</Box>
		</Box>
	);
}

interface TabBarProps {
	activeTab: TabId;
}

function TabBar({ activeTab }: TabBarProps) {
	const tabs: { id: TabId; label: string; key: string }[] = [
		{ id: 'roadmap', label: 'Roadmap', key: '1' },
		{ id: 'phase', label: 'Phase', key: '2' },
		{ id: 'todos', label: 'Todos', key: '3' },
	];

	return (
		<Box marginBottom={1} paddingX={1}>
			{tabs.map((tab, index) => (
				<Box key={tab.id}>
					{index > 0 && <Text dimColor> | </Text>}
					<Text
						bold={activeTab === tab.id}
						color={activeTab === tab.id ? 'cyan' : undefined}
						backgroundColor={activeTab === tab.id ? 'gray' : undefined}
					>
						{' '}
						[{tab.key}] {tab.label}{' '}
					</Text>
				</Box>
			))}
		</Box>
	);
}
