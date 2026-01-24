'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  CreditCard,
  Zap,
  Calendar,
  RotateCcw,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUPPORTED_LANGUAGES = {
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    greeting: 'Bonjour ! Je suis **WinBot**, votre assistant IA.',
    placeholder: 'Posez votre question...',
    quickActions: [
      { icon: HelpCircle, label: 'Comment ça marche ?', query: 'Comment fonctionne WeWinBid ?' },
      { icon: CreditCard, label: 'Tarifs', query: 'Quels sont vos tarifs ?' },
      { icon: Zap, label: 'Fonctionnalités IA', query: 'Quelles sont les fonctionnalités IA ?' },
      { icon: Calendar, label: 'Démo gratuite', query: 'Comment réserver une démo ?' },
    ],
    poweredBy: 'Propulsé par Claude IA',
    disclaimer: 'Réponses générées par IA',
    newChat: 'Nouvelle conversation',
  },
  en: {
    name: 'English',
    flag: '🇬🇧',
    greeting: 'Hello! I\'m **WinBot**, your AI assistant.',
    placeholder: 'Ask your question...',
    quickActions: [
      { icon: HelpCircle, label: 'How it works?', query: 'How does WeWinBid work?' },
      { icon: CreditCard, label: 'Pricing', query: 'What are your prices?' },
      { icon: Zap, label: 'AI Features', query: 'What AI features do you offer?' },
      { icon: Calendar, label: 'Free demo', query: 'How can I book a demo?' },
    ],
    poweredBy: 'Powered by Claude AI',
    disclaimer: 'AI-generated responses',
    newChat: 'New conversation',
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    greeting: '¡Hola! Soy **WinBot**, tu asistente IA.',
    placeholder: 'Haz tu pregunta...',
    quickActions: [
      { icon: HelpCircle, label: '¿Cómo funciona?', query: '¿Cómo funciona WeWinBid?' },
      { icon: CreditCard, label: 'Precios', query: '¿Cuáles son sus precios?' },
      { icon: Zap, label: 'Funciones IA', query: '¿Qué funciones de IA ofrecen?' },
      { icon: Calendar, label: 'Demo gratis', query: '¿Cómo puedo reservar una demo?' },
    ],
    poweredBy: 'Impulsado por Claude IA',
    disclaimer: 'Respuestas generadas por IA',
    newChat: 'Nueva conversación',
  },
  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
    greeting: 'Hallo! Ich bin **WinBot**, Ihr KI-Assistent.',
    placeholder: 'Stellen Sie Ihre Frage...',
    quickActions: [
      { icon: HelpCircle, label: 'Wie funktioniert es?', query: 'Wie funktioniert WeWinBid?' },
      { icon: CreditCard, label: 'Preise', query: 'Was sind Ihre Preise?' },
      { icon: Zap, label: 'KI-Funktionen', query: 'Welche KI-Funktionen bieten Sie?' },
      { icon: Calendar, label: 'Kostenlose Demo', query: 'Wie kann ich eine Demo buchen?' },
    ],
    poweredBy: 'Unterstützt von Claude KI',
    disclaimer: 'KI-generierte Antworten',
    newChat: 'Neues Gespräch',
  },
  it: {
    name: 'Italiano',
    flag: '🇮🇹',
    greeting: 'Ciao! Sono **WinBot**, il tuo assistente IA.',
    placeholder: 'Fai la tua domanda...',
    quickActions: [
      { icon: HelpCircle, label: 'Come funziona?', query: 'Come funziona WeWinBid?' },
      { icon: CreditCard, label: 'Prezzi', query: 'Quali sono i vostri prezzi?' },
      { icon: Zap, label: 'Funzioni IA', query: 'Quali funzioni IA offrite?' },
      { icon: Calendar, label: 'Demo gratuita', query: 'Come posso prenotare una demo?' },
    ],
    poweredBy: 'Alimentato da Claude IA',
    disclaimer: 'Risposte generate da IA',
    newChat: 'Nuova conversazione',
  },
  pt: {
    name: 'Português',
    flag: '🇵🇹',
    greeting: 'Olá! Sou o **WinBot**, seu assistente IA.',
    placeholder: 'Faça sua pergunta...',
    quickActions: [
      { icon: HelpCircle, label: 'Como funciona?', query: 'Como funciona o WeWinBid?' },
      { icon: CreditCard, label: 'Preços', query: 'Quais são seus preços?' },
      { icon: Zap, label: 'Recursos IA', query: 'Quais recursos de IA vocês oferecem?' },
      { icon: Calendar, label: 'Demo grátis', query: 'Como posso agendar uma demo?' },
    ],
    poweredBy: 'Alimentado por Claude IA',
    disclaimer: 'Respostas geradas por IA',
    newChat: 'Nova conversa',
  },
  ar: {
    name: 'العربية',
    flag: '🇲🇦',
    greeting: 'مرحباً! أنا **WinBot**، مساعدك الذكي.',
    placeholder: 'اطرح سؤالك...',
    quickActions: [
      { icon: HelpCircle, label: 'كيف يعمل؟', query: 'كيف يعمل WeWinBid؟' },
      { icon: CreditCard, label: 'الأسعار', query: 'ما هي أسعاركم؟' },
      { icon: Zap, label: 'ميزات الذكاء', query: 'ما هي ميزات الذكاء الاصطناعي؟' },
      { icon: Calendar, label: 'عرض مجاني', query: 'كيف أحجز عرضاً تجريبياً؟' },
    ],
    poweredBy: 'مدعوم من Claude AI',
    disclaimer: 'إجابات مولدة بالذكاء الاصطناعي',
    newChat: 'محادثة جديدة',
  },
};

