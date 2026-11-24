// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

// This PostgreSQL instance is in memory only: no accounts, sessions or rows are
// created in the application's auth service or database.
const db = new PGlite();
const id = (n:number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const A=id(1), B=id(2), accountA=id(11), accountB=id(12), imported=id(13), cardA=id(21), cardB=id(22), categoryA=id(31), categoryB=id(32), categoryBusiness=id(33), businessA=id(41), businessB=id(42), goalA=id(51), goalB=id(52), txA=id(61), invoiceA=id(71), conversationA=id(81), conversationB=id(82), diagnosticA=id(91), diagnosticB=id(92), planA=id(101), planB=id(102), stepA=id(111);
const migration=(name:string)=>readFileSync(new URL(`../../drizzle/migrations/${name}`,import.meta.url),'utf8');
async function signIn(){await db.exec('BEGIN; SET LOCAL ROLE authenticated;');await db.query("SELECT set_config('request.jwt.claim.sub', $1, true)",[A]);}
async function denied(sql:string, params:unknown[]){await expect(db.query(sql,params)).rejects.toMatchObject({code:'42501'});}

beforeAll(async()=>{
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;
 CREATE SCHEMA storage; CREATE TABLE storage.objects(id uuid PRIMARY KEY,bucket_id text,name text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql AS $$ SELECT string_to_array($1,'/') $$;`);
 await db.exec(migration('0000_kallan_foundation.sql'));
 await db.query('INSERT INTO auth.users(id,email) VALUES ($1,$2),($3,$4)',[A,'a@example.test',B,'b@example.test']);
 await db.query("INSERT INTO public.accounts(id,user_id,name,source) VALUES ($1,$2,'Own account','manual'),($3,$4,'Other account','manual'),($5,$2,'Imported fixture','open_finance')",[accountA,A,accountB,B,imported]);
 await db.query("INSERT INTO public.credit_cards(id,user_id,name) VALUES ($1,$2,'Own card'),($3,$4,'Other card')",[cardA,A,cardB,B]);
 await db.query("INSERT INTO public.categories(id,user_id,name,scope) VALUES ($1,$2,'Personal','personal'),($3,$4,'Other category','personal'),($5,NULL,'Business template','business')",[categoryA,A,categoryB,B,categoryBusiness]);
 await db.query("INSERT INTO public.businesses(id,owner_id,name) VALUES ($1,$2,'Own business'),($3,$4,'Other business')",[businessA,A,businessB,B]);
 await db.query("INSERT INTO public.goals(id,user_id,title,target_amount) VALUES ($1,$2,'Own goal',1000),($3,$4,'Other goal',1000)",[goalA,A,goalB,B]);
 await db.query("INSERT INTO public.transactions(id,user_id,account_id,card_id,category_id,description,amount,direction) VALUES ($1,$2,$3,$4,$5,'Own transaction',100,'out')",[txA,A,accountA,cardA,categoryA]);
 await db.query("INSERT INTO public.card_invoices(id,user_id,card_id,reference_month,amount) VALUES ($1,$2,$3,'2026-11-01',100)",[invoiceA,A,cardA]);
 await db.query("INSERT INTO public.ai_conversations(id,user_id) VALUES ($1,$2),($3,$4)",[conversationA,A,conversationB,B]);
 await db.query("INSERT INTO public.diagnostics(id,user_id,conversation_id,kind,title) VALUES ($1,$2,$3,'position','Own diagnostic'),($4,$5,$6,'position','Other diagnostic')",[diagnosticA,A,conversationA,diagnosticB,B,conversationB]);
 await db.query("INSERT INTO public.action_plans(id,user_id,diagnostic_id,title) VALUES ($1,$2,$3,'Own plan'),($4,$5,$6,'Other plan')",[planA,A,diagnosticA,planB,B,diagnosticB]);
 await db.query("INSERT INTO public.action_plan_steps(id,user_id,plan_id,title) VALUES ($1,$2,$3,'Own step')",[stepA,A,planA]);
 // Reproduce the original missing relationship check before applying the fix.
 await signIn();
 const baseline=await db.query("INSERT INTO public.transactions(user_id,account_id,description,amount,direction) VALUES ($1,$2,'Regression fixture',10,'out') RETURNING id",[A,accountB]);
 expect(baseline.rows).toHaveLength(1);
 await db.exec('ROLLBACK;');
 await db.exec(migration('0001_financial_relationship_ownership.sql'));
 await db.exec(migration('0002_private_analysis_relationship_ownership.sql'));
},60000);
beforeEach(signIn);
afterEach(async()=>{await db.exec('ROLLBACK;');});
afterAll(async()=>{await db.close();});

describe('Financial relationships are scoped to their owner',()=>{
 it('persists and reads back an own manual transaction',async()=>{
  const saved=await db.query<{id:string}>("INSERT INTO public.transactions(user_id,account_id,card_id,category_id,description,amount,direction) VALUES ($1,$2,$3,$4,'Valid record',25,'out') RETURNING id",[A,accountA,cardA,categoryA]);
  const first=saved.rows[0];if(!first)throw new Error('Transaction was not saved');
  const read=await db.query<{description:string,amount:string}>('SELECT description,amount FROM public.transactions WHERE id=$1',[first.id]);
  expect(read.rows).toEqual([{description:'Valid record',amount:'25.00'}]);
 });
 it('does not expose another owner\'s accounts',async()=>{const result=await db.query('SELECT id FROM public.accounts WHERE id=$1',[accountB]);expect(result.rows).toHaveLength(0);});
 it.each([['account_id',accountB],['card_id',cardB],['category_id',categoryB]] as const)('rejects a new transaction linked to another owner via %s',async(column,foreign)=>{
  await denied(`INSERT INTO public.transactions(user_id,${column},description,amount,direction) VALUES ($1,$2,'Invalid link',10,'out')`,[A,foreign]);
 });
 it.each([['account_id',accountB],['card_id',cardB],['category_id',categoryB]] as const)('rejects reassignment of an existing transaction via %s',async(column,foreign)=>{await denied(`UPDATE public.transactions SET ${column}=$1 WHERE id=$2`,[foreign,txA]);});
 it('rejects a business category on a personal transaction',async()=>{await denied("INSERT INTO public.transactions(user_id,category_id,description,amount,direction) VALUES ($1,$2,'Wrong scope',10,'out')",[A,categoryBusiness]);});
 it('cannot mark a manual transaction as imported',async()=>{await expect(db.query("UPDATE public.transactions SET source='open_finance' WHERE id=$1",[txA])).rejects.toThrow();});
 it('cannot create an imported account',async()=>{await denied("INSERT INTO public.accounts(user_id,name,source) VALUES ($1,'Forged import','open_finance')",[A]);});
 it('cannot change the balance of an imported account',async()=>{const r=await db.query('UPDATE public.accounts SET balance=99 WHERE id=$1 RETURNING id',[imported]);expect(r.rows).toHaveLength(0);});
 it('rejects reassignment of an invoice to another owner\'s card',async()=>{await denied('UPDATE public.card_invoices SET card_id=$1 WHERE id=$2',[cardB,invoiceA]);});
 it('rejects a goal linked to another owner\'s business',async()=>{await denied("UPDATE public.goals SET scope='business',business_id=$1 WHERE id=$2",[businessB,goalA]);});
 it('keeps personal goals separate from business links',async()=>{await denied('UPDATE public.goals SET business_id=$1 WHERE id=$2',[businessA,goalA]);});
 it('rejects contributions to another owner\'s goal',async()=>{await denied('INSERT INTO public.goal_contributions(user_id,goal_id,amount) VALUES ($1,$2,50)',[A,goalB]);});
 it('recalculates goal progress on contribution insert and delete',async()=>{
  const saved=await db.query<{id:string}>('INSERT INTO public.goal_contributions(user_id,goal_id,amount) VALUES ($1,$2,50) RETURNING id',[A,goalA]);
  const first=saved.rows[0];if(!first)throw new Error('Contribution missing');
  expect((await db.query<{current_amount:string}>('SELECT current_amount FROM public.goals WHERE id=$1',[goalA])).rows).toEqual([{current_amount:'50.00'}]);
  await db.query('DELETE FROM public.goal_contributions WHERE id=$1',[first.id]);
  expect((await db.query<{current_amount:string}>('SELECT current_amount FROM public.goals WHERE id=$1',[goalA])).rows).toEqual([{current_amount:'0.00'}]);
 });
 it('rejects forged goal progress through a direct update',async()=>{await expect(db.query('UPDATE public.goals SET current_amount=900 WHERE id=$1',[goalA])).rejects.toThrow('O valor acumulado muda apenas por contribuições');});
 it('rejects a personal category on a business entry',async()=>{await denied("INSERT INTO public.business_entries(user_id,business_id,category_id,kind,amount,description) VALUES ($1,$2,$3,'expense',10,'Wrong scope')",[A,businessA,categoryA]);});
});

describe('Private analysis relationships use the same ownership checks',()=>{
 it('rejects moving a conversation to another owner\'s business',async()=>{await denied('UPDATE public.ai_conversations SET business_id=$1 WHERE id=$2',[businessB,conversationA]);});
 it('rejects a diagnostic linked to another owner\'s conversation',async()=>{await denied("INSERT INTO public.diagnostics(user_id,conversation_id,kind,title) VALUES ($1,$2,'position','Invalid link')",[A,conversationB]);});
 it('rejects a plan linked to another owner\'s diagnostic',async()=>{await denied("INSERT INTO public.action_plans(user_id,diagnostic_id,title) VALUES ($1,$2,'Invalid link')",[A,diagnosticB]);});
 it('rejects moving a step to another owner\'s action plan',async()=>{await denied('UPDATE public.action_plan_steps SET plan_id=$1 WHERE id=$2',[planB,stepA]);});
});
