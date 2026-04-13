import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { Header } from '../components/Header';
import { NameModal } from '../components/NameModal';
import { CardGrid } from '../components/CardGrid';
import { PokerTable } from '../components/PokerTable';
import type { Participant } from '../types';

function ResultsStats({ participants }: { participants: Participant[] }) {
  const voteCounts = new Map<string, number>();
  for (const p of participants) {
    if (p.vote !== null) voteCounts.set(p.vote, (voteCounts.get(p.vote) ?? 0) + 1);
  }
  if (voteCounts.size === 0) return null;

  const maxCount = Math.max(...voteCounts.values());
  const mostCommon = [...voteCounts.entries()]
    .filter(([, c]) => c === maxCount)
    .map(([v]) => v);

  const voted = participants.filter((p) => p.vote !== null);
  const isConsensus =
    voted.length > 1 && mostCommon.length === 1 && voted.every((p) => p.vote === mostCommon[0]);

  return (
    <div className="mt-3 text-center text-sm text-slate-500 flex justify-center gap-5 flex-wrap">
      {isConsensus && (
        <span className="text-emerald-400 font-semibold">Consensus!</span>
      )}
      <span>
        Most voted: <span className="text-slate-300 font-medium">{mostCommon.join(', ')}</span>
      </span>
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
