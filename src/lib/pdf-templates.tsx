import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

// Styles communs pour les PDF additionnels
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 18,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  text: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 6,
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    marginVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  totalRow: {
    backgroundColor: '#1e40af',
  },
  totalCell: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  signatureBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    minHeight: 80,
  },
});

// Types
interface CompanyInfo {
  name: string;
  siret: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phone: string;
  legalForm: string;
  tvaNumber?: string;
  capital?: string;
  rcs?: string;
}

interface ClientInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  contact?: string;
  email?: string;
}

// ================================
// DEVIS - Quote Document
// ================================
interface DevisLine {
  designation: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  tvaRate: number;
}

interface DevisProps {
  company: CompanyInfo;
  client: ClientInfo;
  reference: string;
  date: string;
  validityDays: number;
  lines: DevisLine[];
  conditions?: string;
  paymentTerms?: string;
}

function DevisDocument({ company, client, reference, date, validityDays, lines, conditions, paymentTerms }: DevisProps) {
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const totalTVA = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice * line.tvaRate / 100), 0);
  const total = subtotal + totalTVA;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DEVIS</Text>
          <Text style={styles.headerSubtitle}>N° {reference}</Text>
        </View>

        {/* Informations entreprise et client */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ width: '45%' }}>
            <Text style={styles.subtitle}>Émetteur</Text>
            <Text style={styles.text}>{company.name}</Text>
            <Text style={styles.text}>{company.address}</Text>
            <Text style={styles.text}>{company.postalCode} {company.city}</Text>
            <Text style={styles.text}>SIRET: {company.siret}</Text>
            {company.tvaNumber && <Text style={styles.text}>TVA: {company.tvaNumber}</Text>}
            <Text style={styles.text}>Tél: {company.phone}</Text>
            <Text style={styles.text}>Email: {company.email}</Text>
          </View>
          <View style={{ width: '45%' }}>
            <Text style={styles.subtitle}>Client</Text>
            <Text style={styles.text}>{client.name}</Text>
            <Text style={styles.text}>{client.address}</Text>
            <Text style={styles.text}>{client.postalCode} {client.city}</Text>
            {client.contact && <Text style={styles.text}>Contact: {client.contact}</Text>}
            {client.email && <Text style={styles.text}>Email: {client.email}</Text>}
          </View>
        </View>

        {/* Date et validité */}
        <View style={styles.infoBox}>
          <Text style={{ fontSize: 10, color: '#1e40af' }}>
            Date d'émission : {date} | Validité : {validityDays} jours
          </Text>
        </View>

        {/* Tableau des prestations */}
        <Text style={styles.title}>Détail des prestations</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: '35%' }]}>Désignation</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>Qté</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>Prix unit. HT</Text>
            <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>TVA</Text>
            <Text style={[styles.tableCell, { width: '25%', textAlign: 'right', borderRightWidth: 0 }]}>Total HT</Text>
          </View>
          {lines.map((line, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: '35%' }]}>
                <Text>{line.designation}</Text>
                {line.description && <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{line.description}</Text>}
              </View>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{line.quantity} {line.unit}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{line.unitPrice.toFixed(2)} €</Text>
              <Text style={[styles.tableCell, { width: '10%', textAlign: 'center' }]}>{line.tvaRate}%</Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right', borderRightWidth: 0 }]}>
                {(line.quantity * line.unitPrice).toFixed(2)} €
              </Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={{ alignItems: 'flex-end', marginTop: 15 }}>
          <View style={{ width: '40%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={styles.text}>Total HT :</Text>
              <Text style={styles.text}>{subtotal.toFixed(2)} €</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={styles.text}>TVA :</Text>
              <Text style={styles.text}>{totalTVA.toFixed(2)} €</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, backgroundColor: '#1e40af' }}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>Total TTC :</Text>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12 }}>{total.toFixed(2)} €</Text>
            </View>
          </View>
        </View>

        {/* Conditions */}
        {conditions && (
          <>
            <Text style={styles.title}>Conditions particulières</Text>
            <Text style={styles.text}>{conditions}</Text>
          </>
        )}

        {paymentTerms && (
          <>
            <Text style={styles.subtitle}>Conditions de paiement</Text>
            <Text style={styles.text}>{paymentTerms}</Text>
          </>
        )}

        {/* Signature */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 }}>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 8 }}>Signature du prestataire</Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 40 }}>Date : {date}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 8 }}>Bon pour accord - Le client</Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 40 }}>Date : _____________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          {company.name} - {company.legalForm} - Capital: {company.capital || 'N/A'} - RCS: {company.rcs || 'N/A'}
        </Text>
      </Page>
    </Document>
  );
}

