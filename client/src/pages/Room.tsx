import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { Header } from '../components/Header';
import { NameModal } from '../components/NameModal';
import { CardGrid } from '../components/CardGrid';
import { ParticipantList } from '../components/ParticipantList';
import { ResultsView } from '../components/ResultsView';

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const room = useRoom(roomId ?? '');

  const [name, setName] = useState(() => localStorage.getItem('pokerdag-name') ?? '');
  const [showNameEdit, setShowNameEdit] = useState(false);

  // Auto-join once Firestore is ready and we have a name
  useEffect(() => {
    if (!room.loading && !room.joined && name) {
      room.join(name);
    }
  }, [room.loading, room.joined, name, room.join]);

  const handleNameSubmit = useCallback(
    (newName: string) => {
      localStorage.setItem('pokerdag-name', newName);
      setName(newName);
      if (room.joined) {
        room.changeName(newName);
      }
      setShowNameEdit(false);
    },
    [room.joined, room.changeName],
  );

  if (!roomId) {
    navigate('/');
    return null;
  }

  // Show name entry before anything else if no name stored
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
  const votedCount = participants.filter((p) => p.vote !== null).length;
  const canReveal = votedCount > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header roomId={roomId} myName={name} onEditName={() => setShowNameEdit(true)} />

      {showNameEdit && (
        <NameModal initial={name} onSubmit={handleNameSubmit} onClose={() => setShowNameEdit(false)} />
      )}

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500 animate-pulse">
            Connecting…
          </div>
        ) : (
          <>
            {/* Participant list — always visible */}
            <div className="mb-8">
              <ParticipantList participants={participants} myId={room.myId} />
            </div>

            {revealed ? (
              /* ── Results ── */
              <ResultsView participants={participants} onNewRound={room.newRound} />
            ) : (
              /* ── Voting phase ── */
              <div>
                <CardGrid myVote={myVote} onVote={room.vote} />

                <div className="mt-10 flex flex-col items-center gap-3">
                  <button
                    onClick={room.reveal}
                    disabled={!canReveal}
                    className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/10"
                  >
                    Reveal Votes
                  </button>
                  {!canReveal && (
                    <p className="text-xs text-slate-600">Waiting for at least one vote…</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
