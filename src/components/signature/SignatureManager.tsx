'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  FileSignature,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Mail,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  FileText,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'signatureManager.title': 'Electronic signatures',
  'signatureManager.subtitle': 'Manage signature requests for your documents',
  'signatureManager.actions.newRequest': 'New request',
  'signatureManager.empty.title': 'No signature requests',
  'signatureManager.empty.subtitle': 'Create your first signature request for your documents',
  'signatureManager.empty.actions.create': 'Create a request',
  'signatureManager.signersCount': '{signed}/{total} signers',
  'signatureManager.expiresOn': 'Expires on {date}',

  'signatureManager.status.draft': 'Draft',
  'signatureManager.status.pending': 'Pending',
  'signatureManager.status.partially_signed': 'Partially signed',
  'signatureManager.status.completed': 'Completed',
  'signatureManager.status.cancelled': 'Cancelled',
  'signatureManager.status.expired': 'Expired',

  'signatureManager.signerStatus.pending': 'Pending',
  'signatureManager.signerStatus.notified': 'Notified',
  'signatureManager.signerStatus.viewed': 'Viewed',
  'signatureManager.signerStatus.signed': 'Signed',
  'signatureManager.signerStatus.declined': 'Declined',
  'signatureManager.signerStatus.expired': 'Expired',

  'signatureManager.createModal.title': 'New signature request',
  'signatureManager.createModal.fields.title.label': 'Request title',
  'signatureManager.createModal.fields.title.placeholder': 'e.g., Service contract',
  'signatureManager.createModal.fields.description.label': 'Description (optional)',
  'signatureManager.createModal.fields.description.placeholder': 'Request description…',
  'signatureManager.createModal.fields.signers.label': 'Signers',
  'signatureManager.createModal.fields.signer.email.placeholder': 'Email',
  'signatureManager.createModal.fields.signer.name.placeholder': 'Full name',
  'signatureManager.createModal.actions.addSigner': 'Add a signer',
  'signatureManager.createModal.fields.sendImmediately': 'Send immediately to signers',
  'signatureManager.createModal.actions.cancel': 'Cancel',
  'signatureManager.createModal.actions.createAndSend': 'Create and send',
  'signatureManager.createModal.actions.createDraft': 'Create draft',

  'signatureManager.detail.status.title': 'Status',
  'signatureManager.detail.createdOn': 'Created on',
  'signatureManager.detail.expiresOn': 'Expires on',
  'signatureManager.detail.signers.title': 'Signers ({count})',
  'signatureManager.detail.actions.remind': 'Send reminder',
  'signatureManager.detail.actions.downloadSigned': 'Download signed document',
  'signatureManager.detail.actions.close': 'Close',
} as const;

type TFunction = (key: keyof typeof entries, vars?: Record<string, any>) => string;

interface Signer {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  status?: 'pending' | 'notified' | 'viewed' | 'signed' | 'declined' | 'expired';
  signed_at?: string;
}

interface SignatureRequest {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'pending' | 'partially_signed' | 'completed' | 'cancelled' | 'expired';
  document_name?: string;
  document_url?: string;
  expires_at?: string;
  created_at: string;
  signers: Signer[];
}

interface SignatureManagerProps {
  tenderId?: string;
  onRequestCreated?: (request: SignatureRequest) => void;
}

