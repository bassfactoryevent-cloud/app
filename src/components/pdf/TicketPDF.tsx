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
    height: 40,
    objectFit: 'contain'
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
  infoBlock: {
    width: '45%',
    padding: 20,
    backgroundColor: '#111111',
    borderRadius: 8,
    border: '1px solid #27272A',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D90416',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 10,
    color: '#D4D4D8',
    lineHeight: 1.5,
    marginBottom: 10,
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
  eventDescription?: string;
  logoUrl: string;
  orderId: string;
}

export const TicketPDF = ({
  eventName,
  eventDate,
  eventLocation,
  ticketTierName,
  customerName,
  qrDataUri,
  eventDescription,
  logoUrl,
  orderId
}: TicketPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <Image src={logoUrl} style={styles.logo} />
        <View style={styles.titleWrapper}>
          <Text style={styles.eventTitle}>{eventName}</Text>
          <Text style={styles.eventDate}>{eventDate}</Text>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Información del Evento</Text>
          <Text style={styles.infoText}>
            Fecha: {eventDate}
          </Text>
          <Text style={styles.infoText}>
            Lugar: {eventLocation}
          </Text>
          {eventDescription && (
            <Text style={styles.infoText}>
              Detalles: {eventDescription}
            </Text>
          )}
          <Text style={styles.infoText}>
            • Recuerde llevar su documento de identidad.
          </Text>
          <Text style={styles.infoText}>
            • Nos reservamos el derecho de admisión y permanencia.
          </Text>
          <Text style={styles.infoText}>
            • El código QR es único y de un solo uso.
          </Text>
        </View>

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
