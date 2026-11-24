import { describe, it, expect } from 'vitest';
import { buildDemoData } from '@/modules/demo/demo-data';
import { financialPosition, monthSummary, goalProgress, generateInsights } from '@/modules/finance/calculations';
import { hasRealData, selectFinanceData } from '@/modules/finance/queries';
import { financeMutationSchema } from '@/modules/finance/schemas';
import type { FinanceData } from '@/modules/finance/types';
const empty:FinanceData={accounts:[],cards:[],invoices:[],investments:[],transactions:[],categories:[],snapshots:[],goals:[]};
describe('Financial product rules',()=>{
 it('never merges demonstration records into real financial rows',()=>{
  const fixture=buildDemoData(new Date(2026,10,24)); const account=fixture.accounts[0]; if(!account)throw new Error('Missing fixture');
  const real={...empty,accounts:[{...account,id:'real-account',name:'Minha conta'}]};
  const selected=selectFinanceData(real,true);
  expect(selected.mode).toBe('real'); expect(selected.data).toBe(real); expect(selected.data.accounts).toHaveLength(1); expect(selected.data.transactions).toHaveLength(0);
 });
 it('honors the disabled demonstration preference for an empty account',()=>{expect(selectFinanceData(empty,false)).toEqual({mode:'empty',data:empty});});
 it('keeps credit limits out of account balances and net worth',()=>{
  const d=buildDemoData(new Date(2026,10,24));
  const card=d.cards[0]; if(!card) throw new Error('Missing fixture');
  const p=financialPosition([],[],[],[{...card,credit_limit:90000,available_limit:80000}]);
  expect(p.availableCash).toBe(0);expect(p.netWorth).toBe(0);expect(p.creditLimitTotal).toBe(90000);
 });
 it('distinguishes investments from available money',()=>{
  const d=buildDemoData(new Date(2026,10,24)); const investment=d.investments[0];if(!investment)throw new Error('Missing fixture');
  const p=financialPosition([],[{...investment,amount:5000}],[],[]);
  expect(p.availableCash).toBe(0);expect(p.investmentsTotal).toBe(5000);expect(p.netWorth).toBe(5000);
 });
 it('does not count internal transfer records as income or expense',()=>{
  const d=buildDemoData(new Date(2026,10,24));const tx=d.transactions[0];if(!tx)throw new Error('Missing fixture');
  expect(monthSummary([{...tx,occurred_on:'2026-11-10',type:'transfer',direction:'out',amount:1000}],{year:2026,month:10})).toEqual({income:0,expenses:0,result:0,count:1});
 });
 it('does not classify open invoices as overdue',()=>{
  const d=buildDemoData(new Date(2026,10,24)); const invoice=d.invoices[0];if(!invoice)throw new Error('Missing fixture');
  const p=financialPosition([],[],[{...invoice,amount:1000,status:'open'}],[]);
  expect(p.openInvoices).toBe(1000);expect(p.overdueInvoices).toBe(0);expect(p.netWorth).toBe(-1000);
 });
 it('recognizes a real goal so demo goals never replace it',()=>{
  const d=buildDemoData(new Date(2026,10,24));const goal=d.goals[0];if(!goal)throw new Error('Missing fixture');
  expect(hasRealData({...empty,goals:[goal]})).toBe(true);expect(hasRealData(empty)).toBe(false);
 });
 it('does not invent personal insights without data',()=>{expect(generateInsights(empty,{year:2026,month:10})).toEqual([]);});
 it('bounds goal progress between zero and completion',()=>{expect(goalProgress({current_amount:200,target_amount:100})).toBe(1);expect(goalProgress({current_amount:0,target_amount:100})).toBe(0);});
 it('never permits imported rows as a user-entered entity',()=>{expect(financeMutationSchema.safeParse({entity:'open_finance',name:'Bank'}).success).toBe(false);});
});
