"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  doc_type: string;
  category: string | null;
  is_approved: number;
  uploaded_at: string;
}

const docTypeStyles: Record<string, string> = {
  article: "bg-blue-500/20 text-blue-400",
  transcript: "bg-purple-500/20 text-purple-400",
  essay: "bg-amber-500/20 text-amber-400",
  notes: "bg-muted/50 text-muted-foreground",
  pdf_extract: "bg-rose-500/20 text-rose-400",
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KnowledgeDoc>>({});
  const [addForm, setAddForm] = useState({
    title: "",
    content: "",
    doc_type: "article",
    category: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = categoryFilter !== "all" ? `?category=${categoryFilter}` : "";
      const res = await fetch(`/api/admin/knowledge${params}`);
      const data = await res.json();
      setDocs(data.docs);
      setCategories(data.categories);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleAddDoc = async () => {
    if (!addForm.title || !addForm.content) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          category: addForm.category || null,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setAddForm({ title: "", content: "", doc_type: "article", category: "" });
        fetchDocs();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDoc = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        setEditForm({});
        fetchDocs();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
    fetchDocs();
  };

  const handleToggleApproved = async (doc: KnowledgeDoc) => {
    await fetch(`/api/admin/knowledge/${doc.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: doc.is_approved ? 0 : 1 }),
    });
    fetchDocs();
  };

  const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

  const filtered = docs.filter((doc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Knowledge Library</h1>
          <p className="text-muted-foreground mt-1">Documents that inform AI responses</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-foreground"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="bg-card/50 border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] h-11 bg-secondary/50 border-input text-foreground">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-foreground focus:bg-secondary focus:text-foreground">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-foreground focus:bg-secondary focus:text-foreground">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-6">Add documents to build the AI&apos;s knowledge base.</p>
            <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Title</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-muted-foreground">Words</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Approved</TableHead>
                <TableHead className="text-muted-foreground w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => {
                const isExpanded = expandedId === doc.id;
                const isEditing = editingId === doc.id;

                return (
                  <>
                    <TableRow
                      key={doc.id}
                      className="border-border hover:bg-card/50 cursor-pointer"
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedId(null);
                          setEditingId(null);
                          setEditForm({});
                        } else {
                          setExpandedId(doc.id);
                        }
                      }}
                    >
                      <TableCell className="text-foreground font-medium">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                          {doc.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${docTypeStyles[doc.doc_type] || "bg-muted/50 text-muted-foreground"} border-0 text-xs`}>
                          {doc.doc_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.category ? (
                          <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground border-0 text-xs">
                            {categories.find((c) => c.id === doc.category)?.name || doc.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{"\u2014"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{wordCount(doc.content).toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleApproved(doc);
                          }}
                          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                            doc.is_approved
                              ? "bg-primary/20 text-primary hover:bg-primary/30"
                              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          {doc.is_approved ? "Yes" : "No"}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDoc(doc.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${doc.id}-expand`} className="border-border bg-muted">
                        <TableCell colSpan={7} className="p-4">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-foreground">Title</Label>
                                <Input
                                  value={editForm.title || ""}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="bg-secondary/50 border-input text-foreground"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-foreground">Content</Label>
                                <Textarea
                                  value={editForm.content || ""}
                                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                  rows={12}
                                  className="bg-secondary/50 border-input text-foreground resize-none font-mono text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateDoc(doc.id)}
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
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex justify-end mb-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingId(doc.id);
                                    setEditForm({
                                      title: doc.title,
                                      content: doc.content,
                                      doc_type: doc.doc_type,
                                      category: doc.category,
                                    });
                                  }}
                                  className="border-input text-muted-foreground hover:bg-secondary"
                                >
                                  Edit
                                </Button>
                              </div>
                              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {doc.content}
                              </p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add Document Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Add Document</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new document to the knowledge library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Title *</Label>
              <Input
                value={addForm.title}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                placeholder="Document title"
                className="bg-secondary/50 border-input text-foreground focus:border-ring"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Content *</Label>
              <Textarea
                value={addForm.content}
                onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                placeholder="Paste or write document content..."
                rows={14}
                className="bg-secondary/50 border-input text-foreground resize-none focus:border-ring font-mono text-sm"
              />
              {addForm.content && (
                <p className="text-xs text-muted-foreground">{wordCount(addForm.content).toLocaleString()} words</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Type</Label>
                <Select value={addForm.doc_type} onValueChange={(v) => setAddForm({ ...addForm, doc_type: v })}>
                  <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="article" className="text-foreground focus:bg-secondary focus:text-foreground">Article</SelectItem>
                    <SelectItem value="transcript" className="text-foreground focus:bg-secondary focus:text-foreground">Transcript</SelectItem>
                    <SelectItem value="essay" className="text-foreground focus:bg-secondary focus:text-foreground">Essay</SelectItem>
                    <SelectItem value="notes" className="text-foreground focus:bg-secondary focus:text-foreground">Notes</SelectItem>
                    <SelectItem value="pdf_extract" className="text-foreground focus:bg-secondary focus:text-foreground">PDF Extract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Category</Label>
                <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                  <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                    <SelectValue placeholder="Optional" />
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
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-input text-muted-foreground hover:bg-secondary">
              Cancel
            </Button>
            <Button
              onClick={handleAddDoc}
              disabled={actionLoading || !addForm.title || !addForm.content}
              className="bg-primary hover:bg-primary/90"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
