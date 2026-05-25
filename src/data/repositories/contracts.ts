// Repository contracts. The UI and services depend ONLY on these interfaces
// (Dependency Inversion). The Supabase implementations live in
// src/data/supabase/repositories.ts and are injected at the composition root.
// Swapping backends = new implementations, zero UI changes.

import type {
  Account,
  AccountPatch,
  BudgetMonth,
  Category,
  CategoryBudget,
  CategoryBudgetPatch,
  CategoryPatch,
  Insight,
  MerchantRule,
  MerchantRulePatch,
  NewAccount,
  NewCategory,
  NewTag,
  NewTransaction,
  Profile,
  RecurringTransaction,
  ReviewItem,
  SavedView,
  SavedViewPatch,
  Tag,
  TagPatch,
  Transaction,
  TransactionPatch,
} from '../types';

export interface ProfileRepository {
  getCurrent(): Promise<Profile | null>;
  update(patch: Partial<Pick<Profile, 'displayName' | 'darkMode' | 'onboarded'>>): Promise<void>;
}

export interface AccountRepository {
  list(): Promise<Account[]>;
  get(id: string): Promise<Account | null>;
  create(input: NewAccount): Promise<Account>;
  update(id: string, patch: AccountPatch): Promise<void>;
  deactivate(id: string): Promise<void>;
}

export interface CategoryRepository {
  list(): Promise<Category[]>;
  create(input: NewCategory): Promise<Category>;
  update(id: string, patch: CategoryPatch): Promise<void>;
}

export interface TagRepository {
  list(): Promise<Tag[]>;
  create(input: NewTag): Promise<Tag>;
  update(id: string, patch: TagPatch): Promise<void>;
  deactivate(id: string): Promise<void>;
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
  create(input: NewTransaction): Promise<string>;
  update(id: string, patch: TransactionPatch): Promise<void>;
  /** Replace the transaction's tags with exactly `tagIds`. */
  setTags(transactionId: string, tagIds: string[]): Promise<void>;
  /** Sum of expense (positive) amounts in the given month, excluding hidden. */
  monthSpendByCategory(year: number, month: number): Promise<Record<string, number>>;
}

export interface RecurringRepository {
  list(): Promise<RecurringTransaction[]>;
}

export interface CreateRuleFromCorrection {
  /** Merchant display name the correction was made on (the match value). */
  merchant: string;
  /** Category to apply to this and future matching transactions. */
  setCategoryId: string;
  /** Transaction the rule was derived from. */
  sourceTransactionId: string;
}

export interface RuleRepository {
  list(): Promise<MerchantRule[]>;
  update(id: string, patch: MerchantRulePatch): Promise<void>;
  deactivate(id: string): Promise<void>;
  /**
   * Persist a MerchantRule from a user correction (spec §12.2/§14) and apply it
   * to existing not-yet-reviewed transactions from the same merchant. Returns
   * the number of existing rows updated.
   */
  createFromCorrection(input: CreateRuleFromCorrection): Promise<number>;
}

export interface BudgetRepository {
  getMonth(year: number, month: number): Promise<BudgetMonth | null>;
  setBuffer(monthId: string, bufferCents: number): Promise<void>;
  listCategoryBudgets(year: number, month: number): Promise<CategoryBudget[]>;
  setCategoryLimit(monthId: string, categoryId: string, limitCents: number): Promise<void>;
}

export interface ReviewRepository {
  listOpen(): Promise<ReviewItem[]>;
  setStatus(id: string, status: ReviewItem['status']): Promise<void>;
}

export interface InsightRepository {
  list(): Promise<Insight[]>;
}

export type IntelligenceGenerationResult = {
  insightsCreated: number;
  reviewItemsCreated: number;
  recurringCandidatesCreated: number;
};

export interface IntelligenceRepository {
  /**
   * Refresh generated insights, review items, and recurring candidates from the
   * user's current transactions. Implementations must be idempotent.
   */
  generate(): Promise<IntelligenceGenerationResult>;
}

export interface SavedViewRepository {
  list(): Promise<SavedView[]>;
  update(id: string, patch: SavedViewPatch): Promise<void>;
}

export interface DataPrivacyRepository {
  exportData(): Promise<Record<string, unknown>>;
  deleteAccount(): Promise<void>;
}

// The bundle injected through React context.
export interface Repositories {
  profile: ProfileRepository;
  accounts: AccountRepository;
  categories: CategoryRepository;
  tags: TagRepository;
  transactions: TransactionRepository;
  recurring: RecurringRepository;
  rules: RuleRepository;
  budget: BudgetRepository;
  review: ReviewRepository;
  insights: InsightRepository;
  intelligence: IntelligenceRepository;
  savedViews: SavedViewRepository;
  dataPrivacy: DataPrivacyRepository;
}
