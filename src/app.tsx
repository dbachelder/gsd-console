/**
 * GSD TUI Main App Component
 * Root component that loads data and renders the layout.
 */

import { Spinner } from '@inkjs/ui';
import { Box, Text, useApp, useInput } from 'ink';
import { useCallback, useEffect, useState } from 'react';
import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { HelpOverlay } from './components/layout/HelpOverlay.tsx';
import { TabLayout } from './components/layout/TabLayout.tsx';
import { useChangeHighlight } from './hooks/useChangeHighlight.ts';
import { useFileWatcher } from './hooks/useFileWatcher.ts';
import { useGsdData } from './hooks/useGsdData.ts';
import type { CliFlags, GsdData } from './lib/types.ts';

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
		// ROADMAP.md affects all phases
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
	const [activeTab, setActiveTab] = useState<'roadmap' | 'phase' | 'todos'>(
		flags.only ?? 'roadmap',
	);

	// Global input handlers (q to quit, ? to toggle help)
	useInput((input) => {
		if (input === 'q') {
			exit();
			process.exit(0);
		}
		if (input === '?') {
			setShowHelp((prev) => !prev);
		}
	});

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
			<TabLayout
				data={data}
				flags={flags}
				isActive={!showHelp}
				onTabChange={setActiveTab}
				isPhaseHighlighted={(num) => isHighlighted(`phase-${num}`)}
				isPhaseFading={(num) => isFading(`phase-${num}`)}
				isTodoHighlighted={(id) => isHighlighted(`todo-${id}`)}
				isTodoFading={(id) => isFading(`todo-${id}`)}
			/>
			<Footer activeTab={activeTab} onlyMode={flags.only} />
		</Box>
	);
}
