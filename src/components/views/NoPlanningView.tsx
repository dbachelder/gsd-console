/**
 * NoPlanningView Component
 * Displayed when no .planning directory exists.
 * Shows helpful instructions for setting up a new GSD project.
 */

import { Box, Text } from 'ink';

interface NoPlanningViewProps {
	currentDir: string;
}

export function NoPlanningView({ currentDir }: NoPlanningViewProps) {
	return (
		<Box flexDirection="column" padding={2}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text bold color="cyan">
					Welcome to GSD Console
				</Text>
			</Box>

			{/* Current directory info */}
			<Box marginBottom={2}>
				<Text dimColor>Current directory: </Text>
				<Text>{currentDir}</Text>
			</Box>

			{/* No planning directory message */}
			<Box
				borderStyle="round"
				borderColor="yellow"
				padding={1}
				flexDirection="column"
				marginBottom={2}
			>
				<Text bold color="yellow">
					No .planning directory found
				</Text>
				<Box marginTop={1}>
					<Text>This directory doesn't have a GSD project set up yet.</Text>
				</Box>
			</Box>

			{/* Setup instructions */}
			<Box flexDirection="column" marginBottom={2}>
				<Text bold>How to start a new GSD project:</Text>

				<Box marginTop={1} marginLeft={2} flexDirection="column">
					<Text bold color="green">
						Option 1: Using OpenCode
					</Text>
					<Box marginLeft={2} flexDirection="column">
						<Text dimColor>
							1. Install GSD: <Text color="cyan">gsd install --global --opencode</Text>
						</Text>
						<Text dimColor>
							2. Start OpenCode: <Text color="cyan">opencode</Text>
						</Text>
						<Text dimColor>
							3. Run: <Text color="cyan">/gsd-new-project "Your Project Name"</Text>
						</Text>
					</Box>
				</Box>

				<Box marginTop={1} marginLeft={2} flexDirection="column">
					<Text bold color="magenta">
						Option 2: Using Claude Code
					</Text>
					<Box marginLeft={2} flexDirection="column">
						<Text dimColor>
							1. Install GSD: <Text color="magenta">gsd install --global</Text>
						</Text>
						<Text dimColor>2. Open Claude Code in this directory</Text>
						<Text dimColor>
							3. Run: <Text color="magenta">/gsd-new-project "Your Project Name"</Text>
						</Text>
					</Box>
				</Box>
			</Box>

			{/* Auto-refresh notice */}
			<Box borderStyle="single" borderColor="dim" padding={1}>
				<Text dimColor>
					Watching for changes... The UI will automatically appear when you create a .planning
					directory.
				</Text>
			</Box>

			{/* Footer */}
			<Box marginTop={2}>
				<Text dimColor>Press q to quit</Text>
			</Box>
		</Box>
	);
}

export default NoPlanningView;
