/**
 * GSD TUI Main App Component
 * Root component that loads data and renders the layout.
 */

import { Spinner } from '@inkjs/ui';
import { Box, Text, useApp, useInput } from 'ink';
import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { TabLayout } from './components/layout/TabLayout.tsx';
import { useGsdData } from './hooks/useGsdData.ts';
import type { CliFlags } from './lib/types.ts';

interface AppProps {
	flags: CliFlags;
}

export default function App({ flags }: AppProps) {
	const { exit } = useApp();
	const data = useGsdData(flags.dir ?? '.planning');

	// Global quit handler
	useInput((input) => {
		if (input === 'q') {
			exit();
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

	// Main app layout
	return (
		<Box flexDirection="column">
			<Header projectName={data.state.projectName} state={data.state} />
			<TabLayout data={data} flags={flags} />
			<Footer onlyMode={flags.only} />
		</Box>
	);
}
