import { useState } from 'react';
import { ThemeSelector } from './ThemeSelector';

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
    <header className="bg-[var(--bg-2)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="logo-text font-bold text-lg tracking-tight">PokerDag</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-3)]">Room</span>
          <span className="font-mono text-[var(--text-2)] bg-[var(--bg-3)] px-2 py-0.5 rounded text-xs">
            {roomId}
          </span>
          <button
            onClick={copyLink}
            title="Copy room link"
            className="text-[var(--text-3)] hover:text-[var(--accent)] transition-colors text-sm px-2 py-0.5 rounded hover:bg-[var(--bg-3)]"
          >
            {copied ? '✓ Copied' : '🔗 Share'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeSelector />
        <button
          onClick={onEditName}
          title="Change your name"
          className="flex items-center gap-1.5 text-sm text-[var(--text-3)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-3)]"
        >
          <span className="w-6 h-6 rounded-full bg-[var(--avatar-bg)] flex items-center justify-center text-xs font-bold text-white uppercase">
            {myName[0]}
          </span>
          <span>{myName}</span>
          <span className="text-xs opacity-60">✏️</span>
        </button>
      </div>
    </header>
  );
}
