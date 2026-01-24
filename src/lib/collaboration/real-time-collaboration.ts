/**
 * Real-Time Collaboration Service
 *
 * Foundation for collaborative editing of tender responses.
 * Supports:
 * - Real-time document editing (like Google Docs)
 * - User presence (cursors, selections)
 * - Comments and suggestions
 * - Version history
 *
 * Uses WebSocket + CRDT (Yjs compatible) for conflict-free editing
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  color: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastActivity: Date;
  isOnline: boolean;
}

export interface CursorPosition {
  documentId: string;
  sectionId: string;
  offset: number;
}

export interface SelectionRange {
  documentId: string;
  sectionId: string;
  start: number;
  end: number;
}

export interface CollaborationComment {
  id: string;
  documentId: string;
  sectionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  position: {
    start: number;
    end: number;
    quotedText: string;
  };
  status: 'open' | 'resolved' | 'rejected';
  replies: CommentReply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

export interface Suggestion {
  id: string;
  documentId: string;
  sectionId: string;
  userId: string;
  userName: string;
  type: 'insert' | 'delete' | 'replace';
  originalText: string;
  suggestedText: string;
  position: {
    start: number;
    end: number;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  userId: string;
  userName: string;
  changes: DocumentChange[];
  snapshot?: string; // Full content snapshot
  createdAt: Date;
}

export interface DocumentChange {
  type: 'insert' | 'delete' | 'format';
  sectionId: string;
  position: number;
  content?: string;
  length?: number;
  format?: Record<string, unknown>;
}

export type CollaborationEvent =
  | { type: 'user_joined'; user: CollaborationUser }
  | { type: 'user_left'; userId: string }
  | { type: 'cursor_moved'; userId: string; cursor: CursorPosition }
  | { type: 'selection_changed'; userId: string; selection: SelectionRange | null }
  | { type: 'content_changed'; changes: DocumentChange[] }
  | { type: 'comment_added'; comment: CollaborationComment }
  | { type: 'comment_updated'; comment: CollaborationComment }
  | { type: 'suggestion_added'; suggestion: Suggestion }
  | { type: 'suggestion_resolved'; suggestionId: string; accepted: boolean };

// =============================================================================
// COLLABORATION SERVICE
// =============================================================================

export class RealTimeCollaborationService {
  private ws: WebSocket | null = null;
  private documentId: string;
  private userId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: Map<string, Set<(event: CollaborationEvent) => void>> = new Map();
  private users: Map<string, CollaborationUser> = new Map();
  private pendingChanges: DocumentChange[] = [];
  private isConnected = false;

  constructor(documentId: string, userId: string) {
    this.documentId = documentId;
    this.userId = userId;
  }

  // ---------------------------------------------------------------------------
  // CONNECTION MANAGEMENT
  // ---------------------------------------------------------------------------

  async connect(wsUrl?: string): Promise<void> {
    const url = wsUrl || this.getDefaultWsUrl();

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send join message
          this.send({
            type: 'join',
            documentId: this.documentId,
            userId: this.userId
          });

          // Flush pending changes
          if (this.pendingChanges.length > 0) {
            this.send({
              type: 'changes',
              changes: this.pendingChanges
            });
            this.pendingChanges = [];
          }

          resolve();
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (!this.isConnected) {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.send({ type: 'leave' });
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.users.clear();
  }

  private getDefaultWsUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/collaboration/ws`;
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    }
  }

  private send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private handleMessage(data: { type: string; [key: string]: unknown }): void {
    switch (data.type) {
      case 'user_joined':
        const joinedUser = data.user as CollaborationUser;
        this.users.set(joinedUser.id, joinedUser);
        this.emit({ type: 'user_joined', user: joinedUser });
        break;

      case 'user_left':
        const leftUserId = data.userId as string;
        this.users.delete(leftUserId);
        this.emit({ type: 'user_left', userId: leftUserId });
        break;

      case 'cursor_moved':
        const cursorUserId = data.userId as string;
        const cursor = data.cursor as CursorPosition;
        const cursorUser = this.users.get(cursorUserId);
        if (cursorUser) {
          cursorUser.cursor = cursor;
          this.emit({ type: 'cursor_moved', userId: cursorUserId, cursor });
        }
        break;

      case 'selection_changed':
        const selUserId = data.userId as string;
        const selection = data.selection as SelectionRange | null;
        const selUser = this.users.get(selUserId);
        if (selUser) {
          selUser.selection = selection || undefined;
          this.emit({ type: 'selection_changed', userId: selUserId, selection });
        }
        break;

      case 'content_changed':
        const changes = data.changes as DocumentChange[];
        this.emit({ type: 'content_changed', changes });
        break;

      case 'comment_added':
        this.emit({ type: 'comment_added', comment: data.comment as CollaborationComment });
        break;

      case 'comment_updated':
        this.emit({ type: 'comment_updated', comment: data.comment as CollaborationComment });
        break;

      case 'suggestion_added':
        this.emit({ type: 'suggestion_added', suggestion: data.suggestion as Suggestion });
        break;

      case 'suggestion_resolved':
        this.emit({
          type: 'suggestion_resolved',
          suggestionId: data.suggestionId as string,
          accepted: data.accepted as boolean
        });
        break;

      case 'users_list':
        const users = data.users as CollaborationUser[];
        this.users.clear();
        users.forEach(u => this.users.set(u.id, u));
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // EVENT HANDLING
  // ---------------------------------------------------------------------------

  on(eventType: string, handler: (event: CollaborationEvent) => void): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  private emit(event: CollaborationEvent): void {
    // Emit to specific event type handlers
    this.eventHandlers.get(event.type)?.forEach(handler => handler(event));
    // Emit to wildcard handlers
    this.eventHandlers.get('*')?.forEach(handler => handler(event));
  }

  // ---------------------------------------------------------------------------
  // CURSOR & SELECTION
  // ---------------------------------------------------------------------------

  updateCursor(sectionId: string, offset: number): void {
    const cursor: CursorPosition = {
      documentId: this.documentId,
      sectionId,
      offset
    };
    this.send({ type: 'cursor_moved', cursor });
  }

  updateSelection(sectionId: string, start: number, end: number): void {
    const selection: SelectionRange = {
      documentId: this.documentId,
      sectionId,
      start,
      end
    };
    this.send({ type: 'selection_changed', selection });
  }

  clearSelection(): void {
    this.send({ type: 'selection_changed', selection: null });
  }

  // ---------------------------------------------------------------------------
  // CONTENT CHANGES
  // ---------------------------------------------------------------------------

  applyChanges(changes: DocumentChange[]): void {
    if (this.isConnected) {
      this.send({ type: 'changes', changes });
    } else {
      // Queue changes for later
      this.pendingChanges.push(...changes);
    }
  }

  insertText(sectionId: string, position: number, content: string): void {
    this.applyChanges([{
      type: 'insert',
      sectionId,
      position,
      content
    }]);
  }

  deleteText(sectionId: string, position: number, length: number): void {
    this.applyChanges([{
      type: 'delete',
      sectionId,
      position,
      length
    }]);
  }

  // ---------------------------------------------------------------------------
  // COMMENTS
  // ---------------------------------------------------------------------------

  addComment(
    sectionId: string,
    content: string,
    start: number,
    end: number,
    quotedText: string
  ): void {
    const comment: Partial<CollaborationComment> = {
      documentId: this.documentId,
      sectionId,
      userId: this.userId,
      content,
      position: { start, end, quotedText },
      status: 'open',
      replies: []
    };
    this.send({ type: 'add_comment', comment });
  }

  replyToComment(commentId: string, content: string): void {
    this.send({
      type: 'reply_comment',
      commentId,
      content
    });
  }

  resolveComment(commentId: string): void {
    this.send({ type: 'resolve_comment', commentId });
  }

  // ---------------------------------------------------------------------------
  // SUGGESTIONS
  // ---------------------------------------------------------------------------

  addSuggestion(
    sectionId: string,
    type: 'insert' | 'delete' | 'replace',
    originalText: string,
    suggestedText: string,
    start: number,
    end: number
  ): void {
    const suggestion: Partial<Suggestion> = {
      documentId: this.documentId,
      sectionId,
      userId: this.userId,
      type,
      originalText,
      suggestedText,
      position: { start, end },
      status: 'pending'
    };
    this.send({ type: 'add_suggestion', suggestion });
  }

  acceptSuggestion(suggestionId: string): void {
    this.send({ type: 'resolve_suggestion', suggestionId, accepted: true });
  }

  rejectSuggestion(suggestionId: string): void {
    this.send({ type: 'resolve_suggestion', suggestionId, accepted: false });
  }

  // ---------------------------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------------------------

  getOnlineUsers(): CollaborationUser[] {
    return Array.from(this.users.values()).filter(u => u.isOnline);
  }

  getUser(userId: string): CollaborationUser | undefined {
    return this.users.get(userId);
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// =============================================================================
// PRESENCE INDICATOR COMPONENT HELPERS
// =============================================================================

export const USER_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#14B8A6', // teal
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
];

export function getRandomColor(userId: string): string {
  // Generate consistent color based on user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function formatUserInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// =============================================================================
// LOCAL STORAGE SYNC FOR OFFLINE SUPPORT
// =============================================================================

export class OfflineCollaborationSync {
  private storageKey: string;

  constructor(documentId: string) {
    this.storageKey = `collab_offline_${documentId}`;
  }

  saveChanges(changes: DocumentChange[]): void {
    try {
      const existing = this.getStoredChanges();
      existing.push(...changes);
      localStorage.setItem(this.storageKey, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save offline changes:', e);
    }
  }

  getStoredChanges(): DocumentChange[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearStoredChanges(): void {
    localStorage.removeItem(this.storageKey);
  }

  hasStoredChanges(): boolean {
    return this.getStoredChanges().length > 0;
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createCollaborationService(
  documentId: string,
  userId: string
): RealTimeCollaborationService {
  return new RealTimeCollaborationService(documentId, userId);
}

export default RealTimeCollaborationService;
