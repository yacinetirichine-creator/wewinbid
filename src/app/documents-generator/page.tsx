'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
} from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Sparkles,
  Save,
  Send,
  Clock,
  CheckCircle2,
  X,
  Copy,
  FileSignature,
} from 'lucide-react';
import { formatDistance } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { LOCALES, LOCALE_NAMES, LOCALE_FLAGS } from '@/lib/i18n';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

// Dynamically import React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

// Types
interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  content: any;
  variables: any[];
  is_default: boolean;
  usage_count: number;
  created_at: string;
}

interface GeneratedDocument {
  id: string;
  title: string;
  category: string;
  content: any;
  status: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  pdf_url?: string;
  tender?: any;
  creator?: any;
}

const CATEGORIES = [
  { value: 'proposal', labelKey: 'documentsGenerator.category.proposal', icon: FileText },
  { value: 'cover_letter', labelKey: 'documentsGenerator.category.coverLetter', icon: FileText },
  { value: 'technical_response', labelKey: 'documentsGenerator.category.technicalResponse', icon: FileText },
  { value: 'cv', labelKey: 'documentsGenerator.category.cv', icon: FileText },
  { value: 'other', labelKey: 'documentsGenerator.category.other', icon: FileText },
] as const;

function useDocumentsGeneratorI18n() {
  const { locale } = useLocale();
  const entries = useMemo(
    () => ({
      'documentsGenerator.title': 'Documents',
      'documentsGenerator.subtitle': 'Create and manage your business documents with AI assistance',

      'documentsGenerator.action.generateWithAi': 'Generate with AI',
      'documentsGenerator.action.newDocument': 'New document',
      'documentsGenerator.action.newTemplate': 'New template',
      'documentsGenerator.action.createTemplate': 'Create a template',
      'documentsGenerator.action.edit': 'Edit',
      'documentsGenerator.action.close': 'Close',
      'documentsGenerator.action.cancel': 'Cancel',
      'documentsGenerator.action.save': 'Save',
      'documentsGenerator.action.saving': 'Saving…',
      'documentsGenerator.action.generate': 'Generate',
      'documentsGenerator.action.generating': 'Generating…',

      'documentsGenerator.stats.documents': 'Documents',
      'documentsGenerator.stats.aiGenerated': 'AI-generated',
      'documentsGenerator.stats.finalized': 'Finalized',
      'documentsGenerator.stats.templates': 'Templates',

      'documentsGenerator.tab.documents': 'Documents',
      'documentsGenerator.tab.templates': 'Templates',

      'documentsGenerator.filter.allCategories': 'All categories',
      'documentsGenerator.filter.allStatuses': 'All statuses',
      'documentsGenerator.status.draft': 'Draft',
      'documentsGenerator.status.final': 'Final',
      'documentsGenerator.status.sent': 'Sent',
      'documentsGenerator.status.signed': 'Signed',

      'documentsGenerator.loading': 'Loading…',
      'documentsGenerator.empty.documents.title': 'No documents yet',
      'documentsGenerator.empty.documents.description': 'Create your first document or use AI to generate content.',
      'documentsGenerator.empty.templates.title': 'No templates yet',
      'documentsGenerator.empty.templates.description': 'Create reusable templates to save time.',

      'documentsGenerator.card.status': 'Status',
      'documentsGenerator.card.created': 'Created',
      'documentsGenerator.card.tender': 'Tender',
      'documentsGenerator.badge.ai': 'AI',

      'documentsGenerator.template.default': 'Default',
      'documentsGenerator.template.uses': 'Uses',

      'documentsGenerator.confirm.deleteDocument': 'Delete this document?',
      'documentsGenerator.confirm.deleteTemplate': 'Delete this template?',

      'documentsGenerator.editor.editDocument': 'Edit document',
      'documentsGenerator.editor.newDocument': 'New document',
      'documentsGenerator.editor.title': 'Title',
      'documentsGenerator.editor.titlePlaceholder': 'Document title',
      'documentsGenerator.editor.category': 'Category',
      'documentsGenerator.editor.content': 'Content',

      'documentsGenerator.templateEditor.editTemplate': 'Edit template',
      'documentsGenerator.templateEditor.newTemplate': 'New template',
      'documentsGenerator.templateEditor.todo': 'Template editor (to be implemented)',

      'documentsGenerator.ai.title': 'Generate with AI',
      'documentsGenerator.ai.documentType': 'Document type',
      'documentsGenerator.ai.generationLanguage': 'Generation language',
      'documentsGenerator.ai.promptLabel': 'Describe what you want to generate',
      'documentsGenerator.ai.promptPlaceholder': 'e.g. Create a commercial proposal for a web development project…',

      'documentsGenerator.category.proposal': 'Business proposal',
      'documentsGenerator.category.coverLetter': 'Cover letter',
      'documentsGenerator.category.technicalResponse': 'Technical response',
      'documentsGenerator.category.cv': 'CV / Company profile',
      'documentsGenerator.category.other': 'Other',
    }),
    []
  );
  const { t } = useUiTranslations(locale, entries);
  const dateFnsLocale = locale === 'fr' ? fr : enUS;
  return { t, locale, dateFnsLocale };
}

