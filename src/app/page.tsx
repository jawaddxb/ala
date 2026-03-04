'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatInterface } from '@/components/chat-interface';
import { HistorySheet } from '@/components/history-sheet';
import { Menu, Moon, Sun, Sparkles, RotateCcw, Library } from 'lucide-react';
import { useAlaStore } from '@/lib/store';

export default function Home() {
  const [showHistory, setShowHistory] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { messages, clearMessages } = useAlaStore();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className="header-height flex items-center justify-between px-4 border-b border-border bg-background sticky top-0 z-40 lg:hidden">
        <button
          onClick={() => setShowHistory(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" strokeWidth={1.5} />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg tracking-tight">ALA</span>
        </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-foreground" strokeWidth={1.5} />
          ) : (
            <Moon className="w-5 h-5 text-foreground" strokeWidth={1.5} />
          )}
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-80 xl:w-[340px] border-r border-border bg-surface/50 flex-col">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg tracking-tight">ALA</h1>
                  <p className="text-xs text-muted-foreground">AI Life Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearMessages}
                    className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                    title="New conversation"
                  >
                    <RotateCcw className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
            <div className="space-y-6">
              <div className="p-4 bg-muted/50 border rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xs">
                    <p className="font-medium text-foreground mb-1">Direct. Opinionated. Real.</p>
                    <p className="text-muted-foreground leading-relaxed">
                      ALA speaks with conviction — backed by knowledge, not platitudes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border space-y-3">
            {/* Knowledge Library Link */}
            <Link
              href="/knowledge"
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Library className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Knowledge Library</p>
                <p className="text-xs text-muted-foreground">Browse source texts</p>
              </div>
            </Link>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatInterface />
        </main>
      </div>

      {/* Mobile Sheet */}
      <HistorySheet open={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
