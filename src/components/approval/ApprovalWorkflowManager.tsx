'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  Send,
  User,
  FileText,
  Calendar,
  Loader2,
  RefreshCw,
  Eye,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ApprovalStep {
  id: string;
  step_order: number;
  name: string;
  description?: string;
  approval_type: 'single' | 'all' | 'majority' | 'threshold';
  threshold_count?: number;
}

interface ApprovalDecision {
  id: string;
  step_id: string;
  approver_id: string;
  decision: 'approved' | 'rejected' | 'request_changes';
  comment?: string;
  decided_at: string;
  approver?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ApprovalComment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ApprovalRequest {
  id: string;
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  current_step_id?: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  requested_by: string;
  requested_at: string;
  completed_at?: string;
  final_decision?: string;
  is_urgent: boolean;
  due_date?: string;
  workflow?: {
    id: string;
    name: string;
    steps: ApprovalStep[];
  };
  current_step?: ApprovalStep;
  decisions: ApprovalDecision[];
  comments: ApprovalComment[];
  requester?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
  };
}

interface ApprovalWorkflowManagerProps {
  requestId?: string;
  onClose?: () => void;
  onUpdate?: () => void;
}

export function ApprovalWorkflowManager({
  requestId,
  onClose,
  onUpdate,
}: ApprovalWorkflowManagerProps) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [canApprove, setCanApprove] = useState(false);

  // Decision modal state
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected' | 'request_changes'>('approved');
  const [decisionComment, setDecisionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter === 'pending' ? 'in_progress' : filter);
      }

      const response = await fetch(`/api/approvals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchRequestDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/approvals/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRequest(data.request);
        setCanApprove(data.can_approve);
        setView('detail');
      }
    } catch (error) {
      console.error('Error fetching request detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    if (requestId) {
      fetchRequestDetail(requestId);
    }
  }, [fetchRequestDetail, fetchRequests, requestId]);

  const handleDecision = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/approvals/${selectedRequest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          comment: decisionComment,
        }),
      });

      if (response.ok) {
        setShowDecisionModal(false);
        setDecisionComment('');
        await fetchRequestDetail(selectedRequest.id);
        await fetchRequests();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error submitting decision:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedRequest || !confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return;

    try {
      const response = await fetch(`/api/approvals/${selectedRequest.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRequests();
        setView('list');
        setSelectedRequest(null);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedRequest || !newComment.trim()) return;

    setCommentSubmitting(true);
    try {
      const response = await fetch(`/api/approvals/${selectedRequest.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        setNewComment('');
        await fetchRequestDetail(selectedRequest.id);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'default' }> = {
      pending: { label: 'En attente', variant: 'warning' },
      in_progress: { label: 'En cours', variant: 'warning' },
      approved: { label: 'Approuvé', variant: 'success' },
      rejected: { label: 'Rejeté', variant: 'danger' },
      cancelled: { label: 'Annulé', variant: 'default' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'request_changes':
        return <RefreshCw className="h-4 w-4 text-amber-500" />;
      default:
        return <Clock className="h-4 w-4 text-surface-400" />;
    }
  };

  if (view === 'detail' && selectedRequest) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setView('list')}>
            ← Retour
          </Button>
          <div className="flex items-center gap-2">
            {selectedRequest.status === 'in_progress' && (
              <Button variant="outline" onClick={handleCancel}>
                Annuler la demande
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Request Details */}
        <Card>
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedRequest.is_urgent && (
                    <Badge variant="danger">Urgent</Badge>
                  )}
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                  {selectedRequest.title}
                </h2>
                {selectedRequest.description && (
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {selectedRequest.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <div>
                <p className="text-xs text-surface-500 dark:text-surface-400">Demandeur</p>
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  {selectedRequest.requester?.full_name || 'Utilisateur'}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-500 dark:text-surface-400">Workflow</p>
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  {selectedRequest.workflow?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-500 dark:text-surface-400">Date de demande</p>
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  {new Date(selectedRequest.requested_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-500 dark:text-surface-400">Échéance</p>
                <p className="font-medium text-surface-900 dark:text-surface-100">
                  {selectedRequest.due_date
                    ? new Date(selectedRequest.due_date).toLocaleDateString('fr-FR')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Workflow Progress */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Progression du workflow
            </h3>

            <div className="space-y-4">
              {selectedRequest.workflow?.steps
                ?.sort((a, b) => a.step_order - b.step_order)
                .map((step, index) => {
                  const stepDecisions = selectedRequest.decisions.filter(
                    (d) => d.step_id === step.id
                  );
                  const isCurrentStep = selectedRequest.current_step_id === step.id;
                  const isPastStep = selectedRequest.current_step
                    ? step.step_order < selectedRequest.current_step.step_order
                    : false;
                  const isCompleted =
                    isPastStep ||
                    (selectedRequest.status === 'approved' && step.step_order <= (selectedRequest.current_step?.step_order || 0)) ||
                    selectedRequest.status === 'approved';

                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border ${
                        isCurrentStep
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : isCompleted
                          ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-surface-200 dark:border-surface-700'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isCurrentStep
                            ? 'bg-primary-500 text-white'
                            : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-surface-900 dark:text-surface-100">
                            {step.name}
                          </h4>
                          {isCurrentStep && selectedRequest.status === 'in_progress' && (
                            <Badge variant="warning">En cours</Badge>
                          )}
                        </div>
                        {step.description && (
                          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            {step.description}
                          </p>
                        )}

                        {/* Decisions for this step */}
                        {stepDecisions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {stepDecisions.map((decision) => (
                              <div
                                key={decision.id}
                                className="flex items-start gap-2 text-sm"
                              >
                                {getDecisionIcon(decision.decision)}
                                <div>
                                  <span className="font-medium">
                                    {decision.approver?.full_name || 'Approbateur'}
                                  </span>
                                  <span className="text-surface-500 dark:text-surface-400">
                                    {' '}
                                    a{' '}
                                    {decision.decision === 'approved'
                                      ? 'approuvé'
                                      : decision.decision === 'rejected'
                                      ? 'rejeté'
                                      : 'demandé des modifications'}
                                  </span>
                                  {decision.comment && (
                                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                                      "{decision.comment}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Action Buttons */}
            {canApprove && selectedRequest.status === 'in_progress' && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                <Button
                  onClick={() => {
                    setDecisionType('approved');
                    setShowDecisionModal(true);
                  }}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDecisionType('request_changes');
                    setShowDecisionModal(true);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Demander modifications
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setDecisionType('rejected');
                    setShowDecisionModal(true);
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Comments Section */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Commentaires ({selectedRequest.comments.length})
            </h3>

            <div className="space-y-4 mb-4">
              {selectedRequest.comments.length === 0 ? (
                <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">
                  Aucun commentaire pour le moment
                </p>
              ) : (
                selectedRequest.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-surface-900 dark:text-surface-100">
                          {comment.author?.full_name || 'Utilisateur'}
                        </span>
                        <span className="text-xs text-surface-400">
                          {new Date(comment.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || commentSubmitting}
              >
                {commentSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Decision Modal */}
        {showDecisionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-surface-900 rounded-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                  {decisionType === 'approved'
                    ? 'Confirmer l\'approbation'
                    : decisionType === 'rejected'
                    ? 'Confirmer le rejet'
                    : 'Demander des modifications'}
                </h3>

                <Textarea
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder={
                    decisionType === 'approved'
                      ? 'Commentaire (optionnel)...'
                      : 'Veuillez expliquer votre décision...'
                  }
                  rows={4}
                  className="mb-4"
                />

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDecisionModal(false);
                      setDecisionComment('');
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant={decisionType === 'rejected' ? 'danger' : 'primary'}
                    onClick={handleDecision}
                    isLoading={submitting}
                    disabled={
                      (decisionType !== 'approved' && !decisionComment.trim()) ||
                      submitting
                    }
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Demandes d'approbation
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as typeof filter);
              setTimeout(fetchRequests, 0);
            }}
            className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
          >
            <option value="all">Toutes</option>
            <option value="pending">En cours</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Rejetées</option>
          </select>
          <Button variant="outline" onClick={fetchRequests}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Request List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
              Aucune demande
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Vous n'avez aucune demande d'approbation pour le moment.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => fetchRequestDetail(request.id)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        request.status === 'approved'
                          ? 'bg-emerald-500'
                          : request.status === 'rejected'
                          ? 'bg-red-500'
                          : request.status === 'in_progress'
                          ? 'bg-amber-500'
                          : 'bg-surface-300'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-surface-900 dark:text-surface-100 truncate">
                          {request.title}
                        </h3>
                        {request.is_urgent && (
                          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
                        <span>{request.requester?.full_name || 'Utilisateur'}</span>
                        <span>•</span>
                        <span>
                          {new Date(request.requested_at).toLocaleDateString('fr-FR')}
                        </span>
                        {request.current_step && (
                          <>
                            <span>•</span>
                            <span>Étape : {request.current_step.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status)}
                    <ChevronRight className="h-5 w-5 text-surface-400" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApprovalWorkflowManager;
