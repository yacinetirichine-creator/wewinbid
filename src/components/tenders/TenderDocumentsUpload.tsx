'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  File,
  FileImage,
  Trash2,
  Plus,
  Sparkles,
  Eye,
  FileSearch,
} from 'lucide-react';
import { Button, Card, Badge, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'tenderDocsUpload.drop.title': 'Drop the tender documents here',
  'tenderDocsUpload.drop.subtitlePrefix': 'or',
  'tenderDocsUpload.drop.browse': 'browse',
  'tenderDocsUpload.drop.subtitleSuffix': 'to select',
  'tenderDocsUpload.drop.maxPerFile': 'Max {size} MB per file',
  'tenderDocsUpload.fileTypes.pdf': 'PDF',
  'tenderDocsUpload.fileTypes.word': 'Word',
  'tenderDocsUpload.fileTypes.excel': 'Excel',
  'tenderDocsUpload.fileTypes.images': 'Images',
  'tenderDocsUpload.uploaded.title': 'Uploaded documents ({count})',
  'tenderDocsUpload.uploaded.removeAll': 'Remove all',
  'tenderDocsUpload.file.words': '{count} words',
  'tenderDocsUpload.file.extractedBadge': 'Extracted',
  'tenderDocsUpload.file.previewTitle': 'Preview content',
  'tenderDocsUpload.extracting.title': 'Extracting content...',
  'tenderDocsUpload.extracting.filesExtracted': '{count} extracted files',
  'tenderDocsUpload.extracting.wordsTotal': '{count} total words',
  'tenderDocsUpload.analyze.analyzing': 'Analysis in progress...',
  'tenderDocsUpload.analyze.extracting': 'Extracting...',
  'tenderDocsUpload.analyze.cta': 'Analyze with AI',
  'tenderDocsUpload.alerts.maxFiles': 'You can’t upload more than {max} files',
  'tenderDocsUpload.alerts.fileTooLarge': 'File {name} exceeds the {max} MB limit',
  'tenderDocsUpload.preview.wordsExtracted': '{count} extracted words',
} as const;

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error' | 'extracting' | 'extracted';
  progress: number;
  url?: string;
  extractedContent?: string;
  wordCount?: number;
}

interface TenderDocumentsUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  onAnalyzeRequest: (files: UploadedFile[]) => void;
  isAnalyzing?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // en MB
  autoExtract?: boolean; // Extraire automatiquement le contenu
}

// Types de fichiers acceptés
const ACCEPTED_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', color: 'text-red-500', extractable: true },
  'application/msword': { icon: FileText, label: 'DOC', color: 'text-blue-500', extractable: true },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'DOCX', color: 'text-blue-500', extractable: true },
  'application/vnd.ms-excel': { icon: FileText, label: 'XLS', color: 'text-green-500', extractable: true },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, label: 'XLSX', color: 'text-green-500', extractable: true },
  'image/jpeg': { icon: FileImage, label: 'JPG', color: 'text-purple-500', extractable: false },
  'image/png': { icon: FileImage, label: 'PNG', color: 'text-purple-500', extractable: false },
  'text/plain': { icon: FileText, label: 'TXT', color: 'text-gray-500', extractable: true },
};

