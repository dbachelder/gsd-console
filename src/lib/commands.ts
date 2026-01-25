/**
 * GSD Command Definitions
 * Defines available commands for the command palette.
 */

import type { ToastType } from '../hooks/useToast.ts';

export interface Command {
	name: string;
	description: string;
	key?: string;
	action: (showToast: (msg: string, type?: ToastType) => void) => void;
}

/**
 * Stub action for commands that will be connected to OpenCode in Phase 4.
 */
function stubAction(showToast: (msg: string, type?: ToastType) => void): void {
	showToast('Will execute when connected to OpenCode', 'info');
}

/**
 * Available GSD commands.
 * These are displayed in the command palette and can be filtered/executed.
 */
export const commands: Command[] = [
	{
		name: 'add-todo',
		description: 'Add a new todo item',
		action: stubAction,
	},
	{
		name: 'add-phase',
		description: 'Add a new phase to roadmap',
		action: stubAction,
	},
	{
		name: 'insert-phase',
		description: 'Insert a phase between existing phases',
		action: stubAction,
	},
	{
		name: 'progress',
		description: 'Update task progress',
		action: stubAction,
	},
	{
		name: 'verify',
		description: 'Run verification checks',
		action: stubAction,
	},
	{
		name: 'discuss-phase',
		description: 'Start phase discussion',
		action: stubAction,
	},
	{
		name: 'plan-phase',
		description: 'Create phase plan',
		action: stubAction,
	},
	{
		name: 'execute-phase',
		description: 'Execute phase plan',
		action: stubAction,
	},
];
