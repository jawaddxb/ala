'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { HistorySheet } from '@/components/history-sheet';
import { Menu, RotateCcw } from 'lucide-react';
import { useAlaStore } from '@/lib/store';

export default function Home() {
  const [showHistory, setShowHistory] = useState(false);
  const { messages, clearMessages } = useAlaStore();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0d1f1e' }}
    >
      {/* Mobile Header */}
      <header
        className="flex items-center justify-between px-4 h-14 sticky top-0 z-40 lg:hidden"
        style={{
          background: 'rgba(13,31,30,0.95)',
          borderBottom: '1px solid rgba(77,184,176,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <button
          onClick={() => setShowHistory(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ color: '#4db8b0' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src="/ala-logo.jpg"
          alt="ALA"
          style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
        />

        {messages.length > 0 ? (
          <button
            onClick={clearMessages}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: 'rgba(168,230,226,0.5)' }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 0px)' }}>
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-72 xl:w-80 flex-col shrink-0">
          <DesktopSidebar />
        </aside>

        {/* Chat */}
        <main
          className="flex-1 flex flex-col min-w-0"
          style={{
            borderLeft: '1px solid rgba(77,184,176,0.1)',
          }}
        >
          <ChatInterface />
        </main>
      </div>

      {/* Mobile History Sheet */}
      <HistorySheet open={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