export default function DocumentsPage() {
  const { t } = useDocumentsGeneratorI18n();
  const [activeTab, setActiveTab] = useState<'documents' | 'templates'>('documents');
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/documents/generate?';
      if (categoryFilter) url += `category=${categoryFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const { documents: data } = await fetch(url).then((r) => r.json());
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/api/documents/templates?';
      if (categoryFilter) url += `category=${categoryFilter}&`;

      const { templates: data } = await fetch(url).then((r) => r.json());
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    } else {
      fetchTemplates();
    }
  }, [activeTab, fetchDocuments, fetchTemplates]);

  const handleCreateDocument = () => {
    setSelectedDocument(null);
    setShowEditor(true);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowTemplateEditor(true);
  };

  const handleEditDocument = (doc: GeneratedDocument) => {
    setSelectedDocument(doc);
    setShowEditor(true);
  };

  const handleEditTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm(t('documentsGenerator.confirm.deleteDocument'))) return;

    try {
      await fetch(`/api/documents/generate?id=${id}`, { method: 'DELETE' });
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(t('documentsGenerator.confirm.deleteTemplate'))) return;

    try {
      await fetch(`/api/documents/templates?id=${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'warning' | 'success' | 'danger'> = {
      draft: 'default',
      final: 'warning',
      sent: 'success',
      signed: 'success',
    };
    const label = t(`documentsGenerator.status.${status}`);
    return <Badge variant={variants[status] || 'default'}>{label}</Badge>;
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('documentsGenerator.title')}
        description={t('documentsGenerator.subtitle')}
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setShowAIGenerator(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              {t('documentsGenerator.action.generateWithAi')}
            </Button>
            {activeTab === 'documents' ? (
              <Button variant="primary" onClick={handleCreateDocument}>
                <Plus className="w-4 h-4 mr-2" />
                {t('documentsGenerator.action.newDocument')}
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                {t('documentsGenerator.action.newTemplate')}
              </Button>
            )}
          </div>
        }
      />

      <div className="px-4 sm:px-6 pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                  <p className="text-sm text-gray-500">{t('documentsGenerator.stats.documents')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.filter((d) => d.ai_generated).length}
                  </p>
                  <p className="text-sm text-gray-500">{t('documentsGenerator.stats.aiGenerated')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {documents.filter((d) => d.status === 'final' || d.status === 'sent').length}
                  </p>
                  <p className="text-sm text-gray-500">{t('documentsGenerator.stats.finalized')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Copy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                  <p className="text-sm text-gray-500">{t('documentsGenerator.stats.templates')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'documents'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t('documentsGenerator.tab.documents')} ({documents.length})
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'templates'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t('documentsGenerator.tab.templates')} ({templates.length})
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <select
                  className="px-4 py-2 border border-gray-200 rounded-xl bg-white"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">{t('documentsGenerator.filter.allCategories')}</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {t(cat.labelKey)}
                    </option>
                  ))}
                </select>

                {activeTab === 'documents' && (
                  <select
                    className="px-4 py-2 border border-gray-200 rounded-xl bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">{t('documentsGenerator.filter.allStatuses')}</option>
                    <option value="draft">{t('documentsGenerator.status.draft')}</option>
                    <option value="final">{t('documentsGenerator.status.final')}</option>
                    <option value="sent">{t('documentsGenerator.status.sent')}</option>
                    <option value="signed">{t('documentsGenerator.status.signed')}</option>
                  </select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">{t('documentsGenerator.loading')}</p>
          </div>
        ) : activeTab === 'documents' ? (
          documents.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('documentsGenerator.empty.documents.title')}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t('documentsGenerator.empty.documents.description')}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setShowAIGenerator(true)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('documentsGenerator.action.generateWithAi')}
                  </Button>
                  <Button variant="primary" onClick={handleCreateDocument}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('documentsGenerator.action.newDocument')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onEdit={() => handleEditDocument(doc)}
                  onDelete={() => handleDeleteDocument(doc.id)}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </div>
          )
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Copy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('documentsGenerator.empty.templates.title')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('documentsGenerator.empty.templates.description')}
              </p>
              <Button variant="primary" onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                {t('documentsGenerator.action.createTemplate')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEditTemplate(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document Editor Modal */}
      {showEditor && (
        <DocumentEditor
          document={selectedDocument}
          onClose={() => {
            setShowEditor(false);
            setSelectedDocument(null);
            fetchDocuments();
          }}
        />
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => {
            setShowTemplateEditor(false);
            setSelectedTemplate(null);
            fetchTemplates();
          }}
        />
      )}

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <AIGenerator
          onClose={() => setShowAIGenerator(false)}
          onGenerated={() => {
            setShowAIGenerator(false);
            fetchDocuments();
          }}
        />
      )}
    </AppLayout>
  );
}

