// Supabase implementations of the repository contracts. One factory builds the
// whole bundle so the composition root can inject it once. Each method maps the
// PostgREST result through src/data/supabase/mappers.ts.

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Repositories, TransactionQuery } from '../repositories/contracts';
import type { CategoryBudget } from '../types';
import {
  toAccount,
  toBudgetMonth,
  toCategory,
  toInsight,
  toMerchantRule,
  toProfile,
  toRecurring,
  toReviewItem,
  toSavedView,
  toTag,
  toTransaction,
} from './mappers';
import { createSupabaseIntelligenceRepository } from './intelligence/repository';

const TX_SELECT =
  '*, categories(slug), transaction_tags(tags(name))';

// Throw on error so callers (wrapped by useAsync) surface a clean message.
function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

const monthRange = (year: number, month: number) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
  return { start, end };
};

// Shared: sum of expense (positive) amounts per category slug for a month,
// excluding hidden. Used by both the transactions and budget repos.
async function spendByCategory(
  sb: SupabaseClient,
  year: number,
  month: number,
): Promise<Record<string, number>> {
  const { start, end } = monthRange(year, month);
  const rows = unwrap(
    await sb
      .from('transactions')
      .select('amount_cents, categories(slug)')
      .gte('date', start)
      .lt('date', end)
      .eq('is_hidden_from_budget', false)
      .gt('amount_cents', 0),
  );
  const out: Record<string, number> = {};
  for (const r of rows as any[]) {
    const slug = r.categories?.slug ?? 'other';
    out[slug] = (out[slug] ?? 0) + r.amount_cents;
  }
  return out;
}

