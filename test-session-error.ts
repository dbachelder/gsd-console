/**
 * Test script to understand session.error event structure
 */

import { createClient } from './src/lib/opencode.ts';

async function testSessionError() {
	console.log('Testing session error events...');

	const client = createClient();

	try {
		// Create a session
		const createResult = await client.session.create({
			body: { title: 'Test Error Session' },
		});

		if (!createResult.data) {
			console.error('Failed to create session');
			return;
		}

		const sessionId = createResult.data.id;
		console.log('Created session:', sessionId);

		// Try to send a prompt that might cause an error
		console.log('Sending test prompt...');
		await client.session.prompt({
			path: { id: sessionId },
			body: {
				parts: [{ type: 'text', text: '/invalid-command-test' }],
			},
		});

		console.log('Prompt sent, subscribing to events...');

		// Subscribe to events
		const result = await client.event.subscribe({});

		for await (const event of result.stream) {
			console.log('Event type:', event.type);
			console.log('Event properties:', JSON.stringify(event.properties, null, 2));

			if (event.type === 'session.error') {
				console.log('\n=== SESSION ERROR ===');
				console.log('Full event:', JSON.stringify(event, null, 2));
				console.log('=====================\n');
			}

			if (event.type === 'session.idle') {
				console.log('Session idle, stopping subscription');
				break;
			}
		}
	} catch (error) {
		console.error('Error in test:', error);
	}
}

testSessionError();
