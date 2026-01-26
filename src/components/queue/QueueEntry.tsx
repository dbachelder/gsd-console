/**
 * QueueEntry Component
 * Renders a single queued command with status icon.
 */

import { Box, Text } from 'ink';
import type { QueuedCommand } from '../../lib/types.ts';

interface QueueEntryProps {
	command: QueuedCommand;
	isSelected: boolean;
}

/** Get status icon and color for command */
function getStatusIcon(status: QueuedCommand['status']): { icon: string; color: string } {
	switch (status) {
		case 'pending':
			return { icon: '○', color: 'gray' };
		case 'running':
			return { icon: '◐', color: 'cyan' };
		case 'complete':
			return { icon: '✓', color: 'green' };
		case 'failed':
			return { icon: '✗', color: 'red' };
	}
}

export function QueueEntry({ command, isSelected }: QueueEntryProps) {
	const { icon, color } = getStatusIcon(command.status);

	return (
		<Box>
			<Text color={color} bold={isSelected}>
				{icon}{' '}
			</Text>
			<Text bold={isSelected}>{command.command}</Text>
			{command.args && <Text dimColor> {command.args}</Text>}
		</Box>
	);
}

export default QueueEntry;
