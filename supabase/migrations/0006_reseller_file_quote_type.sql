-- Distinction facture / devis (ERP) pour les pièces jointes, au lieu de
-- tout regrouper sous "autre document".
alter table public.reseller_files drop constraint if exists reseller_files_type_check;
alter table public.reseller_files add constraint reseller_files_type_check
  check (type in ('invoice', 'quote', 'other'));
