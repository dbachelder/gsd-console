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
			{ key: 'j / Down', description: 'Move down' },
			{ key: 'k / Up', description: 'Move up' },
			{ key: 'h / Left', description: 'Collapse / back' },
			{ key: 'l / Right / Enter', description: 'Expand / select' },
			{ key: 'gg', description: 'Jump to top' },
			{ key: 'G', description: 'Jump to bottom' },
			{ key: 'Ctrl+d', description: 'Page down' },
			{ key: 'Ctrl+u', description: 'Page up' },
		],
	},
	{
		title: 'Tabs',
		keys: [
			{ key: 'Tab', description: 'Next tab' },
			{ key: 'Shift+Tab', description: 'Previous tab' },
			{ key: '1 / 2 / 3', description: 'Jump to tab' },
		],
	},
	{
		title: 'Views',
		keys: [
			{ key: 'd', description: 'Toggle detail level' },
			{ key: 'f', description: 'Filter (in Todos)' },
			{ key: '[ / ]', description: 'Prev / next phase' },
		],
	},
	{
		title: 'General',
		keys: [
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
					GSD Status TUI - Keyboard Shortcuts
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
