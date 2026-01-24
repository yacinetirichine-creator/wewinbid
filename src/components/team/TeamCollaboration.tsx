'use client';

import NextImage from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Send,
  Paperclip,
  AtSign,
  Hash,
  Clock,
  CheckCheck,
  Image,
  File,
  X,
  Smile,
  MoreVertical,
  Reply,
  Edit2,
  Trash2,
  Pin,
  Star,
} from 'lucide-react';
import { Button, Badge, Card, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useLocale } from '@/hooks/useLocale';
import { useUiTranslations } from '@/hooks/useUiTranslations';

const entries = {
  'team.presence.onlineCount': '{count} online',
  'team.channels.title': 'Channels',
  'team.message.edited': '(edited)',
  'team.message.actions.like': 'Like',
  'team.message.actions.reply': 'Reply',
  'team.message.actions.edit': 'Edit',
  'team.message.actions.delete': 'Delete',
  'team.input.placeholder': 'Write a message...',
  'team.input.replyingTo': 'Replying to',
  'team.chat.empty.title': 'No messages',
  'team.chat.empty.subtitle': 'Be the first to write!',
  'team.chat.me': 'Me',
  'team.activity.title': 'Recent activity',
  'team.activity.empty': 'No recent activity',
} as const;

type TFunction = (key: keyof typeof entries, vars?: Record<string, any>) => string;

// Types
interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
  isOnline: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  content: string;
  authorId: string;
  author: TeamMember;
  createdAt: string;
  updatedAt?: string;
  attachments?: Attachment[];
  mentions?: string[];
  replyTo?: Message;
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  isEdited?: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'file';
  url: string;
  size: number;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'tender' | 'general' | 'direct';
  tenderId?: string;
  members: string[];
  unreadCount?: number;
  lastMessage?: Message;
}

// Props
interface TeamChatProps {
  channelId: string;
  currentUserId: string;
  onSendMessage?: (content: string, attachments?: File[]) => void;
  className?: string;
}

interface PresenceIndicatorProps {
  members: TeamMember[];
  maxVisible?: number;
  className?: string;
}

interface ActivityFeedProps {
  tenderId: string;
  className?: string;
}

/**
 * Indicateur de présence de l'équipe
 */
