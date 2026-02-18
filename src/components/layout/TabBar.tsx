/**
 * src/components/layout/TabBar.tsx
 *
 * Bottom tab navigation with three tabs and an unassigned badge on Assign tab.
 * Fixed to bottom of screen, mobile-friendly with min-h-12 touch targets.
 */

export type Tab = 'people' | 'items' | 'assignments';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unassignedCount: number;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'people', label: 'People' },
  { id: 'items', label: 'Items' },
  { id: 'assignments', label: 'Assign' },
];

export function TabBar({ activeTab, onTabChange, unassignedCount }: TabBarProps) {
  return (
    <nav
      role="tablist"
      className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-700"
    >
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'assignments' && unassignedCount > 0;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
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
