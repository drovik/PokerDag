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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      <div className="mb-12 text-center">
        <div className="text-5xl mb-4">🃏</div>
        <h1 className="text-4xl font-bold text-indigo-400 mb-2 tracking-tight">PokerDag</h1>
        <p className="text-slate-400">Planning poker for your team — no login required</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={createRoom}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-semibold rounded-2xl transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform"
        >
          Create a new room
        </button>

        <div className="flex items-center gap-3 text-slate-600">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-sm">or join existing</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            maxLength={12}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
          <button
            onClick={joinRoom}
            disabled={!joinCode.trim()}
            className="px-5 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Join
          </button>
        </div>
      </div>

      <p className="mt-16 text-xs text-slate-700">
        Rooms are temporary — data disappears when everyone leaves
      </p>
    </div>
  );
}
