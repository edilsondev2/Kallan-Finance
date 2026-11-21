
create type public.app_role as enum ('admin','moderator','user');
create type public.main_goal as enum ('organize','understand_spending','investments','business','all');
create type public.data_source as enum ('manual','open_finance');
create type public.account_type as enum ('checking','savings','wallet','other');
create type public.tx_direction as enum ('in','out');
create type public.tx_type as enum ('income','expense','payment','card_purchase','transfer','other');
create type public.connection_status as enum ('preparing','awaiting_authorization','connecting','syncing','verifying','completed','failed','consent_expired','revoked');
create type public.category_kind as enum ('expense','income');
create type public.category_scope as enum ('personal','business');
create type public.goal_scope as enum ('personal','business');
create type public.goal_status as enum ('active','completed','archived');
create type public.entry_kind as enum ('revenue','expense');
create type public.recurrence as enum ('none','weekly','monthly','yearly');
create type public.post_kind as enum ('general','business','question','experience','news');
create type public.report_status as enum ('open','reviewing','resolved','dismissed');
create type public.event_kind as enum ('event','course','fair','partnership','opportunity');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  avatar_url text,
  bio text check (char_length(bio) <= 400),
  city text check (char_length(city) <= 80),
  segment text check (char_length(segment) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles visible to signed-in users" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.user_settings (
  user_id uuid primary key,
  main_goal public.main_goal,
  onboarding_completed boolean not null default false,
  hide_values boolean not null default false,
  show_demo boolean not null default true,
  notify_insights boolean not null default true,
  notify_community boolean not null default true,
  plan text not null default 'free' check (plan in ('free','premium')),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.user_settings to authenticated;
grant all on public.user_settings to service_role;
alter table public.user_settings enable row level security;
create policy "Own settings select" on public.user_settings for select to authenticated using (user_id = auth.uid());
create policy "Own settings insert" on public.user_settings for insert to authenticated with check (user_id = auth.uid() and plan = 'free');
create policy "Own settings update" on public.user_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger user_settings_updated before update on public.user_settings for each row execute function public.set_updated_at();

create or replace function public.protect_plan()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and new.plan is distinct from old.plan then
    raise exception 'O plano só pode ser alterado pelo sistema';
  end if;
  return new;
end; $$;
create trigger user_settings_protect_plan before update on public.user_settings for each row execute function public.protect_plan();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_moderator(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('moderator','admin'))
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1), ''), 80));
  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_user_idx on public.audit_logs(user_id, created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Users read own audit" on public.audit_logs for select to authenticated using (user_id = auth.uid());
create policy "Admins read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rec jsonb;
  owner uuid;
begin
  rec := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  owner := coalesce((rec->>'user_id')::uuid, (rec->>'owner_id')::uuid, auth.uid());
  insert into public.audit_logs (user_id, action, entity, entity_id, metadata)
  values (owner, lower(tg_op), tg_table_name, (rec->>'id')::uuid,
          jsonb_build_object('actor', auth.uid(), 'source', rec->>'source'));
  return null;
end; $$;

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_institution_id text not null,
  name text not null,
  logo_url text,
  products text[] not null default '{}',
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (provider, provider_institution_id)
);
grant select on public.institutions to authenticated;
grant all on public.institutions to service_role;
alter table public.institutions enable row level security;
create policy "Institutions readable" on public.institutions for select to authenticated using (true);

create table public.of_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null,
  institution_id uuid references public.institutions(id) on delete set null,
  institution_name text not null,
  provider_item_id text,
  status public.connection_status not null default 'preparing',
  status_detail text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_item_id)
);
create index of_connections_user_idx on public.of_connections(user_id);
grant select on public.of_connections to authenticated;
grant all on public.of_connections to service_role;
alter table public.of_connections enable row level security;
create policy "Own connections" on public.of_connections for select to authenticated using (user_id = auth.uid());
create trigger of_connections_updated before update on public.of_connections for each row execute function public.set_updated_at();
create trigger of_connections_audit after insert or update or delete on public.of_connections for each row execute function public.audit_row();

create table public.of_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  connection_id uuid not null references public.of_connections(id) on delete cascade,
  provider_consent_id text,
  permissions text[] not null default '{}',
  purpose text,
  granted_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index of_consents_user_idx on public.of_consents(user_id);
