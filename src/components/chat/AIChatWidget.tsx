'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUPPORTED_LANGUAGES = {
  fr: { name: 'Français', flag: '🇫🇷', greeting: 'Bonjour ! Comment puis-je vous aider ?' },
  en: { name: 'English', flag: '🇬🇧', greeting: 'Hello! How can I help you?' },
  es: { name: 'Español', flag: '🇪🇸', greeting: '¡Hola! ¿Cómo puedo ayudarte?' },
  de: { name: 'Deutsch', flag: '🇩🇪', greeting: 'Hallo! Wie kann ich Ihnen helfen?' },
  it: { name: 'Italiano', flag: '🇮🇹', greeting: 'Ciao! Come posso aiutarti?' },
  pt: { name: 'Português', flag: '🇵🇹', greeting: 'Olá! Como posso ajudá-lo?' },
  ar: { name: 'العربية', flag: '🇸🇦', greeting: 'مرحباً! كيف يمكنني مساعدتك؟' },
};

type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

const SYSTEM_PROMPT = `Tu es l'assistant IA de WeWinBid, une plateforme SaaS B2B d'automatisation des réponses aux appels d'offres publics et privés, développée par JARVIS SAS.

Tu dois :
- Répondre dans la langue de l'utilisateur (détecte automatiquement)
- Être professionnel, concis et utile
- Connaître parfaitement les fonctionnalités de WeWinBid :
  * Analyse IA et scoring des appels d'offres (0-100)
  * Génération automatique de documents (mémoires techniques, DPGF, DC1-DC4)
  * Base de données des attributaires et historiques de prix
  * Marketplace pour trouver des partenaires (co-traitants, sous-traitants)
  * Alertes personnalisées sur les nouvelles opportunités
  * Collaboration d'équipe en temps réel
  * Support multilingue (FR, EN, ES, DE, IT, PT, AR)

Tarifs :
- Gratuit : 2 AO/mois, fonctionnalités de base
- Pro (49€/mois) : 20 AO/mois, IA avancée, alertes
- Business (149€/mois) : Illimité, API, support prioritaire

Contact : commercial@wewinbid.com ou https://calendly.com/commercial-wewinbid/30min

Tu ne dois JAMAIS :
- Inventer des informations sur d'autres produits
- Donner des conseils juridiques spécifiques
- Partager des informations confidentielles

Si on te pose une question hors sujet, redirige poliment vers les appels d'offres et WeWinBid.`;

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>('fr');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const greeting = SUPPORTED_LANGUAGES[language].greeting;
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: `${greeting}\n\nJe suis l'assistant IA de WeWinBid. Je peux vous aider à :\n• Découvrir nos fonctionnalités\n• Comprendre nos tarifs\n• Répondre à vos questions sur les appels d'offres\n• Vous guider vers les bonnes ressources`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, language, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-2xl shadow-primary-500/30 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-surface-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">Assistant WeWinBid</h3>
                    <p className="text-xs text-white/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Propulsé par IA
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50">
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
                        ? 'bg-primary-100 text-primary-600' 
                        : 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white'
                    }`}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white rounded-tr-sm'
                        : 'bg-white border border-surface-200 text-surface-700 rounded-tl-sm shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
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
                    <div className="bg-white border border-surface-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
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
            <div className="p-4 border-t border-surface-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={language === 'fr' ? 'Posez votre question...' : 'Ask your question...'}
                  className="flex-1 px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 rounded-xl btn-gradient"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-xs text-surface-400 mt-2 text-center">
                {language === 'fr' 
                  ? 'Assistant IA • Réponses générées automatiquement'
                  : 'AI Assistant • Automatically generated responses'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
