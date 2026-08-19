import { Document, Page, Text, View, StyleSheet, Image as PdfImage, Font } from "@react-pdf/renderer";
import { formatEUR, lineTotalHT, quoteTotals } from "@/lib/quote-calc";
import type { QuoteLine } from "@/lib/types/database";

Font.registerHyphenationCallback((word) => [word]);

const GRID_COLOR = "#33302c";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, color: "#1c1a17", fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 100, maxHeight: 44, objectFit: "contain", marginBottom: 6 },
  issuerName: { fontSize: 17, fontWeight: 700 },
  issuerSubtitle: { fontSize: 9, fontStyle: "italic", marginTop: 2 },
  bigTitle: { fontSize: 30, color: "#1f4e96", fontWeight: 700 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  issuerDetails: { maxWidth: 220 },
  detailLine: { fontSize: 8.5, marginBottom: 1.5, color: "#3a3733" },
  fournisseurLabel: { marginTop: 6, fontWeight: 700, color: "#1c1a17" },
  emailLine: { fontSize: 8.5, marginBottom: 1.5, color: "#2f5fa8" },
  metaBlock: { width: 260 },
  metaRow: { flexDirection: "row", marginBottom: 3 },
  metaLabel: { width: 78, fontSize: 8.5, fontStyle: "italic", fontWeight: 700, textAlign: "right", marginRight: 8 },
  metaValue: { width: 174, fontSize: 9 },
  recipientName: { fontSize: 9, fontWeight: 700, marginBottom: 1.5 },

  table: { marginTop: 26, borderWidth: 1, borderColor: GRID_COLOR },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#e4e4e4" },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: GRID_COLOR },
  th: { fontSize: 8, fontWeight: 700, paddingHorizontal: 6, paddingVertical: 6, borderRightWidth: 1, borderRightColor: GRID_COLOR },
  td: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 6, borderRightWidth: 1, borderRightColor: GRID_COLOR },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colUnit: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right", borderRightWidth: 0 },
  infoRowCell: { fontSize: 9, fontWeight: 700, paddingHorizontal: 6, paddingVertical: 6 },

  totalsBlock: { marginTop: 18, alignSelf: "flex-end", width: 220, borderWidth: 1, borderColor: GRID_COLOR },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: GRID_COLOR,
  },
  totalLineFirst: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, paddingHorizontal: 8 },
  totalLabel: { fontSize: 8.5, fontStyle: "italic", fontWeight: 700 },
  totalValue: { fontSize: 9 },
  totalLineFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: GRID_COLOR,
    backgroundColor: "#e4e4e4",
  },
  totalLabelFinal: { fontSize: 10, fontWeight: 700, fontStyle: "italic" },
  totalValueFinal: { fontSize: 12, fontWeight: 700 },

  footer: { marginTop: 24 },
  footerThanks: { fontSize: 9, fontWeight: 700, fontStyle: "italic" },
  footerNote: { fontSize: 8, color: "#726c62", marginTop: 3 },
});

function splitLines(value?: string | null): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export interface QuotePdfIssuer {
  name: string;
  subtitle?: string | null;
  logoUrl?: string | null;
  addressLines?: string[];
  phone?: string | null;
  email?: string | null;
  siret?: string | null;
  vatIntra?: string | null;
}

export interface QuotePdfRecipient {
  name?: string | null;
  addressLines?: string[];
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <View style={styles.metaValue}>
        {typeof children === "string" ? <Text>{children}</Text> : children}
      </View>
    </View>
  );
}

// Ligne d'information transverse dans le tableau (immatriculation, n° de
// commande…), au même endroit que sur le modèle papier de référence :
// en gras, dans la colonne description, cellules suivantes vides.
function TableInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tableRow} wrap={false}>
      <Text style={[styles.infoRowCell, styles.colDescription]}>
        {label} : {value}
      </Text>
      <Text style={[styles.td, styles.colQty]} />
      <Text style={[styles.td, styles.colUnit]} />
      <Text style={[styles.td, styles.colTotal]} />
    </View>
  );
}

