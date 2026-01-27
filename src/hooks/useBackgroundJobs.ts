/**
 * Background Jobs Hook
 * Manages background jobs for headless execution in OpenCode.
 * Per CONTEXT.md: Keep last 5 success + 5 errors, auto-prune older.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { debugLog, loadOpencodeCommand, sendPrompt } from '../lib/opencode.ts';
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

/** Track jobs currently being started (between pending and running) */
const jobsInProgress = new Set<string>();

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
 * Start a pending job if one exists and no other job is currently running.
 * This is used both by session.idle events and proactive startup for newly created sessions.
 *
 * Sequential processing is guaranteed by checking for running jobs (lines 62-64) before starting new ones.
 * Combined with the proactive useEffect (lines 84-97), this provides:
 * - Immediate startup for first job (new idle session)
 * - Sequential processing for subsequent jobs (session.idle event fires after each completes)
 */
function startPendingJob(
	jobs: BackgroundJob[],
	setJobs: (updater: (prev: BackgroundJob[]) => BackgroundJob[]) => void,
	showToast?: (msg: string, type?: ToastType) => void,
	onProcessingChange?: (processing: boolean) => void,
	onActiveCommandChange?: (command?: string) => void,
): void {
	// Check if there are any pending jobs
	const pendingJob = jobs.find((j) => j.status === 'pending');
	if (!pendingJob) {
		debugLog('[startPendingJob] No pending jobs found');
		return;
	}

	debugLog(
		`[startPendingJob] Found pending job: ${pendingJob.id}, sessionId: ${pendingJob.sessionId}`,
	);

	// Check if job is already being started (prevent duplicate starts)
	if (jobsInProgress.has(pendingJob.id)) {
		debugLog(`[startPendingJob] Job ${pendingJob.id} already in progress, skipping`);
		return;
	}

	// Check if any job is currently running (across all sessions)
	const runningJob = jobs.find((j) => j.status === 'running');
	if (runningJob) {
		debugLog(`[startPendingJob] Job ${runningJob.id} already running, waiting`);
		return;
	}

	// Check if the pending job has a session ID
	if (!pendingJob.sessionId) {
		// Job without session ID - mark as failed
		setJobs((prev) =>
			pruneJobs(
				prev.map((j) =>
					j.id === pendingJob.id
						? {
								...j,
								status: 'failed' as const,
								error: 'No session ID assigned',
								completedAt: Date.now(),
							}
						: j,
				),
			),
		);
		showToast?.(`Background: ${pendingJob.command} failed - no session`, 'warning');
		return;
	}

	// Mark job as in-progress to prevent duplicate starts
	jobsInProgress.add(pendingJob.id);
	debugLog(`[startPendingJob] Marked job ${pendingJob.id} as in-progress`);

	// Start the job asynchronously
	showToast?.(`Background: ${pendingJob.command} started`, 'info');
	onProcessingChange?.(true);
	onActiveCommandChange?.(pendingJob.command);

	const jobId = pendingJob.id;
	const jobCommand = pendingJob.command;
	const jobSessionId = pendingJob.sessionId;

	debugLog(`[startPendingJob] Calling sendPrompt for job ${jobId}`);

	// Extract command name (e.g., "add-todo" from "/gsd-add-todo foo bar")
	const baseCommand = jobCommand.replace(/^\/gsd-/, '');

	// Load full command instruction from OpenCode command files
	(async () => {
		try {
			const fullCommand = await loadOpencodeCommand(baseCommand);
			const promptToSend = fullCommand || jobCommand;

			if (fullCommand) {
				debugLog(`[startPendingJob] Sending full command instruction for job ${jobId}`);
			} else {
				debugLog(`[startPendingJob] Command file not found, sending raw command ${jobId}`);
			}

			// Log the prompt being sent for debugging
			debugLog(
				`[startPendingJob] Prompt content (${promptToSend.length} chars):`,
				promptToSend.slice(0, 200) + (promptToSend.length > 200 ? '...' : ''),
			);

			// Mark job as running AFTER sendPrompt succeeds
			// This ensures failed sendPrompt doesn't leave jobs stuck in running state
			debugLog(`[startPendingJob] Calling sendPrompt for job ${jobId}`);

			// Send to OpenCode with opencode/big-pickle model
			await sendPrompt(jobSessionId, promptToSend, 'opencode/big-pickle');

			// Only mark as running after successful send
			debugLog(`[startPendingJob] Marking job ${jobId} as running (sendPrompt succeeded)`);
			setJobs((current) =>
				current.map((j) =>
					j.id === jobId
						? {
								...j,
								status: 'running' as const,
								startedAt: Date.now(),
							}
						: j,
				),
			);

			// Clear in-progress flag since job is now running
			jobsInProgress.delete(jobId);
			debugLog(`[startPendingJob] Prompt sent successfully, job ${jobId} is running`);
		} catch (error) {
			// Handle promise rejection errors
			debugLog(`[startPendingJob] Error during job ${jobId}:`, error);
			jobsInProgress.delete(jobId); // Clear in-progress flag on error

			setJobs((current) =>
				pruneJobs(
					current.map((j) =>
						j.id === jobId
							? {
									...j,
									status: 'failed' as const,
									error: error instanceof Error ? error.message : 'Unknown error',
									completedAt: Date.now(),
								}
							: j,
					),
				),
			);
			showToast?.(`Background: ${jobCommand} failed`, 'warning');
			onProcessingChange?.(false);
			onActiveCommandChange?.(undefined);
		}
	})();
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

	// Track timeout for running job to detect stuck jobs
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * Proactive job startup - check for pending jobs and start them if no job is running.
	 * This ensures jobs execute immediately for newly created sessions that are already idle,
	 * instead of waiting for session.idle events that never fire.
	 */
	useEffect(() => {
		const pendingJob = jobs.find((j) => j.status === 'pending');
		const runningJob = jobs.find((j) => j.status === 'running');

		// Debug log for proactive startup
		if (pendingJob) {
			const msg = runningJob
				? `[useBackgroundJobs] Pending job found (${pendingJob.id}) but job running, waiting...`
				: `[useBackgroundJobs] Starting pending job: ${pendingJob.id} (${pendingJob.command})`;
			debugLog(msg);
		}

		startPendingJob(jobs, setJobs, showToast, setIsProcessing, setActiveCommand);
	}, [jobs, showToast]);

	/**
	 * Timeout mechanism for stuck jobs.
	 * If a job runs longer than 2 minutes without going idle, mark it as failed.
	 */
	useEffect(() => {
		const runningJob = jobs.find((j) => j.status === 'running');

		// Clear existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		// Set timeout for running job
		if (runningJob) {
			debugLog(`[useBackgroundJobs] Setting 2-minute timeout for job ${runningJob.id}`);
			timeoutRef.current = setTimeout(
				() => {
					debugLog(`[useBackgroundJobs] Job ${runningJob.id} timed out, marking as failed`);
					setJobs((current) =>
						pruneJobs(
							current.map((j) =>
								j.id === runningJob.id
									? {
											...j,
											status: 'failed' as const,
											error: 'Job timed out - session did not go idle within 2 minutes',
											completedAt: Date.now(),
										}
									: j,
							),
						),
					);
					showToast?.(`Background: ${runningJob.command} timed out`, 'warning');
					setIsProcessing(false);
					setActiveCommand(undefined);
				},
				2 * 60 * 1000,
			); // 2 minutes
		}

		// Cleanup timeout on unmount
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [jobs, showToast]);

	// Collect all unique session IDs from jobs for event subscription
	const jobSessionIds = Array.from(
		new Set(
			jobs
				.filter((j) => j.sessionId && (j.status === 'pending' || j.status === 'running'))
				.map((j) => j.sessionId)
				.filter((id): id is string => id !== undefined),
		),
	);

	/**
	 * Handle session idle event.
	 * If a job is running, mark it complete.
	 * The useEffect hook will proactively start the next pending job if one exists.
	 */
	const handleIdle = useCallback(
		(idleSessionId: string) => {
			setJobs((prev) => {
				// Find running job for this session - mark it complete
				const runningJob = prev.find(
					(j) => j.status === 'running' && j.sessionId === idleSessionId,
				);
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

				// No running job for this session - nothing to complete
				// The useEffect hook will handle starting pending jobs
				return prev;
			});
		},
		[showToast],
	);

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
		(errorMsg: string, errorSessionId: string) => {
			setJobs((prev) => {
				const runningJob = prev.find(
					(j) => j.status === 'running' && j.sessionId === errorSessionId,
				);
				if (runningJob) {
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
				}
				return prev;
			});
			setError(new Error(errorMsg));
		},
		[showToast],
	);

	// Subscribe to session events
	useSessionEvents({
		sessionIds: jobSessionIds,
		onIdle: handleIdle,
		onOutput: handleOutput,
		onError: handleError,
		enabled: jobSessionIds.length > 0,
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

			setJobs((prev) => pruneJobs([...prev, job]));
			showToast?.(`Background: ${command} queued`, 'info');
		},
		[sessionId, showToast],
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