export function createSupabaseRepositories(sb: SupabaseClient): Repositories {
  return {
    profile: {
      async getCurrent() {
        const { data: auth } = await sb.auth.getUser();
        if (!auth.user) return null;
        const row = unwrap(
          await sb.from('profiles').select('*').eq('id', auth.user.id).maybeSingle(),
        );
        return row ? toProfile(row) : null;
      },
      async update(patch) {
        const { data: auth } = await sb.auth.getUser();
        if (!auth.user) return;
        const body: Record<string, unknown> = {};
        if (patch.displayName !== undefined) body.display_name = patch.displayName;
        if (patch.darkMode !== undefined) body.dark_mode = patch.darkMode;
        if (patch.onboarded !== undefined) body.onboarded = patch.onboarded;
        unwrap(await sb.from('profiles').update(body).eq('id', auth.user.id).select());
      },
    },

    accounts: {
      async list() {
        const rows = unwrap(
          await sb.from('accounts').select('*').eq('is_active', true).order('created_at'),
        );
        return (rows as any[]).map(toAccount);
      },
      async get(id) {
        const row = unwrap(await sb.from('accounts').select('*').eq('id', id).maybeSingle());
        return row ? toAccount(row) : null;
      },
      async create(input) {
        const { data: auth } = await sb.auth.getUser();
        const row = unwrap(
          await sb
            .from('accounts')
            .insert({
              user_id: auth.user!.id,
              name: input.name,
              type: input.type,
              current_balance_cents: input.currentBalanceCents,
            })
            .select()
            .single(),
        );
        return toAccount(row);
      },
      async update(id, patch) {
        const body: Record<string, unknown> = {};
        if (patch.name !== undefined) body.name = patch.name;
        if (patch.institutionName !== undefined) body.institution_name = patch.institutionName;
        if (patch.type !== undefined) body.type = patch.type;
        if (patch.currentBalanceCents !== undefined)
          body.current_balance_cents = patch.currentBalanceCents;
        if (patch.availableBalanceCents !== undefined)
          body.available_balance_cents = patch.availableBalanceCents;
        if (patch.isActive !== undefined) body.is_active = patch.isActive;
        unwrap(await sb.from('accounts').update(body).eq('id', id).select());
      },
      async deactivate(id) {
        unwrap(await sb.from('accounts').update({ is_active: false }).eq('id', id).select());
      },
    },

    categories: {
      async list() {
        const rows = unwrap(
          await sb.from('categories').select('*').eq('is_active', true).order('sort_order'),
        );
        return (rows as any[]).map(toCategory);
      },
      async update(id, patch) {
        const body: Record<string, unknown> = {};
        if (patch.name !== undefined) body.name = patch.name;
        if (patch.tint !== undefined) body.tint = patch.tint;
        if (patch.sortOrder !== undefined) body.sort_order = patch.sortOrder;
        if (patch.isActive !== undefined) body.is_active = patch.isActive;
        unwrap(await sb.from('categories').update(body).eq('id', id).select());
      },
    },

    tags: {
      async list() {
        const rows = unwrap(await sb.from('tags').select('*').eq('is_active', true).order('name'));
        return (rows as any[]).map(toTag);
      },
      async create(input) {
        const { data: auth } = await sb.auth.getUser();
        const row = unwrap(
          await sb
            .from('tags')
            .insert({
              user_id: auth.user!.id,
              name: input.name,
              tag_type: input.tagType ?? 'custom',
              color: input.color ?? null,
            })
            .select()
            .single(),
        );
        return toTag(row);
      },
      async update(id, patch) {
        const body: Record<string, unknown> = {};
        if (patch.name !== undefined) body.name = patch.name;
        if (patch.tagType !== undefined) body.tag_type = patch.tagType;
        if (patch.color !== undefined) body.color = patch.color;
        unwrap(await sb.from('tags').update(body).eq('id', id).select());
      },
      async deactivate(id) {
        unwrap(await sb.from('tags').update({ is_active: false }).eq('id', id).select());
      },
    },

    transactions: {
      async list(query: TransactionQuery = {}) {
        let q = sb.from('transactions').select(TX_SELECT).order('date', { ascending: false });
        if (query.reviewStatus) q = q.eq('review_status', query.reviewStatus);
        if (query.recurringOnly) q = q.eq('is_recurring_candidate', true);
        if (query.categoryId) q = q.eq('category_id', query.categoryId);
        if (query.hidden !== undefined) q = q.eq('is_hidden_from_budget', query.hidden);
        if (query.limit) q = q.limit(query.limit);
        const rows = unwrap(await q);
        let mapped = (rows as any[]).map(toTransaction);
        // Tag filter is applied client-side since it spans a join table.
        if (query.tag) mapped = mapped.filter((t) => t.tagNames.includes(query.tag!));
        return mapped;
      },
      async get(id) {
        const row = unwrap(
          await sb.from('transactions').select(TX_SELECT).eq('id', id).maybeSingle(),
        );
        return row ? toTransaction(row) : null;
      },
      async create(input) {
        const { data: auth } = await sb.auth.getUser();
        const row = unwrap(
          await sb
            .from('transactions')
            .insert({
              user_id: auth.user!.id,
              account_id: input.accountId,
              category_id: input.categoryId,
              date: input.date,
              description_raw: input.merchant,
              description_clean: input.merchant,
              amount_cents: input.amountCents,
              type: input.type,
              source: 'manual',
              review_status: 'reviewed',
            })
            .select('id')
            .single(),
        );
        return (row as any).id as string;
      },
      async setTags(transactionId, tagIds) {
        const { data: auth } = await sb.auth.getUser();
        const uid = auth.user!.id;
        // Replace-all: clear then insert the chosen set.
        unwrap(await sb.from('transaction_tags').delete().eq('transaction_id', transactionId).select());
        if (tagIds.length) {
          unwrap(
            await sb
              .from('transaction_tags')
              .insert(tagIds.map((tag_id) => ({ transaction_id: transactionId, tag_id, user_id: uid })))
              .select(),
          );
        }
      },
      async update(id, patch) {
        const body: Record<string, unknown> = {};
        if (patch.categoryId !== undefined) body.category_id = patch.categoryId;
        if (patch.descriptionClean !== undefined) body.description_clean = patch.descriptionClean;
        if (patch.isHiddenFromBudget !== undefined)
          body.is_hidden_from_budget = patch.isHiddenFromBudget;
        if (patch.reviewStatus !== undefined) body.review_status = patch.reviewStatus;
        if (patch.notes !== undefined) body.notes = patch.notes;
        unwrap(await sb.from('transactions').update(body).eq('id', id).select());
      },
      async monthSpendByCategory(year, month) {
        return spendByCategory(sb, year, month);
      },
    },

    rules: {
      async list() {
        const rows = unwrap(
          await sb
            .from('merchant_rules')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false }),
        );
        return (rows as any[]).map(toMerchantRule);
      },
      async update(id, patch) {
        const body: Record<string, unknown> = {};
        if (patch.matchValue !== undefined) body.match_value = patch.matchValue;
        if (patch.setCategoryId !== undefined) body.set_category_id = patch.setCategoryId;
        if (patch.setHiddenFromBudget !== undefined)
          body.set_hidden_from_budget = patch.setHiddenFromBudget;
        if (patch.renameTo !== undefined) body.rename_to = patch.renameTo;
        if (patch.priority !== undefined) body.priority = patch.priority;
        if (patch.isActive !== undefined) body.is_active = patch.isActive;
        unwrap(await sb.from('merchant_rules').update(body).eq('id', id).select());
      },
      async deactivate(id) {
        unwrap(await sb.from('merchant_rules').update({ is_active: false }).eq('id', id).select());
      },
      async createFromCorrection({ merchant, setCategoryId, sourceTransactionId }) {
        const { data: auth } = await sb.auth.getUser();
        const uid = auth.user!.id;
        // Persist the rule as a natural-language-friendly "merchant contains"
        // match (spec §14: rules read like remembered corrections).
        unwrap(
          await sb
            .from('merchant_rules')
            .insert({
              user_id: uid,
              match_type: 'raw_description_contains',
              match_value: merchant,
              priority: 10,
              set_category_id: setCategoryId,
              created_from_transaction_id: sourceTransactionId,
            })
            .select(),
        );
        // Apply to existing same-merchant rows the user hasn't hand-reviewed,
        // so the correction visibly propagates (spec §12.2). Never clobber a
        // reviewed row.
        const updated = unwrap(
          await sb
            .from('transactions')
            .update({ category_id: setCategoryId })
            .eq('user_id', uid)
            .eq('description_clean', merchant)
            .neq('id', sourceTransactionId)
            .neq('review_status', 'reviewed')
            .select('id'),
        );
        return (updated as any[]).length;
      },
    },

    recurring: {
      async list() {
        const rows = unwrap(
          await sb
            .from('recurring_transactions')
            .select('*, categories(slug)')
            .neq('status', 'ignored')
            .order('next_expected_date'),
        );
        return (rows as any[]).map(toRecurring);
      },
    },

    budget: {
      async getMonth(year, month) {
        const row = unwrap(
          await sb
            .from('budget_months')
            .select('*')
            .eq('year', year)
            .eq('month', month)
            .maybeSingle(),
        );
        return row ? toBudgetMonth(row) : null;
      },
      async setBuffer(monthId, bufferCents) {
        unwrap(
          await sb.from('budget_months').update({ buffer_cents: bufferCents }).eq('id', monthId).select(),
        );
      },
      async listCategoryBudgets(year, month) {
        const row = unwrap(
          await sb
            .from('budget_months')
            .select('id')
            .eq('year', year)
            .eq('month', month)
            .maybeSingle(),
        );
        if (!row) return [];
        const cbs = unwrap(
          await sb
            .from('category_budgets')
            .select('*, categories(slug)')
            .eq('budget_month_id', (row as any).id)
            .eq('is_active', true),
        );
        const spent = await spendByCategory(sb, year, month);
        return (cbs as any[]).map(
          (cb): CategoryBudget => ({
            id: cb.id,
            categoryId: cb.category_id,
            categorySlug: cb.categories?.slug ?? 'other',
            limitCents: cb.limit_cents,
            spentCents: spent[cb.categories?.slug ?? 'other'] ?? 0,
            isActive: cb.is_active,
          }),
        );
      },
      async setCategoryLimit(monthId, categoryId, limitCents) {
        const { data: auth } = await sb.auth.getUser();
        unwrap(
          await sb.from('category_budgets').upsert(
            {
              user_id: auth.user!.id,
              budget_month_id: monthId,
              category_id: categoryId,
              limit_cents: limitCents,
              is_active: true,
            },
            { onConflict: 'budget_month_id,category_id' },
          ).select(),
        );
      },
    },

    review: {
      async listOpen() {
        const rows = unwrap(
          await sb
            .from('review_items')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false }),
        );
        return (rows as any[]).map(toReviewItem);
      },
      async setStatus(id, status) {
        const item = unwrap(
          await sb
            .from('review_items')
            .select('kind, related_object_type, related_object_id')
            .eq('id', id)
            .maybeSingle(),
        ) as any | null;
        unwrap(await sb.from('review_items').update({ status }).eq('id', id).select());
        if (status !== 'completed' || !item?.related_object_id) return;
        if (item.kind === 'recurring_candidate' && item.related_object_type === 'recurring_transaction') {
          unwrap(
            await sb
              .from('recurring_transactions')
              .update({ status: 'confirmed' })
              .eq('id', item.related_object_id)
              .select(),
          );
        }
        if (item.related_object_type === 'transaction') {
          const patch: Record<string, unknown> = { review_status: 'reviewed' };
          if (item.kind === 'unusual_charge') patch.flag = null;
          unwrap(
            await sb
              .from('transactions')
              .update(patch)
              .eq('id', item.related_object_id)
              .select(),
          );
        }
      },
    },

    insights: {
      async list() {
        const rows = unwrap(
          await sb.from('insights').select('*').order('created_at', { ascending: false }),
        );
        return (rows as any[]).map(toInsight);
      },
    },

    intelligence: createSupabaseIntelligenceRepository(sb),

    savedViews: {
      async list() {
        const rows = unwrap(await sb.from('saved_views').select('*').order('sort_order'));
        return (rows as any[]).map(toSavedView);
      },
      async update(id, patch) {
        const body: Record<string, unknown> = {};
        if (patch.name !== undefined) body.name = patch.name;
        if (patch.filters !== undefined) body.filters_json = patch.filters;
        unwrap(await sb.from('saved_views').update(body).eq('id', id).select());
      },
    },

    dataPrivacy: {
      async exportData() {
        const { data, error } = await sb.functions.invoke('data-export');
        if (error) throw new Error(error.message);
        return data as Record<string, unknown>;
      },
      async deleteAccount() {
        const { error } = await sb.functions.invoke('account-delete', { body: {} });
        if (error) throw new Error(error.message);
      },
    },
  };
}
