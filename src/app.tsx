/**
 * GSD TUI Main App Component
 * Root component that loads data and renders the layout.
 */

import { Spinner } from '@inkjs/ui';
import { Box, Text, useApp, useInput } from 'ink';
import { useCallback, useEffect, useState } from 'react';
import { ExecutionModePrompt } from './components/background/ExecutionModePrompt.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { HelpOverlay } from './components/layout/HelpOverlay.tsx';
import { TabLayout } from './components/layout/TabLayout.tsx';
import { CommandPalette } from './components/palette/CommandPalette.tsx';
import { FilePicker } from './components/picker/FilePicker.tsx';
import { SessionPicker } from './components/picker/SessionPicker.tsx';
import { ToastContainer } from './components/toast/ToastContainer.tsx';
import { useBackgroundJobs } from './hooks/useBackgroundJobs.ts';
import { useChangeHighlight } from './hooks/useChangeHighlight.ts';
import { useCommandPalette } from './hooks/useCommandPalette.ts';
import { useExternalEditor } from './hooks/useExternalEditor.ts';
import { useFileWatcher } from './hooks/useFileWatcher.ts';
import { useGsdData } from './hooks/useGsdData.ts';
import { useToast } from './hooks/useToast.ts';
import type { Command } from './lib/commands.ts';
import { commands } from './lib/commands.ts';
import { getProjectSessions, type SessionInfo, spawnOpencodeSession } from './lib/opencode.ts';
import type { CliFlags, ExecutionMode, GsdData } from './lib/types.ts';

interface AppProps {
	flags: CliFlags;
}

/**
 * Derive affected item IDs from changed file paths.
 * Maps file changes to item IDs that should be highlighted.
 */
function deriveAffectedItemIds(files: string[], data: GsdData): string[] {
	const ids: string[] = [];

	for (const file of files) {
		// ROADMAP.md affects all phases - conservative behavior
		// We cannot diff markdown content to identify which specific phase changed,
		// so we highlight all phases to signal "roadmap changed, check phases"
		if (file.includes('ROADMAP.md')) {
			for (const p of data.phases) {
				ids.push(`phase-${p.number}`);
			}
		}
		// Phase-specific files affect that phase
		// Match patterns like "phases/01-xxx/" or "phases/1-xxx/"
		const phaseMatch = /phases\/(\d+)-/.exec(file);
		if (phaseMatch?.[1]) {
			ids.push(`phase-${parseInt(phaseMatch[1], 10)}`);
		}
		// STATE.md affects all todos (can't determine which specific todo changed)
		if (file.includes('STATE.md')) {
			for (const t of data.todos) {
				ids.push(`todo-${t.id}`);
			}
		}

		// Individual todo file: extract specific todo ID from path
		// Files are like "todos/pending/some-task.md" -> id is "pending-some-task.md"
		// Or "todos/done/completed-task.md" -> id is "done-completed-task.md"
		const todoMatch = /todos\/(pending|done)\/(.+\.md)$/.exec(file);
		if (todoMatch) {
			const status = todoMatch[1]; // 'pending' or 'done'
			const filename = todoMatch[2]; // filename with extension
			ids.push(`todo-${status}-${filename}`);
		}
	}

	// Dedupe
	return [...new Set(ids)];
}

