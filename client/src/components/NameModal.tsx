import { useState, useEffect } from 'react';

type NameModalProps = {
  initial?: string;
  onSubmit: (name: string) => void;
  onClose?: () => void;
};

export function NameModal({ initial = '', onSubmit, onClose }: NameModalProps) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-3)] border border-[var(--border)] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--text)] mb-1">
          {initial ? 'Change your name' : "What's your name?"}
        </h2>
        <p className="text-sm text-[var(--text-3)] mb-6">Visible to everyone in the room</p>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your name"
            maxLength={30}
            className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--border-focus)] transition-colors mb-4"
          />
          <div className="flex gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-[var(--bg-2)] hover:bg-[var(--border)] text-[var(--text-2)] font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 py-3 btn-accent disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl"
            >
              {initial ? 'Save' : 'Join room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
