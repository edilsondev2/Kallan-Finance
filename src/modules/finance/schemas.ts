import { z } from 'zod';
const name = z.string().trim().min(2, 'Informe pelo menos 2 caracteres.').max(160);
const amount = z.coerce.number().finite().positive('Informe um valor maior que zero.').max(999999999999);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(v + 'T12:00:00Z'); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0,10) === v; }, 'Data inválida.');
const id = z.string().uuid().optional();
export const financeMutationSchema = z.discriminatedUnion('entity', [
  z.object({ entity: z.literal('transaction'), id, description: name, amount, occurred_on: date, type: z.enum(['income','expense','payment','card_purchase','transfer','other']), direction: z.enum(['in','out']), category_id: z.string().uuid().nullable(), institution_name: z.string().trim().max(100), notes: z.string().max(1000) }),
  z.object({ entity: z.literal('account'), id, name, balance: z.coerce.number().finite().min(-999999999999).max(999999999999), institution_name: z.string().trim().max(100), type: z.enum(['checking','savings','wallet','other']) }),
  z.object({ entity: z.literal('investment'), id, name, amount, institution_name: z.string().trim().max(100), kind: z.string().trim().min(2).max(80), position_date: date }),
  z.object({ entity: z.literal('card'), id, name, institution_name: z.string().trim().max(100), credit_limit: z.coerce.number().finite().nonnegative(), available_limit: z.coerce.number().finite().nonnegative(), last_four: z.string().regex(/^\d{4}$/).or(z.literal('')) }),
  z.object({ entity: z.literal('invoice'), id, card_id: z.string().uuid(), amount, reference_month: date, due_date: date, status: z.enum(['open','closed','paid','overdue']) }),
  z.object({ entity: z.literal('goal'), id, title: name, target_amount: amount, deadline: date.nullable() }),
  z.object({ entity: z.literal('contribution'), goal_id: z.string().uuid(), amount, note: z.string().max(300) }),
  z.object({ entity: z.literal('category'), name, kind: z.enum(['income','expense']) }),
]);
export type FinanceInput = z.input<typeof financeMutationSchema>;
export const financeDeleteSchema = z.object({ entity: z.enum(['transaction','account','investment','card','invoice','goal']), id: z.string().uuid() });
