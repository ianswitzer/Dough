// Repository contracts. The UI and services depend ONLY on these interfaces
// (Dependency Inversion). The Supabase implementations live in
// src/data/supabase/repositories.ts and are injected at the composition root.
// Swapping backends = new implementations, zero UI changes.

import type {
  Account,
  BudgetMonth,
  Category,
  CategoryBudget,
  Insight,
  Profile,
  RecurringTransaction,
  ReviewItem,
  SavedView,
  Tag,
  Transaction,
  TransactionPatch,
} from '../types';

export interface ProfileRepository {
  getCurrent(): Promise<Profile | null>;
  update(patch: Partial<Pick<Profile, 'displayName' | 'darkMode' | 'onboarded'>>): Promise<void>;
}

export interface AccountRepository {
  list(): Promise<Account[]>;
  create(input: Omit<Account, 'id'>): Promise<Account>;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
}

export interface TagRepository {
  list(): Promise<Tag[]>;
}

export interface TransactionQuery {
  reviewStatus?: 'needs_review';
  recurringOnly?: boolean;
  categoryId?: string;
  tag?: string;
  hidden?: boolean;
  limit?: number;
}

export interface TransactionRepository {
  list(query?: TransactionQuery): Promise<Transaction[]>;
  get(id: string): Promise<Transaction | null>;
  update(id: string, patch: TransactionPatch): Promise<void>;
  /** Sum of expense (positive) amounts in the given month, excluding hidden. */
  monthSpendByCategory(year: number, month: number): Promise<Record<string, number>>;
}

export interface RecurringRepository {
  list(): Promise<RecurringTransaction[]>;
}

export interface BudgetRepository {
  getMonth(year: number, month: number): Promise<BudgetMonth | null>;
  setBuffer(monthId: string, bufferCents: number): Promise<void>;
  listCategoryBudgets(year: number, month: number): Promise<CategoryBudget[]>;
}

export interface ReviewRepository {
  listOpen(): Promise<ReviewItem[]>;
  setStatus(id: string, status: ReviewItem['status']): Promise<void>;
}

export interface InsightRepository {
  list(): Promise<Insight[]>;
}

export interface SavedViewRepository {
  list(): Promise<SavedView[]>;
}

// The bundle injected through React context.
export interface Repositories {
  profile: ProfileRepository;
  accounts: AccountRepository;
  categories: CategoryRepository;
  tags: TagRepository;
  transactions: TransactionRepository;
  recurring: RecurringRepository;
  budget: BudgetRepository;
  review: ReviewRepository;
  insights: InsightRepository;
  savedViews: SavedViewRepository;
}
