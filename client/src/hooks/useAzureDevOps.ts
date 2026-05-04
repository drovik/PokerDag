import { useState, useCallback } from 'react';

export type AzureWorkItem = {
  id: number;
  title: string;
  state: string;
  type: string;
  storyPoints: number | null;
};

export type AzureConfig = {
  pat: string;
  org: string;
  project: string;
  iterationPath: string;
};

const SESSION_KEY = 'pokerdag-ado-config';

function loadConfig(): AzureConfig | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AzureConfig) : null;
  } catch {
    return null;
  }
}

export function useAzureDevOps() {
  const [config, setConfig] = useState<AzureConfig | null>(() => loadConfig());
  const [items, setItems] = useState<AzureWorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());

  const configure = useCallback(async (cfg: AzureConfig) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cfg));
    setConfig(cfg);
    setItems([]);
    setError(null);
    setActiveItemId(null);
    return cfg;
  }, []);

  const clearConfig = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setConfig(null);
    setItems([]);
    setError(null);
    setActiveItemId(null);
    setVotedIds(new Set());
  }, []);

  const fetchItems = useCallback(
    async (cfg?: AzureConfig) => {
      const c = cfg ?? config;
      if (!c) return;
      setLoading(true);
      setError(null);
      try {
        const authHeader = `Basic ${btoa(':' + c.pat)}`;
        const orgEnc = encodeURIComponent(c.org);
        const projEnc = encodeURIComponent(c.project);

        const iterFilter = c.iterationPath.trim()
          ? `AND [System.IterationPath] = '${c.iterationPath.replace(/'/g, "''")}'`
          : '';
        const query =
          `SELECT [System.Id] FROM WorkItems ` +
          `WHERE [System.TeamProject] = '${c.project.replace(/'/g, "''")}' ` +
          iterFilter +
          ` AND [System.State] NOT IN ('Closed', 'Done', 'Removed') ` +
          `ORDER BY [System.Id] ASC`;

        const wiqlRes = await fetch(
          `https://dev.azure.com/${orgEnc}/${projEnc}/_apis/wit/wiql?api-version=7.0`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
          },
        );

        if (!wiqlRes.ok) {
          const text = await wiqlRes.text();
          throw new Error(`ADO ${wiqlRes.status}: ${text.slice(0, 300)}`);
        }

        const wiqlData = (await wiqlRes.json()) as { workItems: { id: number }[] };
        const ids = wiqlData.workItems.map((wi) => wi.id).slice(0, 200);

        if (ids.length === 0) {
          setItems([]);
          return;
        }

        const fields = [
          'System.Id',
          'System.Title',
          'System.State',
          'System.WorkItemType',
          'Microsoft.VSTS.Scheduling.StoryPoints',
        ].join(',');

        const detailsRes = await fetch(
          `https://dev.azure.com/${orgEnc}/_apis/wit/workitems?ids=${ids.join(',')}&fields=${fields}&api-version=7.0`,
          { headers: { Authorization: authHeader } },
        );

        if (!detailsRes.ok) {
          throw new Error(`ADO details ${detailsRes.status}`);
        }

        const detailsData = (await detailsRes.json()) as {
          value: {
            id: number;
            fields: Record<string, string | number | null>;
          }[];
        };

        setItems(
          detailsData.value.map((wi) => ({
            id: wi.id,
            title: wi.fields['System.Title'] as string,
            state: wi.fields['System.State'] as string,
            type: wi.fields['System.WorkItemType'] as string,
            storyPoints: wi.fields['Microsoft.VSTS.Scheduling.StoryPoints'] as number | null,
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [config],
  );

  const selectItem = useCallback((item: AzureWorkItem) => {
    setActiveItemId((prev) => {
      if (prev !== null && prev !== item.id) {
        setVotedIds((ids) => new Set([...ids, prev]));
      }
      return item.id;
    });
  }, []);

  const markVoted = useCallback((id: number) => {
    setVotedIds((prev) => new Set([...prev, id]));
    setActiveItemId(null);
  }, []);

  const activeItem = items.find((i) => i.id === activeItemId) ?? null;

  return {
    config,
    items,
    loading,
    error,
    activeItem,
    votedIds,
    configured: config !== null,
    configure,
    clearConfig,
    fetchItems,
    selectItem,
    markVoted,
  };
}
