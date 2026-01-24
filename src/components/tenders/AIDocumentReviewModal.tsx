'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  AlertCircle,
  Edit3,
  RotateCcw,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react';
import { Button, Card, Textarea, Badge } from '@/components/ui';
import type { GeneratedDocument, DocumentSection } from '@/lib/ai-document-generator';

interface AIDocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument;
  onApprove: (document: GeneratedDocument) => void;
  onReject: (document: GeneratedDocument, feedback: string) => void;
  onRegenerate: (sectionId?: string) => void;
  onEdit: (document: GeneratedDocument) => void;
}

export function AIDocumentReviewModal({
  isOpen,
  onClose,
  document,
  onApprove,
  onReject,
  onRegenerate,
  onEdit,
}: AIDocumentReviewModalProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSectionEdit = (sectionId: string, content: string) => {
    setEditedContent(prev => ({ ...prev, [sectionId]: content }));
  };

  const handleSaveSection = (sectionId: string) => {
    const updatedDocument = {
      ...document,
      sections: document.sections.map(s =>
        s.id === sectionId
          ? { ...s, content: editedContent[sectionId] || s.content, isEdited: true }
          : s
      ),
    };
    onEdit(updatedDocument);
    setEditingSection(null);
  };

  const handleCopyContent = async () => {
    await navigator.clipboard.writeText(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = () => {
    onApprove(document);
    onClose();
  };

  const handleReject = () => {
    if (feedback.trim()) {
      onReject(document, feedback);
      onClose();
    } else {
      setShowFeedbackInput(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-surface-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-surface-900">
                  Révision du document
                </h2>
                <p className="text-sm text-surface-500 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {document.title}
                  <Badge variant="secondary" className="ml-2">
                    v{document.version}
                  </Badge>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
            >
              <X className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between mb-6 p-4 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm text-surface-500">
                  Généré par {document.provider === 'openai' ? 'GPT-4' : 'Claude'} le{' '}
                  {new Date(document.generatedAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyContent}
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-success-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copié' : 'Copier'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRegenerate()}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Régénérer tout
                </Button>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {document.sections.map((section, index) => (
                <Card
                  key={section.id}
                  className={`overflow-hidden transition-all ${
                    activeSection === section.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  {/* Section Header */}
                  <button
                    onClick={() =>
                      setActiveSection(activeSection === section.id ? null : section.id)
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </span>
                      <div className="text-left">
                        <h3 className="font-semibold text-surface-900">
                          {section.title}
                        </h3>
                        {section.isEdited && (
                          <Badge variant="warning" className="text-xs mt-1">
                            Modifié
                          </Badge>
                        )}
                      </div>
                    </div>
                    {activeSection === section.id ? (
                      <ChevronUp className="w-5 h-5 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-400" />
                    )}
                  </button>

                  {/* Section Content */}
                  <AnimatePresence>
                    {activeSection === section.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 border-t border-surface-100">
                          {editingSection === section.id ? (
                            <div className="space-y-4">
                              <Textarea
                                value={editedContent[section.id] ?? section.content}
                                onChange={(e) =>
                                  handleSectionEdit(section.id, e.target.value)
                                }
                                rows={10}
                                className="font-mono text-sm"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingSection(null)}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveSection(section.id)}
                                  className="bg-primary-600 text-white"
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="prose prose-sm max-w-none mb-4 text-surface-700 whitespace-pre-wrap">
                                {editedContent[section.id] ?? section.content}
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingSection(section.id)}
                                  >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Modifier
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRegenerate(section.id)}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Régénérer
                                  </Button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>

            {/* Feedback Input */}
            {showFeedbackInput && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 mb-2">
                      Pourquoi refusez-vous ce document ?
                    </p>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Décrivez les problèmes ou améliorations souhaitées..."
                      rows={3}
                      className="mb-3"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFeedbackInput(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          onReject(document, feedback);
                          onClose();
                        }}
                        className="bg-red-600 text-white hover:bg-red-700"
                        disabled={!feedback.trim()}
                      >
                        Confirmer le refus
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-6 border-t border-surface-200 bg-surface-50">
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <AlertCircle className="w-4 h-4" />
              <span>Relisez attentivement avant d'approuver</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleReject}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Refuser
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-success-600 hover:bg-success-700 text-white"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Approuver et continuer
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AIDocumentReviewModal;
