'use client';

import { Sparkles } from 'lucide-react';

// Preference controls have been removed in the oracle expansion.
// The AI now speaks with a single opinionated voice defined in the admin panel.
export function PreferenceControls() {
  return (
    <div className="p-4 bg-muted/50 border rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="text-xs">
          <p className="font-medium text-foreground mb-1">Direct. Opinionated. Real.</p>
          <p className="text-muted-foreground leading-relaxed">
            ALA speaks with conviction — backed by knowledge, not platitudes.
          </p>
        </div>
      </div>
    </div>
  );
}