type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Simple markdown-like rendering for bold text
function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('fr');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const langConfig = SUPPORTED_LANGUAGES[language];

  // Detect browser language
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0] as LanguageCode;
    if (SUPPORTED_LANGUAGES[browserLang]) {
      setLanguage(browserLang);
    }
  }, []);

  // Add initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingContent = `${langConfig.greeting}\n\nJe peux vous aider à :\n• Découvrir les fonctionnalités de WeWinBid\n• Comprendre nos tarifs\n• Répondre à vos questions sur les appels d'offres\n• Planifier une démonstration`;

      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greetingContent,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, langConfig.greeting, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = useCallback(async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const response = await fetch('/api/chat/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          language,
        }),
      });

      if (!response.ok) throw new Error('Erreur de communication');

      const data = await response.json();

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: language === 'fr'
          ? "Désolé, une erreur s'est produite. Contactez-nous à commercial@wewinbid.com"
          : "Sorry, an error occurred. Please contact us at commercial@wewinbid.com",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, language]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setShowQuickActions(true);
  };

  const handleQuickAction = (query: string) => {
    sendMessage(query);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl shadow-primary-500/30 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
        aria-label="Ouvrir le chat"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 'auto' : 'min(600px, calc(100vh - 100px))'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[400px] bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">WinBot</h3>
                    <p className="text-xs text-white/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {langConfig.poweredBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                    className="bg-white/20 text-white text-sm rounded-lg px-2 py-1 border-none outline-none cursor-pointer"
                  >
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, { flag, name }]) => (
                      <option key={code} value={code} className="text-surface-900">
                        {flag} {name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={resetChat}
                    className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                    title={langConfig.newChat}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50 dark:bg-surface-800">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user'
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                            : 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white'
                        }`}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary-600 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 rounded-tl-sm shadow-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {renderMarkdown(message.content)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Quick Actions */}
                  {showQuickActions && messages.length <= 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 gap-2 pt-2"
                    >
                      {langConfig.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickAction(action.query)}
                          className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left group"
                        >
                          <action.icon className="w-4 h-4 text-primary-500 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium text-surface-600 dark:text-surface-300">{action.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={langConfig.placeholder}
                      className="flex-1 px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm placeholder:text-surface-400"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading}
                      className="w-12 h-12 rounded-xl"
                      variant="primary"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-surface-400 mt-2 text-center">
                    {langConfig.disclaimer}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
