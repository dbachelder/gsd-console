/**
 * WorkQueueView Component
 * Displays user-managed GSD command queue with Vim navigation.
 */

import { Box, Text } from 'ink';
import { useVimNav } from '../../hooks/useVimNav.ts';
import type { QueuedCommand } from '../../lib/types.ts';
import { QueueEntry } from './QueueEntry.tsx';

interface WorkQueueViewProps {
	queue: QueuedCommand[];
	isActive?: boolean;
	onQueueRemove?: (id: string) => void;
	showToast?: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

export function WorkQueueView({
	queue,
	isActive = true,
	onQueueRemove,
	showToast,
}: WorkQueueViewProps) {
	const nav = useVimNav({
		itemCount: queue.length,
		pageSize: 10,
		isActive,
		onSelect: () => {
			// Remove selected command on Enter
			if (nav.selectedIndex < queue.length && onQueueRemove) {
				const command = queue[nav.selectedIndex];
				if (command) {
					onQueueRemove(command.id);
					showToast?.(`Removed: ${command.command}`, 'info');
				}
			}
		},
	});

	if (queue.length === 0) {
		return (
			<Box flexDirection="column" padding={2}>
				<Text dimColor>No commands in queue</Text>
				<Box marginTop={1}>
					<Text dimColor>Press 'w' in Roadmap or Phase tab to add commands</Text>
				</Box>
			</Box>
		);
	}

	// Calculate visible range
	const endIndex = Math.min(nav.scrollOffset + 10, queue.length);
	const visibleCommands = queue.slice(nav.scrollOffset, endIndex);

	return (
		<Box flexDirection="column">
			{visibleCommands.map((command, index) => {
				const absoluteIndex = nav.scrollOffset + index;
				const isSelected = absoluteIndex === nav.selectedIndex;
				return (
					<Box key={command.id}>
						<QueueEntry command={command} isSelected={isSelected} />
					</Box>
				);
			})}
		</Box>
	);
}

export default WorkQueueView;
