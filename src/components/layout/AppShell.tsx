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
import { useSwipeable } from 'react-swipeable';
import { useShallow } from 'zustand/react/shallow';
import { SubtotalBar } from './SubtotalBar';
import { TabBar, TABS, type Tab } from './TabBar';
import { OnboardingScreen } from './OnboardingScreen';
import { useBillStore } from '../../store/billStore';
import { useHistoryStore } from '../../store/historyStore';
import { useOnboarding } from '../../hooks/useOnboarding';
import { HistoryPanel } from '../history/HistoryPanel';
import { PeoplePanel } from '../people/PeoplePanel';
import { ItemsPanel } from '../items/ItemsPanel';
import { AssignmentPanel } from '../assignments/AssignmentPanel';
import { TipTaxPanel } from '../tip-tax/TipTaxPanel';
import { SummaryPanel } from '../summary/SummaryPanel';

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const hasSplits = useHistoryStore.getState().splits.length > 0;
    return hasSplits ? 'history' : 'people';
  });
  const { showOnboarding, dismissOnboarding } = useOnboarding();

  // Count unassigned items for the badge on Assign tab
  const { items, assignments, currentSplitId } = useBillStore(
    useShallow((s) => ({
      items: s.config.items,
      assignments: s.config.assignments,
      currentSplitId: s.currentSplitId,
    }))
  );

  const unassignedCount = items.filter(
    (item) => !assignments[item.id] || assignments[item.id].length === 0
  ).length;

  // Editing indicator: find the matching saved split for date display
  const editingSplit = useHistoryStore((s) =>
    currentSplitId ? s.splits.find((sp) => sp.id === currentSplitId) : undefined
  );

  const editingDate = editingSplit
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(editingSplit.savedAt))
    : '';

  // Swipe left/right to navigate between tabs (mobile touch gestures)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      const tag = (eventData.event.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const idx = TABS.findIndex((t) => t.id === activeTab);
      if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
    },
    onSwipedRight: (eventData) => {
      const tag = (eventData.event.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const idx = TABS.findIndex((t) => t.id === activeTab);
      if (idx > 0) setActiveTab(TABS[idx - 1].id);
    },
    delta: 50,
    swipeDuration: 500,
    preventScrollOnSwipe: false,
    trackTouch: true,
    trackMouse: false,
  });

  // Gate first-time users with onboarding splash
  if (showOnboarding) return <OnboardingScreen onDismiss={dismissOnboarding} />;

  return (
    <div className="flex flex-col h-screen">
      {activeTab !== 'history' && <SubtotalBar />}

      {/* Editing indicator — visible on editor tabs when editing a saved split */}
      {currentSplitId && activeTab !== 'history' && (
        <div className="px-4 py-2 bg-blue-950/50 border-b border-blue-900/50 flex items-center justify-between">
          <span className="text-blue-300 text-xs font-medium">
            Editing saved split{editingDate ? ` from ${editingDate}` : ''}
          </span>
          <button
            onClick={() => setActiveTab('history')}
            className="text-blue-400 text-xs font-medium min-h-8 px-2"
          >
            Back to History
          </button>
        </div>
      )}

      {/* Main content area — padding-bottom for the fixed tab bar */}
      <main
        {...swipeHandlers}
        className="flex-1 overflow-y-auto pb-16 overscroll-contain"
        style={{ touchAction: 'pan-y' }}
      >
        {/* All panels kept mounted; CSS hidden class preserves scroll/input state */}
        <div className={activeTab === 'history' ? '' : 'hidden'}>
          <HistoryPanel onTabChange={setActiveTab} />
        </div>
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
