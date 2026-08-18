import type { OrderStatus, QuoteStatus } from "@/lib/types/database";

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  viewed: "Vu",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré",
};

export const QUOTE_STATUS_TONE: Record<QuoteStatus, "neutral" | "accent" | "success" | "danger" | "warning"> = {
  draft: "neutral",
  sent: "accent",
  viewed: "accent",
  accepted: "success",
  refused: "danger",
  expired: "warning",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  preparation: "En préparation",
  expediee: "Expédiée",
  livree: "Livrée",
  facturee: "Facturée",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, "neutral" | "accent" | "success" | "danger" | "warning"> = {
  preparation: "neutral",
  expediee: "accent",
  livree: "success",
  facturee: "success",
};
