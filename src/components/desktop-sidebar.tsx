'use client';

import { useAlaStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Moon,
  Sun,
  RotateCcw,
  Library,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export function DesktopSidebar() {
  const { messages, clearMessages } = useAlaStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary tracking-tight">ALA</h1>
              <p className="text-xs text-muted-foreground">AI Life Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="w-9 h-9 rounded-lg hover:bg-surface flex items-center justify-center transition-colors"
                title="New conversation"
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg hover:bg-surface flex items-center justify-center transition-colors"
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-4">
        <div className={cn("rounded-2xl p-5 bg-primary/5")}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-primary">Direct. Opinionated. Real.</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                ALA speaks with conviction — backed by knowledge, not platitudes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
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
    </div>
  );
}
