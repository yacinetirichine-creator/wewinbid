'use client';

import { useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import ChatSessions from '@/components/chat/ChatSessions';
import { NewAppLayout as AppLayout } from '@/components/layout/NewAppLayout';
import { MessageSquarePlus, Menu, X } from 'lucide-react';

export default function ChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [showSidebar, setShowSidebar] = useState(true);

  const handleNewChat = () => {
    setSelectedSessionId(undefined);
  };

  const handleSessionCreated = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  return (
    <AppLayout pageTitle="Assistant IA" noPadding>
    <div className="flex h-[calc(100vh-8rem)] bg-gray-50 dark:bg-gray-900">
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-40 w-80 h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-blue-600" />
              Conversations
            </h2>
          </div>
          
          <ChatSessions
            onSelectSession={setSelectedSessionId}
            selectedSessionId={selectedSessionId}
            onNewChat={handleNewChat}
          />
        </div>
      </div>

      {showSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Tender Assistant
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered help for tender analysis and submission
              </p>
            </div>
            
            {!selectedSessionId && (
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  ✨ New conversation
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatInterface
            sessionId={selectedSessionId}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
