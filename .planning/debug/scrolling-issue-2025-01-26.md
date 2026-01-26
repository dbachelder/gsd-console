# Debug Session: Phase Content Scrolling Issue

**Date:** 2025-01-26
**Issue:** Phase content doesn't scroll within viewport - UI gets messed up when content exceeds available space
**Reported by:** User in UAT
**Severity:** Major

## Issue Description

User reports: "I don't see a way to scroll.. UI just gets all messed up when content area is bigger than allotted space, like section headers get partially over written, for example. or borders get overwritten."

## Context

Phase 6 Plan 01 added `flexGrow={1}` to content area Box in PhaseView.tsx and to active view content Box in TabLayout.tsx to make phase tab content scrollable within viewport while footer stays fixed.

## Investigation

### Layout Structure Analysis

**App.tsx (lines 350-353):**
```tsx
<Box flexDirection="column" flexGrow={1}>  // Root container - fills terminal
  <Header />                                 // Fixed height
  <Box flexDirection="column" flexGrow={1}>  // Content area - expands to fill
    <TabLayout ... />
  </Box>
  <Footer />                                 // Fixed height
</Box>
```

**TabLayout.tsx (lines 161-211):**
```tsx
<Box flexDirection="column">  // No flexGrow - takes content height
  <TabBar activeTab={activeTab} />  // Tab headers - fixed height
  <Box flexDirection="column" flexGrow={1}>  // Active view - fills remaining
    {activeTab === 'phase' && <PhaseView ... />}
  </Box>
</Box>
```

**PhaseView.tsx (lines 164-252):**
```tsx
<Box flexDirection="column" paddingX={1} flexGrow={1}>  // Main container - fills
  <Box flexDirection="column" marginBottom={1}>  // Phase header - fixed
    <Text>Phase {phase.number}: {phase.name}</Text>
    <Text>Status: {phase.status}</Text>
  </Box>

  <Box flexDirection="column" borderStyle="single" paddingX={1} flexGrow={1}>  // Content box - fills
    {/* Goal, Plans, Success Criteria, Requirements all rendered in full */}
    <GoalSection goal={phase.goal} />
    {planInfos.map(...)}
    <CriteriaList criteria={phase.successCriteria} />
    {detailLevel >= 2 && <RequirementsList requirements={phase.requirements} />}
  </Box>
</Box>
```

### Scrolling Infrastructure Check

**`useVimNav` hook capabilities (hooks/useVimNav.ts):**
- ✅ Tracks `scrollOffset` state (line 48)
- ✅ Auto-scrolls to keep selection visible (lines 63-76)
- ✅ Returns `scrollOffset` and `setScrollOffset` (lines 189-191)

**PhaseView usage (PhaseView.tsx lines 125-131):**
```tsx
useVimNav({
  itemCount: Math.max(contentLines.length, 1),  // ✓ Counts content
  pageSize: 15,
  isActive,
  onSelect: () => {},
  onBack: () => {},
});
```

**Problem:** The `scrollOffset` returned by `useVimNav` is **not captured or used** in PhaseView:
- Line 125-131: `useVimNav` is called but return value destructured (only `selectedIndex` and `scrollOffset` available)
- Lines 68-69: `_scrollOffset` prop is ignored (prefixed with underscore)
- Lines 201-250: All content rendered in full, never sliced based on scroll position

### Similar Views Check

**RoadmapView.tsx (lines 91-100, 156-174):**
- Uses `useVimNav` and gets `selectedIndex`
- Does NOT capture or use `scrollOffset` (line 91: only `selectedIndex` destructured)
- Renders ALL phases regardless of scroll position (line 160: `phases.map(...)`)

**Conclusion:** Neither RoadmapView nor PhaseView implement scrolling. They track scroll offset but don't use it.

## Root Cause

**`flexGrow={1}` alone does not enable scrolling in Ink.** It only makes a Box expand to fill available space. To implement scrolling:

1. **Track scroll position** (✓ done via `useVimNav`)
2. **Calculate viewport height** (✗ not done)
3. **Render only visible content based on scroll offset** (✗ not done)
4. **Provide scroll indicators** (✗ not done)

When `flexGrow={1}` boxes contain content exceeding viewport height:
- Ink renders all content beyond what fits
- Content wraps around or overwrites other elements
- Borders get overwritten, headers get partially obscured

## What's Missing

1. **Viewport height calculation:** Need to know how many lines can fit in the content area (excluding header/footer/padding)

2. **Content rendering based on scroll offset:**
   ```tsx
   // Current (broken) - renders everything:
   <Box>{allContent.map(item => renderItem(item))}</Box>

   // Needed - renders only visible slice:
   <Box>
     {allContent
       .slice(scrollOffset, scrollOffset + viewportHeight)
       .map(item => renderItem(item))}
   </Box>
   ```

3. **Scroll indicators:** Show when there's content above/below current view

4. **Scroll offset state management:**
   - Capture `scrollOffset` from `useVimNav`
   - Sync with `useTabState` for persistence
   - Pass to render function

5. **Virtual line counting:** Current `contentLines` calculation (lines 116-122) counts text lines but doesn't account for:
   - Multi-line text wrapping
   - Border decorations
   - Padding/spacing
   - Nested boxes

## Related Files

- `src/App.tsx` - Main layout with Header/Content/Footer
- `src/components/layout/TabLayout.tsx` - Tab bar + content area
- `src/components/phase/PhaseView.tsx` - Phase detail view
- `src/components/roadmap/RoadmapView.tsx` - Phase list view (same issue)
- `src/hooks/useVimNav.ts` - Navigation hook with scroll tracking
- `src/hooks/useTabState.ts` - Tab state persistence (has `scrollOffset` fields)

## Next Steps

1. Calculate viewport height for content area (dynamic based on terminal size)
2. Capture `scrollOffset` from `useVimNav` in PhaseView
3. Slice content rendering based on scroll offset
4. Add scroll indicators (↑/↓ or progress bar)
5. Test with various content sizes
6. Apply same pattern to RoadmapView
