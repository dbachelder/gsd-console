/**
 * Job Entry Component
 * Per CONTEXT.md: Expandable entries, collapsed by default, expand to see full output.
 */

import { Spinner } from '@inkjs/ui';
import { Box, Text } from 'ink';
import type { BackgroundJob } from '../../lib/types.ts';

interface JobEntryProps {
	/** The background job to display */
	job: BackgroundJob;
	/** Whether this job is currently selected */
	isSelected: boolean;
	/** Whether this job is expanded */
	isExpanded: boolean;
}

/** Format timestamp as HH:MM:SS */
function formatTime(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
}

/** Get status color for job status */
function getStatusColor(status: BackgroundJob['status']): string | undefined {
	switch (status) {
		case 'pending':
			return 'yellow';
		case 'running':
			return 'cyan';
		case 'complete':
			return 'green';
		case 'failed':
			return 'red';
		case 'cancelled':
			return 'gray';
		default:
			return undefined;
	}
}

/** Get status display text */
function getStatusText(status: BackgroundJob['status']): string {
	return status;
}

/** Get relevant timestamp for display based on status */
function getDisplayTime(job: BackgroundJob): string {
	switch (job.status) {
		case 'pending':
			return formatTime(job.queuedAt);
		case 'running':
			return formatTime(job.startedAt ?? job.queuedAt);
		case 'complete':
		case 'failed':
		case 'cancelled':
			return formatTime(job.completedAt ?? job.queuedAt);
		default:
			return formatTime(job.queuedAt);
	}
}

export function JobEntry({ job, isSelected, isExpanded }: JobEntryProps) {
	const statusColor = getStatusColor(job.status);
	const expandIcon = isExpanded ? 'v' : '>';
	const isRunning = job.status === 'running';

	// Truncate output to ~10 lines for display
	const outputLines = job.output?.split('\n').slice(0, 10) ?? [];
	const hasMoreOutput = (job.output?.split('\n').length ?? 0) > 10;

	return (
		<Box flexDirection="column">
			{/* Collapsed header line */}
			<Box>
				{/* Selection indicator */}
				<Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
					{isSelected ? '\u276F' : ' '}
				</Text>

				{/* Expand/collapse indicator */}
				<Text dimColor> {expandIcon} </Text>

				{/* Status with spinner for running */}
				<Text>[</Text>
				{isRunning ? (
					<Box>
						<Spinner type="dots" />
					</Box>
				) : (
					<Text color={statusColor}>{getStatusText(job.status)}</Text>
				)}
				<Text>]</Text>

				{/* Command name */}
				<Text> {job.command}</Text>

				{/* Timestamp */}
				<Box flexGrow={1} />
				<Text dimColor>{getDisplayTime(job)}</Text>
			</Box>

			{/* Expanded details */}
			{isExpanded && (
				<Box flexDirection="column" marginLeft={4} marginTop={1}>
					{/* Timestamps */}
					<Box>
						<Text dimColor>
							Queued: {formatTime(job.queuedAt)}
							{job.startedAt && ` | Started: ${formatTime(job.startedAt)}`}
							{job.completedAt && ` | Ended: ${formatTime(job.completedAt)}`}
						</Text>
					</Box>

					{/* Error message if failed */}
					{job.error && (
						<Box marginTop={1}>
							<Text color="red">Error: {job.error}</Text>
						</Box>
					)}

					{/* Output preview */}
					{outputLines.length > 0 && (
						<Box flexDirection="column" marginTop={1}>
							<Text dimColor>Output:</Text>
							{outputLines.map((line, lineIndex) => (
								<Text key={`output-${lineIndex}-${line.slice(0, 10)}`} dimColor>
									{' '}
									{line}
								</Text>
							))}
							{hasMoreOutput && <Text dimColor> ...</Text>}
						</Box>
					)}

					{/* Cancel hint for active jobs */}
					{(job.status === 'pending' || job.status === 'running') && (
						<Box marginTop={1}>
							<Text dimColor>Press </Text>
							<Text color="yellow">x</Text>
							<Text dimColor> to cancel</Text>
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
}
