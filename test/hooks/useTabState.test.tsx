import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { useTabState } from '../../src/hooks/useTabState.ts';

describe('useTabState', () => {
	test('initializes with default tab states', () => {
		let capturedTabState: any = null;

		const TestComponent = () => {
			const { tabState } = useTabState();
			capturedTabState = tabState;
			return null;
		};

		render(<TestComponent />);

		expect(capturedTabState).toHaveProperty('roadmap');
		expect(capturedTabState).toHaveProperty('phase');
		expect(capturedTabState).toHaveProperty('todos');
		expect(capturedTabState).toHaveProperty('background');
	});

	test('roadmap tab has default state', () => {
		let capturedGetTab: any = null;

		const TestComponent = () => {
			const { getTab } = useTabState();
			capturedGetTab = getTab;
			return null;
		};

		render(<TestComponent />);

		const roadmapState = capturedGetTab('roadmap');
		expect(roadmapState.expandedPhases).toEqual([]);
		expect(roadmapState.selectedIndex).toBe(0);
		expect(roadmapState.scrollOffset).toBe(0);
	});

	test('phase tab has default state', () => {
		let capturedGetTab: any = null;

		const TestComponent = () => {
			const { getTab } = useTabState();
			capturedGetTab = getTab;
			return null;
		};

		render(<TestComponent />);

		const phaseState = capturedGetTab('phase');
		expect(phaseState.selectedPhaseNumber).toBeUndefined();
		expect(phaseState.scrollOffset).toBe(0);
	});

	test('returns setTab function', () => {
		let capturedSetTab: any = null;

		const TestComponent = () => {
			const { setTab } = useTabState();
			capturedSetTab = setTab;
			return null;
		};

		render(<TestComponent />);

		expect(typeof capturedSetTab).toBe('function');
	});

	test('returns getTab function', () => {
		let capturedGetTab: any = null;

		const TestComponent = () => {
			const { getTab } = useTabState();
			capturedGetTab = getTab;
			return null;
		};

		render(<TestComponent />);

		expect(typeof capturedGetTab).toBe('function');
	});

	test('setTab updates tab state', () => {
		let capturedSetTab: any = null;
		let capturedGetTab: any = null;

		const TestComponent = () => {
			const { setTab, getTab } = useTabState();
			capturedSetTab = setTab;
			capturedGetTab = getTab;
			return null;
		};

		render(<TestComponent />);

		capturedSetTab?.('phase', { selectedPhaseNumber: 1, detailLevel: 2 });

		// Verify state was updated
		const phaseState = capturedGetTab('phase');
		expect(phaseState.selectedPhaseNumber).toBe(1);
		expect(phaseState.detailLevel).toBe(2);
	});

	test('setTab merges partial updates', () => {
		let capturedSetTab: any = null;
		let capturedGetTab: any = null;

		const TestComponent = () => {
			const { setTab, getTab } = useTabState();
			capturedSetTab = setTab;
			capturedGetTab = getTab;
			return null;
		};

		render(<TestComponent />);

		// First set detailLevel
		capturedSetTab?.('phase', { detailLevel: 2 });

		let phaseState = capturedGetTab('phase');
		expect(phaseState.detailLevel).toBe(2);
		expect(phaseState.scrollOffset).toBe(0);

		// Then set scrollOffset (should preserve detailLevel)
		capturedSetTab?.('phase', { scrollOffset: 5 });

		phaseState = capturedGetTab('phase');
		expect(phaseState.detailLevel).toBe(2); // Preserved
		expect(phaseState.scrollOffset).toBe(5); // Updated
	});

	test('handles unknown tab id', () => {
		let capturedGetTab: any = null;

		const TestComponent = () => {
			const { getTab } = useTabState();
			capturedGetTab = getTab;
			return null;
		};

		render(<TestComponent />);

		// Unknown tab should return empty object
		const unknownState = capturedGetTab('unknown' as any);
		expect(unknownState).toEqual({});
	});

	test('tabs maintain independent state', () => {
		let capturedSetTab: any = null;
		let capturedGetTab: any = null;

		const TestComponent = () => {
			const { setTab, getTab } = useTabState();
			capturedSetTab = setTab;
			capturedGetTab = getTab;
			return null;
		};

		render(<TestComponent />);

		// Update roadmap tab
		capturedSetTab?.('roadmap', { expandedPhases: [1, 2] });

		// Update phase tab
		capturedSetTab?.('phase', { selectedPhaseNumber: 3 });

		// Verify tabs are independent
		const roadmapState = capturedGetTab('roadmap');
		const phaseState = capturedGetTab('phase');

		expect(roadmapState.expandedPhases).toEqual([1, 2]);
		expect(phaseState.selectedPhaseNumber).toBe(3);
	});

	test('returns tabState object with all tabs', () => {
		let capturedTabState: any = null;

		const TestComponent = () => {
			const { tabState } = useTabState();
			capturedTabState = tabState;
			return null;
		};

		render(<TestComponent />);

		expect(Object.keys(capturedTabState)).toHaveLength(4);
		expect(capturedTabState).toHaveProperty('roadmap');
		expect(capturedTabState).toHaveProperty('phase');
		expect(capturedTabState).toHaveProperty('todos');
		expect(capturedTabState).toHaveProperty('background');
	});
});
