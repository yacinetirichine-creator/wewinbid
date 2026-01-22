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
} from 'lucide-react';
import { Button, Card, Badge, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
}

interface TenderDocumentsUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  onAnalyzeRequest: (files: UploadedFile[]) => void;
  isAnalyzing?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // en MB
}

// Types de fichiers acceptés
const ACCEPTED_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', color: 'text-red-500' },
  'application/msword': { icon: FileText, label: 'DOC', color: 'text-blue-500' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'DOCX', color: 'text-blue-500' },
  'application/vnd.ms-excel': { icon: FileText, label: 'XLS', color: 'text-green-500' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, label: 'XLSX', color: 'text-green-500' },
  'image/jpeg': { icon: FileImage, label: 'JPG', color: 'text-purple-500' },
  'image/png': { icon: FileImage, label: 'PNG', color: 'text-purple-500' },
  'text/plain': { icon: FileText, label: 'TXT', color: 'text-gray-500' },
};

export function TenderDocumentsUpload({
  onFilesChange,
  onAnalyzeRequest,
  isAnalyzing = false,
  maxFiles = 20,
  maxFileSize = 50, // 50 MB par défaut
}: TenderDocumentsUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    const config = ACCEPTED_TYPES[type as keyof typeof ACCEPTED_TYPES];
    return config || { icon: File, label: 'FILE', color: 'text-gray-400' };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Vérifier le nombre max de fichiers
    if (files.length + fileArray.length > maxFiles) {
      alert(`Vous ne pouvez pas uploader plus de ${maxFiles} fichiers`);
      return;
    }

    const uploadedFiles: UploadedFile[] = fileArray
      .filter(file => {
        // Vérifier la taille
        if (file.size > maxFileSize * 1024 * 1024) {
          alert(`Le fichier ${file.name} dépasse la limite de ${maxFileSize} MB`);
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

    const newFilesList = [...files, ...uploadedFiles];
    setFiles(newFilesList);
    onFilesChange(newFilesList);
  }, [files, maxFiles, maxFileSize, onFilesChange]);

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
              Déposez les documents de l'appel d'offres ici
            </p>
            <p className="text-sm text-surface-500 mt-1">
              ou <span className="text-primary-600 font-medium">parcourez</span> pour sélectionner
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-surface-400">
            <span>PDF</span>
            <span>•</span>
            <span>Word</span>
            <span>•</span>
            <span>Excel</span>
            <span>•</span>
            <span>Images</span>
            <span className="ml-2 text-surface-300">|</span>
            <span>Max {maxFileSize} MB par fichier</span>
          </div>
        </div>
      </div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-surface-900">
              Documents uploadés ({files.length})
            </h4>
            <button
              onClick={() => {
                setFiles([]);
                onFilesChange([]);
              }}
              className="text-sm text-surface-500 hover:text-red-500 transition-colors"
            >
              Tout supprimer
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
                        {file.status === 'success' && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
          className="flex justify-center"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-8 shadow-lg shadow-primary-500/25"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyser avec l'IA
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default TenderDocumentsUpload;