grant select on public.of_consents to authenticated;
grant all on public.of_consents to service_role;
alter table public.of_consents enable row level security;
create policy "Own consents" on public.of_consents for select to authenticated using (user_id = auth.uid());
create trigger of_consents_audit after insert or update or delete on public.of_consents for each row execute function public.audit_row();

create or replace function public.protect_synced_rows()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.source is distinct from old.source or new.external_id is distinct from old.external_id then
    raise exception 'A origem do registro não pode ser alterada';
  end if;
  if old.source = 'open_finance' then
    if (to_jsonb(new) - array['category_id','notes','updated_at']) is distinct from (to_jsonb(old) - array['category_id','notes','updated_at']) then
      raise exception 'Dados recebidos de instituições não podem ser editados';
    end if;
  end if;
  return new;
end; $$;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  connection_id uuid references public.of_connections(id) on delete set null,
  source public.data_source not null default 'manual',
  external_id text,
  type public.account_type not null default 'checking',
  name text not null check (char_length(name) between 1 and 80),
  institution_name text check (char_length(institution_name) <= 80),
  balance numeric(14,2) not null default 0,
  currency text not null default 'BRL',
  balance_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
create index accounts_user_idx on public.accounts(user_id);
grant select, insert, update, delete on public.accounts to authenticated;
grant all on public.accounts to service_role;
alter table public.accounts enable row level security;
create policy "Own accounts select" on public.accounts for select to authenticated using (user_id = auth.uid());
create policy "Own accounts insert" on public.accounts for insert to authenticated with check (user_id = auth.uid() and source = 'manual');
create policy "Own accounts update" on public.accounts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own accounts delete" on public.accounts for delete to authenticated using (user_id = auth.uid() and source = 'manual');
create trigger accounts_updated before update on public.accounts for each row execute function public.set_updated_at();
create trigger accounts_protect before update on public.accounts for each row execute function public.protect_synced_rows();

create table public.balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid not null references public.accounts(id) on delete cascade,
  balance numeric(14,2) not null,
  captured_at timestamptz not null default now()
);
create index balance_snapshots_user_idx on public.balance_snapshots(user_id, captured_at desc);
grant select on public.balance_snapshots to authenticated;
grant all on public.balance_snapshots to service_role;
alter table public.balance_snapshots enable row level security;
create policy "Own snapshots" on public.balance_snapshots for select to authenticated using (user_id = auth.uid());

create or replace function public.snapshot_balance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.balance is distinct from old.balance then
    insert into public.balance_snapshots (user_id, account_id, balance) values (new.user_id, new.id, new.balance);
  end if;
  return null;
