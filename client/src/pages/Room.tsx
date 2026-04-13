import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { Header } from '../components/Header';
import { NameModal } from '../components/NameModal';
import { CardGrid } from '../components/CardGrid';
import { PokerTable } from '../components/PokerTable';
import type { Participant } from '../types';

const CARD_ORDER = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

function ResultsStats({ participants }: { participants: Participant[] }) {
  const voteCounts = new Map<string, number>();
  for (const p of participants) {
    if (p.vote !== null) voteCounts.set(p.vote, (voteCounts.get(p.vote) ?? 0) + 1);
  }
  if (voteCounts.size === 0) return null;

  // Sort by Fibonacci order
  const sorted = [...voteCounts.entries()].sort(
    (a, b) => CARD_ORDER.indexOf(a[0]) - CARD_ORDER.indexOf(b[0]),
  );

  const maxCount = Math.max(...voteCounts.values());
  const mostCommon = sorted.filter(([, c]) => c === maxCount).map(([v]) => v);
  const voted = participants.filter((p) => p.vote !== null);
  const isConsensus =
    voted.length > 1 &&
    mostCommon.length === 1 &&
    voted.every((p) => p.vote === mostCommon[0]);

  // Numeric stats
  const nums = voted
    .map((p) => p.vote)
    .filter((v): v is string => !isNaN(Number(v)))
    .map(Number);
  const min = nums.length > 0 ? Math.min(...nums) : null;
  const max = nums.length > 0 ? Math.max(...nums) : null;
  const spread = min !== null && max !== null ? max - min : null;
  const highSpread = spread !== null && spread >= 5;

  // Names per vote value
  const voterNames = (value: string) =>
    participants.filter((p) => p.vote === value).map((p) => p.name);

  return (
    <div className="mt-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-4">
      {/* Consensus / spread alert */}
      {isConsensus ? (
        <div className="text-center text-emerald-400 font-semibold text-sm">
          Consensus!
        </div>
      ) : highSpread ? (
        <div className="text-center text-amber-400 text-sm font-medium">
          High spread ({spread}) — worth a discussion
        </div>
      ) : null}

      {/* Vote distribution */}
      <div className="space-y-2">
        {sorted.map(([value, count]) => {
          const pct = Math.round((count / voted.length) * 100);
          const isTop = mostCommon.includes(value);
          const names = voterNames(value);
          return (
            <div key={value} className="flex items-center gap-3 text-sm">
              {/* Card label */}
              <span
                className={[
                  'w-8 text-center font-bold shrink-0',
                  isTop ? 'text-indigo-300' : 'text-slate-400',
                ].join(' ')}
              >
                {value}
              </span>
              {/* Bar */}
              <div className="flex-1 bg-slate-700/40 rounded-full h-5 overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-500',
                    isTop ? 'bg-indigo-600' : 'bg-slate-600',
                  ].join(' ')}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {/* Count + names */}
              <span className="text-slate-500 shrink-0 w-5 text-right">{count}</span>
              <span className="text-slate-500 text-xs shrink-0 hidden sm:block">
                {names.join(', ')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Numeric summary */}
      {nums.length > 1 && (
        <div className="flex justify-center gap-6 text-xs text-slate-500 pt-1 border-t border-slate-700/40">
          <span>Min <span className="text-slate-300 font-medium">{min}</span></span>
          <span>Max <span className="text-slate-300 font-medium">{max}</span></span>
          <span>
            Spread{' '}
            <span className={highSpread ? 'text-amber-400 font-medium' : 'text-slate-300 font-medium'}>
              {spread}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const room = useRoom(roomId ?? '');

  const [name, setName] = useState(() => localStorage.getItem('pokerdag-name') ?? '');
  const [showNameEdit, setShowNameEdit] = useState(false);

  useEffect(() => {
    if (!room.loading && !room.joined && name) {
      room.join(name);
    }
  }, [room.loading, room.joined, name, room.join]);

  const handleNameSubmit = useCallback(
    (newName: string) => {
      localStorage.setItem('pokerdag-name', newName);
      setName(newName);
      if (room.joined) room.changeName(newName);
      setShowNameEdit(false);
    },
    [room.joined, room.changeName],
  );

  if (!roomId) {
    navigate('/');
    return null;
  }

  if (!name) {
    return (
      <div className="min-h-screen bg-slate-950">
        <NameModal onSubmit={handleNameSubmit} />
      </div>
    );
  }

  const { participants, revealed, loading } = room;
  const myParticipant = participants.find((p) => p.id === room.myId);
  const myVote = myParticipant?.vote ?? null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header roomId={roomId} myName={name} onEditName={() => setShowNameEdit(true)} />

      {showNameEdit && (
        <NameModal
          initial={name}
          onSubmit={handleNameSubmit}
          onClose={() => setShowNameEdit(false)}
        />
      )}

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500 animate-pulse">
            Connecting…
          </div>
        ) : (
          <>
            <PokerTable
              participants={participants}
              myId={room.myId}
              revealed={revealed}
              onReveal={room.reveal}
              onNewRound={room.newRound}
            />

            {revealed && <ResultsStats participants={participants} />}

            {!revealed && (
              <div className="mt-6">
                <CardGrid myVote={myVote} onVote={room.vote} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
