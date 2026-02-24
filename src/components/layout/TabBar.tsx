/**
 * src/components/layout/TabBar.tsx
 *
 * Bottom tab navigation with roving tabindex and full keyboard navigation.
 * Implements WAI-ARIA tabs pattern: Tab into tablist as a single stop,
 * ArrowLeft/Right move between tabs, Home/End jump to first/last.
 * Fixed to bottom of screen, mobile-friendly with min-h-14 touch targets.
 */

import { useRef } from 'react';

export type Tab = 'history' | 'people' | 'items' | 'assignments' | 'split';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unassignedCount: number;
}

export const TABS: { id: Tab; label: string }[] = [
  { id: 'history', label: 'History' },
  { id: 'people', label: 'People' },
  { id: 'items', label: 'Items' },
  { id: 'assignments', label: 'Assign' },
  { id: 'split', label: 'Split' },
];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  history: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <polyline points="10 6 10 10 13 12" />
    </svg>
  ),
  people: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="7" r="2.5" />
      <path d="M3 16c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
      <circle cx="14" cy="7.5" r="2" />
      <path d="M14.5 11.5c1.8.3 3.5 1.8 3.5 4" />
    </svg>
  ),
  items: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="12" height="16" rx="2" />
      <line x1="7" y1="6" x2="13" y2="6" />
      <line x1="7" y1="9" x2="13" y2="9" />
      <line x1="7" y1="12" x2="10" y2="12" />
    </svg>
  ),
  assignments: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="14" cy="14" r="2.5" />
      <path d="M8.5 6h4.5a2 2 0 0 1 2 2v1.5" />
      <path d="M11.5 14H7a2 2 0 0 1-2-2v-1.5" />
    </svg>
  ),
  split: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 3v14" />
      <path d="M3.5 7.5L10 10" />
      <path d="M16.5 7.5L10 10" />
    </svg>
  ),
};

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
      className="fixed bottom-0 inset-x-0 glass-surface"
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
                'relative flex-1 min-h-14 py-2 text-sm font-medium',
                isActive
                  ? 'text-blue-400'
                  : 'text-gray-400',
              ].join(' ')}
            >
              <span className="flex flex-col items-center gap-0.5">
                {TAB_ICONS[tab.id]}
                <span className="text-[10px] leading-tight">{tab.label}</span>
              </span>
              {showBadge && (
                <span
                  aria-label={`${unassignedCount} unassigned`}
                  className="absolute -top-0.5 left-1/2 ml-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white"
                >
                  {unassignedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
