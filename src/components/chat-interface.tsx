'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAlaStore, type Message } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Send, ArrowRight } from 'lucide-react';

// ─── Citation regex ───────────────────────────────────────────────────────────
const CITATION_PATTERNS = [
  /\b(Quran\s+\d+:\d+(?:[-–]\d+)?)\b/g,
  /\b(Sahih\s+(?:al-)?Bukhari\s+\d+)\b/gi,
  /\b(Sahih\s+Muslim\s+\d+)\b/gi,
  /\b(Torah\s+[\w\s]+\d+:\d+)\b/gi,
  /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Psalms|Proverbs|Isaiah)\s+\d+:\d+\b/g,
];

function renderWithCitations(text: string): React.ReactNode[] {
  // Build one combined pattern with named groups isn't possible in JS easily,
  // so we do a tag-based replacement approach
  let marked = text;
  const OPEN = '\x00CITE\x00';
  const CLOSE = '\x00/CITE\x00';

  CITATION_PATTERNS.forEach(re => {
    marked = marked.replace(re, `${OPEN}$1${CLOSE}`);
  });

  // Also match any "Sahih al-Bukhari NNNN:" style with colon
  marked = marked.replace(/\b(Sahih al-Bukhari \d+):/gi, `${OPEN}$1${CLOSE}:`);
  marked = marked.replace(/\b(Sahih Muslim \d+):/gi, `${OPEN}$1${CLOSE}:`);

  const parts = marked.split(new RegExp(`${OPEN}|${CLOSE}`));
  const result: React.ReactNode[] = [];
  let isCite = false;
  parts.forEach((part, i) => {
    if (!part) { isCite = !isCite; return; }
    if (isCite) {
      result.push(
        <span key={i} className="citation-badge">
          📎 {part}
        </span>
      );
    } else {
      result.push(part);
    }
    isCite = !isCite;
  });
  return result;
}

