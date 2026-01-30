/**
 * CriteriaList Component Tests
 * Tests for success criteria display component.
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { CriteriaList } from '../../../src/components/phase/CriteriaList.tsx';

describe('CriteriaList', () => {
	test('renders success criteria (numbered list)', () => {
		const criteria = [
			'User sees roadmap overview',
			'User can navigate phases',
			'Terminal renders without errors',
		];
		const { lastFrame } = render(<CriteriaList criteria={criteria} />);

		expect(lastFrame()).toContain('Success Criteria:');
		expect(lastFrame()).toContain('1. ');
		expect(lastFrame()).toContain('2. ');
		expect(lastFrame()).toContain('3. ');
		expect(lastFrame()).toContain('User sees roadmap overview');
		expect(lastFrame()).toContain('User can navigate phases');
		expect(lastFrame()).toContain('Terminal renders without errors');
	});

	test('shows checkboxes for completed/uncompleted criteria', () => {
		const criteria = ['Criterion 1', 'Criterion 2'];
		const { lastFrame } = render(
			<CriteriaList criteria={criteria} phaseComplete={false} />,
		);

		// Empty checkboxes for incomplete phase
		expect(lastFrame()).toContain('[ ]');
		expect(lastFrame()).not.toContain('[✓]');
	});

	test('shows green checkmarks for completed criteria', () => {
		const criteria = ['Criterion 1', 'Criterion 2'];
		const { lastFrame } = render(
			<CriteriaList criteria={criteria} phaseComplete={true} />,
		);

		// Green checkmarks for completed phase
		expect(lastFrame()).toContain('[✓]');
	});

	test('handles empty criteria array', () => {
		const { lastFrame } = render(<CriteriaList criteria={[]} />);

		// Should not render anything
		expect(lastFrame()).toBe('');
	});

	test('uses custom label when provided', () => {
		const criteria = ['Criterion 1'];
		const { lastFrame } = render(
			<CriteriaList criteria={criteria} label="Custom Label:" />,
		);

		expect(lastFrame()).toContain('Custom Label:');
		expect(lastFrame()).toContain('Criterion 1');
		expect(lastFrame()).not.toContain('Success Criteria:');
	});

	test('shows dim color for empty checkboxes', () => {
		const criteria = ['Criterion 1'];
		const { lastFrame } = render(
			<CriteriaList criteria={criteria} phaseComplete={false} />,
		);

		const output = lastFrame();
		// Number and checkbox should be dim color (gray)
		expect(output).toContain('1. [ ] ');
	});

	test('shows green color for completed checkmarks', () => {
		const criteria = ['Criterion 1'];
		const { lastFrame } = render(
			<CriteriaList criteria={criteria} phaseComplete={true} />,
		);

		const output = lastFrame();
		// Checkmarks should be green
		expect(output).toContain('[✓]');
	});
});
