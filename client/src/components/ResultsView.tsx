import type { Participant } from '../types';

type ResultsViewProps = {
  participants: Participant[];
  onNewRound: () => void;
};

function getMostCommonVotes(participants: Participant[]): Set<string> {
  const counts = new Map<string, number>();
  for (const p of participants) {
    if (p.vote !== null) {
      counts.set(p.vote, (counts.get(p.vote) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return new Set();
  const max = Math.max(...counts.values());
  return new Set([...counts.entries()].filter(([, c]) => c === max).map(([v]) => v));
}

function getAverage(participants: Participant[]): string | null {
  const nums = participants
    .map((p) => p.vote)
    .filter((v): v is string => v !== null && !isNaN(Number(v)))
    .map(Number);
  if (nums.length === 0) return null;
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
}

export function ResultsView({ participants, onNewRound }: ResultsViewProps) {
  const mostCommon = getMostCommonVotes(participants);
  const average = getAverage(participants);
  const votedParticipants = participants.filter((p) => p.vote !== null);
  const isConsensus =
    votedParticipants.length > 1 &&
    mostCommon.size === 1 &&
    mostCommon.size > 0 &&
    votedParticipants.every((p) => mostCommon.has(p.vote!));

  // Sort: voted first, then by name
  const sorted = [...participants].sort((a, b) => {
    if ((a.vote !== null) !== (b.vote !== null)) return a.vote !== null ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="mt-6">
      {isConsensus && (
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 bg-emerald-900/40 border border-emerald-700 text-emerald-400 font-semibold px-4 py-2 rounded-full text-sm">
            Consensus!
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-5 mb-8">
        {sorted.map((p) => {
          const isHighlighted = p.vote !== null && mostCommon.has(p.vote);
          return (
            <div key={p.id} className="flex flex-col items-center gap-2">
              <div
                className={[
                  'w-16 h-24 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors',
                  p.vote === null
                    ? 'bg-slate-800/50 border-slate-700 text-slate-600'
                    : isHighlighted
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-700 border-slate-500 text-slate-200',
                ].join(' ')}
              >
                {p.vote ?? '–'}
              </div>
              <span className="text-xs text-slate-400 text-center max-w-[72px] truncate">
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="text-center text-sm text-slate-500 mb-8 flex justify-center gap-6">
        {average && (
          <span>
            Average:{' '}
            <span className="text-slate-200 font-semibold">{average}</span>
          </span>
        )}
        {mostCommon.size > 0 && (
          <span>
            Most voted:{' '}
            <span className="text-slate-200 font-semibold">{[...mostCommon].join(', ')}</span>
          </span>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNewRound}
          className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors shadow-lg"
        >
          New Round
        </button>
      </div>
    </div>
  );
}
