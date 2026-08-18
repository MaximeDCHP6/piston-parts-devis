-- Schéma initial : plateforme de devis en marque blanche pour revendeurs
-- À coller dans Supabase Studio > SQL Editor, ou à exécuter via `supabase db push`.

-- ============================================================
-- Tables
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'revendeur' check (role in ('admin', 'revendeur')),
  full_name text,
  created_at timestamptz not null default now()
);

create table public.resellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null,
  company_name text not null,
  logo_url text,
  primary_color text default '#1a1a1a',
  secondary_color text default '#6b6b6b',
  legal_mentions text,
  signature_text text,
  margin_percent numeric not null default 0,
  contact_email text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text not null,
  description text,
  purchase_price numeric,
  category text,
  created_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.resellers (id) on delete cascade,
  type text not null check (type in ('to_reseller', 'to_client')),
  parent_quote_id uuid references public.quotes (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'accepted', 'refused', 'expired')),
  client_name text,
  client_email text,
  valid_until date,
  secure_token text unique,
  pdf_url text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz
);

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  discount_percent numeric not null default 0,
  vat_rate numeric not null default 20,
  line_order int not null default 0
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references public.quotes (id) on delete cascade,
  reseller_id uuid not null references public.resellers (id) on delete cascade,
  status text not null default 'preparation' check (status in ('preparation', 'expediee', 'livree', 'facturee')),
  created_at timestamptz not null default now()
);

create table public.reseller_files (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.resellers (id) on delete cascade,
  type text not null default 'other' check (type in ('invoice', 'other')),
  file_url text not null,
  label text,
  uploaded_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Index
-- ============================================================

create index quotes_reseller_id_idx on public.quotes (reseller_id);
create index quotes_parent_quote_id_idx on public.quotes (parent_quote_id);
create index quotes_secure_token_idx on public.quotes (secure_token);
create index quote_lines_quote_id_idx on public.quote_lines (quote_id);
create index orders_reseller_id_idx on public.orders (reseller_id);
create index reseller_files_reseller_id_idx on public.reseller_files (reseller_id);

-- ============================================================
-- Création automatique du profil à l'inscription
-- Rôle par défaut 'revendeur' : le tout premier compte admin doit être
-- promu manuellement (voir instructions de déploiement).
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Fonctions utilitaires pour les policies RLS
-- ============================================================

create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create function public.current_reseller_id()
returns uuid
language sql
security definer set search_path = public
stable
as $$
  select id from public.resellers where user_id = auth.uid();
$$;

-- ============================================================
-- RLS
-- Note : la page publique /devis/[token] pour le client final ne passe
-- jamais par ces policies. Elle utilise la clé service_role côté serveur
-- (Next.js) pour lire un seul devis via son token, donc aucune policy
-- "anon" n'est nécessaire ni souhaitable ici.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.resellers enable row level security;
alter table public.products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;
alter table public.orders enable row level security;
alter table public.reseller_files enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- resellers
create policy "resellers_self_select" on public.resellers
  for select using (user_id = auth.uid() or public.is_admin());
create policy "resellers_admin_write" on public.resellers
  for insert with check (public.is_admin());
create policy "resellers_admin_update" on public.resellers
  for update using (public.is_admin()) with check (public.is_admin());
create policy "resellers_admin_delete" on public.resellers
  for delete using (public.is_admin());

-- products : accès admin uniquement (le revendeur n'a jamais besoin du
-- catalogue ni du prix d'achat, les lignes de devis sont autosuffisantes)
create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- quotes : lecture seule pour le revendeur sur ses propres devis
-- (les deux types, à lui et à son client), écriture réservée à l'admin
-- et aux routes serveur (service role) pour le flux public.
create policy "quotes_reseller_select" on public.quotes
  for select using (reseller_id = public.current_reseller_id() or public.is_admin());
create policy "quotes_admin_write" on public.quotes
  for insert with check (public.is_admin());
create policy "quotes_admin_update" on public.quotes
  for update using (public.is_admin()) with check (public.is_admin());
create policy "quotes_admin_delete" on public.quotes
  for delete using (public.is_admin());

-- quote_lines
create policy "quote_lines_reseller_select" on public.quote_lines
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.quotes q
      where q.id = quote_lines.quote_id
        and q.reseller_id = public.current_reseller_id()
    )
  );
create policy "quote_lines_admin_write" on public.quote_lines
  for all using (public.is_admin()) with check (public.is_admin());

-- orders
create policy "orders_reseller_select" on public.orders
  for select using (reseller_id = public.current_reseller_id() or public.is_admin());
create policy "orders_admin_write" on public.orders
  for insert with check (public.is_admin());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- reseller_files
create policy "reseller_files_reseller_select" on public.reseller_files
  for select using (reseller_id = public.current_reseller_id() or public.is_admin());
create policy "reseller_files_admin_write" on public.reseller_files
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_logs : admin uniquement
create policy "audit_logs_admin_all" on public.audit_logs
  for all using (public.is_admin()) with check (public.is_admin());
