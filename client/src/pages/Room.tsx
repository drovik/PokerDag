import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { Header } from '../components/Header';
import { NameModal } from '../components/NameModal';
import { CardGrid } from '../components/CardGrid';
import { PokerTable } from '../components/PokerTable';
import type { Participant } from '../types';

const CARD_ORDER = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

function RoomTitle({ title, onSave }: { title: string; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  useEffect(() => {
    if (!editing) setValue(title);
  }, [title, editing]);

  const save = () => {
    onSave(value.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
        maxLength={60}
        placeholder="e.g. Sprint 25.3"
        className="text-lg font-semibold bg-transparent border-b-2 border-[var(--border-focus)] text-[var(--text)] focus:outline-none pb-0.5 w-64"
      />
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-2 group">
      <span className={title ? 'text-lg font-semibold text-[var(--text)]' : 'text-sm text-[var(--text-muted)] italic'}>
        {title || '+ Add title'}
      </span>
      <span className="text-[var(--text-muted)] group-hover:text-[var(--text-3)] text-xs transition-colors">✏️</span>
    </button>
  );
}

function getOutliers(participants: Participant[]): { low: Set<string>; high: Set<string> } {
  const numeric = participants.filter((p) => p.vote !== null && !isNaN(Number(p.vote)));
  const empty = { low: new Set<string>(), high: new Set<string>() };
  if (numeric.length < 2) return empty;
  const vals = numeric.map((p) => Number(p.vote));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) return empty;
  return {
    low: new Set(numeric.filter((p) => Number(p.vote) === min).map((p) => p.id)),
    high: new Set(numeric.filter((p) => Number(p.vote) === max).map((p) => p.id)),
  };
}

function ResultsStats({ participants }: { participants: Participant[] }) {
  const voteCounts = new Map<string, number>();
  for (const p of participants) {
    if (p.vote !== null) voteCounts.set(p.vote, (voteCounts.get(p.vote) ?? 0) + 1);
  }
  if (voteCounts.size === 0) return null;

  const sorted = [...voteCounts.entries()].sort(
    (a, b) => CARD_ORDER.indexOf(a[0]) - CARD_ORDER.indexOf(b[0]),
  );
  const maxCount = Math.max(...voteCounts.values());
  const mostCommon = sorted.filter(([, c]) => c === maxCount).map(([v]) => v);
  const voted = participants.filter((p) => p.vote !== null);
  const isConsensus =
    voted.length > 1 && mostCommon.length === 1 && voted.every((p) => p.vote === mostCommon[0]);

  const nums = voted
    .map((p) => p.vote)
    .filter((v): v is string => !isNaN(Number(v)))
    .map(Number);
  const min = nums.length > 0 ? Math.min(...nums) : null;
  const max = nums.length > 0 ? Math.max(...nums) : null;
  const spread = min !== null && max !== null ? max - min : null;
  const highSpread = spread !== null && spread >= 5;

  const voterNames = (value: string) =>
    participants.filter((p) => p.vote === value).map((p) => p.name);

  return (
    <div className="mt-4 bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl p-4 space-y-4">
      {isConsensus ? (
        <div className="text-center text-emerald-400 font-semibold text-sm">Consensus! 🎉</div>
      ) : highSpread ? (
        <div className="text-center text-amber-400 text-sm font-medium">
          High spread ({spread}) — worth a discussion
        </div>
      ) : null}

      <div className="space-y-2">
        {sorted.map(([value, count]) => {
          const pct = Math.round((count / voted.length) * 100);
          const isTop = mostCommon.includes(value);
          const names = voterNames(value);
          return (
            <div key={value} className="flex items-center gap-3 text-sm">
              <span className={['w-8 text-center font-bold shrink-0', isTop ? 'text-[var(--accent)]' : 'text-[var(--text-3)]'].join(' ')}>
                {value}
              </span>
              <div className="flex-1 bg-[var(--bg-3)] rounded-full h-5 overflow-hidden">
                <div
                  className={['h-full rounded-full transition-all duration-500', isTop ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'].join(' ')}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[var(--text-3)] shrink-0 w-5 text-right">{count}</span>
              <span className="text-[var(--text-3)] text-xs shrink-0 hidden sm:block">{names.join(', ')}</span>
            </div>
          );
        })}
      </div>

      {nums.length > 1 && (
        <div className="flex justify-center gap-6 text-xs text-[var(--text-3)] pt-1 border-t border-[var(--border)]">
          <span>Min <span className="text-[var(--text)] font-medium">{min}</span></span>
          <span>Max <span className="text-[var(--text)] font-medium">{max}</span></span>
          <span>
            Spread{' '}
            <span className={highSpread ? 'text-amber-400 font-medium' : 'text-[var(--text)] font-medium'}>
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
      <div className="min-h-screen bg-[var(--bg)]">
        <NameModal onSubmit={handleNameSubmit} />
      </div>
    );
  }

  const { participants, revealed, title, loading } = room;
  const myParticipant = participants.find((p) => p.id === room.myId);
  const myVote = myParticipant?.vote ?? null;
  const outliers = revealed ? getOutliers(participants) : { low: new Set<string>(), high: new Set<string>() };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <Header roomId={roomId} myName={name} onEditName={() => setShowNameEdit(true)} />

      {showNameEdit && (
        <NameModal initial={name} onSubmit={handleNameSubmit} onClose={() => setShowNameEdit(false)} />
      )}

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[var(--text-3)] animate-pulse">
            Connecting…
          </div>
        ) : (
          <>
            <div className="mb-4">
              <RoomTitle title={title} onSave={room.setTitle} />
            </div>

            <PokerTable
              participants={participants}
              myId={room.myId}
              revealed={revealed}
              outliers={outliers}
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
