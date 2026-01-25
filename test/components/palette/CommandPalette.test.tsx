import { render } from 'ink-testing-library';
import { describe, expect, test, vi } from 'bun:test';
import type { ToastType } from '../../../src/hooks/useToast.ts';
import type { Command } from '../../../src/lib/commands.ts';
import { CommandPalette } from '../../../src/components/palette/CommandPalette.tsx';

// Mock toast function
const mockShowToast = vi.fn((msg: string, type?: ToastType) => {
	// Mock implementation
});

// Mock commands array
const mockCommands: Command[] = [
	{
		name: 'add-todo',
		description: 'Add a new todo',
		action: (showToast: (msg: string, type?: ToastType) => void, _args?: string) => {
			showToast('add-todo stub', 'info');
		},
	},
	{
		name: 'progress',
		description: 'Update phase progress',
		action: (showToast: (msg: string, type?: ToastType) => void, _args?: string) => {
			showToast('progress stub', 'info');
		},
	},
	{
		name: 'help',
		description: 'Show help information',
		action: (showToast: (msg: string, type?: ToastType) => void, _args?: string) => {
			showToast('help stub', 'info');
		},
	},
];

describe('CommandPalette', () => {
	test('renders command list', () => {
		const { lastFrame } = render(
			<CommandPalette
				commands={mockCommands}
				query=""
				onQueryChange={() => {}}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={() => {}}
				showToast={mockShowToast}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('add-todo');
		expect(lastFrame()).toContain('Add a new todo');
		expect(lastFrame()).toContain('progress');
		expect(lastFrame()).toContain('Update phase progress');
	});

	test('filters commands with fuzzy search', () => {
		const { lastFrame } = render(
			<CommandPalette
				commands={mockCommands}
				query="add"
				onQueryChange={() => {}}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={() => {}}
				showToast={mockShowToast}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('add-todo');
		expect(lastFrame()).toContain('Add a new todo');
		// "progress" and "help" should not be visible when filtering for "add"
		expect(lastFrame()).not.toContain('progress');
		expect(lastFrame()).not.toContain('help');
	});

	test('shows filtered commands as user types', () => {
		const mockOnQueryChange = vi.fn();
		const { stdin } = render(
			<CommandPalette
				commands={mockCommands}
				query=""
				onQueryChange={mockOnQueryChange}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={() => {}}
				showToast={mockShowToast}
				onClose={() => {}}
			/>,
		);

		// Type 'prog' to filter - each character triggers a change
		stdin.write('p');

		// Note: Due to React state updates being asynchronous, each character
		// builds on the component's internal inputValue state, not onQueryChange's result
		stdin.write('r');
		stdin.write('o');
		stdin.write('g');

		// After all characters are typed, we should have at least called onQueryChange
		expect(mockOnQueryChange).toHaveBeenCalled();
	});

	test('shows no results message when search matches nothing', () => {
		const { lastFrame } = render(
			<CommandPalette
				commands={mockCommands}
				query="nonexistent"
				onQueryChange={() => {}}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={() => {}}
				showToast={mockShowToast}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('No matching commands');
	});

	test('handles Tab completion for arguments', () => {
		const mockOnQueryChange = vi.fn();
		const { stdin, lastFrame } = render(
			<CommandPalette
				commands={mockCommands}
				query="add"
				onQueryChange={mockOnQueryChange}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={() => {}}
				showToast={mockShowToast}
				onClose={() => {}}
			/>,
		);

		// Press Tab to complete
		stdin.write('\t');

		// Should complete to "add-todo " (with space for arguments)
		expect(mockOnQueryChange).toHaveBeenCalledWith('add-todo ');
	});

	test('triggers onExecute on Enter key', () => {
		const mockOnExecute = vi.fn();
		const { stdin } = render(
			<CommandPalette
				commands={mockCommands}
				query="add-todo"
				onQueryChange={() => {}}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={mockOnExecute}
				showToast={mockShowToast}
				onClose={() => {}}
			/>,
		);

		// Press Enter to execute
		stdin.write('\r');

		expect(mockOnExecute).toHaveBeenCalled();
	});

	test('triggers onClose on Escape key', () => {
		const mockOnClose = vi.fn();
		const { stdin } = render(
			<CommandPalette
				commands={mockCommands}
				query=""
				onQueryChange={() => {}}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={() => {}}
				showToast={mockShowToast}
				onClose={mockOnClose}
			/>,
		);

		// Press Escape to close
		stdin.write('\x1B'); // Escape

		expect(mockOnClose).toHaveBeenCalled();
	});

	test('shows initial prompt when query is empty', () => {
		const { lastFrame } = render(
			<CommandPalette
				commands={mockCommands}
				query=""
				onQueryChange={() => {}}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={() => {}}
				showToast={mockShowToast}
				onClose={() => {}}
			/>,
		);

		expect(lastFrame()).toContain(':');
		expect(lastFrame()).toContain('type command...');
	});

	test('limits visible items to MAX_VISIBLE_ITEMS', () => {
		// Create more than MAX_VISIBLE_ITEMS (8) commands
		const manyCommands: Command[] = Array.from({ length: 10 }, (_, i) => ({
			name: `command-${i}`,
			description: `Description ${i}`,
			action: (showToast: (msg: string, type?: ToastType) => void) => {
				showToast(`cmd-${i} stub`, 'info');
			},
		}));

		const { lastFrame } = render(
			<CommandPalette
				commands={manyCommands}
				query=""
				onQueryChange={() => {}}
				selectedIndex={0}
				onSelectedIndexChange={() => {}}
				onExecute={() => {}}
				showToast={mockShowToast}
				onClose={() => {}}
			/>,
		);

		// Should show "and X more" message
		expect(lastFrame()).toContain('... and 2 more');
	});
});
