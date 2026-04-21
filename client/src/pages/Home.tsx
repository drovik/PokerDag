import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function randomRoomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  const createRoom = () => {
    navigate(`/room/${randomRoomId()}`);
  };

  const joinRoom = () => {
    const code = joinCode.trim().toLowerCase();
    if (code) navigate(`/room/${code}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-8">
      <div className="mb-12 text-center">
        <div className="text-5xl mb-4">🃏</div>
        <h1 className="text-4xl font-bold logo-text mb-2 tracking-tight">PokerDag</h1>
        <p className="text-[var(--text-2)]">Planning poker for your team — no login required</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={createRoom}
          className="w-full py-4 btn-accent text-lg font-semibold rounded-2xl shadow-lg active:scale-95 transition-transform"
        >
          Create a new room
        </button>

        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-sm">or join existing</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            maxLength={12}
            className="flex-1 bg-[var(--bg-3)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-colors font-mono"
          />
          <button
            onClick={joinRoom}
            disabled={!joinCode.trim()}
            className="px-5 py-3 bg-[var(--bg-3)] hover:bg-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text)] font-semibold rounded-xl transition-colors"
          >
            Join
          </button>
        </div>
      </div>

      <p className="mt-16 text-xs text-[var(--text-muted)]">
        Rooms are temporary — data disappears when everyone leaves
      </p>
    </div>
  );
}
