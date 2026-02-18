/**
 * src/components/layout/AppShell.tsx
 *
 * Root layout component with sticky subtotal bar, scrollable panel area,
 * and fixed bottom tab navigation.
 *
 * All three panels are kept mounted using CSS hidden class to preserve
 * scroll position and input state when switching tabs.
 */

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SubtotalBar } from './SubtotalBar';
import { TabBar, type Tab } from './TabBar';
import { useBillStore } from '../../store/billStore';

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('people');

  // Count unassigned items for the badge on Assign tab
  const { items, assignments } = useBillStore(
    useShallow((s) => ({
      items: s.config.items,
      assignments: s.config.assignments,
    }))
  );

  const unassignedCount = items.filter(
    (item) => !assignments[item.id] || assignments[item.id].length === 0
  ).length;

  return (
    <div className="flex flex-col min-h-screen">
      <SubtotalBar />

      {/* Main content area — padding-bottom for the fixed tab bar */}
      <main className="flex-1 overflow-y-auto pb-16">
        {/* All panels kept mounted; CSS hidden class preserves scroll/input state */}
        <div className={activeTab === 'people' ? '' : 'hidden'}>
          <p className="p-4 text-gray-400">People panel placeholder</p>
        </div>
        <div className={activeTab === 'items' ? '' : 'hidden'}>
          <p className="p-4 text-gray-400">Items panel placeholder</p>
        </div>
        <div className={activeTab === 'assignments' ? '' : 'hidden'}>
          <p className="p-4 text-gray-400">Assign panel placeholder</p>
        </div>
      </main>

      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unassignedCount={unassignedCount}
      />
    </div>
  );
}
