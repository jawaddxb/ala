'use client';

import { useAlaStore } from '@/lib/store';
import { PERSPECTIVES, INTENSITY_LABELS, INTENSITY_DESCRIPTIONS, type Perspective, type Intensity } from '@/lib/prompts';
import { Slider } from '@/components/ui/slider';
import { X, Check, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { perspective, intensity, setPerspective, setIntensity } = useAlaStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-background shadow-xl animate-slide-in-right">
        {/* Header */}
        <div className="header-height flex items-center justify-between px-4 border-b border-border pt-[env(safe-area-inset-top)]">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </button>
          <span className="text-title text-primary">Settings</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-56px)] scrollbar-none">
          {/* Reflection Preferences Section */}
          <div className="p-4">
            <h2 className="text-caption uppercase tracking-wide text-muted mb-1">
              Reflection Preferences
            </h2>
            <p className="text-caption text-muted-foreground mb-4">
              Control how ALA adds value-based perspective to responses.
            </p>

            {/* Perspective Selector */}
            <div className="mb-6">
              <h3 className="text-body font-medium mb-3">Perspective</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                {PERSPECTIVES.map((p, index) => (
                  <button
                    key={p.value}
                    onClick={() => setPerspective(p.value)}
                    className={cn(
                      "radio-row w-full text-left",
                      index !== 0 && "border-t border-border"
                    )}
                  >
                    {/* Radio indicator */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      perspective === p.value 
                        ? "border-primary bg-primary" 
                        : "border-border"
                    )}>
                      {perspective === p.value && (
                        <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                      )}
                    </div>
                    
                    {/* Label */}
                    <div className="flex-1">
                      <p className="text-body text-primary">{p.label}</p>
                      <p className="text-caption text-muted-foreground">
                        {getPerspectiveDescription(p.value)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity Slider - only shown when perspective ≠ none */}
            {perspective !== 'none' && (
              <div className="mb-6 animate-fade-in">
                <h3 className="text-body font-medium mb-4">Intensity</h3>
                
                <div className="px-2">
                  <Slider
                    value={[intensity]}
                    onValueChange={([v]) => setIntensity(v as Intensity)}
                    max={3}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                {/* Labels */}
                <div className="flex justify-between mt-2 px-1">
                  {[0, 1, 2, 3].map((i) => (
                    <button 
                      key={i}
                      type="button"
                      onClick={() => setIntensity(i as Intensity)}
                      className={cn(
                        "text-caption transition-colors cursor-pointer hover:text-primary",
                        intensity === i ? "text-primary font-medium" : "text-muted"
                      )}
                    >
                      {INTENSITY_LABELS[i as Intensity]}
                    </button>
                  ))}
                </div>

                {/* Description */}
                <p className="text-caption text-muted-foreground mt-4 p-3 bg-surface rounded-lg">
                  {INTENSITY_DESCRIPTIONS[intensity as Intensity]}
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-2 bg-surface" />

          {/* Appearance Section */}
          <div className="p-4">
            <h2 className="text-caption uppercase tracking-wide text-muted mb-4">
              Appearance
            </h2>
            
            <button
              onClick={toggleTheme}
              className="radio-row w-full text-left border border-border rounded-lg"
            >
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                {isDark ? (
                  <Moon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                ) : (
                  <Sun className="w-5 h-5 text-primary" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-body text-primary">
                  {isDark ? 'Dark mode' : 'Light mode'}
                </p>
                <p className="text-caption text-muted-foreground">
                  Tap to switch
                </p>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="h-2 bg-surface" />

          {/* About Section */}
          <div className="p-4">
            <h2 className="text-caption uppercase tracking-wide text-muted mb-4">
              About
            </h2>
            
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">Version 1.0.0</p>
              <p className="text-caption text-muted-foreground">
                "As it always was and always will be. Freedom of choice."
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 250ms ease-out;
        }
      `}</style>
    </div>
  );
}

function getPerspectiveDescription(perspective: Perspective): string {
  const descriptions: Record<Perspective, string> = {
    none: "ALA provides factual answers without any value framing.",
    abrahamic: "Reflections draw from shared themes across traditions.",
    islam: "Reflections reference Quranic and Islamic scholarly sources.",
    christianity: "Reflections reference Biblical and Christian scholarly sources.",
    judaism: "Reflections reference Tanakh, Talmud, and Rabbinic sources.",
    secular: "Reflections use structured meta-principles for decision-making.",
    mixed: "Reflections may draw from multiple perspectives.",
  };
  return descriptions[perspective];
}
