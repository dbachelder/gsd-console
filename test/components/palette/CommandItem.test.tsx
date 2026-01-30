import { render } from 'ink-testing-library';
import { describe, expect, test } from 'bun:test';
import { CommandItem } from '../../../src/components/palette/CommandItem.tsx';

describe('CommandItem', () => {
	test('renders command name and description', () => {
		const mockCommand = {
			name: 'add-todo',
			description: 'Add a new todo',
		};

		const { lastFrame } = render(
			<CommandItem command={mockCommand as any} isSelected={false} />,
		);

		expect(lastFrame()).toContain('add-todo');
		expect(lastFrame()).toContain('Add a new todo');
	});

	test('shows active highlight when selected', () => {
		const mockCommand = {
			name: 'progress',
			description: 'Update phase progress',
		};

		const { lastFrame } = render(
			<CommandItem command={mockCommand as any} isSelected={true} />,
		);

		// Should show '>' prefix and bold styling for selected item
		expect(lastFrame()).toContain('> progress');
	});

	test('shows normal styling when not selected', () => {
		const mockCommand = {
			name: 'help',
			description: 'Show help information',
		};

		const { lastFrame } = render(
			<CommandItem command={mockCommand as any} isSelected={false} />,
		);

		// Should show '  ' prefix (spaces) for unselected item
		expect(lastFrame()).toContain('  help');
		expect(lastFrame()).not.toContain('> help');
	});

	test('renders command with description', () => {
		const mockCommand = {
			name: 'add-phase',
			description: 'Add a new phase to roadmap',
		};

		const { lastFrame } = render(
			<CommandItem command={mockCommand as any} isSelected={true} />,
		);

		expect(lastFrame()).toContain('add-phase');
		expect(lastFrame()).toContain('Add a new phase to roadmap');
	});

	test('handles empty description', () => {
		const mockCommand = {
			name: 'simple-cmd',
			description: '',
		};

		const { lastFrame } = render(
			<CommandItem command={mockCommand as any} isSelected={false} />,
		);

		expect(lastFrame()).toContain('simple-cmd');
		// Output ends with " - " (space dash space, then nothing for empty description)
		expect(lastFrame()).toMatch(/simple-cmd -$/);
	});
});
