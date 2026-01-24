/**
 * TabLayout Component
 * Manages tab navigation and renders active view.
 */

import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import { getStatusColor, getStatusIcon } from '../../lib/icons.ts';
import type { CliFlags, GsdData } from '../../lib/types.ts';

type TabId = 'roadmap' | 'phase' | 'todos';

interface TabLayoutProps {
	data: GsdData;
	flags: CliFlags;
}

export function TabLayout({ data, flags }: TabLayoutProps) {
	const isOnlyMode = Boolean(flags.only);

	// Tab state - always called unconditionally
	const [activeTab, setActiveTab] = useState<TabId>(flags.only ?? 'roadmap');

	// Tab navigation with number keys and Tab key - always called unconditionally
	// but only active when not in --only mode
	useInput(
		(input, key) => {
			if (isOnlyMode) return; // No-op in only mode
			if (input === '1') setActiveTab('roadmap');
			if (input === '2') setActiveTab('phase');
			if (input === '3') setActiveTab('todos');
			if (key.tab) {
				setActiveTab((current) => {
					if (current === 'roadmap') return 'phase';
					if (current === 'phase') return 'todos';
					return 'roadmap';
				});
			}
		},
		{ isActive: !isOnlyMode },
	);

	// Single view mode (--only flag)
	if (flags.only) {
		return (
			<Box flexDirection="column" paddingX={1}>
				{flags.only === 'roadmap' && <RoadmapPlaceholder phases={data.phases} />}
				{flags.only === 'phase' && (
					<PhasePlaceholder phases={data.phases} phaseNumber={flags.phase ?? 1} />
				)}
				{flags.only === 'todos' && <TodosPlaceholder todos={data.todos} />}
			</Box>
		);
	}

	// Full tabbed layout
	return (
		<Box flexDirection="column">
			{/* Tab bar */}
			<TabBar activeTab={activeTab} />

			{/* Active view content */}
			<Box flexDirection="column" paddingX={1}>
				{activeTab === 'roadmap' && <RoadmapPlaceholder phases={data.phases} />}
				{activeTab === 'phase' && <PhasePlaceholder phases={data.phases} phaseNumber={1} />}
				{activeTab === 'todos' && <TodosPlaceholder todos={data.todos} />}
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

// Placeholder components - will be replaced with full views in Plan 02

interface RoadmapPlaceholderProps {
	phases: GsdData['phases'];
}

function RoadmapPlaceholder({ phases }: RoadmapPlaceholderProps) {
	return (
		<Box flexDirection="column" borderStyle="single" paddingX={1}>
			<Text bold color="yellow">
				Roadmap View
			</Text>
			<Text dimColor>{phases.length} phases loaded</Text>
			<Box marginTop={1} flexDirection="column">
				{phases.slice(0, 5).map((phase) => (
					<Box key={phase.number}>
						<Text color={getStatusColor(phase.status)}>{getStatusIcon(phase.status)} </Text>
						<Text>
							Phase {phase.number}: {phase.name}
						</Text>
						<Text dimColor>
							{' '}
							({phase.plansComplete}/{phase.plansTotal} plans)
						</Text>
					</Box>
				))}
				{phases.length > 5 && <Text dimColor>...and {phases.length - 5} more</Text>}
			</Box>
		</Box>
	);
}

interface PhasePlaceholderProps {
	phases: GsdData['phases'];
	phaseNumber: number;
}

function PhasePlaceholder({ phases, phaseNumber }: PhasePlaceholderProps) {
	const phase = phases.find((p) => p.number === phaseNumber) ?? phases[0];

	if (!phase) {
		return (
			<Box flexDirection="column" borderStyle="single" paddingX={1}>
				<Text color="red">No phases found</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" borderStyle="single" paddingX={1}>
			<Text bold color="yellow">
				Phase {phase.number}: {phase.name}
			</Text>
			<Box marginTop={1}>
				<Text color={getStatusColor(phase.status)}>
					{getStatusIcon(phase.status)} {phase.status}
				</Text>
			</Box>
			<Box marginTop={1} flexDirection="column">
				<Text bold>Goal:</Text>
				<Text>{phase.goal || '(No goal specified)'}</Text>
			</Box>
			<Box marginTop={1}>
				<Text dimColor>
					Plans: {phase.plansComplete}/{phase.plansTotal} complete
				</Text>
			</Box>
		</Box>
	);
}

interface TodosPlaceholderProps {
	todos: GsdData['todos'];
}

function TodosPlaceholder({ todos }: TodosPlaceholderProps) {
	return (
		<Box flexDirection="column" borderStyle="single" paddingX={1}>
			<Text bold color="yellow">
				Todos View
			</Text>
			<Text dimColor>{todos.length} items</Text>
			{todos.length === 0 ? (
				<Text dimColor>No todos found</Text>
			) : (
				<Box marginTop={1} flexDirection="column">
					{todos.slice(0, 5).map((todo) => (
						<Box key={todo.id}>
							<Text color={todo.completed ? 'green' : 'gray'}>[{todo.completed ? 'x' : ' '}] </Text>
							<Text strikethrough={todo.completed}>{todo.text}</Text>
						</Box>
					))}
					{todos.length > 5 && <Text dimColor>...and {todos.length - 5} more</Text>}
				</Box>
			)}
		</Box>
	);
}
