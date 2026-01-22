import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
  Image,
} from '@react-pdf/renderer';

// Styles communs pour les PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    marginTop: 15,
  },
  text: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 8,
    textAlign: 'justify',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 10,
  },
  bullet: {
    width: 10,
    color: '#1e40af',
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: '#4b5563',
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 15,
    minHeight: 100,
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 15,
    marginVertical: 15,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 10,
    color: '#1e40af',
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 20,
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
}

interface TenderInfo {
  reference: string;
  title: string;
  buyer: string;
  deadline: string;
  lots?: { number: string; title: string }[];
}

interface Reference {
  clientName: string;
  projectTitle: string;
  year: number;
  value: number;
  description: string;
}

// Composant DC1 - Lettre de candidature
interface DC1Props {
  company: CompanyInfo;
  tender: TenderInfo;
  isGroupement: boolean;
  groupementMembers?: CompanyInfo[];
}

function DC1Document({ company, tender, isGroupement, groupementMembers }: DC1Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DC1 - Lettre de candidature</Text>
          <Text style={styles.headerSubtitle}>
            Marchés publics / Accords-cadres
          </Text>
        </View>

        {/* Identification du pouvoir adjudicateur */}
        <Text style={styles.title}>1. Identification du pouvoir adjudicateur</Text>
        <Text style={styles.text}>
          Désignation du pouvoir adjudicateur : {tender.buyer}
        </Text>
        <Text style={styles.text}>
          Référence du marché : {tender.reference}
        </Text>
        <Text style={styles.text}>
          Objet du marché : {tender.title}
        </Text>

        {/* Identification du candidat */}
        <Text style={styles.title}>2. Identification du candidat</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ☑ Le candidat se présente {isGroupement ? 'en groupement' : 'seul'}
          </Text>
        </View>

        <Text style={styles.subtitle}>Mandataire du groupement / Candidat unique :</Text>
        <Text style={styles.text}>Raison sociale : {company.name}</Text>
        <Text style={styles.text}>SIRET : {company.siret}</Text>
        <Text style={styles.text}>Forme juridique : {company.legalForm}</Text>
        <Text style={styles.text}>
          Adresse : {company.address}, {company.postalCode} {company.city}
        </Text>
        <Text style={styles.text}>Téléphone : {company.phone}</Text>
        <Text style={styles.text}>Email : {company.email}</Text>

        {isGroupement && groupementMembers && groupementMembers.length > 0 && (
          <>
            <Text style={styles.subtitle}>Membres du groupement :</Text>
            {groupementMembers.map((member, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <Text style={styles.text}>• {member.name}</Text>
                <Text style={[styles.text, { paddingLeft: 15 }]}>
                  SIRET : {member.siret}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Lots */}
        {tender.lots && tender.lots.length > 0 && (
          <>
            <Text style={styles.title}>3. Lots concernés</Text>
            {tender.lots.map((lot, idx) => (
              <View key={idx} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>
                  Lot n°{lot.number} : {lot.title}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Engagement */}
        <Text style={styles.title}>4. Engagement du candidat</Text>
        <Text style={styles.text}>
          Le candidat déclare avoir pris connaissance des pièces du dossier de 
          consultation et s'engage sur l'honneur à respecter les obligations 
          fiscales et sociales en vigueur.
        </Text>
        <Text style={styles.text}>
          Le candidat certifie que les renseignements fournis dans la présente 
          candidature sont exacts.
        </Text>

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Cachet et signature</Text>
            <Text style={[styles.text, { marginTop: 30 }]}>
              Fait à : _________________
            </Text>
            <Text style={styles.text}>Le : _________________</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Nom et qualité du signataire</Text>
            <Text style={[styles.text, { marginTop: 30 }]}>
              _________________________
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré automatiquement - Vérifiez les informations avant soumission
        </Text>
      </Page>
    </Document>
  );
}

// Composant Mémoire technique
interface MemoireTechniqueProps {
  company: CompanyInfo;
  tender: TenderInfo;
  analysis: {
    summary: string;
    requirements: string[];
    methodology: string;
  };
  references: Reference[];
}

function MemoireTechniqueDocument({
  company,
  tender,
  analysis,
  references,
}: MemoireTechniqueProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mémoire Technique</Text>
          <Text style={styles.headerSubtitle}>
            {tender.title}
          </Text>
        </View>

        {/* Page de garde */}
        <View style={{ marginTop: 50, marginBottom: 50, textAlign: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1e40af' }}>
            {company.name}
          </Text>
          <Text style={{ fontSize: 16, color: '#6b7280', marginTop: 20 }}>
            Référence : {tender.reference}
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 10 }}>
            {tender.buyer}
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        {/* Sommaire */}
        <Text style={styles.title}>Sommaire</Text>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>1.</Text>
          <Text style={styles.bulletText}>Présentation de la société</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>2.</Text>
          <Text style={styles.bulletText}>Compréhension du besoin</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>3.</Text>
          <Text style={styles.bulletText}>Méthodologie proposée</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>4.</Text>
          <Text style={styles.bulletText}>Références</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Text style={styles.bullet}>5.</Text>
          <Text style={styles.bulletText}>Moyens humains et matériels</Text>
        </View>

        <Text style={styles.footer}>
          Page 1 - {company.name}
        </Text>
      </Page>

      {/* Page 2 - Présentation */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>1. Présentation de la société</Text>
        
        <Text style={styles.subtitle}>1.1 Identité</Text>
        <Text style={styles.text}>Raison sociale : {company.name}</Text>
        <Text style={styles.text}>SIRET : {company.siret}</Text>
        <Text style={styles.text}>Forme juridique : {company.legalForm}</Text>
        <Text style={styles.text}>
          Siège social : {company.address}, {company.postalCode} {company.city}
        </Text>

        <Text style={styles.subtitle}>1.2 Coordonnées</Text>
        <Text style={styles.text}>Téléphone : {company.phone}</Text>
        <Text style={styles.text}>Email : {company.email}</Text>

        <Text style={styles.title}>2. Compréhension du besoin</Text>
        <Text style={styles.text}>{analysis.summary}</Text>

        <Text style={styles.subtitle}>2.1 Exigences identifiées</Text>
        {analysis.requirements.map((req, idx) => (
          <View key={idx} style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{req}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Page 2 - {company.name}
        </Text>
      </Page>

      {/* Page 3 - Méthodologie */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>3. Méthodologie proposée</Text>
        <Text style={styles.text}>{analysis.methodology}</Text>

        <Text style={styles.title}>4. Références</Text>
        
        {references.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '25%' }]}>Client</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Projet</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>Année</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>Montant</Text>
            </View>
            {references.map((ref, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '25%' }]}>{ref.clientName}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{ref.projectTitle}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{ref.year}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(ref.value)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>
            Références détaillées disponibles sur demande.
          </Text>
        )}

        <Text style={styles.footer}>
          Page 3 - {company.name}
        </Text>
      </Page>
    </Document>
  );
}

// Fonctions utilitaires pour générer les PDF
export async function generateDC1(
  company: CompanyInfo,
  tender: TenderInfo,
  isGroupement: boolean = false,
  groupementMembers?: CompanyInfo[]
): Promise<Blob> {
  const doc = <DC1Document 
    company={company} 
    tender={tender} 
    isGroupement={isGroupement}
    groupementMembers={groupementMembers}
  />;
  
  return await pdf(doc).toBlob();
}

export async function generateMemoireTechnique(
  company: CompanyInfo,
  tender: TenderInfo,
  analysis: {
    summary: string;
    requirements: string[];
    methodology: string;
  },
  references: Reference[]
): Promise<Blob> {
  const doc = <MemoireTechniqueDocument
    company={company}
    tender={tender}
    analysis={analysis}
    references={references}
  />;
  
  return await pdf(doc).toBlob();
}

// Fonction pour télécharger un PDF
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Générer tous les documents d'une réponse
export interface GenerationResult {
  documentType: string;
  filename: string;
  blob: Blob;
  success: boolean;
  error?: string;
}

export async function generateAllDocuments(
  company: CompanyInfo,
  tender: TenderInfo,
  analysis: {
    summary: string;
    requirements: string[];
    methodology: string;
  },
  references: Reference[],
  onProgress?: (progress: number, currentDoc: string) => void
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  const documents = [
    { type: 'DC1', name: 'Lettre de candidature' },
    { type: 'MEMOIRE', name: 'Mémoire technique' },
  ];

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    onProgress?.(Math.round(((i + 1) / documents.length) * 100), doc.name);

    try {
      let blob: Blob;
      let filename: string;

      switch (doc.type) {
        case 'DC1':
          blob = await generateDC1(company, tender);
          filename = `DC1_${tender.reference.replace(/\s/g, '_')}.pdf`;
          break;
        case 'MEMOIRE':
          blob = await generateMemoireTechnique(company, tender, analysis, references);
          filename = `Memoire_Technique_${tender.reference.replace(/\s/g, '_')}.pdf`;
          break;
        default:
          continue;
      }

      results.push({
        documentType: doc.type,
        filename,
        blob,
        success: true,
      });
    } catch (error) {
      results.push({
        documentType: doc.type,
        filename: `${doc.type}_error.pdf`,
        blob: new Blob(),
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de génération',
      });
    }
  }

  return results;
}
