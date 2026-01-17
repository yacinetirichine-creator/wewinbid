'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, ThumbsUp, ThumbsDown, Sparkles, Copy, Check } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  model_used?: string;
  sources?: any[];
  user_rating?: number;
  is_helpful?: boolean;
}

interface Suggestion {
  text: string;
  icon: string;
  category: string;
}

interface ChatInterfaceProps {
  sessionId?: string;
  tenderId?: string;
  onSessionCreated?: (sessionId: string) => void;
}

export default function ChatInterface({ sessionId, tenderId, onSessionCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/chat/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [sessionId]);

  const loadSuggestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('session_id', sessionId);
      if (tenderId) params.append('tender_id', tenderId);

      const response = await fetch(`/api/chat/suggestions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }, [sessionId, tenderId]);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
    }
    loadSuggestions();
  }, [sessionId, loadMessages, loadSuggestions]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: content,
          tender_id: tenderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id ? data.user_message : msg
        )
      );

      setMessages(prev => [...prev, data.assistant_message]);

      if (!sessionId && data.session_id && onSessionCreated) {
        onSessionCreated(data.session_id);
      }

      loadSuggestions();

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev =>
        prev.filter(msg => msg.id !== userMessage.id)
      );
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    sendMessage(suggestion.text);
  };

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          is_helpful: isHelpful,
        }),
      });

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_helpful: isHelpful } : msg
        )
      );
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to Tender Assistant
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              I can help you analyze tenders, answer questions, and provide guidance on submissions.
              {tenderId && ' Ready to analyze your tender!'}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0 whitespace-pre-wrap">
                    {line}
                  </p>
                ))}
              </div>

              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleFeedback(message.id, true)}
                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      message.is_helpful === true ? 'text-green-600' : 'text-gray-500'
                    }`}
                    title="Helpful"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, false)}
                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                      message.is_helpful === false ? 'text-red-600' : 'text-gray-500'
                    }`}
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 ml-auto"
                    title="Copy"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {suggestions.length > 0 && messages.length < 2 && (
        <div className="px-4 py-2 border-t dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{suggestion.icon}</span>
                <span className="text-gray-700 dark:text-gray-300">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about tenders..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '52px', maxHeight: '150px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
