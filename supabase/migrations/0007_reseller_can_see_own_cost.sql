-- Le revendeur doit pouvoir voir le prix que nous lui facturons (son propre
-- coût sur chaque devis), distinct du prix affiché au client final. Jusqu'ici
-- `quote_line_costs` n'avait aucune policy pour le rôle revendeur (accès
-- refusé par défaut) : on ajoute une lecture seule, limitée à ses propres
-- devis.
create policy "quote_line_costs_reseller_select" on public.quote_line_costs
  for select using (
    exists (
      select 1
      from public.quote_lines ql
      join public.quotes q on q.id = ql.quote_id
      where ql.id = quote_line_costs.quote_line_id
        and q.reseller_id = public.current_reseller_id()
    )
  );
