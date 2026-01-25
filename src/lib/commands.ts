/**
 * GSD Command Definitions
 * Defines available commands for the command palette.
 */

import type { ToastType } from '../hooks/useToast.ts';
import { spawnOpencodeSession } from './opencode.ts';

export interface Command {
	name: string;
	description: string;
	key?: string;
	action: (showToast: (msg: string, type?: ToastType) => void, args?: string) => void;
	queueable?: boolean; // If true, prompts for execution mode
}

/**
 * Create a stub action for a command that will be connected to OpenCode in Phase 4.
 * Each command shows its name in the toast for clarity.
 */
function createStubAction(commandName: string) {
	return (showToast: (msg: string, type?: ToastType) => void, args?: string): void => {
		const argsInfo = args ? ` with args: ${args}` : '';
		showToast(
			`Command: ${commandName}${argsInfo} - will execute when connected to OpenCode`,
			'info',
		);
	};
}

/**
 * Available GSD commands.
 * These are displayed in the command palette and can be filtered/executed.
 */
export const commands: Command[] = [
	{
		name: 'add-todo',
		description: 'Add a new todo item',
		action: createStubAction('add-todo'),
		queueable: true,
	},
	{
		name: 'add-phase',
		description: 'Add a new phase to roadmap',
		action: createStubAction('add-phase'),
		queueable: true,
	},
	{
		name: 'insert-phase',
		description: 'Insert a phase between existing phases',
		action: createStubAction('insert-phase'),
		queueable: true,
	},
	{
		name: 'progress',
		description: 'Update task progress',
		action: createStubAction('progress'),
		queueable: true,
	},
	{
		name: 'verify',
		description: 'Run verification checks',
		action: createStubAction('verify'),
		queueable: true,
	},
	{
		name: 'discuss-phase',
		description: 'Start phase discussion',
		action: createStubAction('discuss-phase'),
		queueable: true,
	},
	{
		name: 'plan-phase',
		description: 'Create phase plan',
		action: createStubAction('plan-phase'),
		queueable: true,
	},
	{
		name: 'execute-phase',
		description: 'Execute phase plan',
		action: createStubAction('execute-phase'),
		queueable: true,
	},
	{
		name: 'spawn-opencode',
		description: 'Open OpenCode session for complex workflows',
		action: (showToast, _args) => {
			// Note: spawnSync is blocking, so TUI will pause during OpenCode session
			const success = spawnOpencodeSession();
			if (success) {
				showToast('OpenCode session completed', 'success');
			} else {
				showToast('OpenCode session failed or was cancelled', 'warning');
			}
		},
		// Not queueable - already terminal handoff
	},
	{
		name: 'connect-session',
		description: 'Connect to existing OpenCode session',
		key: 'c',
		action: createStubAction('connect-session'),
		// Not queueable - session management
	},
];
