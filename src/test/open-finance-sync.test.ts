import { describe, expect, it } from 'vitest';
import { isCardAccount, mapBankAccount, mapCard, mapInvestment, mapInvoices, mapTransaction, money, type Ctx, type MalvoAccount, type MalvoBill } from '@/modules/open-finance/sync';

const ctx: Ctx = { userId: 'u1', connectionId: 'c1', institution: 'Banco X (teste)', now: new Date('2026-11-27T12:00:00Z') };

describe('open finance mapping', () => {
  it('normalizes money and ignores unusable values', () => {
    expect(money(10.456)).toBe(10.46);
    expect(money(null)).toBe(0);
    expect(money(Number.NaN)).toBe(0);
  });

  it('tells cards from bank accounts', () => {
    expect(isCardAccount({ type: 'CREDIT' })).toBe(true);
    expect(isCardAccount({ type: 'BANK', subtype: 'CREDIT_CARD' })).toBe(true);
    expect(isCardAccount({ type: 'BANK', subtype: 'CHECKING_ACCOUNT' })).toBe(false);
  });

  it('maps a checking account with the institution name', () => {
    const r = mapBankAccount({ id: 'a1', type: 'BANK', subtype: 'CHECKING_ACCOUNT', name: 'Conta', balance: 1234.5 }, ctx);
    expect(r).toMatchObject({ source: 'open_finance', external_id: 'a1', type: 'checking', balance: 1234.5, institution_name: 'Banco X (teste)', currency: 'BRL' });
  });

  it('maps a card with last four digits and closing/due days', () => {
    const a: MalvoAccount = { id: 'k1', type: 'CREDIT', number: '5555-1234', name: 'Cartão', creditData: { brand: 'VISA', creditLimit: 5000, availableCreditLimit: 3500, balanceCloseDate: '2026-12-05', balanceDueDate: '2026-12-12' } };
    expect(mapCard(a, ctx)).toMatchObject({ last_four: '1234', credit_limit: 5000, available_limit: 3500, closing_day: 5, due_day: 12, brand: 'VISA' });
  });

  it('maps transaction directions by type, with positive amounts', () => {
    const bankIn = mapTransaction({ id: 't1', amount: 100, type: 'CREDIT', date: '2026-11-01', description: 'Salário' }, { kind: 'bank', ourId: 'a' }, ctx);
    const bankOut = mapTransaction({ id: 't2', amount: -40, type: 'DEBIT', date: '2026-11-02', description: 'Mercado' }, { kind: 'bank', ourId: 'a' }, ctx);
    expect(bankIn).toMatchObject({ type: 'income', direction: 'in', amount: 100, account_id: 'a', card_id: null });
    expect(bankOut).toMatchObject({ type: 'expense', direction: 'out', amount: 40 });
  });

  it('treats a bank debit for the card bill as a payment', () => {
    const r = mapTransaction({ id: 't3', amount: -900, type: 'DEBIT', description: 'Pagamento de fatura cartão' }, { kind: 'bank', ourId: 'a' }, ctx);
    expect(r?.type).toBe('payment');
  });

  it('inverts card signs: purchase is DEBIT, payment is CREDIT', () => {
    const buy = mapTransaction({ id: 't4', amount: 80, type: 'DEBIT', description: 'Loja' }, { kind: 'card', ourId: 'k' }, ctx);
    const pay = mapTransaction({ id: 't5', amount: -80, type: 'CREDIT', description: 'Pagamento' }, { kind: 'card', ourId: 'k' }, ctx);
    expect(buy).toMatchObject({ type: 'card_purchase', direction: 'out', amount: 80, card_id: 'k', account_id: null });
    expect(pay).toMatchObject({ type: 'payment', direction: 'in', amount: 80 });
  });

  it('skips zero-amount transactions and falls back on a missing date', () => {
    expect(mapTransaction({ id: 'z', amount: 0, type: 'DEBIT' }, { kind: 'bank', ourId: 'a' }, ctx)).toBeNull();
    expect(mapTransaction({ id: 'y', amount: 5, type: 'DEBIT' }, { kind: 'bank', ourId: 'a' }, ctx)?.occurred_on).toBe('2026-11-27');
  });

  it('builds invoices: settled, overdue, closed and the open one', () => {
    const card: MalvoAccount = { id: 'k1', type: 'CREDIT', balance: 300, creditData: { balanceDueDate: '2026-12-10' } };
    const bills: MalvoBill[] = [
      { id: 'b1', dueDate: '2026-09-10', totalAmount: 100 },
      { id: 'b2', dueDate: '2026-10-10', totalAmount: 200, payments: [{ amount: 100 }] },
      { id: 'b3', dueDate: '2026-12-01', totalAmount: 50 },
    ];
    const rows = mapInvoices(card, bills, 'card-id', ctx);
    const by = Object.fromEntries(rows.map(r => [r.external_id, r]));
    expect(by['b1']?.status).toBe('paid');
    expect(by['b2']?.status).toBe('overdue');
    expect(by['b3']?.status).toBe('closed');
    expect(by['k1:open']).toMatchObject({ status: 'open', amount: 300, reference_month: '2026-12-01', due_date: '2026-12-10' });
  });

  it('maps investment kinds and falls back to outro', () => {
    expect(mapInvestment({ id: 'i1', type: 'FIXED_INCOME', balance: 1000, amountOriginal: 900 }, ctx)).toMatchObject({ kind: 'renda_fixa', amount: 1000, invested_amount: 900 });
    expect(mapInvestment({ id: 'i2', type: 'WHATEVER', amount: 5 }, ctx).kind).toBe('outro');
  });
});
