import { useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';

import { Category } from '../../data/types';
import { useRepositories } from '../../data/DataProvider';
import { useAsync } from '../../lib/useAsync';

// Loads categories once per screen and exposes byId / bySlug lookups. Screens
// resolve a transaction's category (name, tint) through this.
export function useCategories() {
  const repos = useRepositories();
  const { data, loading, refetch } = useAsync(() => repos.categories.list(), []);
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );
  const list = data ?? [];
  const byId = useMemo(() => Object.fromEntries(list.map((c) => [c.id, c])) as Record<string, Category>, [data]);
  const bySlug = useMemo(() => Object.fromEntries(list.map((c) => [c.slug, c])) as Record<string, Category>, [data]);
  return { list, byId, bySlug, loading, refetch };
}
