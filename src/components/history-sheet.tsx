'use client';

import Link from 'next/link';
import { useAlaStore } from '@/lib/store';
import { X, MessageSquare, Trash2, Library } from 'lucide-react';

interface HistorySheetProps {
  open: boolean;
  onClose: () => void;
}

export function HistorySheet({ open, onClose }: HistorySheetProps) {
  const { messages, clearMessages } = useAlaStore();

  if (!open) return null;

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute inset-y-0 left-0 w-full max-w-md bg-background shadow-xl animate-slide-in-left">
        {/* Header */}
        <div className="header-height flex items-center justify-between px-4 border-b border-border">
          <div className="w-10" /> {/* Spacer */}
          <span className="text-title text-primary">Menu</span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-56px)] scrollbar-none">
          {/* Knowledge Library Link */}
          <div className="p-4 border-b border-border">
            <Link 
              href="/knowledge"
              onClick={onClose}
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Library className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body text-primary font-medium">Knowledge Library</p>
                <p className="text-caption text-muted-foreground">Browse Torah, Bible, Quran, Hadith</p>
              </div>
            </Link>
          </div>

          {/* Conversation Section */}
          {hasMessages ? (
            <div className="p-4">
              <h2 className="text-caption uppercase tracking-wide text-muted mb-3">
                Current Conversation
              </h2>
              {/* Current conversation */}
              <div className="border border-border rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-muted" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-body text-primary font-medium">Active session</p>
                    <p className="text-caption text-muted-foreground">
                      {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clear button */}
              <button
                onClick={() => {
                  clearMessages();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 text-caption text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                Clear conversation
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted" strokeWidth={1.5} />
              </div>
              <p className="text-body text-primary font-medium mb-1">Ask anything</p>
              <p className="text-caption text-muted-foreground">
                Your conversations with ALA will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slideInLeft 250ms ease-out;
        }
      `}</style>
    </div>
  );
}
