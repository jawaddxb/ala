'use client';

import { useAlaStore } from '@/lib/store';
import { PERSPECTIVES, INTENSITY_LABELS, INTENSITY_DESCRIPTIONS, type Perspective, type Intensity } from '@/lib/prompts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Sparkles, BookOpen, Star, Cross, ScrollText, Brain, Compass } from 'lucide-react';

const PERSPECTIVE_ICONS: Record<Perspective, React.ReactNode> = {
  none: <Sparkles className="w-4 h-4" />,
  abrahamic: <BookOpen className="w-4 h-4" />,
  islam: <Star className="w-4 h-4" />,
  christianity: <Cross className="w-4 h-4" />,
  judaism: <ScrollText className="w-4 h-4" />,
  secular: <Brain className="w-4 h-4" />,
  mixed: <Compass className="w-4 h-4" />,
};

const PERSPECTIVE_COLORS: Record<Perspective, string> = {
  none: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  abrahamic: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  islam: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  christianity: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  judaism: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  secular: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  mixed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export function PreferenceControls() {
  const { perspective, intensity, setPerspective, setIntensity } = useAlaStore();

  return (
    <div className="space-y-6">
      {/* Perspective Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Perspective
        </label>
        <Select
          value={perspective}
          onValueChange={(v) => setPerspective(v as Perspective)}
        >
          <SelectTrigger className="w-full h-12">
            <SelectValue>
              <span className="flex items-center gap-2.5">
                <span className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  PERSPECTIVE_COLORS[perspective]
                )}>
                  {PERSPECTIVE_ICONS[perspective]}
                </span>
                <span>{PERSPECTIVES.find(p => p.value === perspective)?.label}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PERSPECTIVES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                <span className="flex items-center gap-2.5">
                  <span className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    PERSPECTIVE_COLORS[p.value]
                  )}>
                    {PERSPECTIVE_ICONS[p.value]}
                  </span>
                  <span>{p.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Choose how you'd like responses framed. This is your choice.
        </p>
      </div>

      {/* Intensity Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Reflection Depth
          </label>
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
            intensity === 0 && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            intensity === 1 && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
            intensity === 2 && "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
            intensity === 3 && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
          )}>
            {INTENSITY_LABELS[intensity as Intensity]}
          </span>
        </div>
        
        <div className={cn(
          "pt-1 pb-2",
          perspective === 'none' && "opacity-50 pointer-events-none"
        )}>
          <Slider
            value={[intensity]}
            onValueChange={([v]) => setIntensity(v as Intensity)}
            max={3}
            step={1}
            className="w-full"
            disabled={perspective === 'none'}
          />
        </div>
        
        <div className="flex justify-between text-[10px] font-medium">
          {[0, 1, 2, 3].map((i) => (
            <button 
              key={i}
              type="button"
              onClick={() => setIntensity(i as Intensity)}
              disabled={perspective === 'none'}
              className={cn(
                "transition-colors cursor-pointer hover:text-primary disabled:cursor-not-allowed disabled:opacity-50",
                intensity === i ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              {INTENSITY_LABELS[i as Intensity]}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground leading-relaxed">
          {perspective === 'none' 
            ? 'Select a perspective to enable reflections'
            : INTENSITY_DESCRIPTIONS[intensity as Intensity]
          }
        </p>
      </div>

      {/* Current Settings Card */}
      {perspective !== 'none' && intensity > 0 && (
        <div className="p-4 bg-muted/50 border rounded-xl animate-fade-in">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              PERSPECTIVE_COLORS[perspective]
            )}>
              {PERSPECTIVE_ICONS[perspective]}
            </div>
            <div className="text-xs">
              <p className="font-medium text-foreground mb-1">
                {PERSPECTIVES.find(p => p.value === perspective)?.label}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {INTENSITY_LABELS[intensity as Intensity]} reflection added after each answer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Neutral State Card */}
      {(perspective === 'none' || intensity === 0) && (
        <div className="p-4 bg-muted/50 border rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-xs">
              <p className="font-medium text-foreground mb-1">Neutral only</p>
              <p className="text-muted-foreground leading-relaxed">
                Factual answers without any added perspective.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
