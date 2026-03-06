'use client';

import { useState } from 'react';
import { Settings, Key, Shield, Bell, Database } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">System configuration and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Authentication */}
      <div className="border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Authentication</h2>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Admin Email</label>
            <input
              type="email"
              defaultValue="admin@ala.app"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">New Password</label>
            <input
              type="password"
              placeholder="Leave blank to keep current"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* AI Model */}
      <div className="border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">AI Model</h2>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Primary Model</label>
            <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Default)</option>
              <option value="claude-opus-4-5">Claude Opus 4.5</option>
              <option value="gpt-4o">GPT-4o</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Max Sources per Query</label>
            <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="8">8 sources</option>
              <option value="12" selected>12 sources (Default)</option>
              <option value="20">20 sources</option>
            </select>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="border border-border rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Security</h2>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium">Require Authentication</p>
            <p className="text-xs text-muted-foreground">Users must log in to access ALA</p>
          </div>
          <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
            <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow" />
          </div>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-border mt-2">
          <div>
            <p className="text-sm font-medium">Public Access</p>
            <p className="text-xs text-muted-foreground">Allow unauthenticated chat sessions</p>
          </div>
          <div className="w-10 h-6 bg-muted rounded-full relative cursor-pointer">
            <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow" />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="border border-border rounded-xl p-5 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">System Info</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">v1.0.0</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span className="font-medium">SQLite (persistent)</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform</span><span className="font-medium">Railway</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Framework</span><span className="font-medium">Next.js 15</span></div>
        </div>
      </div>
    </div>
  );
}