export function QuotePdf({
  documentTitle = "Devis",
  issuer,
  recipient,
  quoteRef,
  createdAt,
  vehicleRegistration,
  orderNumber,
  footerContact,
  lines,
}: {
  documentTitle?: string;
  issuer: QuotePdfIssuer;
  recipient: QuotePdfRecipient;
  quoteRef: string;
  createdAt: string;
  vehicleRegistration?: string | null;
  orderNumber?: string | null;
  footerContact?: string | null;
  lines: QuoteLine[];
}) {
  const totals = quoteTotals(lines);
  const representativeVatRate = lines[0]?.vat_rate ?? 20;

  return (
    <Document title={`${documentTitle} ${quoteRef}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {issuer.logoUrl ? <PdfImage src={issuer.logoUrl} style={styles.logo} /> : null}
            <Text style={styles.issuerName}>{issuer.name}</Text>
            {issuer.subtitle ? <Text style={styles.issuerSubtitle}>{issuer.subtitle}</Text> : null}
          </View>
          <Text style={styles.bigTitle}>{documentTitle.toUpperCase()}</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.issuerDetails}>
            {(issuer.addressLines ?? []).map((line) => (
              <Text key={line} style={styles.detailLine}>
                {line}
              </Text>
            ))}
            {issuer.phone ? <Text style={styles.detailLine}>{issuer.phone}</Text> : null}
            {issuer.email ? <Text style={styles.emailLine}>{issuer.email}</Text> : null}
            {issuer.siret ? <Text style={styles.detailLine}>Siret : {issuer.siret}</Text> : null}
            {issuer.vatIntra ? <Text style={styles.detailLine}>TVA Intra : {issuer.vatIntra}</Text> : null}
            <Text style={[styles.detailLine, styles.fournisseurLabel]}>FOURNISSEUR N° :</Text>
          </View>

          <View style={styles.metaBlock}>
            <MetaRow label="DATE :">{new Date(createdAt).toLocaleDateString("fr-FR")}</MetaRow>
            <MetaRow label="N° DEVIS :">{quoteRef}</MetaRow>
            {recipient.name ? (
              <MetaRow label="LIVRAISON A :">
                <View>
                  <Text style={styles.recipientName}>{recipient.name}</Text>
                  {(recipient.addressLines ?? []).map((line) => (
                    <Text key={line} style={styles.detailLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              </MetaRow>
            ) : null}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDescription, { textAlign: "center" }]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Quantité</Text>
            <Text style={[styles.th, styles.colUnit]}>Tarif Unit H.T</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {lines.map((line) => (
            <View key={line.id} style={styles.tableRow} wrap={false}>
              <Text style={[styles.td, styles.colDescription]}>{line.description}</Text>
              <Text style={[styles.td, styles.colQty]}>{line.quantity}</Text>
              <Text style={[styles.td, styles.colUnit]}>{formatEUR(line.unit_price)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{formatEUR(lineTotalHT(line))}</Text>
            </View>
          ))}
          {vehicleRegistration ? <TableInfoRow label="Immatriculation" value={vehicleRegistration} /> : null}
          {orderNumber ? <TableInfoRow label="N° de commande" value={orderNumber} /> : null}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalLineFirst}>
            <Text style={styles.totalLabel}>SOUS-TOTAL H.T</Text>
            <Text style={styles.totalValue}>{formatEUR(totals.totalHT)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>TAUX TVA</Text>
            <Text style={styles.totalValue}>{representativeVatRate.toFixed(2)}%</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{formatEUR(totals.totalTTC - totals.totalHT)}</Text>
          </View>
          <View style={styles.totalLineFinal}>
            <Text style={styles.totalLabelFinal}>TOTAL</Text>
            <Text style={styles.totalValueFinal}>{formatEUR(totals.totalTTC)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerThanks}>NOUS VOUS REMERCIONS DE VOTRE CONFIANCE.</Text>
          <Text style={styles.footerNote}>Pour toute question concernant ce devis :</Text>
          {footerContact ? <Text style={styles.footerNote}>{footerContact}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}

export { splitLines };
