import React, { createContext, useContext, useMemo } from 'react';

import { supabase } from './supabase/client';
import { createSupabaseRepositories } from './supabase/repositories';
import type { Repositories } from './repositories/contracts';

// Composition root: the ONE place the Supabase implementation is wired to the
// interfaces. Everything else consumes `useRepositories()` and sees only the
// contracts. Tests/storybook can wrap children with a different bundle.
const RepoContext = createContext<Repositories | null>(null);

export function DataProvider({
  repositories,
  children,
}: {
  repositories?: Repositories;
  children: React.ReactNode;
}) {
  const repos = useMemo(
    () => repositories ?? createSupabaseRepositories(supabase),
    [repositories],
  );
  return <RepoContext.Provider value={repos}>{children}</RepoContext.Provider>;
}

export function useRepositories(): Repositories {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error('useRepositories must be used within a DataProvider');
  return ctx;
}
