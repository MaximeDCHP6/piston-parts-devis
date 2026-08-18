import { Document, Page, Text, View, StyleSheet, Image as PdfImage, Font } from "@react-pdf/renderer";
import { formatEUR, lineTotalHT, quoteTotals } from "@/lib/quote-calc";
import type { QuoteLine } from "@/lib/types/database";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1c1a17", fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  logo: { width: 120, maxHeight: 50, objectFit: "contain", marginBottom: 8 },
  issuerName: { fontSize: 13, fontWeight: 700 },
  legal: { fontSize: 8, color: "#726c62", marginTop: 4, maxWidth: 220 },
  titleBlock: { alignItems: "flex-end" },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 6 },
  metaLine: { fontSize: 9, color: "#726c62" },
  recipientBlock: { marginBottom: 24 },
  sectionLabel: { fontSize: 8, textTransform: "uppercase", color: "#726c62", marginBottom: 4, letterSpacing: 1 },
  recipientName: { fontSize: 11, fontWeight: 700 },
  table: { borderTopWidth: 1, borderTopColor: "#e6e1d8" },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e6e1d8", paddingVertical: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e6e1d8", paddingVertical: 6 },
  th: { fontSize: 8, textTransform: "uppercase", color: "#726c62", letterSpacing: 0.5 },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1, textAlign: "right" },
  colDiscount: { flex: 1, textAlign: "right" },
  colVat: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalLine: { flexDirection: "row", gap: 16, marginBottom: 2 },
  totalLabel: { fontSize: 9, color: "#726c62" },
  totalValue: { fontSize: 9, width: 80, textAlign: "right" },
  totalValueStrong: { fontSize: 12, width: 80, textAlign: "right", fontWeight: 700 },
  footer: { position: "absolute", bottom: 32, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#e6e1d8", paddingTop: 8 },
  footerText: { fontSize: 8, color: "#726c62" },
});

export interface QuotePdfIssuer {
  name: string;
  logoUrl?: string | null;
  legalMentions?: string | null;
  signatureText?: string | null;
}

export function QuotePdf({
  documentTitle = "Devis",
  issuer,
  recipient,
  quoteRef,
  createdAt,
  validUntil,
  lines,
}: {
  documentTitle?: string;
  issuer: QuotePdfIssuer;
  recipient: { name?: string | null; email?: string | null };
  quoteRef: string;
  createdAt: string;
  validUntil?: string | null;
  lines: QuoteLine[];
}) {
  const totals = quoteTotals(lines);

  return (
    <Document title={`${documentTitle} ${quoteRef}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {issuer.logoUrl ? <PdfImage src={issuer.logoUrl} style={styles.logo} /> : null}
            <Text style={styles.issuerName}>{issuer.name}</Text>
            {issuer.legalMentions ? <Text style={styles.legal}>{issuer.legalMentions}</Text> : null}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{documentTitle.toUpperCase()}</Text>
            <Text style={styles.metaLine}>Référence {quoteRef}</Text>
            <Text style={styles.metaLine}>Émis le {new Date(createdAt).toLocaleDateString("fr-FR")}</Text>
            {validUntil ? (
              <Text style={styles.metaLine}>Valable jusqu&apos;au {new Date(validUntil).toLocaleDateString("fr-FR")}</Text>
            ) : null}
          </View>
        </View>

        {recipient.name ? (
          <View style={styles.recipientBlock}>
            <Text style={styles.sectionLabel}>Destinataire</Text>
            <Text style={styles.recipientName}>{recipient.name}</Text>
            {recipient.email ? <Text style={styles.metaLine}>{recipient.email}</Text> : null}
          </View>
        ) : null}

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDescription]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qté</Text>
            <Text style={[styles.th, styles.colUnit]}>PU HT</Text>
            <Text style={[styles.th, styles.colDiscount]}>Remise</Text>
            <Text style={[styles.th, styles.colVat]}>TVA</Text>
            <Text style={[styles.th, styles.colTotal]}>Total HT</Text>
          </View>
          {lines.map((line) => (
            <View key={line.id} style={styles.tableRow} wrap={false}>
              <Text style={styles.colDescription}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colUnit}>{formatEUR(line.unit_price)}</Text>
              <Text style={styles.colDiscount}>{line.discount_percent > 0 ? `${line.discount_percent}%` : "—"}</Text>
              <Text style={styles.colVat}>{line.vat_rate}%</Text>
              <Text style={styles.colTotal}>{formatEUR(lineTotalHT(line))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{formatEUR(totals.totalHT)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total TVA</Text>
            <Text style={styles.totalValue}>{formatEUR(totals.totalTTC - totals.totalHT)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            <Text style={styles.totalValueStrong}>{formatEUR(totals.totalTTC)}</Text>
          </View>
        </View>

        {issuer.signatureText ? (
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>{issuer.signatureText}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
