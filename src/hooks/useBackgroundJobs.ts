/**
 * Background Jobs Hook
 * Manages background jobs for headless execution in OpenCode.
 * Per CONTEXT.md: Keep last 5 success + 5 errors, auto-prune older.
 */

import { useCallback, useRef, useState } from 'react';
import { sendPrompt } from '../lib/opencode.ts';
import type { BackgroundJob } from '../lib/types.ts';
import { useSessionEvents } from './useSessionEvents.ts';
import type { ToastType } from './useToast.ts';

interface UseBackgroundJobsProps {
	sessionId?: string;
	showToast?: (msg: string, type?: ToastType) => void;
}

interface UseBackgroundJobsReturn {
	jobs: BackgroundJob[];
	isProcessing: boolean;
	activeCommand?: string;
	add: (command: string, explicitSessionId?: string) => void;
	cancel: (jobId: string) => void;
	clear: () => void;
	error?: Error;
}

/** Generate unique ID for a job */
function generateJobId(): string {
	return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Prune jobs to keep only active + last 5 success + last 5 failed/cancelled.
 */
function pruneJobs(jobs: BackgroundJob[]): BackgroundJob[] {
	const active = jobs.filter((j) => j.status === 'pending' || j.status === 'running');
	const success = jobs.filter((j) => j.status === 'complete').slice(-5);
	const failed = jobs.filter((j) => j.status === 'failed' || j.status === 'cancelled').slice(-5);
	return [...active, ...success, ...failed];
}

/**
 * Hook to manage background jobs for headless execution in OpenCode.
 * Jobs are processed sequentially when session becomes idle.
 */
export function useBackgroundJobs({
	sessionId,
	showToast,
}: UseBackgroundJobsProps): UseBackgroundJobsReturn {
	const [jobs, setJobs] = useState<BackgroundJob[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [activeCommand, setActiveCommand] = useState<string | undefined>();
	const [error, setError] = useState<Error | undefined>(undefined);

	// Track output for current running job
	const currentOutputRef = useRef<string>('');

	// Track whether we have a job in 'running' state (not just processed idle)
	const hasRunningJob = jobs.some((j) => j.status === 'running');

	/**
	 * Handle session idle event.
	 * If a job is running, mark it complete.
	 * If pending jobs exist, start the next one.
	 */
	const handleIdle = useCallback(() => {
		setJobs((prev) => {
			// Find running job - mark it complete
			const runningJob = prev.find((j) => j.status === 'running');
			if (runningJob) {
				const output = currentOutputRef.current;
				currentOutputRef.current = ''; // Reset for next job

				showToast?.(`Background: ${runningJob.command} complete`, 'success');

				// Clear active command
				setActiveCommand(undefined);

				return pruneJobs(
					prev.map((j) =>
						j.id === runningJob.id
							? {
									...j,
									status: 'complete' as const,
									completedAt: Date.now(),
									output: output || undefined,
								}
							: j,
					),
				);
			}

			// Find next pending job - start it
			const pendingJob = prev.find((j) => j.status === 'pending');
			if (pendingJob) {
				// Set active command
				setActiveCommand(pendingJob.command);

				// Start the job asynchronously
				if (pendingJob.sessionId) {
					setIsProcessing(true);
					showToast?.(`Background: ${pendingJob.command} started`, 'info');

					// Send prompt - handle failure
					const jobId = pendingJob.id;
					const jobCommand = pendingJob.command;
					const jobSessionId = pendingJob.sessionId;
					sendPrompt(jobSessionId, jobCommand).then((success) => {
						if (!success) {
							// Mark job as failed
							setJobs((current) =>
								pruneJobs(
									current.map((j) =>
										j.id === jobId
											? {
													...j,
													status: 'failed' as const,
													error: 'Failed to send prompt to session',
													completedAt: Date.now(),
												}
											: j,
									),
								),
							);
							showToast?.(`Background: ${jobCommand} failed`, 'warning');
							setIsProcessing(false);
							setActiveCommand(undefined);
						}
					});
				}

				// Mark as running
				return prev.map((j) =>
					j.id === pendingJob.id
						? {
								...j,
								status: 'running' as const,
								startedAt: Date.now(),
							}
						: j,
				);
			}

			// No more jobs to process
			setIsProcessing(false);
			setActiveCommand(undefined);
			return prev;
		});
	}, [showToast]);

	/**
	 * Handle output from session.
	 * Accumulate output for the current running job.
	 */
	const handleOutput = useCallback((text: string) => {
		currentOutputRef.current += text;
	}, []);

	/**
	 * Handle session error.
	 * Mark running job as failed.
	 */
	const handleError = useCallback(
		(errorMsg: string) => {
			console.error('[DEBUG] handleError called with:', errorMsg);
			setJobs((prev) => {
				const runningJob = prev.find((j) => j.status === 'running');
				if (runningJob) {
					console.error('[DEBUG] Marking job as failed:', runningJob.command, 'error:', errorMsg);
					showToast?.(`Background: ${runningJob.command} failed`, 'warning');

					const output = currentOutputRef.current;
					currentOutputRef.current = '';
					setIsProcessing(false);
					setActiveCommand(undefined);

					return pruneJobs(
						prev.map((j) =>
							j.id === runningJob.id
								? {
										...j,
										status: 'failed' as const,
										error: errorMsg,
										completedAt: Date.now(),
										output: output || undefined,
									}
								: j,
						),
					);
				} else {
					console.error('[DEBUG] No running job found when error received');
				}
				return prev;
			});
			setError(new Error(errorMsg));
		},
		[showToast],
	);

	// Subscribe to session events
	useSessionEvents({
		sessionId,
		onIdle: handleIdle,
		onOutput: handleOutput,
		onError: handleError,
		enabled: !!sessionId && (jobs.some((j) => j.status === 'pending') || hasRunningJob),
	});

	/**
	 * Add a command to the background job queue.
	 */
	const add = useCallback(
		(command: string, explicitSessionId?: string) => {
			const jobSessionId = explicitSessionId ?? sessionId;
			const job: BackgroundJob = {
				id: generateJobId(),
				command,
				status: 'pending',
				queuedAt: Date.now(),
				sessionId: jobSessionId,
			};

			console.error('[DEBUG] Adding job:', {
				id: job.id,
				command: job.command,
				sessionId: jobSessionId,
				explicitSessionId,
				hookSessionId: sessionId,
				isProcessing,
			});

			setJobs((prev) => pruneJobs([...prev, job]));
			showToast?.(`Background: ${command} queued`, 'info');

			// If session is available and no job running, trigger processing
			// The next idle event will pick up the pending job
			if (jobSessionId && !isProcessing) {
				console.error('[DEBUG] Triggering handleIdle for job:', job.id);
				// Trigger idle check - if session is already idle, this will start the job
				handleIdle();
			} else {
				console.error('[DEBUG] Not triggering handleIdle:', {
					jobSessionId,
					isProcessing,
				});
			}
		},
		[sessionId, isProcessing, showToast, handleIdle],
	);

	/**
	 * Cancel a job.
	 * If pending, mark as cancelled.
	 * If running, attempt to abort (not fully implemented - would need session.abort).
	 */
	const cancel = useCallback(
		(jobId: string) => {
			setJobs((prev) => {
				const job = prev.find((j) => j.id === jobId);
				if (!job) return prev;

				// Can only cancel pending or running jobs
				if (job.status !== 'pending' && job.status !== 'running') {
					return prev;
				}

				const wasRunning = job.status === 'running';
				showToast?.(`Background: ${job.command} cancelled`, 'warning');

				// If was running, stop processing
				if (wasRunning) {
					currentOutputRef.current = '';
					setIsProcessing(false);
					setActiveCommand(undefined);
					// Note: ideally we'd call session.abort() here, but that's complex
				}

				return pruneJobs(
					prev.map((j) =>
						j.id === jobId
							? {
									...j,
									status: 'cancelled' as const,
									completedAt: Date.now(),
								}
							: j,
					),
				);
			});
		},
		[showToast],
	);

	/**
	 * Clear all jobs from the list.
	 */
	const clear = useCallback(() => {
		setJobs([]);
		currentOutputRef.current = '';
		setIsProcessing(false);
		setActiveCommand(undefined);
	}, []);

	return {
		jobs,
		isProcessing,
		activeCommand,
		add,
		cancel,
		clear,
		error,
	};
}

export default useBackgroundJobs;
