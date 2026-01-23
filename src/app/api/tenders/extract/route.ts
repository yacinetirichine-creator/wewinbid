import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  extractDocument, 
  extractMultipleDocuments,
  combineDocumentsForAnalysis,
  getExtractionStats,
  type ExtractedDocument 
} from '@/lib/document-extraction';

// Handler POST pour extraire le contenu des documents uploadés
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer les fichiers du FormData
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Convertir les fichiers en buffers
    const fileInfos = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          name: file.name,
          type: file.type,
          buffer,
        };
      })
    );

    // Extraire le contenu de tous les documents
    const extractedDocuments: ExtractedDocument[] = [];
    const errors: { filename: string; error: string }[] = [];

    for (const fileInfo of fileInfos) {
      try {
        const extracted = await extractDocument(
          fileInfo.buffer,
          fileInfo.name,
          fileInfo.type
        );
        extractedDocuments.push(extracted);
      } catch (error) {
        errors.push({
          filename: fileInfo.name,
          error: error instanceof Error ? error.message : 'Erreur d\'extraction',
        });
      }
    }

    // Obtenir les statistiques d'extraction
    const stats = getExtractionStats(extractedDocuments);

    // Préparer le contenu combiné pour l'analyse
    const combinedContent = combineDocumentsForAnalysis(extractedDocuments);

    return NextResponse.json({
      success: true,
      extractedDocuments: extractedDocuments.map(doc => ({
        filename: doc.filename,
        extractionMethod: doc.extractionMethod,
        success: doc.success,
        error: doc.error,
        wordCount: doc.content
          ? doc.content
              .trim()
              .split(/\s+/)
              .filter(Boolean).length
          : 0,
        pageCount: doc.pages ?? null,
        // Limiter le contenu retourné pour éviter des réponses trop lourdes
        contentPreview: doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : ''),
        hasFullContent: doc.content.length > 0,
      })),
      combinedContent,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Erreur extraction documents:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'extraction des documents' },
      { status: 500 }
    );
  }
}

// Handler GET pour récupérer les types de fichiers supportés
export async function GET() {
  return NextResponse.json({
    supportedTypes: [
      { extension: '.pdf', mimeType: 'application/pdf', description: 'Documents PDF' },
      { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Documents Word' },
      { extension: '.doc', mimeType: 'application/msword', description: 'Documents Word (ancien format)' },
      { extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Fichiers Excel' },
      { extension: '.txt', mimeType: 'text/plain', description: 'Fichiers texte' },
    ],
    maxFileSize: '10MB',
    maxFiles: 20,
  });
}
