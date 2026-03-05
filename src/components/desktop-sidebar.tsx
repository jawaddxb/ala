'use client';

import { useAlaStore } from '@/lib/store';
import {
  RotateCcw,
  Library,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

export function DesktopSidebar() {
  const { messages, clearMessages } = useAlaStore();

  const userMessages = messages.filter(m => m.role === 'user').length;

  return (
    <div className="sidebar-glow flex flex-col h-full">
      {/* Logo Header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          {/* ALA Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/ala-logo.jpg"
              alt="ALA"
              className="w-11 h-11 rounded-xl object-cover"
            />
            <div>
              <div className="text-[15px] font-bold tracking-wide" style={{ color: '#a8e6e2' }}>ALA®</div>
              <div className="text-[11px] uppercase tracking-[0.15em]" style={{ color: 'rgba(168,230,226,0.45)' }}>
                Freedom of Choice
              </div>
            </div>
          </div>
          {/* Actions */}
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(77,184,176,0.08)' }}
              title="New conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: '#4db8b0' }} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mt-5 h-px" style={{ background: 'rgba(77,184,176,0.1)' }} />
      </div>

      {/* Center Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-4 space-y-3">

        {/* Persona card */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(77,184,176,0.06)',
            border: '1px solid rgba(77,184,176,0.12)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[15px]"
              style={{ background: 'rgba(77,184,176,0.12)' }}
            >
              🔥
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#a8e6e2' }}>
                Direct. Opinionated. Real.
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(168,230,226,0.5)' }}>
                Backed by 58,083 verified sources. No hedging.
              </p>
            </div>
          </div>
        </div>

        {/* Corpus stats */}
        <div
          className="rounded-2xl p-4 space-y-2.5"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(77,184,176,0.08)',
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3"
            style={{ color: 'rgba(168,230,226,0.4)' }}
          >
            Corpus
          </p>
          {[
            { label: 'Quran', count: '6,236', icon: '📖' },
            { label: 'Sahih Bukhari', count: '7,519', icon: '📜' },
            { label: 'Sahih Muslim', count: '7,359', icon: '📜' },
            { label: 'Torah', count: '5,846', icon: '📖' },
            { label: 'Bible KJV', count: '31,098', icon: '✝️' },
            { label: 'Secular', count: '25', icon: '⚡' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.icon}</span>
                <span className="text-xs" style={{ color: 'rgba(168,230,226,0.55)' }}>{item.label}</span>
              </div>
              <span
                className="text-xs font-mono font-semibold"
                style={{ color: '#4db8b0' }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>

        {/* Session stats (if active conversation) */}
        {userMessages > 0 && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'rgba(77,184,176,0.05)',
              border: '1px solid rgba(77,184,176,0.1)',
            }}
          >
            <MessageSquare className="w-4 h-4 shrink-0" style={{ color: '#4db8b0' }} />
            <div>
              <p className="text-xs font-medium" style={{ color: '#a8e6e2' }}>
                {userMessages} {userMessages === 1 ? 'question' : 'questions'} this session
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(168,230,226,0.4)' }}>
                Every answer verified
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 space-y-2" style={{ borderTop: '1px solid rgba(77,184,176,0.1)' }}>
        <Link
          href="/knowledge"
          className="flex items-center gap-3 p-3 rounded-xl transition-all group"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(77,184,176,0.1)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(77,184,176,0.35)';
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(77,184,176,0.07)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(77,184,176,0.1)';
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)';
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(77,184,176,0.1)' }}
          >
            <Library className="w-3.5 h-3.5" style={{ color: '#4db8b0' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: '#a8e6e2' }}>Knowledge Library</p>
            <p className="text-xs" style={{ color: 'rgba(168,230,226,0.4)' }}>Essays & current briefings</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