end; $$;
create trigger accounts_snapshot after insert or update on public.accounts for each row execute function public.snapshot_balance();

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  connection_id uuid references public.of_connections(id) on delete set null,
  source public.data_source not null default 'manual',
  external_id text,
  name text not null check (char_length(name) between 1 and 80),
  institution_name text,
  brand text,
  last_four text check (last_four ~ '^[0-9]{4}$'),
  credit_limit numeric(14,2),
  available_limit numeric(14,2),
  closing_day int check (closing_day between 1 and 31),
  due_day int check (due_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
grant select, insert, update, delete on public.credit_cards to authenticated;
grant all on public.credit_cards to service_role;
alter table public.credit_cards enable row level security;
create policy "Own cards select" on public.credit_cards for select to authenticated using (user_id = auth.uid());
create policy "Own cards insert" on public.credit_cards for insert to authenticated with check (user_id = auth.uid() and source = 'manual');
create policy "Own cards update" on public.credit_cards for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own cards delete" on public.credit_cards for delete to authenticated using (user_id = auth.uid() and source = 'manual');
create trigger credit_cards_updated before update on public.credit_cards for each row execute function public.set_updated_at();
create trigger credit_cards_protect before update on public.credit_cards for each row execute function public.protect_synced_rows();

create table public.card_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id uuid not null references public.credit_cards(id) on delete cascade,
  source public.data_source not null default 'manual',
  external_id text,
  reference_month date not null,
  due_date date,
  amount numeric(14,2) not null default 0,
  status text not null default 'open' check (status in ('open','closed','paid','overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
grant select, insert, update, delete on public.card_invoices to authenticated;
grant all on public.card_invoices to service_role;
alter table public.card_invoices enable row level security;
create policy "Own invoices select" on public.card_invoices for select to authenticated using (user_id = auth.uid());
create policy "Own invoices insert" on public.card_invoices for insert to authenticated with check (user_id = auth.uid() and source = 'manual' and exists (select 1 from public.credit_cards c where c.id = card_id and c.user_id = auth.uid()));
create policy "Own invoices update" on public.card_invoices for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own invoices delete" on public.card_invoices for delete to authenticated using (user_id = auth.uid() and source = 'manual');
create trigger card_invoices_updated before update on public.card_invoices for each row execute function public.set_updated_at();
create trigger card_invoices_protect before update on public.card_invoices for each row execute function public.protect_synced_rows();

create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  connection_id uuid references public.of_connections(id) on delete set null,
  source public.data_source not null default 'manual',
  external_id text,
  name text not null check (char_length(name) between 1 and 80),
  kind text not null default 'outro',
  institution_name text,
  amount numeric(14,2) not null default 0,
  invested_amount numeric(14,2),
  position_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
grant select, insert, update, delete on public.investments to authenticated;
grant all on public.investments to service_role;
alter table public.investments enable row level security;
create policy "Own investments select" on public.investments for select to authenticated using (user_id = auth.uid());
create policy "Own investments insert" on public.investments for insert to authenticated with check (user_id = auth.uid() and source = 'manual');
create policy "Own investments update" on public.investments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own investments delete" on public.investments for delete to authenticated using (user_id = auth.uid() and source = 'manual');
create trigger investments_updated before update on public.investments for each row execute function public.set_updated_at();
create trigger investments_protect before update on public.investments for each row execute function public.protect_synced_rows();

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  category text check (char_length(category) <= 60),
  business_type text check (char_length(business_type) <= 60),
  description text check (char_length(description) <= 600),
  image_url text,
  region text check (char_length(region) <= 80),
  contact_email text check (char_length(contact_email) <= 120),
  contact_phone text check (char_length(contact_phone) <= 30),
  instagram text check (char_length(instagram) <= 60),
  website text check (char_length(website) <= 200),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index businesses_owner_idx on public.businesses(owner_id);
grant select, insert, update, delete on public.businesses to authenticated;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;
create policy "Businesses visible" on public.businesses for select to authenticated using (owner_id = auth.uid() or is_public);
create policy "Own business insert" on public.businesses for insert to authenticated with check (owner_id = auth.uid());
create policy "Own business update" on public.businesses for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Own business delete" on public.businesses for delete to authenticated using (owner_id = auth.uid());
create trigger businesses_updated before update on public.businesses for each row execute function public.set_updated_at();
create trigger businesses_audit after insert or update or delete on public.businesses for each row execute function public.audit_row();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default 'circle',
  color text not null default 'emerald',
  kind public.category_kind not null default 'expense',
  scope public.category_scope not null default 'personal',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categories visible" on public.categories for select to authenticated using (user_id is null or user_id = auth.uid());
create policy "Own categories insert" on public.categories for insert to authenticated with check (user_id = auth.uid() and (business_id is null or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())));
create policy "Own categories update" on public.categories for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own categories delete" on public.categories for delete to authenticated using (user_id = auth.uid());

insert into public.categories (user_id, name, icon, color, kind, scope) values
 (null,'Alimentação','utensils','amber','expense','personal'),
 (null,'Moradia','home','sky','expense','personal'),
 (null,'Transporte','car','violet','expense','personal'),
 (null,'Compras','shopping-bag','pink','expense','personal'),
 (null,'Educação','graduation-cap','indigo','expense','personal'),
 (null,'Saúde','heart-pulse','rose','expense','personal'),
 (null,'Lazer','party-popper','orange','expense','personal'),
 (null,'Serviços','wrench','teal','expense','personal'),
 (null,'Assinaturas','repeat','cyan','expense','personal'),
 (null,'Outros gastos','circle','slate','expense','personal'),
 (null,'Salário','briefcase','emerald','income','personal'),
 (null,'Freelance','laptop','lime','income','personal'),
 (null,'Rendimentos','trending-up','green','income','personal'),
 (null,'Outros recebimentos','plus-circle','slate','income','personal'),
 (null,'Vendas','shopping-cart','emerald','income','business'),
 (null,'Serviços prestados','handshake','lime','income','business'),
 (null,'Fornecedores','package','amber','expense','business'),
 (null,'Marketing','megaphone','pink','expense','business'),
 (null,'Aluguel do negócio','store','sky','expense','business'),
 (null,'Impostos e taxas','receipt','rose','expense','business'),
 (null,'Equipamentos','monitor','violet','expense','business'),
 (null,'Pessoal','users','teal','expense','business'),
 (null,'Outras despesas','circle','slate','expense','business');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  account_id uuid references public.accounts(id) on delete set null,
  card_id uuid references public.credit_cards(id) on delete set null,
  source public.data_source not null default 'manual',
  external_id text,
  occurred_on date not null default current_date,
  description text not null check (char_length(description) between 1 and 140),
  amount numeric(14,2) not null check (amount > 0),
  direction public.tx_direction not null,
  type public.tx_type not null default 'expense',
  category_id uuid references public.categories(id) on delete set null,
  institution_name text,
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
create index transactions_user_date_idx on public.transactions(user_id, occurred_on desc);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "Own tx select" on public.transactions for select to authenticated using (user_id = auth.uid());
create policy "Own tx insert" on public.transactions for insert to authenticated with check (user_id = auth.uid() and source = 'manual');
create policy "Own tx update" on public.transactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own tx delete" on public.transactions for delete to authenticated using (user_id = auth.uid() and source = 'manual');
create trigger transactions_updated before update on public.transactions for each row execute function public.set_updated_at();
create trigger transactions_protect before update on public.transactions for each row execute function public.protect_synced_rows();
create trigger transactions_audit after insert or update or delete on public.transactions for each row execute function public.audit_row();

create table public.business_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  kind public.entry_kind not null,
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null default current_date,
  description text not null check (char_length(description) between 1 and 140),
  category_id uuid references public.categories(id) on delete set null,
  recurrence public.recurrence not null default 'none',
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index business_entries_idx on public.business_entries(business_id, occurred_on desc);
grant select, insert, update, delete on public.business_entries to authenticated;
grant all on public.business_entries to service_role;
alter table public.business_entries enable row level security;
create policy "Own entries select" on public.business_entries for select to authenticated using (user_id = auth.uid());
create policy "Own entries insert" on public.business_entries for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));
create policy "Own entries update" on public.business_entries for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()));
create policy "Own entries delete" on public.business_entries for delete to authenticated using (user_id = auth.uid());
create trigger business_entries_updated before update on public.business_entries for each row execute function public.set_updated_at();

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  business_id uuid references public.businesses(id) on delete cascade,
  scope public.goal_scope not null default 'personal',
  title text not null check (char_length(title) between 1 and 80),
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0,
  deadline date,
  status public.goal_status not null default 'active',
  icon text not null default 'target',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index goals_user_idx on public.goals(user_id);