// ================================
// DPGF - Décomposition du Prix Global et Forfaitaire
// ================================
interface DPGFLine {
  lot: string;
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface DPGFProps {
  company: CompanyInfo;
  tender: {
    reference: string;
    title: string;
    buyer: string;
  };
  lines: DPGFLine[];
}

function DPGFDocument({ company, tender, lines }: DPGFProps) {
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const groupedByLot = lines.reduce((acc, line) => {
    if (!acc[line.lot]) acc[line.lot] = [];
    acc[line.lot].push(line);
    return acc;
  }, {} as Record<string, DPGFLine[]>);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DPGF</Text>
          <Text style={styles.headerSubtitle}>Décomposition du Prix Global et Forfaitaire</Text>
        </View>

        {/* Informations du marché */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.text}>Référence : {tender.reference}</Text>
          <Text style={styles.text}>Objet : {tender.title}</Text>
          <Text style={styles.text}>Pouvoir adjudicateur : {tender.buyer}</Text>
        </View>

        {/* Informations entreprise */}
        <View style={styles.infoBox}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e40af', marginBottom: 4 }}>
            Candidat : {company.name}
          </Text>
          <Text style={{ fontSize: 9, color: '#1e40af' }}>SIRET : {company.siret}</Text>
        </View>

        {/* Tableau DPGF par lot */}
        {Object.entries(groupedByLot).map(([lot, lotLines]) => {
          const lotTotal = lotLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
          return (
            <View key={lot} style={{ marginBottom: 15 }}>
              <Text style={[styles.subtitle, { backgroundColor: '#f3f4f6', padding: 5 }]}>
                {lot}
              </Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>Désignation</Text>
                  <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>Unité</Text>
                  <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>Quantité</Text>
                  <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>P.U. HT</Text>
                  <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', borderRightWidth: 0 }]}>Total HT</Text>
                </View>
                {lotLines.map((line, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '40%' }]}>{line.designation}</Text>
                    <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{line.unit}</Text>
                    <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{line.quantity}</Text>
                    <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{line.unitPrice.toFixed(2)} €</Text>
                    <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', borderRightWidth: 0 }]}>
                      {(line.quantity * line.unitPrice).toFixed(2)} €
                    </Text>
                  </View>
                ))}
                <View style={[styles.tableRow, { backgroundColor: '#e5e7eb' }]}>
                  <Text style={[styles.tableCell, { width: '85%', fontWeight: 'bold' }]}>Sous-total {lot}</Text>
                  <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold', borderRightWidth: 0 }]}>
                    {lotTotal.toFixed(2)} €
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Total général */}
        <View style={{ alignItems: 'flex-end', marginTop: 20 }}>
          <View style={{ padding: 12, backgroundColor: '#1e40af', width: '50%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>TOTAL GÉNÉRAL HT :</Text>
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>{total.toFixed(2)} €</Text>
            </View>
          </View>
        </View>

        {/* Engagement */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.text}>
            Le soussigné s'engage à exécuter les prestations décrites ci-dessus pour le montant total indiqué.
          </Text>
        </View>

        {/* Signature */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 8 }}>Cachet et signature du candidat</Text>
            <Text style={{ fontSize: 8, marginTop: 40 }}>Fait à : _________________</Text>
            <Text style={{ fontSize: 8, marginTop: 5 }}>Le : _________________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          DPGF - {tender.reference} - {company.name}
        </Text>
      </Page>
    </Document>
  );
}

// ================================
// Attestation sur l'honneur
// ================================
interface AttestationProps {
  company: CompanyInfo;
  tender: {
    reference: string;
    title: string;
    buyer: string;
  };
  signataire: {
    name: string;
    title: string;
  };
  date: string;
}

function AttestationDocument({ company, tender, signataire, date }: AttestationProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ATTESTATION SUR L'HONNEUR</Text>
          <Text style={styles.headerSubtitle}>Article 48 du décret n°2016-360</Text>
        </View>

        {/* Identification */}
        <Text style={styles.title}>Identification du candidat</Text>
        <View style={styles.infoBox}>
          <Text style={{ fontSize: 10, color: '#1e40af' }}>
            {company.name} - SIRET : {company.siret}
          </Text>
          <Text style={{ fontSize: 9, color: '#1e40af', marginTop: 3 }}>
            {company.address}, {company.postalCode} {company.city}
          </Text>
        </View>

        <Text style={styles.title}>Objet du marché</Text>
        <Text style={styles.text}>Référence : {tender.reference}</Text>
        <Text style={styles.text}>Objet : {tender.title}</Text>
        <Text style={styles.text}>Pouvoir adjudicateur : {tender.buyer}</Text>

        {/* Déclarations */}
        <Text style={styles.title}>Déclarations</Text>
        <Text style={styles.text}>
          Je soussigné(e), {signataire.name}, agissant en qualité de {signataire.title} de la société {company.name},
        </Text>

        <Text style={[styles.subtitle, { marginTop: 15 }]}>Déclare sur l'honneur :</Text>

        <View style={{ marginLeft: 10 }}>
          <Text style={styles.text}>
            • Ne pas avoir fait l'objet, depuis moins de cinq ans, d'une condamnation définitive pour l'une des
            infractions prévues aux articles 222-38, 222-40, 226-13, 313-1 à 313-3, 314-1 à 314-3, 324-1 à 324-6,
            413-9 à 413-12, 421-1 à 421-2-3, au deuxième alinéa de l'article 421-5, à l'article 433-1, au second
            alinéa de l'article 433-2, au huitième alinéa de l'article 434-9, au second alinéa de l'article 434-9-1,
            aux articles 435-3, 435-4, 435-9, 435-10, 441-1 à 441-7, 441-9, 445-1 et 450-1 du code pénal.
          </Text>

          <Text style={styles.text}>
            • Ne pas avoir fait l'objet, depuis moins de cinq ans, d'une condamnation inscrite au bulletin n°2
            du casier judiciaire pour les infractions mentionnées ci-dessus.
          </Text>

          <Text style={styles.text}>
            • Ne pas être en état de liquidation judiciaire, ne pas être admis au redressement judiciaire
            ou faire l'objet d'une procédure équivalente.
          </Text>

          <Text style={styles.text}>
            • Avoir, au 31 décembre de l'année précédant celle au cours de laquelle a lieu le lancement de
            la consultation, souscrit les déclarations incombant en matière fiscale et sociale et acquitté
            les impôts et cotisations exigibles à cette date.
          </Text>

          <Text style={styles.text}>
            • Être en règle au regard des articles L. 5212-1 à L. 5212-11 du code du travail concernant
            l'emploi des travailleurs handicapés.
          </Text>
        </View>

        {/* Engagement */}
        <Text style={[styles.subtitle, { marginTop: 20 }]}>Engagement</Text>
        <Text style={styles.text}>
          Je m'engage à fournir, sur demande du pouvoir adjudicateur, les certificats et attestations
          prévus aux articles R. 2143-6 à R. 2143-10 du code de la commande publique, délivrés par les
          administrations et organismes compétents, dans un délai de 10 jours à compter de la demande.
        </Text>

        {/* Signature */}
        <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <View style={{ width: '50%' }}>
            <Text style={styles.text}>Fait à : _________________________</Text>
            <Text style={[styles.text, { marginTop: 10 }]}>Le : {date}</Text>
            <Text style={[styles.text, { marginTop: 20 }]}>Signature et cachet :</Text>
            <View style={{ height: 60, borderWidth: 1, borderColor: '#d1d5db', marginTop: 10 }} />
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 5 }}>
              {signataire.name}, {signataire.title}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Attestation sur l'honneur - {tender.reference} - {company.name}
        </Text>
      </Page>
    </Document>
  );
}

// ================================
// Export functions
// ================================
export async function generateDevis(props: DevisProps): Promise<Blob> {
  return await pdf(<DevisDocument {...props} />).toBlob();
}

export async function generateDPGF(props: DPGFProps): Promise<Blob> {
  return await pdf(<DPGFDocument {...props} />).toBlob();
}

export async function generateAttestation(props: AttestationProps): Promise<Blob> {
  return await pdf(<AttestationDocument {...props} />).toBlob();
}

// Types exportés
export type { DevisProps, DevisLine, DPGFProps, DPGFLine, AttestationProps, CompanyInfo, ClientInfo };
