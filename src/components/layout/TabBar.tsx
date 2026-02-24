/**
 * src/components/layout/TabBar.tsx
 *
 * Bottom tab navigation with roving tabindex and full keyboard navigation.
 * Implements WAI-ARIA tabs pattern: Tab into tablist as a single stop,
 * ArrowLeft/Right move between tabs, Home/End jump to first/last.
 * Fixed to bottom of screen, mobile-friendly with min-h-12 touch targets.
 */

import { useRef } from 'react';

export type Tab = 'history' | 'people' | 'items' | 'assignments' | 'split';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unassignedCount: number;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'history', label: 'History' },
  { id: 'people', label: 'People' },
  { id: 'items', label: 'Items' },
  { id: 'assignments', label: 'Assign' },
  { id: 'split', label: 'Split' },
];

export function TabBar({ activeTab, onTabChange, unassignedCount }: TabBarProps) {
  const tabRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  function focusTab(index: number) {
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent, currentIndex: number) {
    const count = TABS.length;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        focusTab((currentIndex + 1) % count);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusTab((currentIndex - 1 + count) % count);
        break;
      case 'Home':
        e.preventDefault();
        focusTab(0);
        break;
      case 'End':
        e.preventDefault();
        focusTab(count - 1);
        break;
    }
  }

  return (
    <nav
      role="tablist"
      aria-orientation="horizontal"
      className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-700"
    >
      <div className="flex">
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'assignments' && unassignedCount > 0;

          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onFocus={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                'relative flex-1 min-h-12 py-3 text-sm font-medium',
                isActive
                  ? 'text-blue-400 border-t-2 border-blue-400'
                  : 'text-gray-400',
              ].join(' ')}
            >
              {tab.label}
              {showBadge && (
                <span
                  aria-label={`${unassignedCount} unassigned`}
                  className="absolute top-2 right-1/3 w-2 h-2 bg-amber-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
