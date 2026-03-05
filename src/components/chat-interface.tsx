'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAlaStore, type Message } from '@/lib/store';
import { Send } from 'lucide-react';

// ─── Citation pattern matching ────────────────────────────────────────────────
const CITATION_RE = [
  /\b(Quran\s+\d+:\d+(?:[-–]\d+)?)/g,
  /\b(Sahih\s+(?:al-)?Bukhari\s+\d+)\b/gi,
  /\b(Sahih\s+Muslim\s+\d+)\b/gi,
  /\b(Genesis|Exodus|Leviticus|Psalms|Proverbs|Isaiah)\s+\d+:\d+\b/g,
];

function renderWithCitations(text: string): React.ReactNode[] {
  const OPEN = '\x00C\x00';
  const CLOSE = '\x00/C\x00';
  let marked = text;
  CITATION_RE.forEach(re => {
    marked = marked.replace(re, `${OPEN}$1${CLOSE}`);
  });
  marked = marked.replace(/\b(Sahih al-Bukhari \d+):/gi, `${OPEN}$1${CLOSE}:`);
  marked = marked.replace(/\b(Sahih Muslim \d+):/gi, `${OPEN}$1${CLOSE}:`);

  const parts = marked.split(new RegExp(`${OPEN}|${CLOSE}`));
  const out: React.ReactNode[] = [];
  let cite = false;
  parts.forEach((p, i) => {
    if (!p) { cite = !cite; return; }
    if (cite) {
      out.push(<span key={i} className="citation-badge">{p}</span>);
    } else {
      out.push(p);
    }
    cite = !cite;
  });
  return out;
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).flatMap((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return [<strong key={i}>{chunk.slice(2, -2)}</strong>];
    }
    if (chunk.startsWith('*') && chunk.endsWith('*')) {
      return [<em key={i}>{chunk.slice(1, -1)}</em>];
    }
    return renderWithCitations(chunk);
  });
}

