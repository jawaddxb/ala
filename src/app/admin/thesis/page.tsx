"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Loader2,
  Lightbulb,
  Pencil,
  X,
  Check,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface ThesisEntry {
  id: string;
  category: string;
  title: string;
  stance: string;
  confidence: "working_theory" | "leaning" | "firm" | "absolute";
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const confidenceColors: Record<string, string> = {
  working_theory: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  leaning: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  firm: "bg-green-500/20 text-green-400 border-green-500/30",
  absolute: "bg-primary/20 text-primary border-primary/30",
};

const confidenceLabels: Record<string, string> = {
  working_theory: "Working Theory",
  leaning: "Leaning",
  firm: "Firm",
  absolute: "Absolute",
};

export default function ThesisPage() {
  const [entries, setEntries] = useState<ThesisEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<ThesisEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ThesisEntry>>({});
  const [addForm, setAddForm] = useState({
    category: "",
    title: "",
    stance: "",
    confidence: "firm" as ThesisEntry["confidence"],
    is_active: 1,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== "all" ? `?category=${activeTab}` : "";
      const res = await fetch(`/api/admin/thesis${params}`);
      const data = await res.json();
      setEntries(data.entries);
      setCategories(data.categories);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!addForm.title || !addForm.stance || !addForm.category) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAdd(false);
        setAddForm({ category: "", title: "", stance: "", confidence: "firm", is_active: 1 });
        fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/thesis/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        setEditForm({});
        fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEntry) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/thesis/${deleteEntry.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDelete(false);
        setDeleteEntry(null);
        fetchData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (entry: ThesisEntry) => {
    await fetch(`/api/admin/thesis/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: entry.is_active ? 0 : 1 }),
    });
    fetchData();
  };

  const startEditing = (entry: ThesisEntry) => {
    setEditingId(entry.id);
    setEditForm({
      category: entry.category,
      title: entry.title,
      stance: entry.stance,
      confidence: entry.confidence,
      is_active: entry.is_active,
    });
  };

  const filtered = activeTab === "all" ? entries : entries.filter((e) => e.category === activeTab);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Thesis Vault</h1>
          <p className="text-muted-foreground mt-1">Define worldview positions by category</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-foreground"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card/50 border border-border flex-wrap h-auto p-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            All
          </TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Entries Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading thesis entries...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Lightbulb className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No entries yet</h3>
            <p className="text-muted-foreground mb-6">Add your first thesis entry to define a position.</p>
            <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => {
            const isEditing = editingId === entry.id;

            if (isEditing) {
              return (
                <Card key={entry.id} className="bg-card border-primary/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Title</Label>
                      <Input
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="bg-secondary/50 border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Category</Label>
                      <Select
                        value={editForm.category}
                        onValueChange={(v) => setEditForm({ ...editForm, category: v })}
                      >
                        <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="text-foreground focus:bg-secondary focus:text-foreground">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Stance</Label>
                      <Textarea
                        value={editForm.stance || ""}
                        onChange={(e) => setEditForm({ ...editForm, stance: e.target.value })}
                        rows={4}
                        className="bg-secondary/50 border-input text-foreground resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Confidence</Label>
                      <Select
                        value={editForm.confidence}
                        onValueChange={(v) => setEditForm({ ...editForm, confidence: v as ThesisEntry["confidence"] })}
                      >
                        <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {Object.entries(confidenceLabels).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="text-foreground focus:bg-secondary focus:text-foreground">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(entry.id)}
                        disabled={actionLoading}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingId(null); setEditForm({}); }}
                        className="border-input text-muted-foreground hover:bg-secondary"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card
                key={entry.id}
                className={`bg-card/50 border-border hover:border-input transition-all cursor-pointer group ${
                  !entry.is_active ? "opacity-50" : ""
                }`}
                onClick={() => startEditing(entry)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg text-foreground font-medium leading-tight">
                      {entry.title}
                    </CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(entry);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteEntry(entry);
                          setShowDelete(true);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge variant="secondary" className={`${confidenceColors[entry.confidence]} border-0 text-xs`}>
                      {confidenceLabels[entry.confidence]}
                    </Badge>
                    <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground border-0 text-xs">
                      {categories.find((c) => c.id === entry.category)?.name || entry.category}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(entry);
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        entry.is_active
                          ? "bg-primary/20 text-primary hover:bg-primary/30"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {entry.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {entry.stance.length > 150 ? `${entry.stance.slice(0, 150)}...` : entry.stance}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Add Thesis Entry</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Define a new worldview position
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Category *</Label>
              <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-foreground focus:bg-secondary focus:text-foreground">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Title *</Label>
              <Input
                value={addForm.title}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                placeholder="e.g., Bitcoin is the future of money"
                className="bg-secondary/50 border-input text-foreground focus:border-ring"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Stance *</Label>
              <Textarea
                value={addForm.stance}
                onChange={(e) => setAddForm({ ...addForm, stance: e.target.value })}
                placeholder="Your detailed position on this topic..."
                rows={5}
                className="bg-secondary/50 border-input text-foreground resize-none focus:border-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Confidence</Label>
                <Select
                  value={addForm.confidence}
                  onValueChange={(v) => setAddForm({ ...addForm, confidence: v as ThesisEntry["confidence"] })}
                >
                  <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(confidenceLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val} className="text-foreground focus:bg-secondary focus:text-foreground">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Status</Label>
                <Select
                  value={addForm.is_active.toString()}
                  onValueChange={(v) => setAddForm({ ...addForm, is_active: parseInt(v) })}
                >
                  <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="1" className="text-foreground focus:bg-secondary focus:text-foreground">Active</SelectItem>
                    <SelectItem value="0" className="text-foreground focus:bg-secondary focus:text-foreground">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-input text-muted-foreground hover:bg-secondary">
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={actionLoading || !addForm.title || !addForm.stance || !addForm.category}
              className="bg-primary hover:bg-primary/90"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Entry</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteEntry && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-foreground font-medium">{deleteEntry.title}</p>
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{deleteEntry.stance}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDelete(false)} className="border-input text-muted-foreground hover:bg-secondary">
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={actionLoading} className="bg-red-500 hover:bg-red-600">
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
