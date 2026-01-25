/**
 * CommandItem Component
 * Displays a single command in the command palette.
 */

import { Box, Text } from 'ink';
import type { Command } from '../../lib/commands.ts';

interface CommandItemProps {
	command: Command;
	isSelected: boolean;
}

export function CommandItem({ command, isSelected }: CommandItemProps) {
	return (
		<Box>
			<Text inverse={isSelected} bold={isSelected}>
				{isSelected ? '> ' : '  '}
				{command.name}
			</Text>
			<Text dimColor={!isSelected}> - {command.description}</Text>
		</Box>
	);
}
