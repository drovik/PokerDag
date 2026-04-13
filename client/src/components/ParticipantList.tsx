import type { Participant } from '../types';

type ParticipantListProps = {
  participants: Participant[];
  myId: string;
};

export function ParticipantList({ participants, myId }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center text-slate-600 text-sm py-4">
        Waiting for participants...
      </div>
    );
  }

  const votedCount = participants.filter((p) => p.vote !== null).length;

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 font-medium">
        Participants — {votedCount}/{participants.length} voted
      </p>
      <div className="flex flex-wrap gap-2">
        {participants.map((p) => {
          const isMe = p.id === myId;
          const hasVoted = p.vote !== null;
          return (
            <div
              key={p.id}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
                isMe
                  ? 'bg-indigo-900/30 border-indigo-700 text-slate-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300',
              ].join(' ')}
            >
              <span
                className={[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold uppercase',
                  isMe ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-200',
                ].join(' ')}
              >
                {p.name[0]}
              </span>
              <span>{p.name}{isMe && <span className="text-slate-500 ml-1 text-xs">(you)</span>}</span>
              <span
                className={[
                  'ml-1 text-xs font-semibold',
                  hasVoted ? 'text-emerald-400' : 'text-slate-600',
                ].join(' ')}
              >
                {hasVoted ? '✓' : '···'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
