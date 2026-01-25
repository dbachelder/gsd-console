/**
 * Header Component
 * Displays project name, phase indicator, and progress bar.
 */

import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';
import { formatProgressBar } from '../../lib/icons.ts';
import type { ProjectState } from '../../lib/types.ts';

interface HeaderProps {
	projectName: string;
	state: ProjectState;
	isRefreshing?: boolean;
}

export function Header({ projectName, state, isRefreshing = false }: HeaderProps) {
	const progress = formatProgressBar(state.progressPercent, 20);

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="cyan"
			paddingX={1}
			marginBottom={1}
		>
			{/* Title row */}
			<Box justifyContent="space-between">
				<Box>
					<Text bold color="cyan">
						GSD Status
					</Text>
					{isRefreshing && (
						<Box marginLeft={1}>
							<Spinner label="" />
						</Box>
					)}
				</Box>
				<Text>
					<Text dimColor>Phase </Text>
					<Text bold color="yellow">
						{state.currentPhase}
					</Text>
					<Text dimColor>/{state.totalPhases}</Text>
				</Text>
			</Box>

			{/* Project name and progress */}
			<Box justifyContent="space-between" marginTop={1}>
				<Text>{projectName}</Text>
				<Box>
					<Text color="green">{progress.filled}</Text>
					<Text dimColor>{progress.empty}</Text>
					<Text dimColor> {state.progressPercent}%</Text>
				</Box>
			</Box>
		</Box>
	);
}