// Document Card Component
function DocumentCard({
  document,
  onEdit,
  onDelete,
  getStatusBadge,
}: {
  document: GeneratedDocument;
  onEdit: () => void;
  onDelete: () => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const { t, dateFnsLocale } = useDocumentsGeneratorI18n();
  const category = CATEGORIES.find((c) => c.value === document.category);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {document.title}
              </h3>
              <p className="text-xs text-gray-500">{category ? t(category.labelKey) : ''}</p>
            </div>
          </div>
          {document.ai_generated && (
            <Badge variant="default" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {t('documentsGenerator.badge.ai')}
            </Badge>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('documentsGenerator.card.status')}</span>
            {getStatusBadge(document.status)}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('documentsGenerator.card.created')}</span>
            <span className="text-gray-900">
              {formatDistance(new Date(document.created_at), new Date(), {
                addSuffix: true,
                locale: dateFnsLocale,
              })}
            </span>
          </div>
          {document.tender && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t('documentsGenerator.card.tender')}</span>
              <span className="text-gray-900 line-clamp-1">{document.tender.title}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-1" />
            {t('documentsGenerator.action.edit')}
          </Button>
          {document.pdf_url && (
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Template Card Component
function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: DocumentTemplate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useDocumentsGeneratorI18n();
  const category = CATEGORIES.find((c) => c.value === template.category);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Copy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {template.name}
              </h3>
              <p className="text-xs text-gray-500">{category ? t(category.labelKey) : ''}</p>
            </div>
          </div>
          {template.is_default && (
            <Badge variant="success" className="text-xs">
              {t('documentsGenerator.template.default')}
            </Badge>
          )}
        </div>

        {template.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-gray-500">{t('documentsGenerator.template.uses')}</span>
          <span className="font-semibold text-gray-900">{template.usage_count}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-1" />
            {t('documentsGenerator.action.edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Document Editor Component (simplified)
function DocumentEditor({
  document,
  onClose,
}: {
  document: GeneratedDocument | null;
  onClose: () => void;
}) {
  const { t } = useDocumentsGeneratorI18n();
  const [title, setTitle] = useState(document?.title || '');
  const [category, setCategory] = useState(document?.category || 'proposal');
  const [content, setContent] = useState(document?.content?.sections?.[0]?.content || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (document?.content?.sections?.length) {
      setContent(document.content.sections[0]?.content || '');
    }
  }, [document]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        category,
        content: {
          sections: [{ id: 'main', title: 'Content', content, order: 1 }],
        },
      };

      if (document) {
        await fetch('/api/documents/generate', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: document.id, ...payload }),
        });
      } else {
        await fetch('/api/documents/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {document ? t('documentsGenerator.editor.editDocument') : t('documentsGenerator.editor.newDocument')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documentsGenerator.editor.title')}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('documentsGenerator.editor.titlePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documentsGenerator.editor.category')}
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {t(cat.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documentsGenerator.editor.content')}
            </label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              style={{ height: '400px', marginBottom: '50px' }}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('documentsGenerator.action.cancel')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSave}
            disabled={!title || saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('documentsGenerator.action.saving') : t('documentsGenerator.action.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Template Editor (simplified - similar to DocumentEditor)
function TemplateEditor({
  template,
  onClose,
}: {
  template: DocumentTemplate | null;
  onClose: () => void;
}) {
  const { t } = useDocumentsGeneratorI18n();
  const [name, setName] = useState(template?.name || '');
  const [category, setCategory] = useState(template?.category || 'proposal');
  const [content, setContent] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">
            {template ? t('documentsGenerator.templateEditor.editTemplate') : t('documentsGenerator.templateEditor.newTemplate')}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-500">{t('documentsGenerator.templateEditor.todo')}</p>
        </div>
        <div className="p-6 border-t flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('documentsGenerator.action.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// AI Generator Component
function AIGenerator({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: () => void;
}) {
  const { t } = useDocumentsGeneratorI18n();
  const [prompt, setPrompt] = useState('');
  const [generationType, setGenerationType] = useState('proposal');
  const [language, setLanguage] = useState('fr');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { content, model } = await fetch('/api/documents/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generation_type: generationType,
          prompt,
          language,
          context: {},
        }),
      }).then((r) => r.json());

      // Create document with generated content
      await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: prompt.substring(0, 100),
          category: generationType,
          content: {
            sections: [{ id: 'main', title: 'Contenu', content, order: 1 }],
          },
          ai_generated: true,
          ai_prompt: prompt,
          ai_model: model || 'gpt-4o-mini',
          variables_data: {
            language,
          },
        }),
      });

      onGenerated();
    } catch (error) {
      console.error('Error generating:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            {t('documentsGenerator.ai.title')}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documentsGenerator.ai.documentType')}
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              value={generationType}
              onChange={(e) => setGenerationType(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {t(cat.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documentsGenerator.ai.generationLanguage')}
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LOCALES.map((locale) => (
                <option key={locale} value={locale}>
                  {LOCALE_FLAGS[locale]} {LOCALE_NAMES[locale]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('documentsGenerator.ai.promptLabel')}
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
              rows={6}
              placeholder={t('documentsGenerator.ai.promptPlaceholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('documentsGenerator.action.cancel')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleGenerate}
            disabled={!prompt || generating}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? t('documentsGenerator.action.generating') : t('documentsGenerator.action.generate')}
          </Button>
        </div>
      </div>
    </div>
  );
}
