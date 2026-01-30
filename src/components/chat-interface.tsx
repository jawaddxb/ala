'use client';

import { useState, useRef, useEffect } from 'react';
import { useAlaStore, type Message } from '@/lib/store';
import { PERSPECTIVES, INTENSITY_LABELS, type Intensity } from '@/lib/prompts';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Sparkles,
  MessageCircle,
  Compass,
  Heart,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    addMessage,
    isLoading,
    setIsLoading,
    perspective,
    intensity,
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
          perspective,
          intensity,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const text = await response.text();
      
      const parts = text.split('───────────────────');
      const neutralAnswer = parts[0]?.trim();
      const reflection = parts[1]?.trim();

      addMessage({
        role: 'assistant',
        content: text,
        neutralAnswer,
        reflection,
        perspectiveUsed: perspective,
        intensityUsed: intensity,
      });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
      });
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Desktop Header - shown on large screens */}
      <div className="hidden lg:flex items-center justify-center py-4 border-b border-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">Conversation</span>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-none"
        ref={scrollRef}
      >
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}

          {isLoading && (
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-pulse-dot" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-pulse-dot" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-pulse-dot" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="w-full resize-none bg-surface text-body text-primary placeholder:text-muted rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-xl shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const { perspective, intensity, setIsLoading, addMessage } = useAlaStore();
  
  const suggestions = [
    { 
      icon: <Compass className="w-5 h-5" />,
      title: "Life decisions",
      prompt: "How do I make a big decision when I'm uncertain?",
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
    },
    { 
      icon: <Heart className="w-5 h-5" />,
      title: "Relationships",
      prompt: "How can I have difficult conversations with loved ones?",
      color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
    },
    { 
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Productivity",
      prompt: "How can I be more productive without burning out?",
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
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
          messages: [{ role: 'user', content: prompt }],
          perspective,
          intensity,
        }),
      });

      if (!response.ok) throw new Error('Failed');

      const responseText = await response.text();
      const parts = responseText.split('───────────────────');
      
      addMessage({
        role: 'assistant',
        content: responseText,
        neutralAnswer: parts[0]?.trim(),
        reflection: parts[1]?.trim(),
        perspectiveUsed: perspective,
        intensityUsed: intensity,
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Hero */}
      <div className="mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 mx-auto">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-primary mb-3">
          Welcome to ALA
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Ask anything. Get neutral, factual answers.
          {perspective !== 'none' && intensity > 0 && (
            <span className="block mt-1 text-primary">
              Plus thoughtful reflections when you want them.
            </span>
          )}
        </p>
      </div>
      
      {/* Suggestion Cards */}
      <div className="w-full max-w-2xl">
        <p className="text-sm text-muted-foreground mb-4">Try asking about...</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {suggestions.map((s) => (
            <button
              key={s.title}
              onClick={() => handleSuggestion(s.prompt)}
              className="group p-4 rounded-2xl bg-surface hover:bg-surface/80 border border-transparent hover:border-border text-left transition-all"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                s.color
              )}>
                {s.icon}
              </div>
              <h3 className="font-medium text-primary mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{s.prompt}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ask this</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = message.role === 'user';
  const hasReflection = message.reflection && message.perspectiveUsed !== 'none' && message.intensityUsed && message.intensityUsed > 0;
  const perspectiveLabel = PERSPECTIVES.find(p => p.value === message.perspectiveUsed)?.label?.split(' ')[0];

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="user-bubble max-w-[80%] lg:max-w-[60%]">
          <p className="text-body whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {/* Core Answer */}
        <div className="bg-surface rounded-2xl rounded-tl-md p-4 lg:p-5">
          <p className="text-body text-primary whitespace-pre-wrap leading-relaxed">
            {message.neutralAnswer || message.content}
          </p>
        </div>

        {/* Reflection Toggle */}
        {hasReflection && (
          <div className="max-w-full">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "reflection-toggle w-full",
                isExpanded && "rounded-b-none border-b-0"
              )}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted" strokeWidth={1.5} />
                <span className="text-caption text-muted-foreground">
                  Reflection • {perspectiveLabel} • Level {message.intensityUsed}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted" strokeWidth={1.5} />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted" strokeWidth={1.5} />
              )}
            </button>

            {isExpanded && (
              <div className="reflection-content animate-slide-down">
                <p className="text-reflection-foreground whitespace-pre-wrap">
                  {message.reflection}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
