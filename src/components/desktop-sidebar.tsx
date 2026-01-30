'use client';

import { useAlaStore } from '@/lib/store';
import { PERSPECTIVES, INTENSITY_LABELS, INTENSITY_DESCRIPTIONS, type Perspective, type Intensity } from '@/lib/prompts';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  BookOpen, 
  Moon, 
  Sun,
  Star,
  Cross,
  ScrollText,
  Brain,
  Compass,
  ChevronRight,
  Quote,
  Lightbulb,
  RotateCcw
} from 'lucide-react';
import { useState, useEffect } from 'react';

const PERSPECTIVE_CONFIG: Record<Perspective, { 
  icon: React.ReactNode; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  none: { 
    icon: <Sparkles className="w-5 h-5" />, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    description: 'Factual answers only'
  },
  abrahamic: { 
    icon: <BookOpen className="w-5 h-5" />, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    description: 'Shared wisdom across traditions'
  },
  islam: { 
    icon: <Star className="w-5 h-5" />, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    description: 'Quranic & Islamic sources'
  },
  christianity: { 
    icon: <Cross className="w-5 h-5" />, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'Biblical & Christian sources'
  },
  judaism: { 
    icon: <ScrollText className="w-5 h-5" />, 
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    description: 'Torah & Rabbinic sources'
  },
  secular: { 
    icon: <Brain className="w-5 h-5" />, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    description: 'Rational meta-principles'
  },
  mixed: { 
    icon: <Compass className="w-5 h-5" />, 
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    description: 'Explore multiple views'
  },
};

export function DesktopSidebar() {
  const { perspective, intensity, setPerspective, setIntensity, messages, clearMessages } = useAlaStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const config = PERSPECTIVE_CONFIG[perspective];

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
              <p className="text-xs text-muted-foreground">Choice-conditioned assistant</p>
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-4">
        
        {/* Current Mode Card */}
        <div className={cn(
          "rounded-2xl p-5 transition-colors",
          config.bgColor
        )}>
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-white/80 dark:bg-black/20",
              config.color
            )}>
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-primary">
                {PERSPECTIVES.find(p => p.value === perspective)?.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {config.description}
              </p>
              {perspective !== 'none' && intensity > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-white/60 dark:bg-black/20 rounded-full">
                  <span className="text-xs font-medium text-primary">
                    Level {intensity}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {INTENSITY_LABELS[intensity as Intensity]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Perspective Selection */}
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Choose Perspective
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {PERSPECTIVES.map((p) => {
              const pConfig = PERSPECTIVE_CONFIG[p.value];
              const isSelected = perspective === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setPerspective(p.value)}
                  className={cn(
                    "relative p-3 rounded-xl text-left transition-all",
                    "border-2",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent bg-surface hover:bg-surface/80 hover:border-border"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                    pConfig.bgColor,
                    pConfig.color
                  )}>
                    {pConfig.icon}
                  </div>
                  <p className="text-sm font-medium text-primary truncate">
                    {p.label.split(' ')[0]}
                  </p>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Intensity Slider */}
        {perspective !== 'none' && (
          <div className="animate-fade-in">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Reflection Depth
            </h2>
            <div className="bg-surface rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Intensity</span>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  intensity === 0 && "bg-gray-100 text-gray-600 dark:bg-gray-800",
                  intensity === 1 && "bg-blue-100 text-blue-700 dark:bg-blue-900/50",
                  intensity === 2 && "bg-purple-100 text-purple-700 dark:bg-purple-900/50",
                  intensity === 3 && "bg-amber-100 text-amber-700 dark:bg-amber-900/50",
                )}>
                  {INTENSITY_LABELS[intensity as Intensity]}
                </span>
              </div>
              
              <Slider
                value={[intensity]}
                onValueChange={([v]) => setIntensity(v as Intensity)}
                max={3}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between mt-2 text-[10px]">
                {[0, 1, 2, 3].map((i) => (
                  <button 
                    key={i}
                    type="button"
                    onClick={() => setIntensity(i as Intensity)}
                    className={cn(
                      "transition-colors cursor-pointer hover:text-primary",
                      intensity === i ? "text-primary font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {INTENSITY_LABELS[i as Intensity]}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs text-muted-foreground bg-background rounded-lg p-3">
                {INTENSITY_DESCRIPTIONS[intensity as Intensity]}
              </p>
            </div>
          </div>
        )}

        {/* How It Works Card */}
        <div className="bg-surface rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-medium text-primary">How it works</h3>
          </div>
          <ul className="space-y-2">
            {[
              'Neutral answer first, always',
              'Reflection added if enabled',
              'You control everything',
              'ALA never suggests changes'
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
          <Quote className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground italic">
            "Freedom of choice. Your path is your own."
          </p>
        </div>
      </div>
    </div>
  );
}