grant select, insert, update, delete on public.goals to authenticated;
grant all on public.goals to service_role;
alter table public.goals enable row level security;
create policy "Own goals select" on public.goals for select to authenticated using (user_id = auth.uid());
create policy "Own goals insert" on public.goals for insert to authenticated with check (user_id = auth.uid() and current_amount = 0 and (business_id is null or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())));
create policy "Own goals update" on public.goals for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own goals delete" on public.goals for delete to authenticated using (user_id = auth.uid());
create trigger goals_updated before update on public.goals for each row execute function public.set_updated_at();
create trigger goals_audit after insert or update or delete on public.goals for each row execute function public.audit_row();

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null,
  amount numeric(14,2) not null check (amount <> 0),
  note text check (char_length(note) <= 140),
  contributed_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index goal_contributions_goal_idx on public.goal_contributions(goal_id);
grant select, insert, delete on public.goal_contributions to authenticated;
grant all on public.goal_contributions to service_role;
alter table public.goal_contributions enable row level security;
create policy "Own contributions select" on public.goal_contributions for select to authenticated using (user_id = auth.uid());
create policy "Own contributions insert" on public.goal_contributions for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy "Own contributions delete" on public.goal_contributions for delete to authenticated using (user_id = auth.uid());

create or replace function public.recalc_goal_amount()
returns trigger language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  gid := coalesce(new.goal_id, old.goal_id);
  update public.goals set current_amount = coalesce((select sum(amount) from public.goal_contributions where goal_id = gid), 0) where id = gid;
  return null;
