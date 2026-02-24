/**
 * src/components/history/HistoryRow.tsx
 *
 * Single history entry row displaying formatted date, people names (with +N overflow),
 * and computed total. Separate tap targets for loading (whole row) and deleting (x button).
 */

import type { SavedSplit } from '../../store/historyStore';
import { computeSplit } from '../../engine/engine';
import { centsToDollars } from '../../utils/currency';
import type { Cents } from '../../engine/types';

interface HistoryRowProps {
  split: SavedSplit;
  onLoad: (split: SavedSplit) => void;
  onDelete: (split: SavedSplit) => void;
}

export function HistoryRow({ split, onLoad, onDelete }: HistoryRowProps) {
  // Format date from savedAt timestamp
  const dateStr = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(split.savedAt));

  // People names: first 2 + overflow count
  const people = split.config.people;
  let peopleStr: string;
  if (people.length === 0) {
    peopleStr = 'No people';
  } else if (people.length <= 2) {
    peopleStr = people.map((p) => p.name).join(', ');
  } else {
    const remaining = people.length - 2;
    peopleStr = `${people[0].name}, ${people[1].name} +${remaining}`;
  }

  // Compute total from engine
  const result = computeSplit(split.config);
  let totalStr: string;
  if (result.ok) {
    const totalCents = result.results.reduce(
      (s, r) => s + r.roundedTotalCents,
      0
    );
    totalStr = `$${centsToDollars(totalCents as Cents)}`;
  } else {
    totalStr = '\u2014'; // em-dash for incomplete split
  }

  return (
    <button
      onClick={() => onLoad(split)}
      className="w-full glass-card rounded-xl flex items-center justify-between px-4 py-3 min-h-16
                 hover:bg-white/5 press-scale
                 transition text-left"
    >
      {/* Left side: date + people names */}
      <div className="flex flex-col min-w-0 flex-1 mr-3">
        <span className="text-sm text-gray-400">{dateStr}</span>
        <span className="text-base text-gray-100 font-medium truncate">
          {peopleStr}
        </span>
      </div>

      {/* Right side: total + delete button */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg text-white font-semibold tabular-nums">
          {totalStr}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(split);
          }}
          className="text-gray-500 hover:text-red-400 min-w-11 min-h-11
                     flex items-center justify-center"
          aria-label={`Delete split from ${dateStr}`}
        >
          &times;
        </button>
      </div>
    </button>
  );
}