export default function App({ flags }: AppProps) {
	const { exit } = useApp();
	const planningDir = flags.dir ?? '.planning';

	// Stable error handler to prevent useFileWatcher's useEffect from re-running on every render
	const handleWatcherError = useCallback((err: Error) => {
		console.error('File watcher error:', err);
	}, []);

	// File watcher for automatic refresh
	const { changedFiles, isRefreshing, lastRefresh } = useFileWatcher({
		path: planningDir,
		debounceMs: 300,
		onError: handleWatcherError,
	});

	// Load data with file watcher integration
	const data = useGsdData(planningDir, lastRefresh ?? undefined, changedFiles);

	// Change highlight tracking
	const { markChanged, isHighlighted, isFading } = useChangeHighlight({
		holdDurationMs: 5000,
		fadeDurationMs: 500,
	});

	// Mark items as changed when files change
	useEffect(() => {
		if (changedFiles.length > 0 && !data.loading) {
			const itemIds = deriveAffectedItemIds(changedFiles, data);
			if (itemIds.length > 0) {
				markChanged(itemIds);
			}
		}
	}, [changedFiles, data, markChanged]);

	// Help overlay state
	const [showHelp, setShowHelp] = useState(false);

	// Track active tab for footer (passed up from TabLayout would be better,
	// but for simplicity we'll default to roadmap and let Footer handle it)
	const [activeTab, setActiveTab] = useState<'roadmap' | 'phase' | 'todos' | 'background'>(
		flags.only ?? 'roadmap',
	);

	// Lifted selection state for editor integration
	const [selectedPhaseNumber, setSelectedPhaseNumber] = useState<number>(flags.phase ?? 1);
	const [selectedTodoId, setSelectedTodoId] = useState<string | undefined>();

	// External editor integration
	const editorContext = {
		activeTab,
		selectedPhase: selectedPhaseNumber,
		selectedTodo: selectedTodoId,
		planningDir,
	};
	const { files: editableFiles, open: openEditor, needsPicker } = useExternalEditor(editorContext);

	// File picker state
	const [showFilePicker, setShowFilePicker] = useState(false);

	// Session picker state
	const [showSessionPicker, setShowSessionPicker] = useState(false);
	const [sessions, setSessions] = useState<SessionInfo[]>([]);
	const [sessionsLoading, setSessionsLoading] = useState(false);
	const [activeSessionId, setActiveSessionId] = useState<string | undefined>();

	// Execution mode prompt state
	const [showModePrompt, setShowModePrompt] = useState(false);
	const [pendingCommand, setPendingCommand] = useState<Command | null>(null);

	// Toast notifications
	const { toasts, show: showToast } = useToast();

	// Background jobs (uses toast for notifications)
	const {
		jobs: backgroundJobs,
		add: addBackgroundJob,
		cancel: cancelBackgroundJob,
	} = useBackgroundJobs({
		sessionId: activeSessionId,
		showToast,
	});

	// Command palette - need to track filtered count for navigation bounds
	const [filteredCount, setFilteredCount] = useState(commands.length);
	const palette = useCommandPalette({ commands, filteredCount });

	/**
	 * Handle command selection from palette.
	 * Queueable commands show execution mode prompt, others execute immediately.
	 */
	const handleCommandSelect = useCallback(
		(command: Command) => {
			if (command.queueable) {
				// Show execution mode prompt for queueable commands
				setPendingCommand(command);
				setShowModePrompt(true);
			} else {
				// Execute non-queueable commands immediately
				command.action(showToast);
			}
		},
		[showToast],
	);

	/**
	 * Handle execution mode selection.
	 * Routes command to appropriate execution path based on mode.
	 */
	const handleModeSelect = useCallback(
		(mode: ExecutionMode) => {
			setShowModePrompt(false);
			if (!pendingCommand) return;

			const commandName = pendingCommand.name;

			switch (mode) {
				case 'headless':
					// Add to background jobs for headless execution
					addBackgroundJob(commandName);
					break;

				case 'interactive':
					// Spawn new OpenCode session with this command
					{
						const success = spawnOpencodeSession(`/gsd:${commandName}`);
						if (success) {
							showToast('OpenCode session completed', 'success');
						} else {
							showToast('OpenCode session failed or was cancelled', 'warning');
						}
					}
					break;

				case 'primary':
					// Send to existing connected session
					if (!activeSessionId) {
						showToast("No session connected. Press 'c' to connect.", 'warning');
						setPendingCommand(null);
						return;
					}
					// For now, queue as background job with the connected session
					addBackgroundJob(commandName);
					break;
			}

			setPendingCommand(null);
		},
		[pendingCommand, activeSessionId, addBackgroundJob, showToast],
	);

	/**
	 * Cancel the execution mode prompt.
	 */
	const handleModeCancel = useCallback(() => {
		setShowModePrompt(false);
		setPendingCommand(null);
	}, []);

	// Global input handlers (q to quit, ? to toggle help, e to edit, c to connect)
	// Disabled when any overlay is open
	const isAnyOverlayOpen =
		palette.mode === 'open' || showFilePicker || showSessionPicker || showModePrompt;

	useInput(
		(input) => {
			if (input === 'q') {
				exit();
				process.exit(0);
			}
			if (input === '?') {
				setShowHelp((prev) => !prev);
			}
			if (input === 'e') {
				// Open editor for current context
				if (editableFiles.length === 0) {
					showToast('No file to edit in current context', 'warning');
				} else if (needsPicker) {
					// Multiple files - show picker
					setShowFilePicker(true);
				} else {
					// Single file - open directly
					openEditor();
				}
			}
			if (input === 'c') {
				// Open session picker
				setSessionsLoading(true);
				setShowSessionPicker(true);
				getProjectSessions(process.cwd()).then((s) => {
					setSessions(s);
					setSessionsLoading(false);
				});
			}
		},
		{ isActive: !isAnyOverlayOpen },
	);

	// Loading state
	if (data.loading) {
		return (
			<Box flexDirection="column" padding={1}>
				<Box>
					<Spinner label="Loading planning documents..." />
				</Box>
			</Box>
		);
	}

	// Error state
	if (data.error) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="red" bold>
					Error loading planning data
				</Text>
				<Text color="red">{data.error.message}</Text>
				<Box marginTop={1}>
					<Text dimColor>Press q to quit</Text>
				</Box>
			</Box>
		);
	}

	// Help overlay takes over the screen
	if (showHelp) {
		return (
			<Box flexDirection="column">
				<Header
					projectName={data.state.projectName}
					state={data.state}
					isRefreshing={isRefreshing}
				/>
				<HelpOverlay onClose={() => setShowHelp(false)} />
			</Box>
		);
	}

	// Main app layout
	return (
		<Box flexDirection="column" flexGrow={1}>
			<Header projectName={data.state.projectName} state={data.state} isRefreshing={isRefreshing} />
			<Box flexDirection="column" flexGrow={1}>
				<TabLayout
					data={data}
					flags={flags}
					isActive={!showHelp && !isAnyOverlayOpen}
					onTabChange={setActiveTab}
					isPhaseHighlighted={(num) => isHighlighted(`phase-${num}`)}
					isPhaseFading={(num) => isFading(`phase-${num}`)}
					isTodoHighlighted={(id) => isHighlighted(`todo-${id}`)}
					isTodoFading={(id) => isFading(`todo-${id}`)}
					showToast={showToast}
					selectedPhaseNumber={selectedPhaseNumber}
					onPhaseSelect={setSelectedPhaseNumber}
					selectedTodoId={selectedTodoId}
					onTodoSelect={setSelectedTodoId}
					planningDir={planningDir}
					backgroundJobs={backgroundJobs}
					onCancelJob={cancelBackgroundJob}
				/>
			</Box>
			<Footer activeTab={activeTab} onlyMode={flags.only} />

			{/* Command palette overlay */}
			{palette.mode === 'open' && (
				<Box position="absolute" marginTop={3} marginLeft={2}>
					<CommandPalette
						commands={commands}
						query={palette.query}
						onQueryChange={(q) => {
							palette.setQuery(q);
						}}
						selectedIndex={palette.selectedIndex}
						onSelectedIndexChange={(idx) => {
							palette.setSelectedIndex(idx);
							setFilteredCount(commands.length); // Will be refined by palette
						}}
						onExecute={(command) => {
							palette.close();
							handleCommandSelect(command);
						}}
						showToast={showToast}
						onClose={palette.close}
					/>
				</Box>
			)}

			{/* File picker overlay for multi-file editing */}
			{showFilePicker && (
				<Box position="absolute" marginTop={3} marginLeft={2}>
					<FilePicker
						files={editableFiles}
						onSelect={(path) => {
							setShowFilePicker(false);
							openEditor(path);
						}}
						onClose={() => setShowFilePicker(false)}
					/>
				</Box>
			)}

			{/* Session picker overlay for OpenCode connection */}
			{showSessionPicker && (
				<Box position="absolute" marginTop={3} marginLeft={2}>
					<SessionPicker
						sessions={sessions}
						isLoading={sessionsLoading}
						onSelect={(sessionId) => {
							setActiveSessionId(sessionId);
							setShowSessionPicker(false);
							showToast(`Connected to session ${sessionId.slice(0, 8)}...`, 'success');
						}}
						onSpawnNew={() => {
							setShowSessionPicker(false);
							const success = spawnOpencodeSession();
							if (success) {
								showToast('OpenCode session completed', 'success');
							} else {
								showToast('OpenCode session failed or was cancelled', 'warning');
							}
						}}
						onClose={() => setShowSessionPicker(false)}
					/>
				</Box>
			)}

			{/* Execution mode prompt overlay */}
			{showModePrompt && pendingCommand && (
				<Box position="absolute" marginTop={3} marginLeft={2}>
					<ExecutionModePrompt
						command={pendingCommand.name}
						hasActiveSession={Boolean(activeSessionId)}
						onSelect={handleModeSelect}
						onCancel={handleModeCancel}
					/>
				</Box>
			)}

			{/* Toast notifications */}
			<ToastContainer toasts={toasts} />
		</Box>
	);
}