end; $$;
create trigger goal_contributions_recalc after insert or delete on public.goal_contributions for each row execute function public.recalc_goal_amount();

create or replace function public.protect_goal_amount()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and new.current_amount is distinct from old.current_amount
     and pg_trigger_depth() <= 1 then
    raise exception 'O valor acumulado muda apenas por contribuições';
  end if;
  return new;
end; $$;
create trigger goals_protect_amount before update on public.goals for each row execute function public.protect_goal_amount();

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
grant select, insert, delete on public.blocks to authenticated;
grant all on public.blocks to service_role;
alter table public.blocks enable row level security;
create policy "Own blocks select" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "Own blocks insert" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "Own blocks delete" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

create or replace function public.is_blocked_between(_a uuid, _b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where (blocker_id = _a and blocked_id = _b) or (blocker_id = _b and blocked_id = _a))
$$;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind public.post_kind not null default 'general',
  content text not null check (char_length(content) between 1 and 2000),
  image_url text,
  business_id uuid references public.businesses(id) on delete set null,
  shared_post_id uuid references public.posts(id) on delete set null,
  likes_count int not null default 0,
  comments_count int not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_created_idx on public.posts(created_at desc);
create index posts_author_idx on public.posts(author_id);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "Posts visible" on public.posts for select to authenticated
  using ((not is_hidden or author_id = auth.uid() or public.is_moderator(auth.uid())) and not public.is_blocked_between(auth.uid(), author_id));
create policy "Own posts insert" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and is_hidden = false and likes_count = 0 and comments_count = 0
    and (business_id is null or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())));
create policy "Own posts update" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Moderators update posts" on public.posts for update to authenticated using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));
create policy "Posts delete" on public.posts for delete to authenticated using (author_id = auth.uid() or public.is_moderator(auth.uid()));
create trigger posts_updated before update on public.posts for each row execute function public.set_updated_at();

create or replace function public.protect_post_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null or pg_trigger_depth() > 1 then return new; end if;
  if new.likes_count is distinct from old.likes_count or new.comments_count is distinct from old.comments_count then
    raise exception 'Contadores são calculados pelo sistema';
  end if;
  if new.is_hidden is distinct from old.is_hidden and not public.is_moderator(auth.uid()) then
    raise exception 'Apenas a moderação pode alterar a visibilidade';
  end if;
  if new.author_id = auth.uid() then
    return new;
  end if;
  if (to_jsonb(new) - array['is_hidden','updated_at']) is distinct from (to_jsonb(old) - array['is_hidden','updated_at']) then
    raise exception 'A moderação só pode ocultar ou exibir publicações';
  end if;
  return new;
end; $$;
create trigger posts_protect before update on public.posts for each row execute function public.protect_post_fields();

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index post_comments_post_idx on public.post_comments(post_id, created_at);
grant select, insert, update, delete on public.post_comments to authenticated;
grant all on public.post_comments to service_role;
alter table public.post_comments enable row level security;
create policy "Comments visible" on public.post_comments for select to authenticated
  using ((not is_hidden or author_id = auth.uid() or public.is_moderator(auth.uid()))
    and not public.is_blocked_between(auth.uid(), author_id)
    and exists (select 1 from public.posts p where p.id = post_id));
create policy "Own comments insert" on public.post_comments for insert to authenticated
  with check (author_id = auth.uid() and is_hidden = false
    and exists (select 1 from public.posts p where p.id = post_id and not public.is_blocked_between(auth.uid(), p.author_id)));
