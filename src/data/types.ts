// Domain types — camelCase, app-facing. These are what the UI and services
// speak; row mappers (supabase/mappers.ts) translate snake_case DB rows to/from
// these. Keeping them decoupled means a schema rename never ripples into the UI.

export type Confidence = 'low' | 'medium' | 'high';
export type Direction = 'up' | 'down' | 'flat';

export type Profile = {
  id: string;
  email: string;
  displayName: string | null;
  timezone: string;
  currency: string;
  darkMode: 'system' | 'light' | 'dark';
  onboarded: boolean;
};

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'cash'
  | 'loan'
  | 'investment'
  | 'manual';

export type Account = {
  id: string;
  name: string;
  institutionName: string | null;
  type: AccountType;
  syncProvider: string | null;
  currentBalanceCents: number | null;
  availableBalanceCents: number | null;
  isActive: boolean;
};

export type AccountPatch = Partial<
  Pick<Account, 'name' | 'institutionName' | 'type' | 'currentBalanceCents' | 'availableBalanceCents' | 'isActive'>
>;

export type Category = {
  id: string;
  name: string;
  slug: string;
  type: 'expense' | 'income' | 'transfer';
  tint: string; // theme tint key: accent | sage | rose | sky | plum | muted
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
};

export type NewCategory = {
  name: string;
  type?: Category['type'];
  tint?: string;
  monthlyLimitCents?: number;
};

export type CategoryPatch = Partial<Pick<Category, 'name' | 'tint' | 'sortOrder' | 'isActive'>>;

export type Tag = {
  id: string;
  name: string;
  tagType: string;
  color: string | null;
};

export type NewTag = {
  name: string;
  tagType?: string;
  color?: string | null;
};

export type TagPatch = Partial<Pick<Tag, 'name' | 'tagType' | 'color'>>;

export type MerchantRule = {
  id: string;
  matchType: string;
  matchValue: string;
  setCategoryId: string | null;
  setHiddenFromBudget: boolean | null;
  renameTo: string | null;
  priority: number;
  isActive: boolean;
};

export type MerchantRulePatch = Partial<
  Pick<MerchantRule, 'matchValue' | 'setCategoryId' | 'setHiddenFromBudget' | 'renameTo' | 'priority' | 'isActive'>
>;

export type TxnType = 'expense' | 'income' | 'transfer' | 'refund' | 'adjustment';

export type Transaction = {
  id: string;
  accountId: string;
  merchantId: string | null;
  categoryId: string | null;
  date: string; // ISO yyyy-mm-dd
  descriptionRaw: string;
  descriptionClean: string | null;
  merchant: string; // resolved display name (clean || raw)
  amountCents: number; // expense positive, income negative
  type: TxnType;
  isHiddenFromBudget: boolean;
  isRecurringCandidate: boolean;
  reviewStatus: 'needs_review' | 'reviewed' | 'ignored';
  flag: string | null; // 'unusual' | 'split-suggested' | null
  notes: string | null;
  tagNames: string[]; // denormalized for display
};

export type RecurringTransaction = {
  id: string;
  name: string;
  categoryId: string | null;
  categorySlug: string | null;
  cadence: string;
  expectedAmountCents: number;
  amountVarianceCents: number;
  nextExpectedDate: string;
  status: 'candidate' | 'confirmed' | 'ignored' | 'ended';
  isIncome: boolean;
  changeLabel?: string | null; // e.g. "+$8" when amount drifted up
  confidence: Confidence;
};

export type BudgetMonth = {
  id: string;
  year: number;
  month: number;
  incomeExpectedCents: number | null;
  bufferCents: number;
};

export type CategoryBudget = {
  id: string;
  categoryId: string;
  categorySlug: string;
  limitCents: number;
  spentCents: number; // computed from transactions
  isActive: boolean;
};

export type CategoryBudgetPatch = Partial<Pick<CategoryBudget, 'limitCents' | 'isActive'>>;

export type ReviewKind =
  | 'uncategorized_transaction'
  | 'unusual_charge'
  | 'subscription_increase'
  | 'recurring_candidate'
  | 'budget_drift'
  | 'duplicate_possible'
  | 'rule_suggestion';

export type ReviewItem = {
  id: string;
  kind: ReviewKind;
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  body: string;
  relatedObjectType: string | null;
  relatedObjectId: string | null;
  status: 'open' | 'completed' | 'dismissed' | 'snoozed';
};

export type InsightKind =
  | 'spending_drift'
  | 'merchant_delta'
  | 'category_delta'
  | 'unusual_transaction'
  | 'recurring_change'
  | 'monthly_summary';

export type Insight = {
  id: string;
  kind: InsightKind;
  title: string;
  summary: string;
  deltaCents: number | null;
  direction: Direction | null;
  categorySlug: string | null;
  confidence: Confidence;
};

export type SavedView = {
  id: string;
  name: string;
  slug: string;
  filters: Record<string, unknown>;
  isDefault: boolean;
};

export type SavedViewPatch = Partial<Pick<SavedView, 'name' | 'filters'>>;

// Patch type for transaction edits (only the fields the detail screen mutates).
export type TransactionPatch = Partial<
  Pick<
    Transaction,
    'accountId' | 'categoryId' | 'descriptionClean' | 'isHiddenFromBudget' | 'reviewStatus' | 'notes'
  >
>;

// Input for creating a transaction manually (the Add Transaction form).
export type NewTransaction = {
  accountId: string;
  categoryId: string | null;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  amountCents: number; // expense positive, income negative
  type: TxnType;
};

// Input for creating an account manually (the Add Account form).
export type NewAccount = {
  name: string;
  type: AccountType;
  currentBalanceCents: number | null;
};
