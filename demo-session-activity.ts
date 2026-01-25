#!/usr/bin/env bun
/**
 * Demo: Session Activity Monitor
 *
 * Run this script to see real-time session activity from OpenCode server.
 *
 * Usage:
 *   bun demo-session-activity.ts
 */

import { getActiveSession, monitorSessionActivity } from './src/lib/sessionActivity.ts';

console.log('🔍 OpenCode Session Activity Monitor');
console.log('Press Ctrl+C to stop\n');

// Get initial state
const initial = await getActiveSession();
if (initial) {
	console.log(`📊 Current: ${initial.title}`);
	console.log(`   Active: ${initial.isActive ? 'yes' : 'no'}`);
	console.log(`   Activity: ${initial.currentActivity || 'none'}`);
} else {
	console.log('📊 No sessions found');
}

// Monitor for changes
monitorSessionActivity((activity) => {
	const status = activity.isActive ? '● Active' : '○ Idle';
	const time = new Date(activity.lastUpdated).toLocaleTimeString();
	console.log(`\n[${time}] ${status}`);
	console.log(`   ${activity.title}`);
	if (activity.currentActivity) {
		console.log(`   → ${activity.currentActivity}`);
	}
});
