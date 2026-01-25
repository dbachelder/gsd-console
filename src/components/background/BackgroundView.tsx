/**
 * Background View Component
 * Per CONTEXT.md: Fourth tab in TabLayout, shows background jobs.
 * Provides vim navigation, expand/collapse, and cancel with confirmation.
 */

import { Box, Text, useInput } from 'ink';
import { useCallback, useState } from 'react';
import type { ToastType } from '../../hooks/useToast.ts';
import { useVimNav } from '../../hooks/useVimNav.ts';
import type { BackgroundJob } from '../../lib/types.ts';
import { JobEntry } from './JobEntry.tsx';

interface BackgroundViewProps {
	/** List of background jobs */
	jobs: BackgroundJob[];
	/** Whether this view is active for input */
	isActive: boolean;
	/** Callback to cancel a job */
	onCancel: (jobId: string) => void;
	/** Toast notification function */
	showToast?: (msg: string, type?: ToastType) => void;
}

export function BackgroundView({ jobs, isActive, onCancel, showToast }: BackgroundViewProps) {
	// Track which jobs are expanded
	const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(new Set());

	// Track cancel confirmation state
	const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);

	// Vim navigation for job list
	const { selectedIndex } = useVimNav({
		itemCount: jobs.length,
		pageSize: 10,
		isActive: isActive && confirmingCancelId === null,
		onSelect: handleToggleExpand,
	});

	// Get currently selected job
	const selectedJob = jobs[selectedIndex];

	// Toggle expand/collapse for selected job
	function handleToggleExpand() {
		if (!selectedJob) return;

		setExpandedJobIds((prev) => {
			const next = new Set(prev);
			if (next.has(selectedJob.id)) {
				next.delete(selectedJob.id);
			} else {
				next.add(selectedJob.id);
			}
			return next;
		});
	}

	// Handle cancel request
	const handleCancelRequest = useCallback(() => {
		if (!selectedJob) return;

		// Can only cancel pending or running jobs
		if (selectedJob.status !== 'pending' && selectedJob.status !== 'running') {
			showToast?.('Cannot cancel completed job', 'warning');
			return;
		}

		// Enter confirmation mode
		setConfirmingCancelId(selectedJob.id);
	}, [selectedJob, showToast]);

	// Handle cancel confirmation
	const handleConfirmCancel = useCallback(
		(confirmed: boolean) => {
			if (confirmed && confirmingCancelId) {
				onCancel(confirmingCancelId);
			}
			setConfirmingCancelId(null);
		},
		[confirmingCancelId, onCancel],
	);

	// Input handling for cancel shortcut and confirmation
	useInput(
		(input, key) => {
			// In confirmation mode
			if (confirmingCancelId !== null) {
				if (input === 'y' || input === 'Y') {
					handleConfirmCancel(true);
					return;
				}
				if (input === 'n' || input === 'N' || key.escape) {
					handleConfirmCancel(false);
					return;
				}
				return;
			}

			// Normal mode - x or d to request cancel
			if (input === 'x' || input === 'd') {
				handleCancelRequest();
				return;
			}
		},
		{ isActive },
	);

	// Empty state
	if (jobs.length === 0) {
		return (
			<Box flexDirection="column" padding={2}>
				<Text dimColor>No background jobs.</Text>
				<Box marginTop={1}>
					<Text dimColor>Queue commands with </Text>
					<Text color="cyan">Ctrl+P</Text>
					<Text dimColor> then select </Text>
					<Text color="yellow">[H]</Text>
					<Text dimColor> Headless mode.</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" padding={1}>
			{/* Job list */}
			{jobs.map((job, index) => (
				<Box key={job.id} flexDirection="column">
					<JobEntry
						job={job}
						isSelected={index === selectedIndex}
						isExpanded={expandedJobIds.has(job.id)}
					/>

					{/* Cancel confirmation inline */}
					{confirmingCancelId === job.id && (
						<Box marginLeft={4} marginTop={1}>
							<Text color="yellow">Cancel {job.command}? </Text>
							<Text dimColor>(</Text>
							<Text bold>y</Text>
							<Text dimColor>/</Text>
							<Text bold>n</Text>
							<Text dimColor>)</Text>
						</Box>
					)}
				</Box>
			))}

			{/* Footer hint */}
			<Box marginTop={2}>
				<Text dimColor>
					Enter: expand | x: cancel | j/k: navigate
					{confirmingCancelId && ' | y/n: confirm'}
				</Text>
			</Box>
		</Box>
	);
}
