/**
 * src/components/layout/AppShell.tsx
 *
 * Root layout component with sticky subtotal bar, scrollable panel area,
 * and fixed bottom tab navigation.
 *
 * All panels are kept mounted using CSS hidden class to preserve
 * scroll position and input state when switching tabs.
 *
 * Gates first-time users with an onboarding splash screen.
 */

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SubtotalBar } from './SubtotalBar';
import { TabBar, type Tab } from './TabBar';
import { OnboardingScreen } from './OnboardingScreen';
import { useBillStore } from '../../store/billStore';
import { useOnboarding } from '../../hooks/useOnboarding';
import { PeoplePanel } from '../people/PeoplePanel';
import { ItemsPanel } from '../items/ItemsPanel';
import { AssignmentPanel } from '../assignments/AssignmentPanel';
import { TipTaxPanel } from '../tip-tax/TipTaxPanel';
import { SummaryPanel } from '../summary/SummaryPanel';

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('people');
  const { showOnboarding, dismissOnboarding } = useOnboarding();

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

  // Gate first-time users with onboarding splash
  if (showOnboarding) return <OnboardingScreen onDismiss={dismissOnboarding} />;

  return (
    <div className="flex flex-col min-h-screen">
      <SubtotalBar />

      {/* Main content area — padding-bottom for the fixed tab bar */}
      <main className="flex-1 overflow-y-auto pb-16 overscroll-contain">
        {/* All panels kept mounted; CSS hidden class preserves scroll/input state */}
        <div className={activeTab === 'people' ? '' : 'hidden'}>
          <PeoplePanel />
        </div>
        <div className={activeTab === 'items' ? '' : 'hidden'}>
          <ItemsPanel />
        </div>
        <div className={activeTab === 'assignments' ? '' : 'hidden'}>
          <AssignmentPanel onTabChange={setActiveTab} />
        </div>
        <div className={activeTab === 'split' ? '' : 'hidden'}>
          <TipTaxPanel />
          <SummaryPanel />
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
