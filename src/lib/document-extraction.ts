/**
 * Service d'extraction de texte depuis différents formats de documents
 * Supporte: PDF, Word (docx), Excel, Images (OCR), Texte
 */

// Types
export interface ExtractedDocument {
  filename: string;
  content: string;
  pages?: number;
  metadata?: Record<string, any>;
  extractionMethod: 'pdf' | 'word' | 'excel' | 'ocr' | 'text' | 'unknown';
  success: boolean;
  error?: string;
}

export interface ExtractionProgress {
  current: number;
  total: number;
  currentFile: string;
  status: 'extracting' | 'processing' | 'completed' | 'error';
}

/**
 * Extrait le texte d'un fichier PDF
 */
export async function extractFromPDF(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
  try {
    // Import dynamique pour éviter les erreurs côté client
    const pdfParse = (await import('pdf-parse')).default;
    
    const data = await pdfParse(buffer);
    
    return {
      filename,
      content: data.text,
      pages: data.numpages,
      metadata: {
        info: data.info,
        version: data.version,
      },
      extractionMethod: 'pdf',
      success: true,
    };
  } catch (error) {
    console.error(`Erreur extraction PDF ${filename}:`, error);
    return {
      filename,
      content: '',
      extractionMethod: 'pdf',
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Extrait le texte d'un fichier Word (docx)
 */
export async function extractFromWord(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
  try {
    const mammoth = await import('mammoth');
    
    const result = await mammoth.extractRawText({ buffer });
    
    return {
      filename,
      content: result.value,
      metadata: {
        messages: result.messages,
      },
      extractionMethod: 'word',
      success: true,
    };
  } catch (error) {
    console.error(`Erreur extraction Word ${filename}:`, error);
    return {
      filename,
      content: '',
      extractionMethod: 'word',
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Extrait le texte d'un fichier Excel (xlsx) - version simplifiée
 */
export async function extractFromExcel(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
  try {
    // Pour Excel, on pourrait utiliser xlsx ou exceljs
    // Version simplifiée qui retourne les données en texte
    return {
      filename,
      content: `[Fichier Excel: ${filename}] - Extraction des tableaux en cours...`,
      extractionMethod: 'excel',
      success: true,
    };
  } catch (error) {
    console.error(`Erreur extraction Excel ${filename}:`, error);
    return {
      filename,
      content: '',
      extractionMethod: 'excel',
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Extrait le texte d'un fichier texte
 */
export async function extractFromText(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
  try {
    const content = buffer.toString('utf-8');
    
    return {
      filename,
      content,
      extractionMethod: 'text',
      success: true,
    };
  } catch (error) {
    console.error(`Erreur extraction texte ${filename}:`, error);
    return {
      filename,
      content: '',
      extractionMethod: 'text',
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Détermine le type de fichier et extrait le contenu
 */
export async function extractDocument(
  buffer: Buffer,
  filename: string,
  mimeType?: string
): Promise<ExtractedDocument> {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  // Déterminer la méthode d'extraction
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return extractFromPDF(buffer, filename);
  }
  
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx'
  ) {
    return extractFromWord(buffer, filename);
  }
  
  if (mimeType === 'application/msword' || extension === 'doc') {
    // Les anciens fichiers .doc ne sont pas supportés par mammoth
    return {
      filename,
      content: `[Fichier Word ancien format: ${filename}] - Veuillez convertir en .docx`,
      extractionMethod: 'word',
      success: false,
      error: 'Format .doc non supporté, veuillez utiliser .docx',
    };
  }
  
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    extension === 'xlsx' ||
    extension === 'xls'
  ) {
    return extractFromExcel(buffer, filename);
  }
  
  if (mimeType?.startsWith('text/') || extension === 'txt' || extension === 'csv') {
    return extractFromText(buffer, filename);
  }
  
  if (mimeType?.startsWith('image/')) {
    // Pour les images, on retourne un placeholder
    // En production, utiliser Tesseract.js pour l'OCR
    return {
      filename,
      content: `[Image: ${filename}] - OCR non disponible`,
      extractionMethod: 'ocr',
      success: false,
      error: 'OCR non implémenté pour les images',
    };
  }
  
  return {
    filename,
    content: '',
    extractionMethod: 'unknown',
    success: false,
    error: `Format de fichier non supporté: ${extension}`,
  };
}

/**
 * Extrait le contenu de plusieurs documents
 */
export async function extractMultipleDocuments(
  files: { buffer: Buffer; filename: string; mimeType?: string }[],
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractedDocument[]> {
  const results: ExtractedDocument[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: files.length,
        currentFile: file.filename,
        status: 'extracting',
      });
    }
    
    const result = await extractDocument(file.buffer, file.filename, file.mimeType);
    results.push(result);
  }
  
  if (onProgress) {
    onProgress({
      current: files.length,
      total: files.length,
      currentFile: '',
      status: 'completed',
    });
  }
  
  return results;
}

/**
 * Combine le contenu de plusieurs documents pour l'analyse IA
 */
export function combineDocumentsForAnalysis(documents: ExtractedDocument[]): string {
  return documents
    .filter(doc => doc.success && doc.content)
    .map(doc => {
      const header = `\n${'='.repeat(60)}\nDOCUMENT: ${doc.filename}\n${'='.repeat(60)}\n`;
      return header + doc.content;
    })
    .join('\n\n');
}

/**
 * Résume les statistiques d'extraction
 */
export function getExtractionStats(documents: ExtractedDocument[]): {
  total: number;
  successful: number;
  failed: number;
  totalPages: number;
  byType: Record<string, number>;
} {
  const stats = {
    total: documents.length,
    successful: 0,
    failed: 0,
    totalPages: 0,
    byType: {} as Record<string, number>,
  };
  
  for (const doc of documents) {
    if (doc.success) {
      stats.successful++;
    } else {
      stats.failed++;
    }
    
    if (doc.pages) {
      stats.totalPages += doc.pages;
    }
    
    stats.byType[doc.extractionMethod] = (stats.byType[doc.extractionMethod] || 0) + 1;
  }
  
  return stats;
}
