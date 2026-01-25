/**
 * useCommandPalette Hook
 * Manages command palette visibility, query state, and selection.
 */

import { useInput } from 'ink';
import { useCallback, useState } from 'react';
import type { Command } from '../lib/commands.ts';
import type { ToastType } from './useToast.ts';

export type PaletteMode = 'closed' | 'open';

export interface UseCommandPaletteResult {
	mode: PaletteMode;
	query: string;
	setQuery: (query: string) => void;
	selectedIndex: number;
	setSelectedIndex: (index: number) => void;
	close: () => void;
	execute: (
		command: Command,
		showToast: (msg: string, type?: ToastType) => void,
		args?: string,
	) => void;
}

interface UseCommandPaletteConfig {
	commands: Command[];
	filteredCount: number;
}

export function useCommandPalette(config: UseCommandPaletteConfig): UseCommandPaletteResult {
	const { filteredCount } = config;

	const [mode, setMode] = useState<PaletteMode>('closed');
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);

	const close = useCallback(() => {
		setMode('closed');
		setQuery('');
		setSelectedIndex(0);
	}, []);

	const execute = useCallback(
		(command: Command, showToast: (msg: string, type?: ToastType) => void, args?: string) => {
			command.action(showToast, args);
			close();
		},
		[close],
	);

	// Handle palette open trigger (: key) when closed
	useInput(
		(input) => {
			if (input === ':') {
				setMode('open');
				setQuery('');
				setSelectedIndex(0);
			}
		},
		{ isActive: mode === 'closed' },
	);

	// Handle navigation within palette when open
	useInput(
		(input, key) => {
			// Escape closes palette
			if (key.escape) {
				close();
				return;
			}

			// Up arrow or k - move selection up
			if (key.upArrow || input === 'k') {
				setSelectedIndex((prev) => Math.max(0, prev - 1));
				return;
			}

			// Down arrow or j - move selection down
			if (key.downArrow || input === 'j') {
				setSelectedIndex((prev) => Math.min(filteredCount - 1, prev + 1));
				return;
			}
		},
		{ isActive: mode === 'open' },
	);

	return {
		mode,
		query,
		setQuery,
		selectedIndex,
		setSelectedIndex,
		close,
		execute,
	};
}