create policy "Moderators update comments" on public.post_comments for update to authenticated using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));
create policy "Comments delete" on public.post_comments for delete to authenticated
  using (author_id = auth.uid() or public.is_moderator(auth.uid()) or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create table public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'like' check (kind in ('like')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
grant select, insert, delete on public.post_reactions to authenticated;
grant all on public.post_reactions to service_role;
alter table public.post_reactions enable row level security;
create policy "Reactions visible" on public.post_reactions for select to authenticated using (true);
create policy "Own reactions insert" on public.post_reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = post_id));
create policy "Own reactions delete" on public.post_reactions for delete to authenticated using (user_id = auth.uid());

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
grant select, insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "Follows visible" on public.follows for select to authenticated using (true);
create policy "Own follows insert" on public.follows for insert to authenticated with check (follower_id = auth.uid() and not public.is_blocked_between(follower_id, following_id));
create policy "Own follows delete" on public.follows for delete to authenticated using (follower_id = auth.uid());

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  target_type text not null check (target_type in ('post','comment','profile','business','event')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 60),
  details text check (char_length(details) <= 500),
  status public.report_status not null default 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "Own reports insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');
create policy "Reports visible" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_moderator(auth.uid()));
create policy "Moderators update reports" on public.reports for update to authenticated using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));

create table public.events (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind public.event_kind not null default 'event',
  title text not null check (char_length(title) between 1 and 100),
  description text check (char_length(description) <= 1000),
  starts_at timestamptz,
  location text check (char_length(location) <= 120),
  is_online boolean not null default false,
  link text check (char_length(link) <= 300),
  image_url text,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "Events visible" on public.events for select to authenticated
  using ((not is_hidden or author_id = auth.uid() or public.is_moderator(auth.uid())) and not public.is_blocked_between(auth.uid(), author_id));
create policy "Own events insert" on public.events for insert to authenticated with check (author_id = auth.uid() and is_hidden = false);
create policy "Own events update" on public.events for update to authenticated using (author_id = auth.uid() or public.is_moderator(auth.uid())) with check (author_id = auth.uid() or public.is_moderator(auth.uid()));
create policy "Events delete" on public.events for delete to authenticated using (author_id = auth.uid() or public.is_moderator(auth.uid()));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Own notifications select" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own notifications delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

create or replace function public.notify_community()
returns trigger language plpgsql security definer set search_path = public as $$
declare target uuid; actor uuid; actor_name text; t text; l text;
begin
  if tg_table_name = 'post_reactions' then
    select author_id into target from public.posts where id = new.post_id;
    actor := new.user_id; t := 'curtiu sua publicação'; l := '/comunidade';
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_table_name = 'post_comments' then
    select author_id into target from public.posts where id = new.post_id;
    actor := new.author_id; t := 'comentou na sua publicação'; l := '/comunidade';
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_table_name = 'follows' then
    target := new.following_id; actor := new.follower_id; t := 'começou a seguir você'; l := '/comunidade/perfil/' || new.follower_id;
  end if;
  if target is not null and target <> actor
     and coalesce((select notify_community from public.user_settings where user_id = target), true) then
    select display_name into actor_name from public.profiles where id = actor;
    insert into public.notifications (user_id, kind, title, link)
    values (target, tg_table_name, coalesce(nullif(actor_name,''),'Alguém') || ' ' || t, l);
  end if;
  return null;
end; $$;
create trigger post_reactions_notify after insert on public.post_reactions for each row execute function public.notify_community();
create trigger post_comments_notify after insert on public.post_comments for each row execute function public.notify_community();
create trigger follows_notify after insert on public.follows for each row execute function public.notify_community();

create or replace function public.decrement_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'post_reactions' then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  else
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end; $$;
create trigger post_reactions_dec after delete on public.post_reactions for each row execute function public.decrement_counts();
create trigger post_comments_dec after delete on public.post_comments for each row execute function public.decrement_counts();

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  agent text not null default 'financeiro' check (agent in ('financeiro','organizacao','dividas','planejamento','empreendedor')),
  business_id uuid references public.businesses(id) on delete set null,
  title text not null default 'Nova conversa' check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ai_conversations_user_idx on public.ai_conversations(user_id, updated_at desc);
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant all on public.ai_conversations to service_role;
alter table public.ai_conversations enable row level security;
create policy "Own conversations select" on public.ai_conversations for select to authenticated using (user_id = auth.uid());
create policy "Own conversations insert" on public.ai_conversations for insert to authenticated with check (user_id = auth.uid() and (business_id is null or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())));
create policy "Own conversations update" on public.ai_conversations for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own conversations delete" on public.ai_conversations for delete to authenticated using (user_id = auth.uid());
create trigger ai_conversations_updated before update on public.ai_conversations for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index ai_messages_conv_idx on public.ai_messages(conversation_id, created_at);
grant select, insert, delete on public.ai_messages to authenticated;
grant all on public.ai_messages to service_role;
alter table public.ai_messages enable row level security;
create policy "Own messages select" on public.ai_messages for select to authenticated using (user_id = auth.uid());
create policy "Own messages insert" on public.ai_messages for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "Own messages delete" on public.ai_messages for delete to authenticated using (user_id = auth.uid());

