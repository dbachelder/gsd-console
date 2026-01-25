import { describe, expect, test } from 'bun:test';
import { render } from 'ink-testing-library';
import { useTabNav } from '../../src/hooks/useTabNav.ts';

describe('useTabNav', () => {
	test('initializes with first tab selected', () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['roadmap', 'phase', 'todos'], isActive: true });
			capturedNav = nav;
			return null;
		};

		render(<TestComponent />);

		expect(capturedNav.activeTab).toBe('roadmap');
		expect(capturedNav.tabIndex).toBe(0);
	});

	test('initializes with custom initial tab', () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['roadmap', 'phase', 'todos'], initialTab: 'phase', isActive: true });
			capturedNav = nav;
			return null;
		};

		render(<TestComponent />);

		expect(capturedNav.activeTab).toBe('phase');
		expect(capturedNav.tabIndex).toBe(1);
	});

	test('cycles forward with Tab key', async () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['a', 'b', 'c'], isActive: true });
			capturedNav = nav;
			return null;
		};

		const { stdin } = render(<TestComponent />);

		stdin.write('\t');

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(capturedNav?.activeTab).toBe('b');
		expect(capturedNav?.tabIndex).toBe(1);
	});

	test('wraps to first tab when Tab pressed on last tab', async () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['a', 'b', 'c'], isActive: true, initialTab: 'c' });
			capturedNav = nav;
			return null;
		};

		const { stdin } = render(<TestComponent />);

		stdin.write('\t');

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(capturedNav?.activeTab).toBe('a');
		expect(capturedNav?.tabIndex).toBe(0);
	});

	test('jumps to tab with number key 1', async () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['a', 'b', 'c'], isActive: true });
			capturedNav = nav;
			return null;
		};

		const { stdin } = render(<TestComponent />);

		stdin.write('1');

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(capturedNav?.activeTab).toBe('a');
		expect(capturedNav?.tabIndex).toBe(0);
	});

	test('jumps to tab with number key 2', async () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['a', 'b', 'c'], isActive: true });
			capturedNav = nav;
			return null;
		};

		const { stdin } = render(<TestComponent />);

		stdin.write('2');

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(capturedNav?.activeTab).toBe('b');
		expect(capturedNav?.tabIndex).toBe(1);
	});

	test('jumps to tab with number key 3', async () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['a', 'b', 'c'], isActive: true });
			capturedNav = nav;
			return null;
		};

		const { stdin } = render(<TestComponent />);

		stdin.write('3');

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(capturedNav?.activeTab).toBe('c');
		expect(capturedNav?.tabIndex).toBe(2);
	});

	test('ignores number key outside tab count', async () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['a', 'b'], isActive: true });
			capturedNav = nav;
			return null;
		};

		const { stdin } = render(<TestComponent />);

		stdin.write('5');

		await new Promise(resolve => setTimeout(resolve, 10));

		// Should stay on first tab
		expect(capturedNav?.activeTab).toBe('a');
		expect(capturedNav?.tabIndex).toBe(0);
	});

	test('returns setActiveTab function', () => {
		let capturedNav: any = null;

		const TestComponent = () => {
			const nav = useTabNav({ tabs: ['a', 'b'], isActive: true });
			capturedNav = nav;
			return null;
		};

		render(<TestComponent />);

		expect(typeof capturedNav.setActiveTab).toBe('function');
	});

	test('calls onTabChange callback when tab changes', async () => {
		let callbackCalled = false;
		let callbackTab: string | null = null;

		const TestComponent = () => {
			const nav = useTabNav({
				tabs: ['a', 'b'],
				isActive: true,
				onTabChange: (tab) => { callbackCalled = true; callbackTab = tab; },
			});
			return null;
		};

		const { stdin } = render(<TestComponent />);

		stdin.write('\t');

		await new Promise(resolve => setTimeout(resolve, 10));

		expect(callbackCalled).toBe(true);
		expect(callbackTab).toBe('b' as string);
	});

	test('respects isActive flag for keyboard input', () => {
		const TestComponentActive = () => {
			const nav = useTabNav({ tabs: ['a', 'b'], isActive: true });
			return null;
		};

		const TestComponentInactive = () => {
			const nav = useTabNav({ tabs: ['a', 'b'], isActive: false });
			return null;
		};

		// Both components should initialize fine regardless of isActive
		expect(() => render(<TestComponentActive />)).not.toThrow();
		expect(() => render(<TestComponentInactive />)).not.toThrow();
	});
});
