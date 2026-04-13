import { useState } from 'react';

type HeaderProps = {
  roomId: string;
  myName: string;
  onEditName: () => void;
};

export function Header({ roomId, myName, onEditName }: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-bold text-indigo-400 text-lg tracking-tight">PokerDag</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Room</span>
          <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-xs">
            {roomId}
          </span>
          <button
            onClick={copyLink}
            title="Copy room link"
            className="text-slate-400 hover:text-indigo-400 transition-colors text-sm px-2 py-0.5 rounded hover:bg-slate-800"
          >
            {copied ? '✓ Copied' : '🔗 Share'}
          </button>
        </div>
      </div>

      <button
        onClick={onEditName}
        title="Change your name"
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-800"
      >
        <span className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white uppercase">
          {myName[0]}
        </span>
        <span>{myName}</span>
        <span className="text-xs opacity-60">✏️</span>
      </button>
    </header>
  );
}
