/**
 * CommandPalette Component
 * Provides fuzzy-filtered command list with text input.
 */

import { TextInput } from '@inkjs/ui';
import { useFuzzySearchList } from '@nozbe/microfuzz/react';
import { Box, Text } from 'ink';
import { useEffect } from 'react';
import type { ToastType } from '../../hooks/useToast.ts';
import type { Command } from '../../lib/commands.ts';
import { CommandItem } from './CommandItem.tsx';

interface CommandPaletteProps {
	commands: Command[];
	query: string;
	onQueryChange: (query: string) => void;
	selectedIndex: number;
	onSelectedIndexChange: (index: number) => void;
	onExecute: (command: Command, showToast: (msg: string, type?: ToastType) => void) => void;
	showToast: (msg: string, type?: ToastType) => void;
	onClose: () => void;
}

const MAX_VISIBLE_ITEMS = 8;

export function CommandPalette({
	commands,
	query,
	onQueryChange,
	selectedIndex,
	onSelectedIndexChange,
	onExecute,
	showToast,
}: CommandPaletteProps) {
	// Fuzzy search filtering
	const filteredCommands = useFuzzySearchList({
		list: commands,
		queryText: query,
		getText: (item) => [item.name, item.description],
		mapResultItem: ({ item }) => item,
	});

	// Clamp selected index when filtered results change
	useEffect(() => {
		if (selectedIndex >= filteredCommands.length) {
			onSelectedIndexChange(Math.max(0, filteredCommands.length - 1));
		}
	}, [filteredCommands.length, selectedIndex, onSelectedIndexChange]);

	// Handle command execution on submit
	const handleSubmit = () => {
		if (filteredCommands.length > 0 && selectedIndex < filteredCommands.length) {
			const selectedCommand = filteredCommands[selectedIndex];
			if (selectedCommand) {
				onExecute(selectedCommand, showToast);
			}
		}
	};

	const visibleCommands = filteredCommands.slice(0, MAX_VISIBLE_ITEMS);

	return (
		<Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={1}>
			<Box marginBottom={1}>
				<Text color="blue" bold>
					:
				</Text>
				<TextInput placeholder="type command..." onChange={onQueryChange} onSubmit={handleSubmit} />
			</Box>

			{visibleCommands.length === 0 ? (
				<Text dimColor>No matching commands</Text>
			) : (
				visibleCommands.map((command, index) => (
					<CommandItem key={command.name} command={command} isSelected={index === selectedIndex} />
				))
			)}

			{filteredCommands.length > MAX_VISIBLE_ITEMS && (
				<Text dimColor>... and {filteredCommands.length - MAX_VISIBLE_ITEMS} more</Text>
			)}
		</Box>
	);
}