export function PresenceIndicator({
  members,
  maxVisible = 5,
  className,
}: PresenceIndicatorProps) {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

  const onlineMembers = members.filter(m => m.isOnline);
  const visibleMembers = onlineMembers.slice(0, maxVisible);
  const remainingCount = onlineMembers.length - maxVisible;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex -space-x-2">
        {visibleMembers.map((member) => (
          <div
            key={member.id}
            className="relative group"
            title={member.name}
          >
            {member.avatar ? (
              <NextImage
                  src={member.avatar}
                  alt={member.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                  unoptimized
                />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-100 flex items-center justify-center">
                <span className="text-xs font-medium text-primary-700">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {member.name}
            </div>
          </div>
        ))}
        
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-white bg-surface-200 flex items-center justify-center">
            <span className="text-xs font-medium text-surface-600">
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
      
      <span className="text-sm text-surface-500">
        {t('team.presence.onlineCount', { count: onlineMembers.length })}
      </span>
    </div>
  );
}

/**
 * Liste des canaux de discussion
 */
export function ChannelList({
  channels,
  currentChannelId,
  onSelectChannel,
  className,
}: {
  channels: Channel[];
  currentChannelId?: string;
  onSelectChannel: (channelId: string) => void;
  className?: string;
}) {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);

  const getChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'tender':
        return <Hash className="w-4 h-4 text-surface-400" />;
      case 'direct':
        return <MessageSquare className="w-4 h-4 text-surface-400" />;
      default:
        return <Users className="w-4 h-4 text-surface-400" />;
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      <h3 className="px-3 py-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
        {t('team.channels.title')}
      </h3>
      {channels.map((channel) => (
        <button
          key={channel.id}
          onClick={() => onSelectChannel(channel.id)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
            currentChannelId === channel.id
              ? 'bg-primary-50 text-primary-700'
              : 'text-surface-700 hover:bg-surface-50'
          )}
        >
          {getChannelIcon(channel.type)}
          <span className="flex-1 text-left text-sm font-medium truncate">
            {channel.name}
          </span>
          {channel.unreadCount && channel.unreadCount > 0 && (
            <Badge variant="danger" size="sm">
              {channel.unreadCount}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Bulle de message
 */
function MessageBubble({
  message,
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onReact,
  t,
  distanceLocale,
}: {
  message: Message;
  isOwn: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
  t: TFunction;
  distanceLocale: Locale;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group flex gap-3 px-4 py-2 hover:bg-surface-50 transition-colors',
        isOwn && 'flex-row-reverse'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {message.author.avatar ? (
        <NextImage
            src={message.author.avatar}
            alt={message.author.name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full flex-shrink-0"
            unoptimized
          />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary-700">
            {message.author.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Contenu */}
      <div className={cn('flex-1 max-w-[70%]', isOwn && 'text-right')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-surface-900 text-sm">
            {message.author.name}
          </span>
          <span className="text-xs text-surface-400">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: distanceLocale })}
          </span>
          {message.isPinned && (
            <Pin className="w-3 h-3 text-amber-500" />
          )}
          {message.isEdited && (
            <span className="text-xs text-surface-400">{t('team.message.edited')}</span>
          )}
        </div>

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-2 p-2 bg-surface-100 rounded-lg border-l-2 border-primary-300 text-sm text-surface-600">
            <span className="font-medium text-surface-700">{message.replyTo.author.name}: </span>
            {message.replyTo.content.substring(0, 50)}...
          </div>
        )}

        {/* Message content */}
        <p className={cn(
          'text-surface-800 whitespace-pre-wrap break-words',
          isOwn ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 inline-block' : ''
        )}>
          {message.content}
        </p>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
              >
                {attachment.type === 'image' ? (
                  <Image className="w-4 h-4 text-surface-500" />
                ) : (
                  <File className="w-4 h-4 text-surface-500" />
                )}
                <span className="text-sm text-surface-700 truncate max-w-[150px]">
                  {attachment.name}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(emoji)}
                className="px-2 py-0.5 bg-surface-100 rounded-full text-sm hover:bg-surface-200 transition-colors"
              >
                {emoji} {users.length}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1 bg-white shadow-lg rounded-lg border border-surface-200 p-1"
          >
            <button
              onClick={() => onReact?.('👍')}
              className="p-1.5 hover:bg-surface-100 rounded"
              title={t('team.message.actions.like')}
            >
              <Smile className="w-4 h-4 text-surface-500" />
            </button>
            <button
              onClick={onReply}
              className="p-1.5 hover:bg-surface-100 rounded"
              title={t('team.message.actions.reply')}
            >
              <Reply className="w-4 h-4 text-surface-500" />
            </button>
            {isOwn && (
              <>
                <button
                  onClick={onEdit}
                  className="p-1.5 hover:bg-surface-100 rounded"
                  title={t('team.message.actions.edit')}
                >
                  <Edit2 className="w-4 h-4 text-surface-500" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 hover:bg-surface-100 rounded"
                  title={t('team.message.actions.delete')}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Zone de saisie de message
 */
function MessageInput({
  onSend,
  onAttach,
  replyingTo,
  onCancelReply,
  placeholder,
  t,
}: {
  onSend: (content: string) => void;
  onAttach?: (files: File[]) => void;
  replyingTo?: Message;
  onCancelReply?: () => void;
  placeholder?: string;
  t: TFunction;
}) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const effectivePlaceholder = placeholder ?? t('team.input.placeholder');

  const handleSubmit = () => {
    if (content.trim()) {
      onSend(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onAttach) {
      onAttach(files);
    }
  };

  return (
    <div className="border-t border-surface-200 bg-white p-4">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 p-2 bg-surface-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Reply className="w-4 h-4 text-surface-400" />
            <span className="text-surface-500">{t('team.input.replyingTo')}</span>
            <span className="font-medium text-surface-700">{replyingTo.author.name}</span>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:bg-surface-200 rounded">
            <X className="w-4 h-4 text-surface-500" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attach button */}
        <label className="p-2 hover:bg-surface-100 rounded-lg cursor-pointer transition-colors">
          <Paperclip className="w-5 h-5 text-surface-500" />
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>

        {/* Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={effectivePlaceholder}
            rows={1}
            className="resize-none pr-10"
          />
        </div>

        {/* Send button */}
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Chat d'équipe complet
 */
export function TeamChat({
  channelId,
  currentUserId,
  onSendMessage,
  className,
}: TeamChatProps) {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);
  const distanceLocale: Locale = locale.startsWith('fr') ? fr : enUS;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/team/channels/${channelId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Erreur chargement messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [channelId]);

  // Scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (content: string) => {
    // Optimistic update
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content,
      authorId: currentUserId,
      author: {
        id: currentUserId,
        name: t('team.chat.me'),
        email: '',
        role: 'editor',
        isOnline: true,
      },
      createdAt: new Date().toISOString(),
      replyTo: replyingTo,
    };

    setMessages(prev => [...prev, tempMessage]);
    setReplyingTo(undefined);

    // Appeler le callback si fourni
    onSendMessage?.(content);

    // Envoyer au serveur
    try {
      const response = await fetch(`/api/team/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          replyToId: replyingTo?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Remplacer le message temporaire
        setMessages(prev => prev.map(m => 
          m.id === tempMessage.id ? data.message : m
        ));
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
      // Supprimer le message temporaire en cas d'erreur
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  return (
    <Card className={cn('flex flex-col h-[600px]', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-500">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p>{t('team.chat.empty.title')}</p>
            <p className="text-sm">{t('team.chat.empty.subtitle')}</p>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.authorId === currentUserId}
                onReply={() => setReplyingTo(message)}
                onEdit={() => {/* TODO */}}
                onDelete={() => {/* TODO */}}
                onReact={() => {/* TODO */}}
                t={t}
                distanceLocale={distanceLocale}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(undefined)}
        t={t}
      />
    </Card>
  );
}

/**
 * Fil d'activité pour un appel d'offres
 */
export function ActivityFeed({ tenderId, className }: ActivityFeedProps) {
  const { locale } = useLocale();
  const { t } = useUiTranslations(locale, entries);
  const distanceLocale: Locale = locale.startsWith('fr') ? fr : enUS;

  const [activities, setActivities] = useState<Array<{
    id: string;
    type: string;
    user: TeamMember;
    description: string;
    createdAt: string;
    metadata?: Record<string, any>;
  }>>([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const response = await fetch(`/api/tenders/${tenderId}/activity`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Erreur chargement activités:', error);
      }
    };

    loadActivities();
  }, [tenderId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_uploaded':
        return <File className="w-4 h-4 text-blue-500" />;
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'status_changed':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'member_added':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Star className="w-4 h-4 text-surface-400" />;
    }
  };

  return (
    <Card className={cn('p-4', className)}>
      <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-surface-400" />
        {t('team.activity.title')}
      </h3>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3">
            <div className="p-2 bg-surface-100 rounded-lg">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-surface-800">
                <span className="font-medium">{activity.user.name}</span>{' '}
                {activity.description}
              </p>
              <p className="text-xs text-surface-400 mt-0.5">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: distanceLocale })}
              </p>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="text-sm text-surface-500 text-center py-4">
            {t('team.activity.empty')}
          </p>
        )}
      </div>
    </Card>
  );
}
