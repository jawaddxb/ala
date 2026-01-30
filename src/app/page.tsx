'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatInterface } from '@/components/chat-interface';
import { PreferenceControls } from '@/components/preference-controls';
import { SettingsSheet } from '@/components/settings-sheet';
import { HistorySheet } from '@/components/history-sheet';
import { Menu, Settings, Sparkles, Moon, Sun, Lightbulb, Quote, RotateCcw, Library } from 'lucide-react';
import { useAlaStore } from '@/lib/store';

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
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
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <Settings className="w-5 h-5 text-foreground" strokeWidth={1.5} />
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
                  <p className="text-xs text-muted-foreground">Choice-conditioned assistant</p>
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
              {/* Section Title */}
              <div>
                <h2 className="text-sm font-medium text-foreground mb-1">Your Preferences</h2>
                <p className="text-xs text-muted-foreground">Control how ALA responds</p>
              </div>

              {/* Preference Controls */}
              <PreferenceControls />

              {/* How It Works Card */}
              <div className="p-4 bg-card rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="font-medium text-sm">How it works</h3>
                </div>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">1.</span>
                    Every response starts with a neutral, factual answer
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">2.</span>
                    If you enable a perspective, an optional reflection is added
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">3.</span>
                    You control this completely — change anytime
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">4.</span>
                    ALA never suggests you change your settings
                  </li>
                </ul>
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
            
            <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <Quote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Freedom of choice.</span>{' '}
                Your path is your own.
              </p>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatInterface />
        </main>
      </div>

      {/* Mobile Sheets */}
      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} />
      <HistorySheet open={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}
