import { useEffect, useState } from 'react';
import type { Participant } from '../types';

type OutlierType = 'low' | 'high' | null;

type PokerTableProps = {
  participants: Participant[];
  myId: string;
  revealed: boolean;
  outliers: { low: Set<string>; high: Set<string> };
  onReveal: () => void;
  onNewRound: () => void;
};

const COUNTDOWN_SECS = 5;

function seatPosition(index: number, total: number) {
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
  return {
    left: `${50 + 44 * Math.cos(angle)}%`,
    top: `${50 + 44 * Math.sin(angle)}%`,
  };
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

function Seat({
  participant,
  isMe,
  revealed,
  outlierType,
}: {
  participant: Participant;
  isMe: boolean;
  revealed: boolean;
  outlierType: OutlierType;
}) {
  const hasVoted = participant.vote !== null;
  const showValue = revealed || isMe;

  let cardClass =
    'w-10 h-14 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-md select-none';
  let cardContent: string;

  if (!hasVoted) {
    cardClass += ' bg-[var(--bg-3)] border-[var(--border)] text-[var(--text-muted)]';
    cardContent = '–';
  } else if (showValue) {
    if (outlierType === 'low') {
      cardClass += ' bg-white border-amber-400 text-slate-900 shadow-lg shadow-amber-500/20';
    } else if (outlierType === 'high') {
      cardClass += ' bg-white border-rose-400 text-slate-900 shadow-lg shadow-rose-500/20';
    } else {
      cardClass += ' bg-white border-slate-300 text-slate-900 shadow-lg';
    }
    cardContent = participant.vote!;
  } else {
    cardClass += ' card-back border-[var(--accent)]';
    cardContent = '';
  }

  return (
    <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
      <div className={cardClass}>
        {cardContent}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <div
          className={[
            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold uppercase',
            isMe
              ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/60'
              : 'bg-[var(--bg-3)] text-[var(--text-2)]',
          ].join(' ')}
        >
          {participant.name[0]}
        </div>
        <span className="text-[11px] text-[var(--text-3)] whitespace-nowrap max-w-[72px] truncate">
          {participant.name}
        </span>
        {outlierType && (
          <span
            className={[
              'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide',
              outlierType === 'low'
                ? 'bg-amber-900/70 text-amber-400'
                : 'bg-rose-900/70 text-rose-400',
            ].join(' ')}
          >
            {outlierType === 'low' ? '▼ Low' : '▲ High'}
          </span>
        )}
      </div>
    </div>
  );
}

export function PokerTable({
  participants,
  myId,
  revealed,
  outliers,
  onReveal,
  onNewRound,
}: PokerTableProps) {
  const votedCount = participants.filter((p) => p.vote !== null).length;
  const total = participants.length;
  const allVoted = total > 0 && votedCount === total;
  const average = revealed ? getAverage(participants) : null;

  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!allVoted || revealed) {
      setCountdown(null);
      return;
    }
    setCountdown(COUNTDOWN_SECS);
    const tick = setInterval(() => {
      setCountdown((n) => (n !== null && n > 1 ? n - 1 : null));
    }, 1000);
    const revealTimer = setTimeout(onReveal, COUNTDOWN_SECS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(revealTimer);
    };
  }, [allVoted, revealed, onReveal]);

  return (
    <div className="relative w-full" style={{ aspectRatio: '2.2 / 1' }}>
      {/* ── Felt surface ── */}
      <div className="absolute inset-[6%] rounded-[50%] shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-visible">
        <div
          className="absolute inset-0 rounded-[50%]"
          style={{ background: 'var(--felt-bg)' }}
        />
        <div
          className="absolute rounded-[50%] pointer-events-none"
          style={{
            inset: '-10px',
            border: '10px solid transparent',
            borderColor: 'var(--rail-border)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4)',
            background: 'var(--rail-bg) border-box',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
          }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          {revealed ? (
            <>
              {average && (
                <div className="text-center leading-tight">
                  <div
                    className="text-[10px] uppercase tracking-widest mb-0.5"
                    style={{ color: 'var(--felt-text)' }}
                  >
                    Average
                  </div>
                  <div className="text-4xl font-bold text-white drop-shadow">{average}</div>
                </div>
              )}
              <button
                onClick={onNewRound}
                className="mt-1 px-5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
              >
                New Round
              </button>
            </>
          ) : countdown !== null ? (
            <>
              <div
                className="text-[10px] uppercase tracking-widest"
                style={{ color: 'var(--felt-text)' }}
              >
                All voted!
              </div>
              <div
                key={countdown}
                className="text-6xl font-bold text-white drop-shadow-lg countdown-pop"
              >
                {countdown}
              </div>
              <button
                onClick={onReveal}
                className="text-[10px] text-white/50 hover:text-white/90 underline transition-colors"
              >
                reveal now
              </button>
            </>
          ) : (
            <>
              {total > 0 && (
                <div
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: 'var(--felt-text)' }}
                >
                  {votedCount} / {total} voted
                </div>
              )}
              <button
                onClick={onReveal}
                disabled={votedCount === 0}
                className="px-6 py-2 bg-[var(--accent)] hover:bg-[var(--accent-h)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
              >
                Reveal
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Seated participants ── */}
      {participants.map((p, i) => {
        const outlierType: OutlierType = revealed
          ? outliers.low.has(p.id)
            ? 'low'
            : outliers.high.has(p.id)
              ? 'high'
              : null
          : null;
        return (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={seatPosition(i, participants.length)}
          >
            <Seat participant={p} isMe={p.id === myId} revealed={revealed} outlierType={outlierType} />
          </div>
        );
      })}

      {total === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm" style={{ color: 'var(--felt-text)' }}>Waiting for players…</span>
        </div>
      )}
    </div>
  );
}
