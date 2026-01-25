/**
 * PhaseRow Component
 * Displays a single phase in the roadmap list with status and progress.
 */

import { Box, Text } from 'ink';
import { getIndicatorIcons, getStatusColor, getStatusIcon } from '../../lib/icons.ts';
import type { Phase } from '../../lib/types.ts';
import { ProgressBar } from './ProgressBar.tsx';

interface PhaseRowProps {
	phase: Phase;
	isSelected: boolean;
	isExpanded: boolean;
	showIndicators?: boolean;
}

export function PhaseRow({ phase, isSelected, isExpanded, showIndicators = true }: PhaseRowProps) {
	const chevron = isExpanded ? '\u25BC' : '\u25B6'; // Down or Right triangle
	const statusIcon = getStatusIcon(phase.status);
	const statusColor = getStatusColor(phase.status);

	// Calculate plan completion percentage
	const planPercent =
		phase.plansTotal > 0 ? Math.round((phase.plansComplete / phase.plansTotal) * 100) : 0;

	// Get indicator icons string
	const indicatorIcons = getIndicatorIcons(phase.indicators);

	return (
		<Box flexDirection="column">
			{/* Main phase row */}
			<Box justifyContent="space-between">
				{/* Left side: chevron, status, name */}
				<Box>
					<Text
						backgroundColor={isSelected ? 'gray' : undefined}
						color={isSelected ? 'white' : undefined}
					>
						{/* Chevron */}
						<Text>{chevron} </Text>

						{/* Status icon */}
						<Text color={statusColor}>[{statusIcon}] </Text>

						{/* Phase name */}
						<Text bold={isSelected}>
							Phase {phase.number}: {phase.name}
						</Text>
					</Text>
				</Box>

				{/* Right side: progress bar and count */}
				<Box>
					<ProgressBar percent={planPercent} width={10} showPercent={false} />
					<Text dimColor>
						{' '}
						{phase.plansComplete}/{phase.plansTotal}
					</Text>
				</Box>
			</Box>

			{/* Expanded content: indicator icons */}
			{isExpanded && showIndicators && indicatorIcons && (
				<Box marginLeft={4}>
					<Text dimColor>{indicatorIcons}</Text>
				</Box>
			)}
		</Box>
	);
}
