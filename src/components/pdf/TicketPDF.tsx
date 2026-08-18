import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer';

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
  bannerImage: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderRadius: 8,
    marginBottom: 20,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoIcon: {
    width: 14,
    height: 14,
    marginRight: 8,
    marginTop: 1,
  },
  infoTextInline: {
    fontSize: 10,
    color: '#D4D4D8',
    lineHeight: 1.5,
    flex: 1,
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
  coverImageUrl?: string;
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
  coverImageUrl,
  logoUrl,
  orderId
}: TicketPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <Image src={logoUrl} style={styles.logo} />
        <View style={styles.titleWrapper}>
          <Text style={styles.eventTitle}>{eventName}</Text>
          <Text style={styles.eventDate}>{eventDate.split(',')[0]}</Text>
        </View>
      </View>

      {coverImageUrl && (
        <Image src={coverImageUrl} style={styles.bannerImage} />
      )}

      <View style={styles.mainContent}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Información del Evento</Text>
          
          <View style={styles.infoRow}>
            <Svg viewBox="0 0 24 24" style={styles.infoIcon} fill="none" stroke="#D90416" strokeWidth={2}>
              <Path d="M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18" />
            </Svg>
            <Text style={styles.infoTextInline}>{eventDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Svg viewBox="0 0 24 24" style={styles.infoIcon} fill="none" stroke="#D90416" strokeWidth={2}>
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <Path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </Svg>
            <Text style={styles.infoTextInline}>{eventLocation}</Text>
          </View>

          {eventDescription && (
            <View style={styles.infoRow}>
              <Svg viewBox="0 0 24 24" style={styles.infoIcon} fill="none" stroke="#D90416" strokeWidth={2}>
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </Svg>
              <Text style={styles.infoTextInline}>{eventDescription}</Text>
            </View>
          )}

          <View style={{ marginTop: 10, borderTop: '1px solid #27272A', paddingTop: 10 }}>
            <View style={styles.infoRow}>
              <Svg viewBox="0 0 24 24" style={styles.infoIcon} fill="none" stroke="#A1A1AA" strokeWidth={2}>
                <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <Path d="M22 4L12 14.01l-3-3" />
              </Svg>
              <Text style={styles.infoTextInline}>Lleva tu documento de identidad original.</Text>
            </View>
            <View style={styles.infoRow}>
              <Svg viewBox="0 0 24 24" style={styles.infoIcon} fill="none" stroke="#A1A1AA" strokeWidth={2}>
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </Svg>
              <Text style={styles.infoTextInline}>Nos reservamos el derecho de admisión.</Text>
            </View>
            <View style={styles.infoRow}>
              <Svg viewBox="0 0 24 24" style={styles.infoIcon} fill="none" stroke="#A1A1AA" strokeWidth={2}>
                <Path d="M3 3h18v18H3z M9 3v18 M15 3v18" />
              </Svg>
              <Text style={styles.infoTextInline}>El código QR es único e intransferible.</Text>
            </View>
          </View>
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
