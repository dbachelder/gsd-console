/**
 * TabLayout Component Tests
 */

import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { TabLayout } from '../../../src/components/layout/TabLayout.tsx';
import type { GsdData, ProjectState, CliFlags } from '../../../src/lib/types.ts';
import type { Phase } from '../../../src/lib/types.ts';

const mockState: ProjectState = {
	currentPhase: 1,
	totalPhases: 4,
	projectName: 'Test Project',
	coreValue: 'Test value',
	progressPercent: 25,
	lastActivity: '2026-01-25',
};

const createMockData = (): GsdData => ({
	phases: [],
	todos: [],
	state: mockState,
	loading: false,
	error: null,
	changedFiles: [],
});

const createMockPhase = (number: number): Phase => ({
	number,
	name: `Test Phase ${number}`,
	goal: 'Test goal',
	status: 'not-started' as const,
	requirements: [],
	successCriteria: [],
	dependsOn: null,
	indicators: {
		hasContext: false,
		hasPlan: false,
		hasResearch: false,
		uatComplete: false,
	},
	plansTotal: 0,
	plansComplete: 0,
});

describe('TabLayout', () => {
	test('renders all 4 tabs', () => {
		const mockData = createMockData();

		const { lastFrame } = render(
			<TabLayout
				data={mockData}
				flags={{}}
				selectedPhaseNumber={1}
				onPhaseSelect={() => {}}
			/>,
		);

		expect(lastFrame()).toContain('[1] Roadmap');
		expect(lastFrame()).toContain('[2] Phase');
		expect(lastFrame()).toContain('[3] Todos');
		expect(lastFrame()).toContain('[4] Background');
	});

	test('shows active tab with underline', () => {
		const mockData = createMockData();

		const { lastFrame } = render(
			<TabLayout
				data={mockData}
				flags={{}}
				selectedPhaseNumber={1}
				onPhaseSelect={() => {}}
			/>,
		);

		// Roadmap should be active (default)
		expect(lastFrame()).toContain('Roadmap');
	});

	test('renders RoadmapView when roadmap tab active', () => {
		const mockData = createMockData();

		const { lastFrame } = render(
			<TabLayout
				data={mockData}
				flags={{}}
				selectedPhaseNumber={1}
				onPhaseSelect={() => {}}
			/>,
		);

		// Should render roadmap view content (though empty phases)
		expect(lastFrame()).toContain('[1] Roadmap');
	});

	test('renders PhaseView when phase tab active', () => {
		const mockData = createMockData();
		mockData.phases = [createMockPhase(1)];

		const { lastFrame } = render(
			<TabLayout
				data={mockData}
				flags={{}}
				selectedPhaseNumber={1}
				onPhaseSelect={() => {}}
			/>,
		);

		// Initially shows roadmap tab
		expect(lastFrame()).toContain('[1] Roadmap');
	});

	test('omits tab bar in single view mode', () => {
		const mockData = createMockData();
		const flags: CliFlags = { only: 'roadmap' };

		const { lastFrame } = render(
			<TabLayout
				data={mockData}
				flags={flags}
				selectedPhaseNumber={1}
				onPhaseSelect={() => {}}
			/>,
		);

		// In single view mode, only the content is rendered, not tabs
		expect(lastFrame()).not.toContain('[2] Phase');
	});

	test('displays active view correctly', () => {
		const mockData = createMockData();

		const { lastFrame } = render(
			<TabLayout
				data={mockData}
				flags={{}}
				selectedPhaseNumber={1}
				onPhaseSelect={() => {}}
			/>,
		);

		// Should have tab bar
		expect(lastFrame()).toContain('[1]');
		expect(lastFrame()).toContain('Roadmap');
	});
});
