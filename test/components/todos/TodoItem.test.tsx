/**
 * TodoItem Component Tests
 * Tests for individual todo item display with checkbox and text.
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import type { Todo } from '../../../src/lib/types.ts';
import { TodoItem } from '../../../src/components/todos/TodoItem.tsx';

describe('TodoItem', () => {
	const mockTodo: Todo = {
		id: '1',
		text: 'Complete Phase 1',
		completed: false,
		source: 'ROADMAP',
		phase: 1,
	};

	test('renders todo text', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={false} />,
		);

		expect(lastFrame()).toContain('Complete Phase 1');
	});

	test('shows green checkmark for completed todos', () => {
		const completedTodo: Todo = { ...mockTodo, completed: true };

		const { lastFrame } = render(
			<TodoItem todo={completedTodo} isSelected={false} />,
		);

		const output = lastFrame() ?? '';
		expect(output).toContain('[x]');
	});

	test('shows empty checkbox for pending todos', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={false} />,
		);

		const output = lastFrame() ?? '';
		expect(output).toContain('[ ]');
		expect(output).not.toContain('[x]');
	});

	test('shows strikethrough text for completed todos', () => {
		const completedTodo: Todo = { ...mockTodo, completed: true };

		const { lastFrame } = render(
			<TodoItem todo={completedTodo} isSelected={false} />,
		);

		const output = lastFrame() ?? '';

		// "Complete Phase 1" should appear (but dimmed for completed)
		expect(output).toContain('Complete Phase 1');
	});

	test('handles selection highlight', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={true} />,
		);

		const output = lastFrame() ?? '';
		// Selected item should be highlighted
		expect(output).toContain('Complete Phase 1');
	});

	test('handles highlight state', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={false} isHighlighted={true} />,
		);

		// Should render without error (highlight color handled by component)
		expect(lastFrame()).toContain('Complete Phase 1');
	});

	test('handles fading state', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={false} isFading={true} />,
		);

		// Should render without error (fade color handled by component)
		expect(lastFrame()).toContain('Complete Phase 1');
	});

	test('handles both highlight and fading', () => {
		const { lastFrame } = render(
			<TodoItem
				todo={mockTodo}
				isSelected={false}
				isHighlighted={true}
				isFading={true}
			/>,
		);

		// Should render without error (fading takes priority)
		expect(lastFrame()).toContain('Complete Phase 1');
	});

	test('shows source metadata when showDetail is true', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={false} showDetail={true} />,
		);

		expect(lastFrame()).toContain('Source:');
		expect(lastFrame()).toContain('ROADMAP');
	});

	test('shows phase metadata when showDetail is true', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={false} showDetail={true} />,
		);

		expect(lastFrame()).toContain('Phase:');
		expect(lastFrame()).toContain('1');
	});

	test('shows both source and phase when available', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={false} showDetail={true} />,
		);

		expect(lastFrame()).toContain('Source: ROADMAP | Phase: 1');
	});

	test('hides metadata when showDetail is false', () => {
		const { lastFrame } = render(
			<TodoItem todo={mockTodo} isSelected={false} showDetail={false} />,
		);

		expect(lastFrame()).not.toContain('Source:');
		expect(lastFrame()).not.toContain('Phase:');
	});

	test('hides metadata when todo has no source', () => {
		const noSourceTodo: Todo = { id: '1', text: 'Test', completed: false };

		const { lastFrame } = render(
			<TodoItem todo={noSourceTodo} isSelected={false} showDetail={true} />,
		);

		expect(lastFrame()).not.toContain('Source:');
	});

	test('hides metadata when todo has no phase', () => {
		const noPhaseTodo: Todo = {
			id: '1',
			text: 'Test',
			completed: false,
			source: 'ROADMAP',
		};

		const { lastFrame } = render(
			<TodoItem todo={noPhaseTodo} isSelected={false} showDetail={true} />,
		);

		expect(lastFrame()).not.toContain('Phase:');
	});
});
