/**
 * CommandPalette Component
 * Provides fuzzy-filtered command list with text input and Tab completion.
 */

import { useFuzzySearchList } from '@nozbe/microfuzz/react';
import { Box, Text, useInput } from 'ink';
import { useEffect, useState } from 'react';
import type { ToastType } from '../../hooks/useToast.ts';
import type { Command } from '../../lib/commands.ts';
import { CommandItem } from './CommandItem.tsx';

interface CommandPaletteProps {
	commands: Command[];
	query: string;
	onQueryChange: (query: string) => void;
	selectedIndex: number;
	onSelectedIndexChange: (index: number) => void;
	onExecute: (
		command: Command,
		showToast: (msg: string, type?: ToastType) => void,
		args?: string,
	) => void;
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
	onClose,
}: CommandPaletteProps) {
	// Local input state for controlled input (mirrors query prop)
	const [inputValue, setInputValue] = useState(query);

	// Sync local state when query changes externally (e.g., on open)
	useEffect(() => {
		setInputValue(query);
	}, [query]);

	// Fuzzy search filtering - only match on command name part (before space)
	const queryForSearch = query.split(' ')[0] ?? query;
	const filteredCommands = useFuzzySearchList({
		list: commands,
		queryText: queryForSearch,
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
				// Extract arguments from query (everything after command name and space)
				const spaceIndex = inputValue.indexOf(' ');
				const args = spaceIndex >= 0 ? inputValue.slice(spaceIndex + 1).trim() : undefined;
				onExecute(selectedCommand, showToast, args || undefined);
			}
		}
	};

	// Handle Tab completion
	const handleTabComplete = () => {
		if (filteredCommands.length > 0) {
			const selectedCommand = filteredCommands[selectedIndex];
			if (selectedCommand) {
				// Complete to command name + space (ready for args)
				const completed = `${selectedCommand.name} `;
				setInputValue(completed);
				onQueryChange(completed);
			}
		}
	};

	// Custom controlled input handler
	useInput((input, key) => {
		// Tab: autocomplete to selected command
		if (key.tab) {
			handleTabComplete();
			return;
		}

		// Enter: submit/execute
		if (key.return) {
			handleSubmit();
			return;
		}

		// Escape: close palette (handled by parent hook)
		if (key.escape) {
			onClose();
			return;
		}

		// Backspace: delete last character
		if (key.backspace || key.delete) {
			const newValue = inputValue.slice(0, -1);
			setInputValue(newValue);
			onQueryChange(newValue);
			return;
		}

		// Regular character input (ignore control keys)
		if (input && !key.ctrl && !key.meta && input.length === 1) {
			const newValue = inputValue + input;
			setInputValue(newValue);
			onQueryChange(newValue);
		}
	});

	const visibleCommands = filteredCommands.slice(0, MAX_VISIBLE_ITEMS);

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="blue"
			paddingX={1}
			backgroundColor="black"
		>
			<Box marginBottom={1}>
				<Text color="blue" bold>
					:
				</Text>
				<Text>{inputValue || ''}</Text>
				<Text color="gray">|</Text>
				{!inputValue && <Text dimColor>type command...</Text>}
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

			<Box marginTop={1}>
				<Text dimColor>Tab: complete | Enter: execute | Esc: close</Text>
			</Box>
		</Box>
	);
}