function renderAIContent(content: string): React.ReactNode {
  return content.split(/\n\n+/).map((block, bi) => {
    const lines = block.split('\n');
    if (lines.every(l => /^\d+\.\s/.test(l.trim()) || !l.trim())) {
      return (
        <ol key={bi} style={{ listStyle: 'decimal', paddingLeft: '1.4rem', margin: '0.5rem 0' }}>
          {lines.filter(l => l.trim()).map((item, ii) => (
            <li key={ii} style={{ marginBottom: '0.35rem', lineHeight: 1.7 }}>
              {renderInline(item.replace(/^\d+\.\s*/, ''))}
            </li>
          ))}
        </ol>
      );
    }
    if (lines.every(l => /^[-•]\s/.test(l.trim()) || !l.trim())) {
      return (
        <ul key={bi} className="ai-message" style={{ listStyle: 'none', padding: 0, margin: '0.4rem 0' }}>
          {lines.filter(l => l.trim()).map((item, ii) => (
            <li key={ii}>{renderInline(item.replace(/^[-•]\s*/, ''))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} style={{ margin: bi > 0 ? '0.6rem 0 0' : 0, lineHeight: 1.75 }}>
        {lines.map((line, li) => (
          <span key={li}>
            {renderInline(line)}
            {li < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ChatInterface() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, addMessage, isLoading, setIsLoading } = useAlaStore();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    addMessage({ role: 'user', content: userMessage });
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMessage }],
        }),
      });
      if (!res.ok) throw new Error('failed');
      addMessage({ role: 'assistant', content: await res.text() });
    } catch {
      addMessage({ role: 'assistant', content: 'Something went wrong. Try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#faf8f4' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-2xl mx-auto px-5 py-8 lg:py-12">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-7">
              {messages.map(m => <MessageBubble key={m.id} message={m} />)}
            </div>
          )}

          {isLoading && (
            <div className="mt-7 flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full overflow-hidden shrink-0"
                style={{ border: '1.5px solid #e0dbd2' }}
              >
                <img src="/ala-logo.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-1.5 items-center">
                {[0, 160, 320].map((delay, i) => (
                  <span
                    key={i}
                    className="animate-pulse-dot rounded-full"
                    style={{ width: 6, height: 6, background: '#2a7470', display: 'inline-block', animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid #e0dbd2', background: '#faf8f4' }}>
        <div className="max-w-2xl mx-auto px-5 py-4">
          <form onSubmit={handleSubmit}>
            <div
              className="flex items-end gap-3 rounded-xl px-4 py-3"
              style={{ background: '#ffffff', border: '1px solid #e0dbd2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 resize-none bg-transparent focus:outline-none text-sm leading-relaxed"
                style={{ minHeight: '22px', maxHeight: '140px', color: '#1a2e2c', caretColor: '#2a7470' }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: input.trim() && !isLoading ? '#2a7470' : '#ece9e3',
                  color: input.trim() && !isLoading ? '#ffffff' : '#b0a89e',
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
          <p className="text-center text-[11px] mt-2" style={{ color: '#c0b8b0' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  {
    title: 'Riba & Halal Finance',
    prompt: 'What does Islam say about riba and halal investing? Give me the exact hadith citations.',
  },
  {
    title: 'Bitcoin & Sound Money',
    prompt: 'What do the religious texts say about sound money and currency debasement?',
  },
  {
    title: 'War & Sovereignty',
    prompt: 'What does scripture say about resisting oppression and defending one\'s land?',
  },
];

function EmptyState() {
  const { setIsLoading, addMessage, messages } = useAlaStore();

  const handleSuggestion = async (prompt: string) => {
    addMessage({ role: 'user', content: prompt });
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error('failed');
      addMessage({ role: 'assistant', content: await res.text() });
    } catch {
      addMessage({ role: 'assistant', content: 'Something went wrong. Try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[62vh] text-center select-none">
      {/* Typographic mark — no logo image, lead with the word */}
      <div className="mb-7">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div style={{ width: 30, height: 1, background: '#d0cbc2' }} />
          <span
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: '#b0a89e',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            ALA®
          </span>
          <div style={{ width: 30, height: 1, background: '#d0cbc2' }} />
        </div>

        <h1
          className="mb-2"
          style={{
            fontFamily: 'var(--font-fraunces), Georgia, serif',
            fontSize: '2.1rem',
            fontWeight: 600,
            color: '#1a2e2c',
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
          }}
        >
          Ask. Get an answer.
        </h1>
        <p className="text-sm" style={{ color: '#9a9388', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
          Direct answers backed by 58,083 verified sources. No hedging. No hallucination.
        </p>
      </div>

      {/* Suggestions — editorial list, no icons */}
      <div className="w-full max-w-lg space-y-2 mt-7">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            onClick={() => handleSuggestion(s.prompt)}
            className="w-full text-left px-4 py-3 rounded-xl transition-all group"
            style={{ background: '#ffffff', border: '1px solid #e0dbd2' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#b8dbd9';
              (e.currentTarget as HTMLButtonElement).style.background = '#f6fafa';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#e0dbd2';
              (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
            }}
          >
            <p
              className="text-sm font-semibold mb-0.5"
              style={{ color: '#2a7470' }}
            >
              {s.title}
            </p>
            <p
              className="text-xs leading-relaxed line-clamp-1"
              style={{ color: '#9a9388' }}
            >
              {s.prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const rendered = useMemo(() => renderAIContent(message.content), [message.content]);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="user-bubble max-w-[78%] lg:max-w-[65%]"
          style={{ fontSize: '0.9rem' }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* ALA avatar */}
      <div
        className="shrink-0 w-7 h-7 rounded-full overflow-hidden mt-0.5"
        style={{ border: '1.5px solid #e0dbd2' }}
      >
        <img src="/ala-logo.jpg" alt="ALA" className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className="rounded-xl px-5 py-4"
          style={{
            background: '#ffffff',
            border: '1px solid #e8e3d8',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div className="ai-message text-sm" style={{ color: '#2a3a39' }}>
            {rendered}
          </div>
        </div>
      </div>
    </div>
  );
}
