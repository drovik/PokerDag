import { CARD_VALUES } from '../types';

type CardGridProps = {
  myVote: string | null;
  onVote: (value: string) => void;
  disabled?: boolean;
};

export function CardGrid({ myVote, onVote, disabled = false }: CardGridProps) {
  return (
    <div>
      <p className="text-center text-sm text-[var(--text-3)] mb-4">Pick your estimate</p>
      <div className="flex flex-wrap justify-center gap-3">
        {CARD_VALUES.map((value) => {
          const selected = myVote === value;
          return (
            <button
              key={value}
              onClick={() => !disabled && onVote(value)}
              disabled={disabled}
              className={[
                'w-16 h-24 rounded-xl border-2 text-xl font-bold',
                'flex items-center justify-center select-none',
                'transition-all duration-150',
                selected
                  ? 'btn-accent border-[var(--accent)] shadow-lg scale-105'
                  : 'bg-[var(--bg-3)] border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:scale-105',
                disabled
                  ? 'opacity-50 cursor-not-allowed hover:scale-100'
                  : 'cursor-pointer active:scale-95',
              ].join(' ')}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
