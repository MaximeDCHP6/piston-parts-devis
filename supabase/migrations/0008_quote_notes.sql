-- Notes internes admin sur un devis (ex. "relancé le 12/03, en attente
-- validation client"). Jamais accessibles au revendeur ni au client final.
create table public.quote_notes (
  quote_id uuid primary key references public.quotes (id) on delete cascade,
  note text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.quote_notes enable row level security;
create policy "quote_notes_admin_only" on public.quote_notes
  for all using (public.is_admin()) with check (public.is_admin());
