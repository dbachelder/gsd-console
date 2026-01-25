# Roadmap: GSD Status TUI

## Overview

Build a standalone terminal UI that displays GSD project status in real-time alongside OpenCode.

## Phases

### Phase 1: Core TUI
**Goal**: User can view GSD project status in a keyboard-navigable terminal interface
**Depends on**: Nothing (first phase)
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04
**Success Criteria** (what must be TRUE):
  1. User sees roadmap overview with phase list and progress percentage
  2. User can expand a phase to see its goal, requirements, and success criteria
  3. User sees todos list from planning docs
  4. User can navigate between panels using Tab and arrow keys
  5. User can scroll content using Vim keybindings
**Plans**: 4 plans

### Phase 2: Real-time Updates
**Goal**: TUI automatically refreshes when planning docs change
**Depends on**: Phase 1
**Requirements**: RT-01, RT-02, RT-03
**Success Criteria** (what must be TRUE):
  1. TUI refreshes automatically when any .planning/ file is saved
  2. Rapid file saves do not cause flicker
  3. Recently changed items show a visual indicator
**Plans**: 3 plans

### Phase 3.1: UI Polish
**Goal**: UI refinement for existing TUI
**Depends on**: Phase 3
**Plans**: 2 plans
