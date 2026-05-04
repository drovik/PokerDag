import { useState } from 'react';
import type { AzureConfig, AzureWorkItem } from '../hooks/useAzureDevOps';

type ADO = {
  config: AzureConfig | null;
  items: AzureWorkItem[];
  loading: boolean;
  error: string | null;
  activeItem: AzureWorkItem | null;
  votedIds: Set<number>;
  configured: boolean;
  configure: (cfg: AzureConfig) => Promise<AzureConfig>;
  clearConfig: () => void;
  fetchItems: (cfg?: AzureConfig) => Promise<void>;
  selectItem: (item: AzureWorkItem) => void;
};

type Props = {
  ado: ADO;
  revealed: boolean;
  consensusValue: string | null;
  onSelectItem: (item: AzureWorkItem) => void;
  onSaveEstimate: (item: AzureWorkItem, points: string) => Promise<void>;
};

const TYPE_ICONS: Record<string, string> = {
  'User Story': '📖',
  'Product Backlog Item': '📋',
  Bug: '🐛',
  Task: '✅',
  Feature: '⭐',
  Epic: '🚀',
};

function typeIcon(type: string) {
  return TYPE_ICONS[type] ?? '🔹';
}

export function AzureDevOpsPanel({
  ado,
  revealed,
  consensusValue,
  onSelectItem,
  onSaveEstimate,
}: Props) {
  const [form, setForm] = useState<AzureConfig>({
    pat: '',
    org: '',
    project: '',
    iterationPath: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pat.trim() || !form.org.trim() || !form.project.trim()) return;
    const cfg = await ado.configure(form);
    await ado.fetchItems(cfg);
  };

  const handleSaveEstimate = async () => {
    if (!ado.activeItem || !consensusValue) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await onSaveEstimate(ado.activeItem, consensusValue);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!ado.configured) {
    return (
      <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base">🔗</span>
          <h3 className="font-semibold text-sm text-[var(--text)]">Connect Azure DevOps</h3>
        </div>

        <form onSubmit={handleConnect} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Personal Access Token
              </label>
              <input
                type="password"
                value={form.pat}
                onChange={(e) => setForm((f) => ({ ...f, pat: e.target.value }))}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Needs <em>Work Items (Read &amp; Write)</em> scope
              </p>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Organization</label>
              <input
                type="text"
                value={form.org}
                onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
                placeholder="my-org"
                required
                className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)]"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Project</label>
              <input
                type="text"
                value={form.project}
                onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
                placeholder="MyProject"
                required
                className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)]"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Iteration Path{' '}
                <span className="text-[var(--text-muted)] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.iterationPath}
                onChange={(e) => setForm((f) => ({ ...f, iterationPath: e.target.value }))}
                placeholder="MyProject\\Sprint 25.3"
                className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Leave blank to load all active items
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={ado.loading || !form.pat || !form.org || !form.project}
            className="w-full btn-accent py-2 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ado.loading ? 'Connecting…' : 'Connect & load items'}
          </button>

          {ado.error && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2 break-all">
              {ado.error}
            </p>
          )}
        </form>
      </div>
    );
  }

  const canSaveEstimate =
    revealed &&
    ado.activeItem !== null &&
    consensusValue !== null &&
    isFinite(Number(consensusValue));

  return (
    <div className="bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">🔗</span>
          <span className="font-semibold text-sm text-[var(--text)] truncate">
            {ado.config?.org} / {ado.config?.project}
          </span>
          {ado.config?.iterationPath && (
            <span className="text-xs text-[var(--text-muted)] truncate hidden sm:block">
              · {ado.config.iterationPath}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => ado.fetchItems()}
            disabled={ado.loading}
            title="Refresh"
            className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-focus)] disabled:opacity-40 transition-all"
          >
            {ado.loading ? '…' : '↻'}
          </button>
          <button
            onClick={ado.clearConfig}
            title="Disconnect"
            className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/40 transition-all"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Active item + save estimate row */}
      {ado.activeItem && (
        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[var(--accent)] font-medium">Voting on</p>
            <p className="text-sm text-[var(--text)] truncate">
              #{ado.activeItem.id} {ado.activeItem.title}
            </p>
          </div>
          {canSaveEstimate && (
            <div className="shrink-0 flex items-center gap-2">
              {saveSuccess ? (
                <span className="text-xs text-emerald-400 font-medium">Saved ✓</span>
              ) : (
                <button
                  onClick={handleSaveEstimate}
                  disabled={saving}
                  className="text-xs btn-accent px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap disabled:opacity-50"
                >
                  {saving ? 'Saving…' : `Save ${consensusValue} pts`}
                </button>
              )}
              {saveError && (
                <span className="text-xs text-red-400 max-w-[120px] truncate" title={saveError}>
                  {saveError}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {ado.error && (
        <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2 break-all">
          {ado.error}
        </p>
      )}

      {/* Work item list */}
      {ado.loading && items_placeholder()}
      {!ado.loading && ado.items.length === 0 && !ado.error && (
        <p className="text-xs text-[var(--text-muted)] text-center py-4">
          No active work items found
        </p>
      )}

      {!ado.loading && ado.items.length > 0 && (
        <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1 -mr-1">
          {ado.items.map((item) => {
            const isActive = item.id === ado.activeItem?.id;
            const isVoted = ado.votedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={[
                  'flex items-start gap-2 px-2 py-1.5 rounded-xl group transition-colors',
                  isActive
                    ? 'bg-[var(--accent)]/15'
                    : 'hover:bg-[var(--bg-3)]',
                ].join(' ')}
              >
                <span className="text-sm shrink-0 mt-0.5" title={item.type}>
                  {typeIcon(item.type)}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs font-mono text-[var(--text-muted)] shrink-0">
                      #{item.id}
                    </span>
                    <span
                      className={[
                        'text-sm truncate',
                        isActive ? 'text-[var(--text)] font-medium' : 'text-[var(--text)]',
                      ].join(' ')}
                    >
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-muted)]">{item.state}</span>
                    {item.storyPoints !== null && (
                      <span className="text-xs text-[var(--text-3)] bg-[var(--bg-3)] px-1.5 py-0 rounded">
                        {item.storyPoints} pts
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {isVoted ? (
                    <span className="text-xs text-emerald-400 font-medium">✓</span>
                  ) : isActive ? (
                    <span className="text-xs text-[var(--accent)] font-medium">voting</span>
                  ) : (
                    <button
                      onClick={() => onSelectItem(item)}
                      className="text-xs btn-accent px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity whitespace-nowrap"
                    >
                      Vote
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)] text-right">
        {ado.items.length} item{ado.items.length !== 1 ? 's' : ''} ·{' '}
        {ado.votedIds.size} done
      </p>
    </div>
  );
}

function items_placeholder() {
  return (
    <div className="space-y-1.5 py-1">
      {[80, 60, 72, 55].map((w, i) => (
        <div key={i} className="flex gap-2 px-2 py-1.5 animate-pulse">
          <div className="w-4 h-4 rounded bg-[var(--bg-3)] shrink-0 mt-0.5" />
          <div className={`h-4 rounded bg-[var(--bg-3)]`} style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}
