import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #D90416',
    paddingBottom: 20,
    marginBottom: 20,
  },
  logo: {
    width: 140,
  },
  titleWrapper: {
    alignItems: 'flex-end',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  eventDate: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 5,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  coverImage: {
    width: '45%',
    height: 300,
    objectFit: 'cover',
    borderRadius: 8,
  },
  ticketDetails: {
    width: '50%',
    padding: 20,
    backgroundColor: '#18181B',
    borderRadius: 8,
    border: '1px solid #27272A',
  },
  label: {
    fontSize: 10,
    color: '#A1A1AA',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  qrInstructions: {
    fontSize: 10,
    color: '#000000',
    marginTop: 5,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTop: '1px solid #27272A',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#A1A1AA',
  }
});

interface TicketPDFProps {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketTierName: string;
  customerName: string;
  qrDataUri: string;
  coverImageUrl?: string;
  orderId: string;
}

export const TicketPDF = ({
  eventName,
  eventDate,
  eventLocation,
  ticketTierName,
  customerName,
  qrDataUri,
  coverImageUrl,
  orderId
}: TicketPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        {/* Usamos texto como placeholder si no se inyecta la URL absoluta del logo */}
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>BASSFACTORY</Text>
        <View style={styles.titleWrapper}>
          <Text style={styles.eventTitle}>{eventName}</Text>
          <Text style={styles.eventDate}>{eventDate}</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        {coverImageUrl ? (
          <Image src={coverImageUrl} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, { backgroundColor: '#27272A', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#A1A1AA' }}>Sin Imagen</Text>
          </View>
        )}

        <View style={styles.ticketDetails}>
          <Text style={styles.label}>Asistente</Text>
          <Text style={styles.value}>{customerName}</Text>

          <Text style={styles.label}>Localidad / Etapa</Text>
          <Text style={styles.value}>{ticketTierName}</Text>

          <Text style={styles.label}>Ubicación</Text>
          <Text style={styles.value}>{eventLocation}</Text>

          <Text style={styles.label}>Nº de Orden</Text>
          <Text style={{ fontSize: 12, marginBottom: 15, fontFamily: 'Courier' }}>{orderId.substring(0, 8).toUpperCase()}</Text>

          <View style={styles.qrContainer}>
            <Image src={qrDataUri} style={styles.qrImage} />
            <Text style={styles.qrInstructions}>Presenta este código en la entrada</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Este boleto es personal e intransferible. La reventa está prohibida.
        </Text>
        <Text style={styles.footerText}>
          Bassfactory © {new Date().getFullYear()} - Todos los derechos reservados
        </Text>
      </View>

    </Page>
  </Document>
);
