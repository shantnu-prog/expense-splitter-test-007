See: .planning/research/SWIPE.md (researched 2026-02-24, HIGH confidence)

Key decisions from research:
- react-swipeable v7.0.2 (~3KB gzip, React 19 compatible)
- useSwipeable hook on <main> container (not individual panels)
- touch-action: pan-y on main element (CSS-level scroll conflict prevention)
- delta: 50px threshold, swipeDuration: 500ms
- Skip swipe on INPUT/TEXTAREA/SELECT elements
- No wrapping at edges (History first, Split last)
- Export TABS array from TabBar.tsx for index-based navigation
