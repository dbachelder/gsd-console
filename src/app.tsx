/**
 * GSD TUI Main App Component
 * Root component that loads data and renders the layout.
 */

import { Spinner } from '@inkjs/ui';
import { Box, Text, useApp, useInput } from 'ink';
import { useState } from 'react';
import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { HelpOverlay } from './components/layout/HelpOverlay.tsx';
import { TabLayout } from './components/layout/TabLayout.tsx';
import { useGsdData } from './hooks/useGsdData.ts';
import type { CliFlags } from './lib/types.ts';

interface AppProps {
	flags: CliFlags;
}

export default function App({ flags }: AppProps) {
	const { exit } = useApp();
	const data = useGsdData(flags.dir ?? '.planning');

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
				<Header projectName={data.state.projectName} state={data.state} />
				<HelpOverlay onClose={() => setShowHelp(false)} />
			</Box>
		);
	}

	// Main app layout
	return (
		<Box flexDirection="column">
			<Header projectName={data.state.projectName} state={data.state} />
			<TabLayout data={data} flags={flags} isActive={!showHelp} onTabChange={setActiveTab} />
			<Footer activeTab={activeTab} onlyMode={flags.only} />
		</Box>
	);
}
