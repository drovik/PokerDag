import { CARD_VALUES } from '../types';

type CardGridProps = {
  myVote: string | null;
  onVote: (value: string) => void;
  disabled?: boolean;
};

export function CardGrid({ myVote, onVote, disabled = false }: CardGridProps) {
  return (
    <div>
      <p className="text-center text-sm text-slate-500 mb-4">Pick your estimate</p>
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
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/25 scale-105'
                  : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-indigo-500 hover:scale-105',
                disabled
                  ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-slate-800 hover:border-slate-600'
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
