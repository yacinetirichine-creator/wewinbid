'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Edit2, Trash2, Reply, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  edited: boolean;
  edited_at?: string;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface CommentsThreadProps {
  tenderId: string;
  currentUserId: string;
}

export function CommentsThread({ tenderId, currentUserId }: CommentsThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [tenderId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tenders/comments?tenderId=${tenderId}`);
      if (!response.ok) throw new Error('Erreur fetch');

      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error('Erreur fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    setSending(true);

    try {
      const response = await fetch('/api/tenders/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId,
          content: newComment,
          parentId: replyingTo,
        }),
      });

      if (!response.ok) throw new Error('Erreur création');

      setNewComment('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Erreur création comment:', error);
    } finally {
      setSending(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/tenders/comments?id=${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) throw new Error('Erreur mise à jour');

      setEditingId(null);
      setEditContent('');
      await fetchComments();
    } catch (error) {
      console.error('Erreur edit comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;

    try {
      const response = await fetch(`/api/tenders/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur suppression');

      await fetchComments();
    } catch (error) {
      console.error('Erreur delete comment:', error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const startReply = (commentId: string) => {
    setReplyingTo(commentId);
    textareaRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulaire nouveau commentaire */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {replyingTo && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Reply className="h-4 w-4" />
            <span>Répondre à un commentaire</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              Annuler
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
            U
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1"
              >
                <AtSign className="h-4 w-4" />
                Mentionner
              </button>
              <button
                type="submit"
                disabled={!newComment.trim() || sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun commentaire pour le moment</p>
            <p className="text-sm mt-1">Soyez le premier à commenter !</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onEdit={startEdit}
                onDelete={handleDelete}
                onReply={startReply}
                editingId={editingId}
                editContent={editContent}
                setEditContent={setEditContent}
                handleEdit={handleEdit}
                setEditingId={setEditingId}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// Composant pour un commentaire
interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  onEdit: (comment: Comment) => void;
  onDelete: (id: string) => void;
  onReply: (id: string) => void;
  editingId: string | null;
  editContent: string;
  setEditContent: (content: string) => void;
  handleEdit: (id: string) => void;
  setEditingId: (id: string | null) => void;
  depth?: number;
}

function CommentItem({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  editingId,
  editContent,
  setEditContent,
  handleEdit,
  setEditingId,
  depth = 0,
}: CommentItemProps) {
  const isOwner = comment.user.id === currentUserId;
  const isEditing = editingId === comment.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${depth > 0 ? 'ml-12 mt-3' : ''}`}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {comment.user.full_name?.[0] || 'U'}
        </div>

        <div className="flex-1 bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-medium">{comment.user.full_name}</div>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: fr,
                })}
                {comment.edited && <span className="ml-1">(modifié)</span>}
              </div>
            </div>

            {isOwner && !isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(comment)}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(comment.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
              {depth === 0 && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Répondre
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Réponses */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              editingId={editingId}
              editContent={editContent}
              setEditContent={setEditContent}
              handleEdit={handleEdit}
              setEditingId={setEditingId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
