-- Recentrage : l'application ne construit plus le devis "fournisseur →
-- revendeur" (déjà géré dans l'ERP de l'entreprise). Un seul devis est
-- créé directement pour le client final, avec un coût par ligne saisi en
-- interne (jamais exposé au revendeur) servant à calculer automatiquement
-- le prix client via la marge du revendeur.

alter table public.quotes add column order_number text;

-- Coût par ligne, strictement réservé à l'admin. Table séparée (plutôt
-- qu'une colonne sur quote_lines) pour que le revendeur ne puisse
-- techniquement pas y accéder, même en cas d'erreur d'affichage côté UI :
-- aucune policy n'est créée pour lui, donc accès refusé par défaut.
create table public.quote_line_costs (
  quote_line_id uuid primary key references public.quote_lines (id) on delete cascade,
  cost_price numeric not null
);
alter table public.quote_line_costs enable row level security;
create policy "quote_line_costs_admin_only" on public.quote_line_costs
  for all using (public.is_admin()) with check (public.is_admin());

-- Carnet d'adresses client par revendeur : beaucoup de destinataires
-- possibles pour un même revendeur, réutilisables d'un devis à l'autre.
create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.resellers (id) on delete cascade,
  name text not null,
  email text,
  address text,
  created_at timestamptz not null default now()
);
alter table public.client_contacts enable row level security;
create policy "client_contacts_admin_all" on public.client_contacts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "client_contacts_reseller_select" on public.client_contacts
  for select using (reseller_id = public.current_reseller_id());

-- Pièce jointe ERP liée à un devis précis (ex. le vrai devis/facture
-- fournisseur émis depuis l'ERP de l'entreprise) : visible du revendeur
-- sur ce devis, jamais exposée sur la page publique /devis/[token].
alter table public.reseller_files add column quote_id uuid references public.quotes (id) on delete cascade;
