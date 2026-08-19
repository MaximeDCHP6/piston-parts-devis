-- Champs additionnels observés sur le modèle de devis/facture actuel de
-- l'entreprise : adresse de livraison du client final et immatriculation
-- du véhicule concerné (pièces auto).

alter table public.quotes add column client_address text;
alter table public.quotes add column vehicle_registration text;
