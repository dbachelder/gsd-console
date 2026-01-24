import { describe, expect, test } from 'bun:test';
import { parseState, parseTodos } from '../../src/lib/parser.ts';
import type { Phase, ProjectState } from '../../src/lib/types.ts';

describe('parseState', () => {
	test('extracts phase information', () => {
		const content = `
Phase: 2 of 4 (Core TUI)
Progress: [##########] 50%
Last activity: 2025-01-24 - Completed 01-01-PLAN.md
`;
		const state = parseState(content);
		expect(state.currentPhase).toBe(2);
		expect(state.totalPhases).toBe(4);
		expect(state.progressPercent).toBe(50);
		expect(state.lastActivity).toContain('2025-01-24');
	});

	test('handles missing data gracefully', () => {
		const state = parseState('');
		expect(state.currentPhase).toBe(1);
		expect(state.totalPhases).toBe(4);
		expect(state.progressPercent).toBe(0);
	});
});

describe('parseTodos', () => {
	test('extracts todos from pending section', () => {
		const content = `
### Pending Todos

- [ ] First todo item
- [x] Completed todo item
- [ ] Another pending item
`;
		const todos = parseTodos(content);
		expect(todos.length).toBe(3);
		expect(todos[0]?.text).toBe('First todo item');
		expect(todos[0]?.completed).toBe(false);
		expect(todos[1]?.completed).toBe(true);
	});

	test('handles empty content', () => {
		const todos = parseTodos('');
		expect(todos.length).toBe(0);
	});

	test('ignores "None yet." placeholder', () => {
		const content = `
### Pending Todos

None yet.
`;
		const todos = parseTodos(content);
		expect(todos.length).toBe(0);
	});
});
