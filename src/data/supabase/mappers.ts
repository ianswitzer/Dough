// Row → domain mappers. Each takes a snake_case PostgREST row (optionally with
// embedded relations) and returns a camelCase domain object. One place to
// absorb DB shape; UI stays clean.

import type {
  Account,
  BudgetMonth,
  Category,
  Insight,
  MerchantRule,
  Profile,
  RecurringTransaction,
  ReviewItem,
  SavedView,
  Tag,
  Transaction,
} from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toProfile = (r: any): Profile => ({
  id: r.id,
  email: r.email,
  displayName: r.display_name ?? null,
  timezone: r.timezone,
  currency: r.currency,
  darkMode: r.dark_mode,
  onboarded: r.onboarded,
});

export const toAccount = (r: any): Account => ({
  id: r.id,
  name: r.name,
  institutionName: r.institution_name ?? null,
  type: r.type,
  syncProvider: r.sync_provider ?? null,
  currentBalanceCents: r.current_balance_cents ?? null,
  availableBalanceCents: r.available_balance_cents ?? null,
  isActive: r.is_active,
});

export const toCategory = (r: any): Category => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  type: r.type,
  tint: r.tint,
  sortOrder: r.sort_order,
  isDefault: r.is_default,
  isActive: r.is_active,
});

export const toTag = (r: any): Tag => ({
  id: r.id,
  name: r.name,
  tagType: r.tag_type,
  color: r.color ?? null,
});

export const toMerchantRule = (r: any): MerchantRule => ({
  id: r.id,
  matchType: r.match_type,
  matchValue: r.match_value,
  setCategoryId: r.set_category_id ?? null,
  setHiddenFromBudget: r.set_hidden_from_budget ?? null,
  renameTo: r.rename_to ?? null,
  priority: r.priority,
  isActive: r.is_active,
});

export const toTransaction = (r: any): Transaction => ({
  id: r.id,
  accountId: r.account_id,
  merchantId: r.merchant_id ?? null,
  categoryId: r.category_id ?? null,
  date: r.date,
  descriptionRaw: r.description_raw,
  descriptionClean: r.description_clean ?? null,
  merchant: r.description_clean || r.description_raw,
  amountCents: r.amount_cents,
  type: r.type,
  isHiddenFromBudget: r.is_hidden_from_budget,
  isRecurringCandidate: r.is_recurring_candidate,
  reviewStatus: r.review_status,
  flag: r.flag ?? null,
  notes: r.notes ?? null,
  // transaction_tags(tags(name)) → ['Household', ...]
  tagNames: Array.isArray(r.transaction_tags)
    ? r.transaction_tags.map((tt: any) => tt.tags?.name).filter(Boolean)
    : [],
});

export const toRecurring = (r: any): RecurringTransaction => ({
  id: r.id,
  name: r.name,
  categoryId: r.category_id ?? null,
  categorySlug: r.categories?.slug ?? null,
  cadence: r.cadence,
  expectedAmountCents: r.expected_amount_cents,
  amountVarianceCents: r.amount_variance_cents ?? 0,
  nextExpectedDate: r.next_expected_date,
  status: r.status,
  isIncome: r.is_income,
  confidence: r.amount_variance_cents > 0 ? 'medium' : 'high',
});

export const toBudgetMonth = (r: any): BudgetMonth => ({
  id: r.id,
  year: r.year,
  month: r.month,
  incomeExpectedCents: r.income_expected_cents ?? null,
  bufferCents: r.buffer_cents,
});

export const toReviewItem = (r: any): ReviewItem => ({
  id: r.id,
  kind: r.kind,
  severity: r.severity,
  title: r.title,
  body: r.body,
  relatedObjectType: r.related_object_type ?? null,
  relatedObjectId: r.related_object_id ?? null,
  status: r.status,
});

export const toInsight = (r: any): Insight => ({
  id: r.id,
  kind: r.kind,
  title: r.title,
  summary: r.summary,
  deltaCents: r.delta_cents ?? null,
  direction: r.direction ?? null,
  categorySlug: r.category_slug ?? null,
  confidence: r.confidence,
});

export const toSavedView = (r: any): SavedView => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  filters: r.filters_json ?? {},
  isDefault: r.is_default,
});
