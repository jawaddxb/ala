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
  notes: "bg-slate-500/20 text-slate-400",
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Knowledge Library</h1>
          <p className="text-slate-400 mt-1">Documents that inform AI responses</p>
        </div>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] h-11 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white focus:bg-slate-700 focus:text-white">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-white focus:bg-slate-700 focus:text-white">
                    {cat.icon} {cat.name}
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
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
          <p className="text-slate-400">Loading documents...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
            <p className="text-slate-400 mb-6">Add documents to build the AI&apos;s knowledge base.</p>
            <Button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Title</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Category</TableHead>
                <TableHead className="text-slate-400">Words</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Approved</TableHead>
                <TableHead className="text-slate-400 w-20"></TableHead>
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
                      className="border-slate-700 hover:bg-slate-800/50 cursor-pointer"
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
                      <TableCell className="text-white font-medium">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                          {doc.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${docTypeStyles[doc.doc_type] || "bg-slate-500/20 text-slate-400"} border-0 text-xs`}>
                          {doc.doc_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.category ? (
                          <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 border-0 text-xs">
                            {categories.find((c) => c.id === doc.category)?.name || doc.category}
                          </Badge>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{wordCount(doc.content).toLocaleString()}</TableCell>
                      <TableCell className="text-slate-500 text-xs">
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
                              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              : "bg-slate-700/50 text-slate-500 hover:bg-slate-700"
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
                      <TableRow key={`${doc.id}-expand`} className="border-slate-700 bg-slate-900/50">
                        <TableCell colSpan={7} className="p-4">
                          {isEditing ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-slate-200">Title</Label>
                                <Input
                                  value={editForm.title || ""}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="bg-slate-700/50 border-slate-600 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-200">Content</Label>
                                <Textarea
                                  value={editForm.content || ""}
                                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                  rows={12}
                                  className="bg-slate-700/50 border-slate-600 text-white resize-none font-mono text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateDoc(doc.id)}
                                  disabled={actionLoading}
                                  className="bg-emerald-500 hover:bg-emerald-600"
                                >
                                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setEditingId(null); setEditForm({}); }}
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
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
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                >
                                  Edit
                                </Button>
                              </div>
                              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
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
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Document</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new document to the knowledge library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Title *</Label>
              <Input
                value={addForm.title}
                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                placeholder="Document title"
                className="bg-slate-700/50 border-slate-600 text-white focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Content *</Label>
              <Textarea
                value={addForm.content}
                onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                placeholder="Paste or write document content..."
                rows={14}
                className="bg-slate-700/50 border-slate-600 text-white resize-none focus:border-emerald-500 font-mono text-sm"
              />
              {addForm.content && (
                <p className="text-xs text-slate-500">{wordCount(addForm.content).toLocaleString()} words</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Type</Label>
                <Select value={addForm.doc_type} onValueChange={(v) => setAddForm({ ...addForm, doc_type: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="article" className="text-white focus:bg-slate-700 focus:text-white">Article</SelectItem>
                    <SelectItem value="transcript" className="text-white focus:bg-slate-700 focus:text-white">Transcript</SelectItem>
                    <SelectItem value="essay" className="text-white focus:bg-slate-700 focus:text-white">Essay</SelectItem>
                    <SelectItem value="notes" className="text-white focus:bg-slate-700 focus:text-white">Notes</SelectItem>
                    <SelectItem value="pdf_extract" className="text-white focus:bg-slate-700 focus:text-white">PDF Extract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Category</Label>
                <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-white focus:bg-slate-700 focus:text-white">
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleAddDoc}
              disabled={actionLoading || !addForm.title || !addForm.content}
              className="bg-emerald-500 hover:bg-emerald-600"
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
