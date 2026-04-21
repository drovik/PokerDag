import { useTheme } from '../context/ThemeContext';

const THEMES = [
  { id: 'dark',  label: 'Dark',      icon: '🌙' },
  { id: 'light', label: 'Light',     icon: '☀️' },
  { id: 'vegas', label: 'Las Vegas', icon: '🎰' },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.label}
          className={[
            'w-8 h-8 rounded-lg text-base transition-all',
            theme === t.id
              ? 'bg-[var(--accent)] shadow-md scale-110'
              : 'hover:bg-[var(--bg-3)] opacity-60 hover:opacity-100',
          ].join(' ')}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