create table public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  kind text not null,
  title text not null,
  metrics jsonb not null default '{}'::jsonb,
  data_quality jsonb not null default '{}'::jsonb,
  explanation text,
  reference_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index diagnostics_user_idx on public.diagnostics(user_id, created_at desc);
grant select, insert, delete on public.diagnostics to authenticated;
grant all on public.diagnostics to service_role;
alter table public.diagnostics enable row level security;
create policy "Own diagnostics select" on public.diagnostics for select to authenticated using (user_id = auth.uid());
create policy "Own diagnostics insert" on public.diagnostics for insert to authenticated with check (user_id = auth.uid());
create policy "Own diagnostics delete" on public.diagnostics for delete to authenticated using (user_id = auth.uid());

create table public.action_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  diagnostic_id uuid references public.diagnostics(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.action_plans to authenticated;
grant all on public.action_plans to service_role;
alter table public.action_plans enable row level security;
create policy "Own plans select" on public.action_plans for select to authenticated using (user_id = auth.uid());
create policy "Own plans insert" on public.action_plans for insert to authenticated with check (user_id = auth.uid());
create policy "Own plans delete" on public.action_plans for delete to authenticated using (user_id = auth.uid());

create table public.action_plan_steps (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.action_plans(id) on delete cascade,
  user_id uuid not null,
  position int not null default 0,
  title text not null,
  description text,
  done boolean not null default false,
  done_at timestamptz
);
create index action_plan_steps_plan_idx on public.action_plan_steps(plan_id, position);
grant select, insert, update, delete on public.action_plan_steps to authenticated;
grant all on public.action_plan_steps to service_role;
alter table public.action_plan_steps enable row level security;
create policy "Own steps select" on public.action_plan_steps for select to authenticated using (user_id = auth.uid());
create policy "Own steps insert" on public.action_plan_steps for insert to authenticated with check (user_id = auth.uid() and exists (select 1 from public.action_plans p where p.id = plan_id and p.user_id = auth.uid()));
create policy "Own steps update" on public.action_plan_steps for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own steps delete" on public.action_plan_steps for delete to authenticated using (user_id = auth.uid());

create or replace function public.delete_my_data()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Não autenticado'; end if;
  delete from public.action_plan_steps where user_id = uid;
  delete from public.action_plans where user_id = uid;
  delete from public.diagnostics where user_id = uid;
  delete from public.ai_messages where user_id = uid;
  delete from public.ai_conversations where user_id = uid;
  delete from public.goal_contributions where user_id = uid;
  delete from public.goals where user_id = uid;
  delete from public.business_entries where user_id = uid;
  delete from public.transactions where user_id = uid;
  delete from public.card_invoices where user_id = uid;
  delete from public.credit_cards where user_id = uid;
  delete from public.investments where user_id = uid;
  delete from public.balance_snapshots where user_id = uid;
  delete from public.accounts where user_id = uid;
  delete from public.of_consents where user_id = uid;
  delete from public.of_connections where user_id = uid;
  delete from public.categories where user_id = uid;
  delete from public.notifications where user_id = uid;
  delete from public.reports where reporter_id = uid;
  delete from public.user_settings where user_id = uid;
end; $$;
revoke execute on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;

create policy "Signed-in users read media" on storage.objects for select to authenticated
  using (bucket_id = 'media');
create policy "Users upload own media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
