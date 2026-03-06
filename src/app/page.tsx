'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { HistorySheet } from '@/components/history-sheet';
import { Menu, RotateCcw, BookOpen } from 'lucide-react';
import { useAlaStore } from '@/lib/store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export default function Home() {
  const [showHistory, setShowHistory] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const { messages, clearMessages } = useAlaStore();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#faf8f4' }}>
      {/* Mobile header */}
      <header
        className="flex items-center justify-between px-3 sm:px-4 h-14 sticky top-0 z-40 lg:hidden"
        style={{
          background: 'rgba(250,248,244,0.95)',
          borderBottom: '1px solid #e0dbd2',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={() => setShowHistory(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors hover:bg-border"
          style={{ color: '#7a7065' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        <img
          src="/ala-logo.jpg"
          alt="ALA"
          style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'cover' }}
        />

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowSources(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors hover:bg-border"
            style={{ color: '#2a7470' }}
          >
            <BookOpen className="w-4 h-4" />
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors hover:bg-border"
              style={{ color: '#9a9388' }}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
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

      {/* Mobile Sources Sheet */}
      <Sheet open={showSources} onOpenChange={setShowSources}>
        <SheetContent side="right" className="w-[85vw] max-w-sm p-0" style={{ background: '#faf8f4' }}>
          <SheetHeader className="sr-only">
            <SheetTitle>Sources</SheetTitle>
            <SheetDescription>Corpus statistics and navigation</SheetDescription>
          </SheetHeader>
          <DesktopSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}
