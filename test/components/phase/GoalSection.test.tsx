/**
 * GoalSection Component Tests
 * Tests for phase goal display component.
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { GoalSection } from '../../../src/components/phase/GoalSection.tsx';

describe('GoalSection', () => {
	test('renders goal text', () => {
		const goal = 'Build terminal UI with Ink';
		const { lastFrame } = render(<GoalSection goal={goal} />);

		expect(lastFrame()).toContain('Goal:');
		expect(lastFrame()).toContain(goal);
	});

	test('handles empty goal', () => {
		const { lastFrame } = render(<GoalSection goal="" />);

		expect(lastFrame()).toContain('Goal:');
		expect(lastFrame()).toContain('(No goal specified)');
	});
});
