'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card, Badge, Modal } from '@/components/ui';
import { 
  Search, Upload, FileText, FilePlus, Trash2, Download, Eye, 
  FolderOpen, CheckCircle, XCircle, Clock, Filter, Grid, List,
  File, FileImage, FileSpreadsheet, Archive, MoreVertical
} from 'lucide-react';

// Types
interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  category: DocumentCategory;
  status: DocumentStatus;
  tender_id?: string;
  tender_title?: string;
  uploaded_at: string;
  expires_at?: string;
  url?: string;
}

type DocumentCategory = 
  | 'ADMINISTRATIVE' 
  | 'FINANCIAL' 
  | 'TECHNICAL' 
  | 'LEGAL' 
  | 'INSURANCE'
  | 'REFERENCE'
  | 'OTHER';

type DocumentStatus = 'VALID' | 'EXPIRED' | 'PENDING' | 'REJECTED';

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string; icon: any }> = {
  ADMINISTRATIVE: { label: 'Administratif', color: 'bg-blue-100 text-blue-800', icon: FileText },
  FINANCIAL: { label: 'Financier', color: 'bg-green-100 text-green-800', icon: FileSpreadsheet },
  TECHNICAL: { label: 'Technique', color: 'bg-purple-100 text-purple-800', icon: File },
  LEGAL: { label: 'Juridique', color: 'bg-orange-100 text-orange-800', icon: FileText },
  INSURANCE: { label: 'Assurance', color: 'bg-yellow-100 text-yellow-800', icon: Archive },
  REFERENCE: { label: 'Référence', color: 'bg-indigo-100 text-indigo-800', icon: FolderOpen },
  OTHER: { label: 'Autre', color: 'bg-gray-100 text-gray-800', icon: File },
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; icon: any }> = {
  VALID: { label: 'Valide', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  EXPIRED: { label: 'Expiré', color: 'bg-red-100 text-red-800', icon: XCircle },
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800', icon: XCircle },
};

// Document templates for quick creation
const DOCUMENT_TEMPLATES = [
  { name: 'KBIS / Extrait RCS', category: 'ADMINISTRATIVE' as DocumentCategory, description: 'Extrait Kbis de moins de 3 mois' },
  { name: 'Attestation fiscale', category: 'FINANCIAL' as DocumentCategory, description: 'Attestation de régularité fiscale' },
  { name: 'Attestation URSSAF', category: 'FINANCIAL' as DocumentCategory, description: 'Attestation de vigilance URSSAF' },
  { name: 'Attestation assurance RC', category: 'INSURANCE' as DocumentCategory, description: 'Responsabilité civile professionnelle' },
  { name: 'Attestation décennale', category: 'INSURANCE' as DocumentCategory, description: 'Assurance décennale (BTP)' },
  { name: 'Références clients', category: 'REFERENCE' as DocumentCategory, description: 'Liste de références et attestations' },
  { name: 'Certifications', category: 'TECHNICAL' as DocumentCategory, description: 'ISO, Qualibat, etc.' },
  { name: 'Organigramme', category: 'ADMINISTRATIVE' as DocumentCategory, description: 'Structure de l\'entreprise' },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'OTHER' as DocumentCategory,
    expiresAt: '',
    file: null as File | null,
  });

  const supabase = createClient();

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      // Simulated data for demo
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'KBIS_JARVIS_2025.pdf',
          type: 'application/pdf',
          size: 245000,
          category: 'ADMINISTRATIVE',
          status: 'VALID',
          uploaded_at: '2025-01-10T10:00:00Z',
          expires_at: '2025-04-10T10:00:00Z',
        },
        {
          id: '2',
          name: 'Attestation_fiscale_2024.pdf',
          type: 'application/pdf',
          size: 180000,
          category: 'FINANCIAL',
          status: 'VALID',
          uploaded_at: '2025-01-05T14:30:00Z',
          expires_at: '2025-07-05T14:30:00Z',
        },
        {
          id: '3',
          name: 'RC_Pro_AXA_2024.pdf',
          type: 'application/pdf',
          size: 520000,
          category: 'INSURANCE',
          status: 'EXPIRED',
          uploaded_at: '2024-01-15T09:00:00Z',
          expires_at: '2025-01-15T09:00:00Z',
        },
        {
          id: '4',
          name: 'References_clients_2024.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 89000,
          category: 'REFERENCE',
          status: 'VALID',
          uploaded_at: '2024-12-20T11:00:00Z',
        },
        {
          id: '5',
          name: 'ISO_27001_Certificate.pdf',
          type: 'application/pdf',
          size: 1200000,
          category: 'TECHNICAL',
          status: 'VALID',
          uploaded_at: '2024-06-01T08:00:00Z',
          expires_at: '2027-06-01T08:00:00Z',
        },
        {
          id: '6',
          name: 'Memoire_technique_template.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 450000,
          category: 'TECHNICAL',
          status: 'VALID',
          uploaded_at: '2025-01-08T16:00:00Z',
        },
      ];
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Check if document is expiring soon (within 30 days)
  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.includes('image')) return FileImage;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    return FileText;
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const stats = {
    total: documents.length,
    valid: documents.filter(d => d.status === 'VALID').length,
    expired: documents.filter(d => d.status === 'EXPIRED').length,
    expiringSoon: documents.filter(d => isExpiringSoon(d.expires_at)).length,
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name) return;
    
    // In production, upload to Supabase Storage
    const newDoc: Document = {
      id: Date.now().toString(),
      name: uploadForm.name,
      type: uploadForm.file.type,
      size: uploadForm.file.size,
      category: uploadForm.category,
      status: 'VALID',
      uploaded_at: new Date().toISOString(),
      expires_at: uploadForm.expiresAt || undefined,
    };
    
    setDocuments([newDoc, ...documents]);
    setShowUploadModal(false);
    setUploadForm({ name: '', category: 'OTHER', expiresAt: '', file: null });
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedDocument) return;
    setDocuments(documents.filter(d => d.id !== selectedDocument.id));
    setShowDeleteModal(false);
    setSelectedDocument(null);
  };

  // Document card component
  const DocumentCard = ({ doc }: { doc: Document }) => {
    const CategoryIcon = CATEGORY_CONFIG[doc.category].icon;
    const StatusIcon = STATUS_CONFIG[doc.status].icon;
    const FileIcon = getFileIcon(doc.type);
    
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-gray-100 rounded-lg">
            <FileIcon className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate" title={doc.name}>
              {doc.name}
            </h3>
            <p className="text-sm text-gray-500">{formatSize(doc.size)}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${CATEGORY_CONFIG[doc.category].color}`}>
                <CategoryIcon className="w-3 h-3" />
                {CATEGORY_CONFIG[doc.category].label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${STATUS_CONFIG[doc.status].color}`}>
                <StatusIcon className="w-3 h-3" />
                {STATUS_CONFIG[doc.status].label}
              </span>
              {isExpiringSoon(doc.expires_at) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                  <Clock className="w-3 h-3" />
                  Expire bientôt
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="text-xs text-gray-500">
                {formatDate(doc.uploaded_at)}
                {doc.expires_at && ` • Expire: ${formatDate(doc.expires_at)}`}
              </span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Voir">
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Télécharger">
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
                <button 
                  className="p-1.5 hover:bg-red-50 rounded-lg" 
                  title="Supprimer"
                  onClick={() => {
                    setSelectedDocument(doc);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Document row for list view
  const DocumentRow = ({ doc }: { doc: Document }) => {
    const FileIcon = getFileIcon(doc.type);
    
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <FileIcon className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">{doc.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${CATEGORY_CONFIG[doc.category].color}`}>
            {CATEGORY_CONFIG[doc.category].label}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${STATUS_CONFIG[doc.status].color}`}>
            {STATUS_CONFIG[doc.status].label}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">{formatSize(doc.size)}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(doc.uploaded_at)}</td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {doc.expires_at ? formatDate(doc.expires_at) : '-'}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg">
              <Eye className="w-4 h-4 text-gray-500" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg">
              <Download className="w-4 h-4 text-gray-500" />
            </button>
            <button 
              className="p-1.5 hover:bg-red-50 rounded-lg"
              onClick={() => {
                setSelectedDocument(doc);
                setShowDeleteModal(true);
              }}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Gérez votre bibliothèque de documents administratifs</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.valid}</p>
              <p className="text-sm text-gray-500">Valides</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
              <p className="text-sm text-gray-500">Expirent bientôt</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
              <p className="text-sm text-gray-500">Expirés</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Templates */}
      <Card className="p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Documents types à télécharger</h3>
        <div className="flex flex-wrap gap-2">
          {DOCUMENT_TEMPLATES.map((template, idx) => (
            <button
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
              onClick={() => {
                setUploadForm({ ...uploadForm, name: template.name, category: template.category });
                setShowUploadModal(true);
              }}
              title={template.description}
            >
              <FilePlus className="w-4 h-4 text-gray-500" />
              {template.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'ALL')}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="ALL">Toutes catégories</option>
          {Object.entries(CATEGORY_CONFIG).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'ALL')}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="ALL">Tous statuts</option>
          {Object.entries(STATUS_CONFIG).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
        <div className="flex items-center border rounded-lg">
          <button
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-5 h-5 text-gray-500" />
          </button>
          <button
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Documents */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Aucun document ne correspond à vos critères'
              : 'Commencez par ajouter vos documents administratifs'}
          </p>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Ajouter un document
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ajouté le</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire le</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDocuments.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Ajouter un document"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du document *
            </label>
            <Input
              value={uploadForm.name}
              onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              placeholder="Ex: KBIS_2025.pdf"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie *
            </label>
            <select
              value={uploadForm.category}
              onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as DocumentCategory })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {Object.entries(CATEGORY_CONFIG).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'expiration (optionnel)
            </label>
            <Input
              type="date"
              value={uploadForm.expiresAt}
              onChange={(e) => setUploadForm({ ...uploadForm, expiresAt: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fichier *
            </label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadForm({ 
                      ...uploadForm, 
                      file,
                      name: uploadForm.name || file.name 
                    });
                  }
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploadForm.file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{uploadForm.file.name}</p>
                      <p className="text-sm text-gray-500">{formatSize(uploadForm.file.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Cliquez pour sélectionner un fichier</p>
                    <p className="text-sm text-gray-400 mt-1">PDF, DOC, XLS, PNG, JPG (max 10 MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!uploadForm.file || !uploadForm.name}
            >
              <Upload className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer le document"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer <strong>{selectedDocument?.name}</strong> ? 
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
