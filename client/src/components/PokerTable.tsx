import type { Participant } from '../types';

type PokerTableProps = {
  participants: Participant[];
  myId: string;
  revealed: boolean;
  onReveal: () => void;
  onNewRound: () => void;
};

function seatPosition(index: number, total: number) {
  // Distribute seats evenly around an ellipse, starting from top-center
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

const CARD_BACK: React.CSSProperties = {
  backgroundColor: '#312e81',
  backgroundImage: [
    'repeating-linear-gradient(135deg, rgba(129,140,248,0.18) 0px, rgba(129,140,248,0.18) 2px, transparent 2px, transparent 10px)',
    'repeating-linear-gradient(45deg,  rgba(129,140,248,0.18) 0px, rgba(129,140,248,0.18) 2px, transparent 2px, transparent 10px)',
  ].join(', '),
};

function Seat({
  participant,
  isMe,
  revealed,
}: {
  participant: Participant;
  isMe: boolean;
  revealed: boolean;
}) {
  const hasVoted = participant.vote !== null;
  // My own vote is always visible to me; others' only after reveal
  const showValue = revealed || isMe;

  let cardClass =
    'w-10 h-14 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-md select-none';
  let cardStyle: React.CSSProperties = {};
  let cardContent: string;

  if (!hasVoted) {
    cardClass += ' bg-slate-800/50 border-slate-600/40 text-slate-600';
    cardContent = '–';
  } else if (showValue) {
    cardClass += ' bg-white border-slate-300 text-slate-900 shadow-lg';
    cardContent = participant.vote!;
  } else {
    // Card back — voted but not yet revealed
    cardClass += ' border-indigo-500/60';
    cardStyle = CARD_BACK;
    cardContent = '';
  }

  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-none select-none">
      <div className={cardClass} style={cardStyle}>
        {cardContent}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <div
          className={[
            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold uppercase',
            isMe
              ? 'bg-indigo-500 text-white ring-2 ring-indigo-300/60'
              : 'bg-slate-600 text-slate-200',
          ].join(' ')}
        >
          {participant.name[0]}
        </div>
        <span className="text-[11px] text-slate-400 whitespace-nowrap max-w-[72px] truncate">
          {participant.name}
        </span>
      </div>
    </div>
  );
}

export function PokerTable({
  participants,
  myId,
  revealed,
  onReveal,
  onNewRound,
}: PokerTableProps) {
  const votedCount = participants.filter((p) => p.vote !== null).length;
  const total = participants.length;
  const canReveal = votedCount > 0;
  const average = revealed ? getAverage(participants) : null;

  return (
    <div className="relative w-full" style={{ aspectRatio: '2.2 / 1' }}>
      {/* ── Felt surface ── */}
      <div className="absolute inset-[6%] rounded-[50%] shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-visible">
        {/* Green felt */}
        <div
          className="absolute inset-0 rounded-[50%]"
          style={{
            background:
              'radial-gradient(ellipse at 40% 35%, #166534, #14532d 55%, #0f3d21)',
          }}
        />
        {/* Wooden rail */}
        <div
          className="absolute rounded-[50%] pointer-events-none"
          style={{
            inset: '-10px',
            border: '10px solid transparent',
            borderColor: '#78350f',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4)',
            background:
              'radial-gradient(ellipse at 30% 20%, #92400e, #78350f 50%, #451a03) border-box',
            WebkitMask:
              'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
          }}
        />

        {/* ── Centre content ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {revealed ? (
            <>
              {average && (
                <div className="text-center leading-tight">
                  <div className="text-[10px] uppercase tracking-widest text-green-400/60 mb-0.5">
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
          ) : (
            <>
              {total > 0 && (
                <div className="text-[11px] uppercase tracking-widest text-green-400/50">
                  {votedCount} / {total} voted
                </div>
              )}
              <button
                onClick={onReveal}
                disabled={!canReveal}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700/60 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-lg"
              >
                Reveal
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Seated participants ── */}
      {participants.map((p, i) => (
        <div
          key={p.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={seatPosition(i, participants.length)}
        >
          <Seat participant={p} isMe={p.id === myId} revealed={revealed} />
        </div>
      ))}

      {/* Empty table hint */}
      {total === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-green-700/60 text-sm">Waiting for players…</span>
        </div>
      )}
    </div>
  );
}
