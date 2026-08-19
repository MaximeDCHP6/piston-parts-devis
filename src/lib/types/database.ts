// Types écrits à la main, alignés sur supabase/migrations/0001_init.sql.
// À remplacer par une génération automatique (`supabase gen types
// typescript`) une fois le projet Supabase distant en place.
//
// Important : utiliser `type` et non `interface` pour les lignes de table.
// Les `interface` ne satisfont pas le contrôle structurel
// `extends Record<string, unknown>` que fait le typage générique de
// @supabase/supabase-js, ce qui ferait silencieusement retomber toutes les
// requêtes sur le type `never`.

export type ProfileRole = "admin" | "revendeur";
export type QuoteType = "to_reseller" | "to_client";
export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "refused"
  | "expired";
export type OrderStatus = "preparation" | "expediee" | "livree" | "facturee";
export type ResellerFileType = "invoice" | "quote" | "other";

export type Profile = {
  id: string;
  role: ProfileRole;
  full_name: string | null;
  created_at: string;
};

export type Reseller = {
  id: string;
  user_id: string | null;
  company_name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  legal_mentions: string | null;
  signature_text: string | null;
  margin_percent: number;
  contact_email: string | null;
  phone: string | null;
  siret: string | null;
  vat_intra: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  purchase_price: number | null;
  category: string | null;
  created_at: string;
};

export type Quote = {
  id: string;
  reseller_id: string;
  type: QuoteType;
  parent_quote_id: string | null;
  status: QuoteStatus;
  client_name: string | null;
  client_email: string | null;
  client_address: string | null;
  vehicle_registration: string | null;
  order_number: string | null;
  quote_number: string | null;
  valid_until: string | null;
  secure_token: string | null;
  pdf_url: string | null;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
};

export type QuoteLine = {
  id: string;
  quote_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  vat_rate: number;
  line_order: number;
};

export type Order = {
  id: string;
  quote_id: string;
  reseller_id: string;
  status: OrderStatus;
  created_at: string;
};

export type ResellerFile = {
  id: string;
  reseller_id: string;
  quote_id: string | null;
  type: ResellerFileType;
  file_url: string;
  label: string | null;
  uploaded_at: string;
};

export type QuoteLineCost = {
  quote_line_id: string;
  cost_price: number;
};

export type ClientContact = {
  id: string;
  reseller_id: string;
  name: string;
  email: string | null;
  address: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type TableDef<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, Partial<Profile> & { id: string }>;
      resellers: TableDef<Reseller, Partial<Reseller> & { company_name: string }>;
      products: TableDef<Product, Partial<Product> & { name: string }>;
      quotes: TableDef<Quote, Partial<Quote> & { reseller_id: string; type: QuoteType }>;
      quote_lines: TableDef<QuoteLine, Partial<QuoteLine> & { quote_id: string; description: string }>;
      orders: TableDef<Order, Partial<Order> & { quote_id: string; reseller_id: string }>;
      reseller_files: TableDef<ResellerFile, Partial<ResellerFile> & { reseller_id: string; file_url: string }>;
      audit_logs: TableDef<AuditLog, Partial<AuditLog> & { action: string }>;
      quote_line_costs: TableDef<QuoteLineCost, QuoteLineCost>;
      client_contacts: TableDef<ClientContact, Partial<ClientContact> & { reseller_id: string; name: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
