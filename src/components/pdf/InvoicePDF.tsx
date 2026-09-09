import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#09090b',
    color: '#ffffff',
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.4
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: '#27272a',
    paddingBottom: 16,
    marginBottom: 16,
  },
  logo: {
    width: 130,
    height: 38,
    objectFit: 'contain',
    marginBottom: 8,
  },
  companyInfo: {
    color: '#a1a1aa',
    fontSize: 8,
    lineHeight: 1.4,
  },
  companyName: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  invoiceMeta: {
    alignItems: 'flex-end',
  },
  invoiceBadge: {
    backgroundColor: '#1f1215',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    color: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 7.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00F0FF',
    marginBottom: 4,
    fontFamily: 'Courier-Bold',
  },
  metaText: {
    color: '#a1a1aa',
    fontSize: 8,
    marginBottom: 2,
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#166534',
    color: '#22c55e',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  infoCol: {
    width: '32%',
  },
  infoLabel: {
    fontSize: 7.5,
    color: '#71717a',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValueMain: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  infoValueSub: {
    fontSize: 8,
    color: '#a1a1aa',
    lineHeight: 1.3,
  },
  table: {
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  th: {
    color: '#a1a1aa',
    fontSize: 7.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#0e0e12',
    alignItems: 'center',
  },
  colType: {
    width: '14%',
  },
  colDesc: {
    width: '46%',
  },
  colQty: {
    width: '10%',
    textAlign: 'center',
  },
  colPrice: {
    width: '15%',
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    textAlign: 'right',
  },
  itemTypeTag: {
    fontSize: 7,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  itemTypeMerch: {
    backgroundColor: '#082f49',
    color: '#38bdf8',
  },
  itemTypeTicket: {
    backgroundColor: '#450a0a',
    color: '#f87171',
  },
  itemTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  itemSub: {
    fontSize: 7.5,
    color: '#a1a1aa',
    marginTop: 1,
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  totalsBox: {
    width: 220,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 6,
    padding: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalLabel: {
    fontSize: 8,
    color: '#a1a1aa',
  },
  totalValue: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  totalGrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 6,
    marginTop: 4,
  },
  totalGrandLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  totalGrandValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#00F0FF',
    fontFamily: 'Courier-Bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    paddingTop: 10,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 7,
    color: '#71717a',
    lineHeight: 1.4,
    marginBottom: 2,
  },
});

export interface InvoiceItem {
  type: 'merch' | 'ticket';
  title: string;
  variantOrTier?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoicePDFProps {
  invoiceNumber: string;
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  shippingZip?: string;
  paymentProvider?: string;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  items: InvoiceItem[];
  logoDataUri?: string;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoiceNumber,
  orderId,
  orderDate,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  shippingCity,
  shippingCountry,
  shippingZip,
  paymentProvider = "Bold Pasarela de Pagos",
  subtotal,
  shippingCost,
  totalAmount,
  items,
  logoDataUri,
}) => {
  return (
    <Document title={`Factura_${invoiceNumber}`}>
      <Page size="LETTER" style={styles.page}>
        
        {/* Header: Logo and Invoice Meta */}
        <View style={styles.headerRow}>
          <View>
            {logoDataUri ? (
              <Image src={logoDataUri} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 }}>
                BASSFACTORY
              </Text>
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>BASSFACTORY ENTERTAINMENT S.A.S.</Text>
              <Text>NIT: 901.654.321-0</Text>
              <Text>Bogotá D.C., Colombia</Text>
              <Text>ventas@bassfactory.co • www.bassfactory.co</Text>
            </View>
          </View>

          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceBadge}>Factura de Venta Oficial</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={styles.metaText}>Fecha: {orderDate}</Text>
            <Text style={styles.metaText}>Ref Orden: #{orderId.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.statusBadge}>✓ PAGADA / APROBADA</Text>
          </View>
        </View>

        {/* Customer, Shipping, and Payment Details Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Adquiriente / Cliente</Text>
            <Text style={styles.infoValueMain}>{customerName}</Text>
            <Text style={styles.infoValueSub}>{customerEmail}</Text>
            {customerPhone && <Text style={styles.infoValueSub}>Tel: {customerPhone}</Text>}
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>
              {shippingAddress ? 'Destino de Despacho' : 'Modalidad de Entrega'}
            </Text>
            {shippingAddress ? (
              <>
                <Text style={styles.infoValueMain}>{shippingAddress}</Text>
                <Text style={styles.infoValueSub}>
                  {shippingCity}, {shippingCountry || 'Colombia'}{shippingZip ? ` (${shippingZip})` : ''}
                </Text>
              </>
            ) : (
              <Text style={styles.infoValueSub}>
                Digital (Boleta Oficial QR en línea)
              </Text>
            )}
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Forma y Medio de Pago</Text>
            <Text style={styles.infoValueMain}>{paymentProvider}</Text>
            <Text style={styles.infoValueSub}>PSE / Tarjetas Crédito y Débito</Text>
            <Text style={styles.infoValueSub}>Transacción Electrónica Segura</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colType]}>Tipo</Text>
            <Text style={[styles.th, styles.colDesc]}>Descripción del Artículo</Text>
            <Text style={[styles.th, styles.colQty]}>Cant</Text>
            <Text style={[styles.th, styles.colPrice]}>Precio Unit.</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>

          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.colType}>
                <Text style={[styles.itemTypeTag, item.type === 'merch' ? styles.itemTypeMerch : styles.itemTypeTicket]}>
                  {item.type === 'merch' ? 'MERCH' : 'BOLETA'}
                </Text>
              </View>
              
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.variantOrTier && (
                  <Text style={styles.itemSub}>{item.variantOrTier}</Text>
                )}
              </View>

              <Text style={[styles.colQty, { color: '#ffffff', fontWeight: 'bold' }]}>
                {item.quantity}
              </Text>

              <Text style={[styles.colPrice, { color: '#a1a1aa' }]}>
                ${item.unitPrice.toLocaleString('es-CO')}
              </Text>

              <Text style={[styles.colTotal, { color: '#ffffff', fontWeight: 'bold' }]}>
                ${item.totalPrice.toLocaleString('es-CO')}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Box */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>${subtotal.toLocaleString('es-CO')} COP</Text>
            </View>
            {shippingCost > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Costo de Envío Nacional:</Text>
                <Text style={styles.totalValue}>${shippingCost.toLocaleString('es-CO')} COP</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Impuestos / IVA Incluido:</Text>
              <Text style={styles.totalValue}>$0 COP</Text>
            </View>
            <View style={styles.totalGrandRow}>
              <Text style={styles.totalGrandLabel}>Total Pagado:</Text>
              <Text style={styles.totalGrandValue}>${totalAmount.toLocaleString('es-CO')} COP</Text>
            </View>
          </View>
        </View>

        {/* Footer Disclaimers */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            • BASSFACTORY S.A.S. certifica la validez de este comprobante electrónico de venta correspondiente a la orden emitida a través de www.bassfactory.co.
          </Text>
          <Text style={styles.footerText}>
            • Para mercancía física, los tiempos de entrega estándar son de 3 a 5 días hábiles a nivel nacional.
          </Text>
          <Text style={styles.footerText}>
            • Para boletas electrónicas de eventos, el código QR oficial se genera y habilita 1 día antes del evento por protocolos antifraude.
          </Text>
        </View>

      </Page>
    </Document>
  );
};
