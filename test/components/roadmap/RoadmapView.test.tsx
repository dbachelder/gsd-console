/**
 * RoadmapView Component Tests
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { RoadmapView } from '../../../src/components/roadmap/RoadmapView.tsx';
import type { Phase } from '../../../src/lib/types.ts';

describe('RoadmapView', () => {
	const mockPhases: Phase[] = [
		{
			number: 1,
			name: 'Core TUI',
			status: 'complete',
			goal: 'Build terminal UI',
			requirements: [],
			successCriteria: [],
			dependsOn: null,
			plansTotal: 4,
			plansComplete: 4,
			indicators: {
				hasPlan: true,
				hasContext: true,
				hasResearch: false,
				uatComplete: false,
			},
		},
		{
			number: 2,
			name: 'Real-time Updates',
			status: 'in-progress',
			goal: 'Watch files',
			requirements: [],
			successCriteria: [],
			dependsOn: '1',
			plansTotal: 3,
			plansComplete: 1,
			indicators: {
				hasPlan: true,
				hasContext: true,
				hasResearch: false,
				uatComplete: false,
			},
		},
		{
			number: 3,
			name: 'Actions and Editing',
			status: 'not-started',
			goal: 'Execute commands',
			requirements: [],
			successCriteria: [],
			dependsOn: '2',
			plansTotal: 4,
			plansComplete: 0,
			indicators: {
				hasPlan: true,
				hasContext: true,
				hasResearch: false,
				uatComplete: false,
			},
		},
	];

	test('renders phase list with phase names', () => {
		const { lastFrame } = render(
			<RoadmapView phases={mockPhases} isActive={true} />,
		);

		// PhaseRow renders just the phase number (e.g., "1: Core TUI")
		expect(lastFrame()).toContain('1: Core TUI');
		expect(lastFrame()).toContain('2: Real-time Updates');
		expect(lastFrame()).toContain('3: Actions and Editing');
	});

	test('shows phase status indicators', () => {
		const { lastFrame } = render(
			<RoadmapView phases={mockPhases} isActive={true} />,
		);

		// Check for status icons (complete has ✓, in-progress has ◐, not-started has ○)
		expect(lastFrame()).toContain('[✓]'); // complete status
		expect(lastFrame()).toContain('[◐]'); // in-progress status
		expect(lastFrame()).toContain('[○]'); // not-started status
	});

	test('expands phase when in expandedPhases set', () => {
		const { lastFrame } = render(
			<RoadmapView
				phases={mockPhases}
				isActive={true}
				initialExpandedPhases={[1]}
			/>,
		);

		expect(lastFrame()).toContain('▼'); // Down arrow for expanded
		// PhaseRow shows indicators when expanded (goal is in PhaseView, not PhaseRow)
		expect(lastFrame()).toContain('Context');
		expect(lastFrame()).toContain('Plan');
	});

	test('collapses phase when not in expandedPhases set', () => {
		const { lastFrame } = render(
			<RoadmapView
				phases={mockPhases}
				isActive={true}
				initialExpandedPhases={[]}
			/>,
		);

		expect(lastFrame()).toContain('▶'); // Right arrow for collapsed
	});

	test('handles empty phases array', () => {
		const { lastFrame } = render(
			<RoadmapView phases={[]} isActive={true} />,
		);

		expect(lastFrame()).toContain('No phases found');
	});

	test('handles phase with no goal', () => {
		const phasesWithoutGoal: Phase[] = [
			{
				number: 1,
				name: 'Phase Without Goal',
				status: 'not-started',
				goal: '',
				requirements: [],
				successCriteria: [],
				dependsOn: null,
				plansTotal: 0,
				plansComplete: 0,
				indicators: {
					hasPlan: false,
					hasContext: false,
					hasResearch: false,
					uatComplete: false,
				},
			},
		];

		const { lastFrame } = render(
			<RoadmapView phases={phasesWithoutGoal} isActive={true} />,
		);

		// Should render without crashing even without goal
		expect(lastFrame()).toContain('1: Phase Without Goal');
	});

	test('shows progress bars for each phase', () => {
		const { lastFrame } = render(
			<RoadmapView phases={mockPhases} isActive={true} />,
		);

		// Phase 1: 4/4 = 100%
		expect(lastFrame()).toContain('4/4');

		// Phase 2: 1/3 = 33%
		expect(lastFrame()).toContain('1/3');

		// Phase 3: 0/4 = 0%
		expect(lastFrame()).toContain('0/4');
	});

	test('shows visual indicators when expanded', () => {
		const { lastFrame } = render(
			<RoadmapView
				phases={mockPhases}
				isActive={true}
				initialExpandedPhases={[1]}
			/>,
		);

		// Phase 1 has plan and context indicators with labels
		expect(lastFrame()).toContain('Plan');
		expect(lastFrame()).toContain('Context');
	});

	test('calls onPhaseNavigate on initial render', () => {
		let navigatedPhase: number | undefined;

		render(
			<RoadmapView
				phases={mockPhases}
				isActive={true}
				onPhaseNavigate={(phaseNum) => {
					navigatedPhase = phaseNum;
				}}
			/>,
		);

		// Should call with initial selected phase (phase 1)
		expect(navigatedPhase).toBe(1);
	});

	test('expands phase on Enter key when selected', () => {
		let selectedPhase: number | undefined;

		const { lastFrame, stdin } = render(
			<RoadmapView
				phases={mockPhases}
				isActive={true}
				onSelectPhase={(phaseNum) => {
					selectedPhase = phaseNum;
				}}
				initialExpandedPhases={[1]}
			/>,
		);

		// Press Enter on expanded phase
		stdin.write('\r');

		const frame = lastFrame();

		// Should call onSelectPhase
		expect(selectedPhase).toBe(1);
	});
});
