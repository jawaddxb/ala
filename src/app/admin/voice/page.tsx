"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Save,
  Mic,
  Send,
  Sparkles,
} from "lucide-react";

interface VoiceProfile {
  name: string;
  bio: string | null;
  voice_description: string | null;
  example_quotes: string | null;
  directness: number;
  hedge_level: number;
  disclaimer_mode: string;
  opinion_strength: string;
  challenge_back: number;
  language_notes: string | null;
}

const directnessLabels = ["Diplomatic", "Measured", "Direct", "Blunt"];
const hedgeLabels = ["Never", "Rarely", "Sometimes", "Always"];

export default function VoicePage() {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [quotesText, setQuotesText] = useState("");
  const [testQuestion, setTestQuestion] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/voice");
        const data = await res.json();
        setProfile(data);
        // Parse quotes JSON into text lines
        try {
          const quotes = data.example_quotes ? JSON.parse(data.example_quotes) : [];
          setQuotesText(quotes.join("\n"));
        } catch {
          setQuotesText(data.example_quotes || "");
        }
      } catch (error) {
        console.error("Failed to fetch voice profile:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      // Convert quotes text back to JSON array
      const quotesArray = quotesText
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/voice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          example_quotes: JSON.stringify(quotesArray),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTestVoice = async () => {
    if (!testQuestion.trim()) return;
    setTesting(true);
    setTestResponse("");
    try {
      const res = await fetch("/api/admin/voice/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: testQuestion }),
      });
      const data = await res.json();
      setTestResponse(data.response || data.error || "No response");
    } catch {
      setTestResponse("Preview failed — check your API configuration.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading voice profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Voice Engine</h1>
          <p className="text-muted-foreground mt-1">Define how the AI speaks and thinks</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-foreground"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : saved ? (
            <span className="flex items-center gap-2">Saved</span>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      {/* Profile Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="bg-secondary/50 border-input text-foreground focus:border-ring"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Bio</Label>
            <Textarea
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className="bg-secondary/50 border-input text-foreground resize-none focus:border-ring"
              placeholder="Background, identity, key traits..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Description */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Voice Description</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={profile.voice_description || ""}
            onChange={(e) => setProfile({ ...profile, voice_description: e.target.value })}
            rows={4}
            className="bg-secondary/50 border-input text-foreground resize-none focus:border-ring"
            placeholder="How should the AI speak? Describe tone, cadence, vocabulary..."
          />
        </CardContent>
      </Card>

      {/* Example Quotes */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Example Quotes</CardTitle>
          <p className="text-sm text-muted-foreground">One quote per line — these teach the AI your speaking style</p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={quotesText}
            onChange={(e) => setQuotesText(e.target.value)}
            rows={6}
            className="bg-secondary/50 border-input text-foreground resize-none focus:border-ring font-mono text-sm"
            placeholder="Even if the sky collapsed, I would not kneel.
If you don't understand, maybe the frequency doesn't match yours."
          />
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Directness Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Directness</Label>
              <span className="text-sm text-primary font-medium">
                {directnessLabels[profile.directness]}
              </span>
            </div>
            <Slider
              value={[profile.directness]}
              onValueChange={([v]) => setProfile({ ...profile, directness: v })}
              max={3}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {directnessLabels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Hedge Level Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Hedge Level</Label>
              <span className="text-sm text-primary font-medium">
                {hedgeLabels[profile.hedge_level]}
              </span>
            </div>
            <Slider
              value={[profile.hedge_level]}
              onValueChange={([v]) => setProfile({ ...profile, hedge_level: v })}
              max={3}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {hedgeLabels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Disclaimer Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Disclaimer Mode</Label>
              <Select
                value={profile.disclaimer_mode}
                onValueChange={(v) => setProfile({ ...profile, disclaimer_mode: v })}
              >
                <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="off" className="text-foreground focus:bg-secondary focus:text-foreground">Off</SelectItem>
                  <SelectItem value="minimal" className="text-foreground focus:bg-secondary focus:text-foreground">Minimal</SelectItem>
                  <SelectItem value="standard" className="text-foreground focus:bg-secondary focus:text-foreground">Standard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opinion Strength */}
            <div className="space-y-2">
              <Label className="text-foreground">Opinion Strength</Label>
              <Select
                value={profile.opinion_strength}
                onValueChange={(v) => setProfile({ ...profile, opinion_strength: v })}
              >
                <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="neutral" className="text-foreground focus:bg-secondary focus:text-foreground">Neutral</SelectItem>
                  <SelectItem value="leaning" className="text-foreground focus:bg-secondary focus:text-foreground">Leaning</SelectItem>
                  <SelectItem value="firm" className="text-foreground focus:bg-secondary focus:text-foreground">Firm</SelectItem>
                  <SelectItem value="provocative" className="text-foreground focus:bg-secondary focus:text-foreground">Provocative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Challenge Back Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">Challenge Back</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reframe weak questions: &quot;The real question is...&quot;
              </p>
            </div>
            <button
              onClick={() => setProfile({ ...profile, challenge_back: profile.challenge_back ? 0 : 1 })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                profile.challenge_back ? "bg-primary" : "bg-muted-foreground"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  profile.challenge_back ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Language Notes */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Language Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={profile.language_notes || ""}
            onChange={(e) => setProfile({ ...profile, language_notes: e.target.value })}
            className="bg-secondary/50 border-input text-foreground focus:border-ring"
            placeholder="e.g., English primary. Occasional German phrases for DACH audience."
          />
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Preview Voice
          </CardTitle>
          <p className="text-sm text-muted-foreground">Test how the AI responds with current settings (save first)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder="Ask a test question..."
              className="bg-secondary/50 border-input text-foreground focus:border-ring"
              onKeyDown={(e) => e.key === "Enter" && handleTestVoice()}
            />
            <Button
              onClick={handleTestVoice}
              disabled={testing || !testQuestion.trim()}
              className="bg-primary hover:bg-primary/90 shrink-0"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {testResponse && (
            <div className="p-4 bg-muted border border-border rounded-lg">
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{testResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