// ─── Markdown-like renderer ───────────────────────────────────────────────────
function renderAIContent(content: string): React.ReactNode {
  const blocks = content.split(/\n\n+/);

  return blocks.map((block, bi) => {
    const lines = block.split('\n');

    // Numbered list
    if (lines.every(l => /^\d+\.\s/.test(l.trim()) || l.trim() === '')) {
      const items = lines.filter(l => l.trim());
      return (
        <ol key={bi} className="ai-message" style={{ listStyle: 'decimal', paddingLeft: '1.3rem', margin: '0.5rem 0' }}>
          {items.map((item, ii) => {
            const text = item.replace(/^\d+\.\s*/, '');
            return (
              <li key={ii} style={{ marginBottom: '0.4rem', lineHeight: 1.7 }}>
                {renderInline(text)}
              </li>
            );
          })}
        </ol>
      );
    }

    // Bullet list (- or •)
    if (lines.every(l => /^[-•]\s/.test(l.trim()) || l.trim() === '')) {
      const items = lines.filter(l => l.trim());
      return (
        <ul key={bi} style={{ listStyle: 'none', padding: 0, margin: '0.4rem 0' }}>
          {items.map((item, ii) => {
            const text = item.replace(/^[-•]\s*/, '');
            return (
              <li key={ii} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', lineHeight: 1.65 }}>
                <span style={{ color: '#4db8b0', fontWeight: 700, flexShrink: 0 }}>—</span>
                <span>{renderInline(text)}</span>
              </li>
            );
          })}
        </ul>
      );
    }

    // Mixed block — render line by line
    return (
      <p key={bi} style={{ margin: bi > 0 ? '0.55rem 0 0' : '0', lineHeight: 1.75 }}>
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

function renderInline(text: string): React.ReactNode[] {
  // Bold **text** or *text*
  const withBold = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  const intermediate: React.ReactNode[] = withBold.map((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={i} style={{ color: '#a8e6e2', fontWeight: 600 }}>{chunk.slice(2, -2)}</strong>;
    }
    if (chunk.startsWith('*') && chunk.endsWith('*')) {
      return <em key={i}>{chunk.slice(1, -1)}</em>;
    }
    return chunk;
  });

  // Now pass strings through citation renderer
  return intermediate.flatMap((node, i) => {
    if (typeof node === 'string') {
      return renderWithCitations(node);
    }
    return [node];
  });
}

export function ChatInterface() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    addMessage,
    isLoading,
    setIsLoading,
  } = useAlaStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    addMessage({ role: 'user', content: userMessage });
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');
      const text = await response.text();
      addMessage({ role: 'assistant', content: text });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({ role: 'assistant', content: 'Something went wrong. Try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1f1e' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-2xl mx-auto px-5 py-8 lg:py-10">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-7">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}

          {isLoading && (
            <div className="mt-7">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(77,184,176,0.12)' }}
                >
                  <img src="/ala-logo.jpg" alt="" className="w-5 h-5 rounded-full object-cover" />
                </div>
                <div className="flex gap-1.5 items-center">
                  {[0, 150, 300].map((delay, i) => (
                    <span
                      key={i}
                      className="animate-pulse-dot rounded-full"
                      style={{
                        width: 7, height: 7,
                        background: '#4db8b0',
                        display: 'inline-block',
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div
        className="backdrop-blur"
        style={{
          borderTop: '1px solid rgba(77,184,176,0.1)',
          background: 'rgba(13,31,30,0.95)',
        }}
      >
        <div className="max-w-2xl mx-auto p-4">
          <form onSubmit={handleSubmit}>
            <div
              className="flex items-end gap-3 rounded-2xl px-4 py-3 transition-all"
              style={{
                background: '#112827',
                border: '1px solid rgba(77,184,176,0.15)',
              }}
              onFocus={() => {}}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 resize-none bg-transparent focus:outline-none text-sm leading-relaxed"
                style={{
                  minHeight: '24px',
                  maxHeight: '140px',
                  color: '#f0fafa',
                  caretColor: '#4db8b0',
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: input.trim() && !isLoading ? '#4db8b0' : 'rgba(77,184,176,0.12)',
                  color: input.trim() && !isLoading ? '#0d1f1e' : 'rgba(77,184,176,0.4)',
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <p className="text-center text-xs mt-2" style={{ color: 'rgba(168,230,226,0.25)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  const { setIsLoading, addMessage, messages } = useAlaStore();

  const suggestions = [
    {
      emoji: '₿',
      title: 'Bitcoin & Money',
      prompt: 'Why is Bitcoin the only real money? What do the religious texts say about fiat currency?',
    },
    {
      emoji: '⚖️',
      title: 'Riba & Halal Finance',
      prompt: 'What does Islam say about riba and halal investing? Give me the exact hadith citations.',
    },
    {
      emoji: '🌍',
      title: 'War & Sovereignty',
      prompt: 'What does scripture say about resisting oppression and defending one\'s land?',
    },
  ];

  const handleSuggestion = async (prompt: string) => {
    addMessage({ role: 'user', content: prompt });
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: prompt }],
        }),
      });
      if (!response.ok) throw new Error('Failed');
      const text = await response.text();
      addMessage({ role: 'assistant', content: text });
    } catch {
      addMessage({ role: 'assistant', content: 'Something went wrong. Try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center select-none">
      {/* Logo + tagline */}
      <div className="mb-10">
        <div
          className="mx-auto mb-5 rounded-2xl overflow-hidden"
          style={{
            width: 72, height: 72,
            boxShadow: '0 0 40px rgba(77,184,176,0.25)',
          }}
        >
          <img src="/ala-logo.jpg" alt="ALA" className="w-full h-full object-cover" />
        </div>
        <h2
          className="text-2xl font-bold tracking-tight mb-2"
          style={{ color: '#f0fafa' }}
        >
          Ask. Get an answer.
        </h2>
        <p className="text-sm" style={{ color: 'rgba(168,230,226,0.45)' }}>
          Direct. Backed by 58,083 verified sources. No hedging.
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="w-full max-w-xl space-y-2.5">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={() => handleSuggestion(s.prompt)}
            className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-4 transition-all group"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(77,184,176,0.1)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(77,184,176,0.3)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(77,184,176,0.06)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(77,184,176,0.1)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.025)';
            }}
          >
            <span className="text-xl shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#a8e6e2' }}>{s.title}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(168,230,226,0.4)' }}>{s.prompt}</p>
            </div>
            <ArrowRight
              className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: '#4db8b0' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const rendered = useMemo(() => renderAIContent(message.content), [message.content]);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] lg:max-w-[65%] rounded-2xl rounded-br-md px-4 py-3 text-sm font-medium leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, #4db8b0, #3da8a0)',
            color: '#0d1f1e',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* ALA avatar */}
      <div className="shrink-0 mt-0.5">
        <div
          className="w-8 h-8 rounded-full overflow-hidden"
          style={{ boxShadow: '0 0 0 2px rgba(77,184,176,0.2)' }}
        >
          <img src="/ala-logo.jpg" alt="ALA" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-md px-5 py-4"
          style={{
            background: 'rgba(17,40,39,0.8)',
            border: '1px solid rgba(77,184,176,0.1)',
          }}
        >
          <div
            className="ai-message text-sm leading-relaxed"
            style={{ color: 'rgba(240,250,250,0.9)' }}
          >
            {rendered}
          </div>
        </div>
      </div>
    </div>
  );
}
