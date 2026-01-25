/**
 * GSD TUI Type Definitions
 * Types for parsing and displaying GSD planning documents.
 */

// Phase status types
export type PhaseStatus = 'not-started' | 'in-progress' | 'complete' | 'blocked';

// Phase indicators (derived from file existence/content)
export interface PhaseIndicators {
	hasContext: boolean; // CONTEXT.md exists
	hasPlan: boolean; // PLAN.md exists
	hasResearch: boolean; // RESEARCH.md exists
	uatComplete: boolean; // UAT.md exists with status: passed
}

export interface Phase {
	number: number; // 1, 2, 3... (can be decimal like 1.1 for inserted phases)
	name: string; // "Core TUI"
	goal: string; // From roadmap
	status: PhaseStatus;
	requirements: string[]; // Requirement IDs (DISP-01, etc.)
	successCriteria: string[];
	dependsOn: string | null; // Prior phase dependency
	indicators: PhaseIndicators;
	plansTotal: number;
	plansComplete: number;
}

export interface Todo {
	id: string;
	text: string;
	completed: boolean;
	source?: string; // File path where todo was found
	phase?: number; // Related phase if any
}

export interface ProjectState {
	currentPhase: number;
	totalPhases: number;
	projectName: string;
	coreValue: string;
	progressPercent: number;
	lastActivity: string;
}

export interface GsdData {
	phases: Phase[];
	todos: Todo[];
	state: ProjectState;
	loading: boolean;
	error: Error | null;
	changedFiles: string[]; // Files that changed in last refresh
}

// CLI flags for the TUI
export interface CliFlags {
	only?: 'roadmap' | 'phase' | 'todos';
	phase?: number;
	dir?: string;
}

// OpenCode integration types

/** OpenCode connection state */
export interface OpencodeConnectionState {
	isConnected: boolean;
	isChecking: boolean;
	serverVersion?: string;
	error?: Error;
}
