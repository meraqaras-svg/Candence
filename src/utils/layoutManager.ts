import type { HomeWidgetConfig, HomeWidgetId } from '../types/music';

export const DEFAULT_HOME_LAYOUT: HomeWidgetConfig[] = [
  {
    id: 'quick-picks',
    label: 'Quick Picks',
    description: 'Curated ambient, electronic, and full-length listening sessions.',
    visible: true,
  },
  {
    id: 'recently-played',
    label: 'Recently Played',
    description: 'Jump back into tracks and mixes you listened to recently.',
    visible: true,
  },
  {
    id: 'playlists',
    label: 'Playlists',
    description: 'Your personal mixes and saved collections.',
    visible: true,
  },
];

export function toggleWidgetVisibility(
  layout: HomeWidgetConfig[],
  id: HomeWidgetId
): HomeWidgetConfig[] {
  return layout.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item));
}

export function moveWidget(
  layout: HomeWidgetConfig[],
  id: HomeWidgetId,
  direction: 'up' | 'down'
): HomeWidgetConfig[] {
  const index = layout.findIndex((item) => item.id === id);
  if (index === -1) return layout;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= layout.length) return layout;

  return reorderWidgets(layout, index, targetIndex);
}

export function reorderWidgets(
  layout: HomeWidgetConfig[],
  fromIndex: number,
  toIndex: number
): HomeWidgetConfig[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= layout.length ||
    toIndex >= layout.length ||
    fromIndex === toIndex
  ) {
    return layout;
  }
  const next = [...layout];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function normalizeLayout(saved: unknown): HomeWidgetConfig[] {
  if (!Array.isArray(saved) || saved.length === 0) {
    return DEFAULT_HOME_LAYOUT.map((w) => ({ ...w }));
  }

  const defaultById = new Map<HomeWidgetId, HomeWidgetConfig>(
    DEFAULT_HOME_LAYOUT.map((w) => [w.id, w])
  );
  const seen = new Set<HomeWidgetId>();
  const normalized: HomeWidgetConfig[] = [];

  for (const item of saved) {
    if (
      item &&
      typeof item === 'object' &&
      'id' in item &&
      typeof item.id === 'string' &&
      defaultById.has(item.id as HomeWidgetId)
    ) {
      const id = item.id as HomeWidgetId;
      if (seen.has(id)) continue;
      seen.add(id);
      const base = defaultById.get(id)!;
      normalized.push({
        ...base,
        visible:
          typeof (item as HomeWidgetConfig).visible === 'boolean'
            ? (item as HomeWidgetConfig).visible
            : base.visible,
      });
    }
  }

  for (const base of DEFAULT_HOME_LAYOUT) {
    if (!seen.has(base.id)) {
      normalized.push({ ...base });
    }
  }

  return normalized;
}
