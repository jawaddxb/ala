'use client';

import { useAlaStore } from '@/lib/store';
import { RotateCcw, Library, BookOpen } from 'lucide-react';
import Link from 'next/link';

const CORPUS = [
  { label: 'Quran', count: '6,236', sub: 'Sahih International' },
  { label: 'Sahih al-Bukhari', count: '7,519', sub: 'authenticated hadiths' },
  { label: 'Sahih Muslim', count: '7,359', sub: 'authenticated hadiths' },
  { label: 'Torah / Tanakh', count: '5,846', sub: 'JPS translation' },
  { label: 'Bible KJV', count: '31,098', sub: 'King James version' },
  { label: 'Secular Wisdom', count: '25', sub: 'Aurelius · Taleb · Hayek' },
];

export function DesktopSidebar() {
  const { messages, clearMessages } = useAlaStore();
  const userMessages = messages.filter(m => m.role === 'user').length;

  return (
    <div className="ala-sidebar flex flex-col h-full">
      {/* Logo + wordmark */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/ala-logo.jpg"
              alt="ALA"
              className="w-9 h-9 rounded-lg object-cover"
              style={{ opacity: 0.95 }}
            />
            <div>
              <div
                className="text-sm font-bold tracking-wide"
                style={{ color: '#1a2e2c', letterSpacing: '0.04em' }}
              >
                ALA®
              </div>
              <div
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: '#9a9388', fontWeight: 500 }}
              >
                Freedom of Choice
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-border"
              style={{ color: '#9a9388' }}
              title="New conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="mt-5 h-px" style={{ background: '#e0dbd2' }} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">

        {/* Tagline */}
        <div>
          <p
            className="text-[13px] leading-relaxed"
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              color: '#3d5452',
              fontStyle: 'italic',
              fontWeight: 400,
            }}
          >
            Direct. Opinionated. Referenced.
          </p>
        </div>

        {/* Corpus */}
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-3"
            style={{ color: '#b0a89e' }}
          >
            Corpus — 58,083 sources
          </p>
          <div className="space-y-0">
            {CORPUS.map((item) => (
              <div
                key={item.label}
                className="flex items-baseline justify-between py-1.5"
                style={{ borderBottom: '1px solid #ece9e3' }}
              >
                <div>
                  <span className="text-xs font-medium" style={{ color: '#3d5452' }}>
                    {item.label}
                  </span>
                  <span className="text-[10px] ml-1.5" style={{ color: '#b0a89e' }}>
                    {item.sub}
                  </span>
                </div>
                <span
                  className="text-xs font-mono font-semibold ml-3 shrink-0"
                  style={{ color: '#2a7470' }}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Session counter */}
        {userMessages > 0 && (
          <p className="text-[11px]" style={{ color: '#b0a89e' }}>
            {userMessages} {userMessages === 1 ? 'question' : 'questions'} this session · every answer verified
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-3" style={{ borderTop: '1px solid #e0dbd2' }}>
        <Link
          href="/knowledge"
          className="flex items-center gap-2.5 py-2 text-sm transition-colors group"
          style={{ color: '#7a7065' }}
        >
          <BookOpen
            className="w-4 h-4 shrink-0 transition-colors"
            style={{ color: '#2a7470' }}
          />
          <div>
            <span
              className="text-sm font-medium"
              style={{ color: '#3d5452' }}
            >
              Knowledge Library
            </span>
            <span className="text-[11px] block" style={{ color: '#b0a89e' }}>
              Essays &amp; current briefings
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
