/**
 * PhaseView Component Tests
 * Tests for phase detail view with goal, requirements, and success criteria.
 */

import { describe, expect, test, vi } from 'bun:test';
import { render } from 'ink-testing-library';
import type { Phase } from '../../../src/lib/types.ts';
import { PhaseView } from '../../../src/components/phase/PhaseView.tsx';

// Mock parser functions since we're not testing plan file parsing
vi.mock('../../../src/lib/parser.ts', () => ({
	parsePlanFiles: vi.fn(() => []),
}));

describe('PhaseView', () => {
	const mockPhase: Phase = {
		number: 1,
		name: 'Core TUI',
		goal: 'Build terminal UI with Ink',
		requirements: ['DISP-01', 'DISP-02', 'NAV-01'],
		successCriteria: [
			'User sees roadmap overview',
			'User can navigate phases',
			'Terminal renders without errors',
		],
		status: 'in-progress',
		plansComplete: 2,
		plansTotal: 4,
		indicators: {
			hasPlan: true,
			hasContext: false,
			hasResearch: false,
			uatComplete: false,
		},
		dependsOn: '',
	};

	const mockPhases: Phase[] = [mockPhase];

	test('renders phase name and goal', () => {
		const { lastFrame } = render(
			<PhaseView
				phase={mockPhase}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('Phase 1:');
		expect(lastFrame()).toContain('Core TUI');
		expect(lastFrame()).toContain('Goal:');
		expect(lastFrame()).toContain('Build terminal UI with Ink');
	});

	test('shows requirements list at detail level 2+', () => {
		const { lastFrame } = render(
			<PhaseView
				phase={mockPhase}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={2}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('Requirements:');
		expect(lastFrame()).toContain('DISP-01');
		expect(lastFrame()).toContain('DISP-02');
		expect(lastFrame()).toContain('NAV-01');
	});

	test('hides requirements at detail level 1', () => {
		const { lastFrame } = render(
			<PhaseView
				phase={mockPhase}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('Goal:');
		expect(lastFrame()).not.toContain('Requirements:');
	});

	test('shows success criteria list', () => {
		const { lastFrame } = render(
			<PhaseView
				phase={mockPhase}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('Success Criteria:');
		expect(lastFrame()).toContain('1. [ ] User sees roadmap overview');
		expect(lastFrame()).toContain('2. [ ] User can navigate phases');
		expect(lastFrame()).toContain('3. [ ] Terminal renders without errors');
	});

	test('shows success criteria with checkboxes when phase is complete', () => {
		const completePhase: Phase = {
			...mockPhase,
			status: 'complete',
		};

		const { lastFrame } = render(
			<PhaseView
				phase={completePhase}
				allPhases={[completePhase]}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		// Green checkmarks for completed phase
		expect(lastFrame()).toContain('1. [✓] User sees roadmap overview');
	});

	test('shows empty checkboxes when phase is not complete', () => {
		const { lastFrame } = render(
			<PhaseView
				phase={mockPhase}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		// Empty checkboxes for incomplete phase
		expect(lastFrame()).toContain('1. [ ] User sees roadmap overview');
		expect(lastFrame()).not.toContain('[✓]');
	});

	test('shows phase status and progress', () => {
		const { lastFrame } = render(
			<PhaseView
				phase={mockPhase}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('in-progress');
		expect(lastFrame()).toContain('2/4 plans complete');
	});

	test('shows indicators when present', () => {
		const { lastFrame } = render(
			<PhaseView
				phase={mockPhase}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		// Should show Plan and Verification indicators
		expect(lastFrame()).toContain('Indicators:');
	});

	test('handles missing phase', () => {
		const { lastFrame } = render(
			<PhaseView
				phase={null}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('No phase selected');
		expect(lastFrame()).toContain('Use [/] to navigate phases.');
	});

	test('handles empty goal', () => {
		const noGoalPhase: Phase = {
			...mockPhase,
			goal: '',
		};

		const { lastFrame } = render(
			<PhaseView
				phase={noGoalPhase}
				allPhases={[noGoalPhase]}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('Goal:');
		expect(lastFrame()).toContain('(No goal specified)');
	});

	test('handles empty requirements array', () => {
		const noReqsPhase: Phase = {
			...mockPhase,
			requirements: [],
		};

		const { lastFrame } = render(
			<PhaseView
				phase={noReqsPhase}
				allPhases={[noReqsPhase]}
				isActive={false}
				detailLevel={2}
				onDetailLevelChange={() => {}}
			/>,
		);

		// Should not render requirements section
		expect(lastFrame()).not.toContain('Requirements:');
	});

	test('handles empty success criteria array', () => {
		const noCriteriaPhase: Phase = {
			...mockPhase,
			successCriteria: [],
		};

		const { lastFrame } = render(
			<PhaseView
				phase={noCriteriaPhase}
				allPhases={[noCriteriaPhase]}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		// Should not render criteria section
		expect(lastFrame()).not.toContain('Success Criteria:');
	});

	test('shows plan list (parsed via parser)', () => {
		// Parser mock returns empty array by default (from vi.mock above)
		// Test just verifies PhaseView renders without error
		const { lastFrame } = render(
			<PhaseView
				phase={mockPhase}
				allPhases={mockPhases}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		// Should render successfully (parser integration tested in parser tests)
		expect(lastFrame()).toContain('Phase 1:');
	});

	test('shows depends on information at detail level 2+', () => {
		const withDepsPhase: Phase = {
			...mockPhase,
			dependsOn: 'Phase 1',
		};

		const { lastFrame } = render(
			<PhaseView
				phase={withDepsPhase}
				allPhases={[withDepsPhase]}
				isActive={false}
				detailLevel={2}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('Depends on:');
		expect(lastFrame()).toContain('Phase 1');
	});

	test('hides depends on at detail level 1', () => {
		const withDepsPhase: Phase = {
			...mockPhase,
			dependsOn: 'Phase 1',
		};

		const { lastFrame } = render(
			<PhaseView
				phase={withDepsPhase}
				allPhases={[withDepsPhase]}
				isActive={false}
				detailLevel={1}
				onDetailLevelChange={() => {}}
			/>,
		);

		expect(lastFrame()).not.toContain('Depends on:');
	});
});
