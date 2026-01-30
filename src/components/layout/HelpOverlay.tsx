/**
 * HelpOverlay Component
 * Full-screen help showing all keyboard shortcuts.
 */

import { Box, Text, useInput } from 'ink';

interface HelpOverlayProps {
	onClose: () => void;
}

interface KeyGroup {
	title: string;
	keys: { key: string; description: string }[];
}

const helpGroups: KeyGroup[] = [
	{
		title: 'Navigation',
		keys: [
			{ key: 'j / k', description: 'Move up / down' },
			{ key: 'h / l', description: 'Collapse / expand' },
			{ key: 'Enter', description: 'Select / expand' },
			{ key: 'gg / G', description: 'Jump to top / bottom' },
			{ key: 'Ctrl+d / Ctrl+u', description: 'Page down / up' },
			{ key: 'Tab / Shift+Tab', description: 'Next / prev tab' },
			{ key: '[ / ]', description: 'Prev / next phase' },
		],
	},
	{
		title: 'Actions',
		keys: [
			{ key: ':', description: 'Command palette' },
			{ key: 'e', description: 'Open in editor' },
			{ key: 'Space', description: 'Toggle todo (in Todos)' },
		],
	},
	{
		title: 'Display',
		keys: [
			{ key: 'd', description: 'Toggle detail level' },
			{ key: 'f', description: 'Filter (in Todos)' },
			{ key: '?', description: 'Toggle this help' },
			{ key: 'q', description: 'Quit' },
		],
	},
];

export function HelpOverlay({ onClose }: HelpOverlayProps) {
	// Close on any key press
	useInput(() => {
		onClose();
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="double"
			borderColor="cyan"
			paddingX={2}
			paddingY={1}
			marginX={1}
		>
			{/* Title */}
			<Box justifyContent="center" marginBottom={1}>
				<Text bold color="cyan">
					GSD Console - Keyboard Shortcuts
				</Text>
			</Box>

			{/* Key groups */}
			{helpGroups.map((group) => (
				<Box key={group.title} flexDirection="column" marginBottom={1}>
					<Text bold color="yellow">
						{group.title}
					</Text>
					<Box flexDirection="column" marginLeft={2}>
						{group.keys.map(({ key, description }) => (
							<Box key={key}>
								<Box width={20}>
									<Text color="green">{key}</Text>
								</Box>
								<Text>{description}</Text>
							</Box>
						))}
					</Box>
				</Box>
			))}

			{/* Footer */}
			<Box justifyContent="center" marginTop={1}>
				<Text dimColor italic>
					Press any key to close
				</Text>
			</Box>
		</Box>
	);
}
