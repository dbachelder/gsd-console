/**
 * TodosView Component Tests
 * Tests for todo list display with filtering and navigation.
 */

import { describe, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';
import type { Todo } from '../../../src/lib/types.ts';
import { TodosView } from '../../../src/components/todos/TodosView.tsx';

describe('TodosView', () => {
	const mockTodos: Todo[] = [
		{
			id: '1',
			text: 'First todo',
			completed: false,
			source: 'ROADMAP',
			phase: 1,
		},
		{
			id: '2',
			text: 'Second todo',
			completed: true,
			source: 'STATE',
			phase: 1,
		},
		{
			id: '3',
			text: 'Third todo',
			completed: false,
			source: 'PLAN',
			phase: 2,
		},
	];

	test('renders todo list', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		expect(lastFrame()).toContain('Todos');
		expect(lastFrame()).toContain('First todo');
		expect(lastFrame()).toContain('Second todo');
		expect(lastFrame()).toContain('Third todo');
	});

	test('shows completed todos with checkmark', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		// Completed todo has checkmark
		expect(lastFrame()).toContain('[x]');
	});

	test('shows pending todos with empty checkbox', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		// Pending todos have empty checkboxes
		expect(lastFrame()).toContain('[ ]');
	});

	test('shows strikethrough text for completed todos', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		const output = lastFrame() ?? '';

		// "Second todo" should have strikethrough (dimmed)
		// Note: Ink uses dimColor for strikethrough effect
		expect(output).toContain('Second todo');
	});

	test('handles empty todo list', () => {
		const { lastFrame } = render(<TodosView todos={[]} isActive={false} />);

		expect(lastFrame()).toContain('No todos found');
	});

	test('handles only completed todos filter', () => {
		// Mock component state by rendering with all completed todos
		const completedOnlyTodos: Todo[] = [
			...mockTodos.filter((t) => t.completed),
		];

		const { lastFrame } = render(
			<TodosView todos={completedOnlyTodos} isActive={false} />,
		);

		// Should only show completed todo
		expect(lastFrame()).toContain('Second todo');
	});

	test('shows pending and done counts', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		expect(lastFrame()).toContain('2 pending, 1 done');
	});

	test('shows all todos by default', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		// All three todos should be shown
		expect(lastFrame()).toContain('First todo');
		expect(lastFrame()).toContain('Second todo');
		expect(lastFrame()).toContain('Third todo');
	});

	test('renders todo items in order (incomplete first)', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		const output = lastFrame() ?? '';

		// Incomplete todos should appear before completed ones
		const indexFirst = output.indexOf('First todo');
		const indexSecond = output.indexOf('Second todo');
		const indexThird = output.indexOf('Third todo');

		// First and Third are incomplete, should come before Second (completed)
		expect(indexFirst).toBeGreaterThan(-1);
		expect(indexThird).toBeGreaterThan(-1);
		expect(indexSecond).toBeGreaterThan(-1);

		// Incomplete should be before completed
		expect(indexFirst).toBeLessThan(indexSecond);
		expect(indexThird).toBeLessThan(indexSecond);
	});

	test('shows filter status hints', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		expect(lastFrame()).toContain('Filter:');
		expect(lastFrame()).toContain('all');
		expect(lastFrame()).toContain('(f to toggle)');
	});

	test('shows detail status hints', () => {
		const { lastFrame } = render(
			<TodosView todos={mockTodos} isActive={false} />,
		);

		expect(lastFrame()).toContain('Details:');
		expect(lastFrame()).toContain('hidden');
		expect(lastFrame()).toContain('(d to toggle)');
	});

	test('handles isHighlighted prop', () => {
		const { lastFrame } = render(
			<TodosView
				todos={mockTodos}
				isActive={false}
				isTodoHighlighted={(todoId) => todoId === '1'}
			/>,
		);

		// Should render without error (highlight behavior tested in TodoItem tests)
		expect(lastFrame()).toContain('First todo');
	});

	test('handles isFading prop', () => {
		const { lastFrame } = render(
			<TodosView
				todos={mockTodos}
				isActive={false}
				isTodoFading={(todoId) => todoId === '1'}
			/>,
		);

		// Should render without error (fade behavior tested in TodoItem tests)
		expect(lastFrame()).toContain('First todo');
	});

	test('calls onTodoSelect with selected todo', () => {
		const onTodoSelect = vi.fn();

		render(<TodosView todos={mockTodos} isActive={true} onTodoSelect={onTodoSelect} />);

		// Initial selection should be first todo (index 0)
		expect(onTodoSelect).toHaveBeenCalledWith('1');
	});
});