export function TenderDocumentsUpload({
  onFilesChange,
  onAnalyzeRequest,
  isAnalyzing = false,
  maxFiles = 20,
  maxFileSize = 50, // 50 MB par défaut
  autoExtract = true,
}: TenderDocumentsUploadProps) {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    const config = ACCEPTED_TYPES[type as keyof typeof ACCEPTED_TYPES];
    return config || { icon: File, label: 'FILE', color: 'text-gray-400', extractable: false };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Extraire le contenu des fichiers via l'API
  const extractDocuments = async (uploadedFiles: UploadedFile[]): Promise<UploadedFile[]> => {
    const extractableFiles = uploadedFiles.filter(f => {
      const config = ACCEPTED_TYPES[f.type as keyof typeof ACCEPTED_TYPES];
      return config?.extractable;
    });

    if (extractableFiles.length === 0) return uploadedFiles;

    setIsExtracting(true);
    setExtractionProgress(0);

    try {
      const formData = new FormData();
      extractableFiles.forEach(f => formData.append('files', f.file));

      const response = await fetch('/api/tenders/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Extraction failed');

      const data = await response.json();
      
      // Mettre à jour les fichiers avec le contenu extrait
      const updatedFiles = uploadedFiles.map(file => {
        const extracted = data.extractedDocuments?.find(
          (d: any) => d.filename === file.name
        );
        if (extracted) {
          return {
            ...file,
            status: 'extracted' as const,
            extractedContent: extracted.contentPreview,
            wordCount: extracted.wordCount,
          };
        }
        return file;
      });

      setExtractionProgress(100);
      return updatedFiles;
    } catch (error) {
      console.error('Erreur extraction:', error);
      return uploadedFiles;
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Vérifier le nombre max de fichiers
    if (files.length + fileArray.length > maxFiles) {
      alert(t('tenderDocsUpload.alerts.maxFiles', { max: maxFiles }));
      return;
    }

    let uploadedFiles: UploadedFile[] = fileArray
      .filter(file => {
        // Vérifier la taille
        if (file.size > maxFileSize * 1024 * 1024) {
          alert(t('tenderDocsUpload.alerts.fileTooLarge', { name: file.name, max: maxFileSize }));
          return false;
        }
        return true;
      })
      .map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'success' as const,
        progress: 100,
      }));

    // Extraire automatiquement si activé
    if (autoExtract && uploadedFiles.length > 0) {
      uploadedFiles = await extractDocuments(uploadedFiles);
    }

    const newFilesList = [...files, ...uploadedFiles];
    setFiles(newFilesList);
    onFilesChange(newFilesList);
  }, [files, maxFiles, maxFileSize, onFilesChange, autoExtract, t]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleAnalyze = () => {
    if (files.length > 0) {
      onAnalyzeRequest(files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragOver 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-surface-300 hover:border-primary-400 hover:bg-surface-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            'p-4 rounded-2xl transition-colors',
            isDragOver ? 'bg-primary-100' : 'bg-surface-100'
          )}>
            <Upload className={cn(
              'w-10 h-10 transition-colors',
              isDragOver ? 'text-primary-600' : 'text-surface-400'
            )} />
          </div>
          
          <div>
            <p className="text-lg font-semibold text-surface-900">
              {t('tenderDocsUpload.drop.title')}
            </p>
            <p className="text-sm text-surface-500 mt-1">
                {t('tenderDocsUpload.drop.subtitlePrefix')}{' '}
                <span className="text-primary-600 font-medium">{t('tenderDocsUpload.drop.browse')}</span>{' '}
                {t('tenderDocsUpload.drop.subtitleSuffix')}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-surface-400">
            <span>{t('tenderDocsUpload.fileTypes.pdf')}</span>
            <span>•</span>
            <span>{t('tenderDocsUpload.fileTypes.word')}</span>
            <span>•</span>
            <span>{t('tenderDocsUpload.fileTypes.excel')}</span>
            <span>•</span>
            <span>{t('tenderDocsUpload.fileTypes.images')}</span>
            <span className="ml-2 text-surface-300">|</span>
            <span>{t('tenderDocsUpload.drop.maxPerFile', { size: maxFileSize })}</span>
          </div>
        </div>
      </div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-surface-900">
              {t('tenderDocsUpload.uploaded.title', { count: files.length })}
            </h4>
            <button
              onClick={() => {
                setFiles([]);
                onFilesChange([]);
              }}
              className="text-sm text-surface-500 hover:text-red-500 transition-colors"
            >
              {t('tenderDocsUpload.uploaded.removeAll')}
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {files.map((file) => {
                const fileConfig = getFileIcon(file.type);
                const FileIcon = fileConfig.icon;
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-200 group"
                  >
                    <div className={cn('p-2 rounded-lg bg-surface-50', fileConfig.color)}>
                      <FileIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-surface-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{fileConfig.label}</span>
                        {file.status === 'extracted' && file.wordCount && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">{t('tenderDocsUpload.file.words', { count: file.wordCount })}</span>
                          </>
                        )}
                        {file.status === 'success' && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                        {file.status === 'extracted' && (
                          <Badge variant="success" className="text-[10px] py-0 px-1">{t('tenderDocsUpload.file.extractedBadge')}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {file.extractedContent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(file);
                          }}
                          className="p-1.5 text-surface-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                          title={t('tenderDocsUpload.file.previewTitle')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Bouton d'analyse */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          {/* Barre de progression extraction */}
          {isExtracting && (
            <div className="w-full max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <FileSearch className="w-4 h-4 text-primary-600 animate-pulse" />
                <span className="text-sm text-surface-600">{t('tenderDocsUpload.extracting.title')}</span>
              </div>
              <Progress value={extractionProgress} className="h-2" />
            </div>
          )}

          {/* Stats d'extraction */}
          {files.some(f => f.status === 'extracted') && !isExtracting && (
            <div className="flex items-center gap-4 text-sm text-surface-600">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t('tenderDocsUpload.extracting.filesExtracted', { count: files.filter(f => f.status === 'extracted').length })}
              </span>
              <span>
                {t('tenderDocsUpload.extracting.wordsTotal', { count: files.reduce((acc, f) => acc + (f.wordCount || 0), 0).toLocaleString(locale) })}
              </span>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing || isExtracting}
            className="px-8 shadow-lg shadow-primary-500/25"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('tenderDocsUpload.analyze.analyzing')}
              </>
            ) : isExtracting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('tenderDocsUpload.analyze.extracting')}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t('tenderDocsUpload.analyze.cta')}
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Modal aperçu contenu */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-200">
                <div>
                  <h3 className="font-semibold text-surface-900">{previewFile.name}</h3>
                  <p className="text-sm text-surface-500">
                    {previewFile.wordCount
                      ? t('tenderDocsUpload.preview.wordsExtracted', { count: previewFile.wordCount.toLocaleString(locale) })
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[60vh]">
                <pre className="whitespace-pre-wrap text-sm text-surface-700 font-mono bg-surface-50 p-4 rounded-lg">
                  {previewFile.extractedContent}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TenderDocumentsUpload;
