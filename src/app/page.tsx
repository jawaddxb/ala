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
    <div className="min-h-screen flex flex-col" style={{ background: '#faf8f4' }}>
      {/* Mobile header */}
      <header
        className="flex items-center justify-between px-4 h-14 sticky top-0 z-40 lg:hidden"
        style={{
          background: 'rgba(250,248,244,0.95)',
          borderBottom: '1px solid #e0dbd2',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => setShowHistory(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-border"
          style={{ color: '#7a7065' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src="/ala-logo.jpg"
          alt="ALA"
          style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'cover' }}
        />

        {messages.length > 0 ? (
          <button
            onClick={clearMessages}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-border"
            style={{ color: '#9a9388' }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 0px)' }}>
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 xl:w-72 flex-col shrink-0">
          <DesktopSidebar />
        </aside>

        {/* Chat */}
        <main
          className="flex-1 flex flex-col min-w-0"
          style={{ borderLeft: '1px solid #e0dbd2' }}
        >
          <ChatInterface />
        </main>
      </div>

      <HistorySheet open={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
