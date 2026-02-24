/**
 * src/components/history/HistoryPanel.tsx
 *
 * History list panel with empty state, delete with undo, New Split button,
 * and tap-to-load. Mounted in AppShell with CSS hidden pattern.
 */

import { useHistoryStore } from '../../store/historyStore';
import type { SavedSplit } from '../../store/historyStore';
import { useBillStore } from '../../store/billStore';
import { useUndoDelete } from '../../hooks/useUndoDelete';
import { UndoToast } from '../shared/UndoToast';
import { HistoryRow } from './HistoryRow';
import type { Tab } from '../layout/TabBar';

interface HistoryPanelProps {
  onTabChange: (tab: Tab) => void;
}

export function HistoryPanel({ onTabChange }: HistoryPanelProps) {
  const splits = useHistoryStore((s) => s.splits);
  const undo = useUndoDelete();

  function handleDelete(split: SavedSplit) {
    useHistoryStore.getState().remove(split.id);
    undo.scheduleDelete({ kind: 'savedSplit', split });
  }

  function handleUndo() {
    const snap = undo.handleUndo(undo.snapshot);
    if (snap?.kind === 'savedSplit') {
      useHistoryStore.getState().restore(snap.split);
    }
  }

  function handleLoad(split: SavedSplit) {
    useBillStore.getState().loadConfig(split.config);
    useBillStore.getState().setCurrentSplitId(split.id);
    onTabChange('people');
  }

  function handleNewSplit() {
    useBillStore.getState().reset();
    onTabChange('people');
  }

  if (splits.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-gray-400 text-base mb-2">No saved splits yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Split a bill and save it to see it here
          </p>
          <button
            onClick={handleNewSplit}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl min-h-12 active:bg-blue-700"
          >
            New Split
          </button>
        </div>
        <UndoToast
          message={undo.message}
          visible={undo.visible}
          onUndo={handleUndo}
          onDismiss={undo.dismiss}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Header with New Split button */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-gray-400 text-sm font-medium">Saved Splits</h2>
          <button
            onClick={handleNewSplit}
            className="text-blue-400 text-sm font-medium min-h-11 px-2"
          >
            + New Split
          </button>
        </div>
        {/* Scrollable split list */}
        <div className="flex-1 px-4 pt-3 space-y-2">
          {splits.map((split) => (
            <HistoryRow
              key={split.id}
              split={split}
              onLoad={handleLoad}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
      <UndoToast
        message={undo.message}
        visible={undo.visible}
        onUndo={handleUndo}
        onDismiss={undo.dismiss}
      />
    </>
  );
}
