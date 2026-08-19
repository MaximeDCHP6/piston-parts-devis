-- Coordonnées légales du revendeur (affichées sur le devis en marque
-- blanche) et numéro de devis saisi manuellement par l'admin (au lieu
-- d'une référence auto-générée, pour suivre la numérotation interne de
-- l'entreprise).

alter table public.resellers add column phone text;
alter table public.resellers add column siret text;
alter table public.resellers add column vat_intra text;

alter table public.quotes add column quote_number text;