export function SignatureManager({ tenderId, onRequestCreated }: SignatureManagerProps) {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SignatureRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (tenderId) params.append('tender_id', tenderId);
      
      const response = await fetch(`/api/signatures?${params.toString()}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching signature requests:', error);
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusConfig = (status: SignatureRequest['status']) => {
    const configs = {
      draft: {
        label: t('signatureManager.status.draft'),
        color: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
        icon: FileText,
      },
      pending: {
        label: t('signatureManager.status.pending'),
        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        icon: Clock,
      },
      partially_signed: {
        label: t('signatureManager.status.partially_signed'),
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        icon: Users,
      },
      completed: {
        label: t('signatureManager.status.completed'),
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
        icon: CheckCircle,
      },
      cancelled: {
        label: t('signatureManager.status.cancelled'),
        color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        icon: XCircle,
      },
      expired: {
        label: t('signatureManager.status.expired'),
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
        icon: AlertTriangle,
      },
    };
    return configs[status];
  };

  const getSignerStatusBadge = (status: Signer['status']) => {
    const configs = {
      pending: { label: t('signatureManager.signerStatus.pending'), variant: 'default' as const },
      notified: { label: t('signatureManager.signerStatus.notified'), variant: 'info' as const },
      viewed: { label: t('signatureManager.signerStatus.viewed'), variant: 'warning' as const },
      signed: { label: t('signatureManager.signerStatus.signed'), variant: 'success' as const },
      declined: { label: t('signatureManager.signerStatus.declined'), variant: 'danger' as const },
      expired: { label: t('signatureManager.signerStatus.expired'), variant: 'default' as const },
    };
    return configs[status || 'pending'];
  };

  const handleCreateRequest = async (data: {
    title: string;
    description?: string;
    signers: Signer[];
    document_url?: string;
    document_name?: string;
    send_immediately: boolean;
  }) => {
    try {
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tender_id: tenderId,
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setShowCreateModal(false);
      fetchRequests();
      
      if (onRequestCreated) {
        onRequestCreated(result.request);
      }
    } catch (error) {
      console.error('Error creating signature request:', error);
    }
  };

  const sendReminder = async (requestId: string, signerId: string) => {
    try {
      await fetch(`/api/signatures/${requestId}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signer_id: signerId }),
      });
      // Toast de succès
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-surface-200 dark:bg-surface-700 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary-500" />
            {t('signatureManager.title')}
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {t('signatureManager.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('signatureManager.actions.newRequest')}
        </Button>
      </div>

      {/* Liste des demandes */}
      {requests.length === 0 ? (
        <Card className="p-8 text-center">
          <FileSignature className="h-12 w-12 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
          <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
            {t('signatureManager.empty.title')}
          </h3>
          <p className="text-surface-500 dark:text-surface-400 mb-4">
            {t('signatureManager.empty.subtitle')}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('signatureManager.empty.actions.create')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            const signedCount = request.signers.filter(s => s.status === 'signed').length;
            
            return (
              <Card
                key={request.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-surface-900 dark:text-surface-100">
                          {request.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      {request.description && (
                        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-1 mb-2">
                          {request.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-surface-400 dark:text-surface-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {t('signatureManager.signersCount', { signed: signedCount, total: request.signers.length })}
                        </span>
                        {request.document_name && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {request.document_name}
                          </span>
                        )}
                        {request.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {t('signatureManager.expiresOn', { date: new Date(request.expires_at).toLocaleDateString(locale) })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {request.status === 'completed' && request.document_url && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Signataires */}
                  <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
                    <div className="flex flex-wrap gap-2">
                      {request.signers.map((signer) => {
                        const signerStatus = getSignerStatusBadge(signer.status);
                        return (
                          <div
                            key={signer.id || signer.email}
                            className="flex items-center gap-2 px-2 py-1 bg-surface-50 dark:bg-surface-800 rounded-lg"
                          >
                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-xs font-medium text-primary-700 dark:text-primary-300">
                              {signer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-surface-700 dark:text-surface-200">
                              {signer.name}
                            </span>
                            <Badge variant={signerStatus.variant} size="sm">
                              {signerStatus.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de création */}
      <CreateSignatureModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRequest}
        t={t}
      />

      {/* Modal de détail */}
      {selectedRequest && (
        <SignatureDetailModal
          isOpen={!!selectedRequest}
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onRemind={sendReminder}
          onRefresh={fetchRequests}
          t={t}
          locale={locale}
          getStatusConfig={getStatusConfig}
        />
      )}
    </div>
  );
}

// Modal de création
interface CreateSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    signers: Signer[];
    document_url?: string;
    document_name?: string;
    send_immediately: boolean;
  }) => void;
  t: TFunction;
}

function CreateSignatureModal({ isOpen, onClose, onSubmit, t }: CreateSignatureModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    send_immediately: false,
  });
  const [signers, setSigners] = useState<Signer[]>([{ email: '', name: '' }]);
  const [saving, setSaving] = useState(false);

  const addSigner = () => {
    setSigners([...signers, { email: '', name: '' }]);
  };

  const removeSigner = (index: number) => {
    if (signers.length > 1) {
      setSigners(signers.filter((_, i) => i !== index));
    }
  };

  const updateSigner = (index: number, field: keyof Signer, value: string) => {
    const newSigners = [...signers];
    newSigners[index] = { ...newSigners[index], [field]: value };
    setSigners(newSigners);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validSigners = signers.filter(s => s.email && s.name);
    if (!formData.title || validSigners.length === 0) return;

    setSaving(true);
    try {
      await onSubmit({
        ...formData,
        signers: validSigners,
      });
      
      // Reset
      setFormData({ title: '', description: '', send_immediately: false });
      setSigners([{ email: '', name: '' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('signatureManager.createModal.title')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('signatureManager.createModal.fields.title.label')}
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder={t('signatureManager.createModal.fields.title.placeholder')}
          required
        />

        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">
            {t('signatureManager.createModal.fields.description.label')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 resize-none"
            placeholder={t('signatureManager.createModal.fields.description.placeholder')}
          />
        </div>

        {/* Signataires */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-2">
            {t('signatureManager.createModal.fields.signers.label')}
          </label>
          <div className="space-y-3">
            {signers.map((signer, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={t('signatureManager.createModal.fields.signer.email.placeholder')}
                  type="email"
                  value={signer.email}
                  onChange={(e) => updateSigner(index, 'email', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder={t('signatureManager.createModal.fields.signer.name.placeholder')}
                  value={signer.name}
                  onChange={(e) => updateSigner(index, 'name', e.target.value)}
                  className="flex-1"
                />
                {signers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSigner(index)}
                  >
                    <Trash2 className="h-4 w-4 text-danger-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addSigner}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('signatureManager.createModal.actions.addSigner')}
          </Button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.send_immediately}
            onChange={(e) => setFormData(prev => ({ ...prev, send_immediately: e.target.checked }))}
            className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-surface-700 dark:text-surface-200">
            {t('signatureManager.createModal.fields.sendImmediately')}
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-4 border-t border-surface-200 dark:border-surface-700">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('signatureManager.createModal.actions.cancel')}
          </Button>
          <Button type="submit" isLoading={saving}>
            <Send className="h-4 w-4 mr-2" />
            {formData.send_immediately
              ? t('signatureManager.createModal.actions.createAndSend')
              : t('signatureManager.createModal.actions.createDraft')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Modal de détail
interface SignatureDetailModalProps {
  isOpen: boolean;
  request: SignatureRequest;
  onClose: () => void;
  onRemind: (requestId: string, signerId: string) => void;
  onRefresh: () => void;
  t: TFunction;
  locale: string;
  getStatusConfig: (status: SignatureRequest['status']) => { label: string; color: string; icon: any };
}

function SignatureDetailModal({
  isOpen,
  request,
  onClose,
  onRemind,
  onRefresh,
  t,
  locale,
  getStatusConfig,
}: SignatureDetailModalProps) {
  const statusConfig = getStatusConfig(request.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={request.title} size="lg">
      <div className="space-y-6">
        {request.description && (
          <p className="text-surface-600 dark:text-surface-400">
            {request.description}
          </p>
        )}

        {/* Statut global */}
        <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-surface-500 dark:text-surface-400">{t('signatureManager.detail.status.title')}</span>
              <p className="font-medium text-surface-900 dark:text-surface-100 capitalize">
                {statusConfig.label}
              </p>
            </div>
            <div>
              <span className="text-sm text-surface-500 dark:text-surface-400">{t('signatureManager.detail.createdOn')}</span>
              <p className="font-medium text-surface-900 dark:text-surface-100">
                {new Date(request.created_at).toLocaleDateString(locale)}
              </p>
            </div>
            {request.expires_at && (
              <div>
                <span className="text-sm text-surface-500 dark:text-surface-400">{t('signatureManager.detail.expiresOn')}</span>
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  {new Date(request.expires_at).toLocaleDateString(locale)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Liste des signataires */}
        <div>
          <h4 className="text-sm font-medium text-surface-700 dark:text-surface-200 mb-3">
            {t('signatureManager.detail.signers.title', { count: request.signers.length })}
          </h4>
          <div className="space-y-3">
            {request.signers.map((signer) => {
              const statusBadge = {
                pending: { label: t('signatureManager.signerStatus.pending'), variant: 'default' as const, icon: Clock },
                notified: { label: t('signatureManager.signerStatus.notified'), variant: 'info' as const, icon: Mail },
                viewed: { label: t('signatureManager.signerStatus.viewed'), variant: 'warning' as const, icon: Eye },
                signed: { label: t('signatureManager.signerStatus.signed'), variant: 'success' as const, icon: CheckCircle },
                declined: { label: t('signatureManager.signerStatus.declined'), variant: 'danger' as const, icon: XCircle },
                expired: { label: t('signatureManager.signerStatus.expired'), variant: 'default' as const, icon: AlertTriangle },
              }[signer.status || 'pending'];
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={signer.id || signer.email}
                  className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {signer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-surface-100">
                        {signer.name}
                      </p>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {signer.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadge.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusBadge.label}
                    </Badge>
                    {signer.status !== 'signed' && signer.status !== 'declined' && signer.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemind(request.id, signer.id!)}
                        title={t('signatureManager.detail.actions.remind')}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-surface-200 dark:border-surface-700">
          {request.status === 'completed' && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('signatureManager.detail.actions.downloadSigned')}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {t('signatureManager.detail.actions.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SignatureManager;
