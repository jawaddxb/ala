"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Search,
  Plus,
  Pencil,
  Trash2,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Filter,
  X,
  Copy,
  FileText,
} from "lucide-react";

interface Source {
  id: string;
  reference: string;
  text: string;
  source: string;
  book?: string;
  chapter?: number;
  verse?: number;
  number?: number;
  category?: string;
}

const sourceTypes = [
  { value: "all", label: "All Sources" },
  { value: "quran", label: "Quran" },
  { value: "bible", label: "Bible" },
  { value: "hadith_bukhari", label: "Hadith Bukhari" },
  { value: "hadith_muslim", label: "Hadith Muslim" },
  { value: "secular", label: "Secular" },
];

const sourceStyles: Record<string, { bg: string; text: string; border: string }> = {
  quran: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  bible: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  hadith_bukhari: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  hadith_muslim: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  secular: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
};

export default function SourcesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [sources, setSources] = useState<Source[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceType, setSourceType] = useState(searchParams.get("source") || "all");
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(searchParams.get("import") === "true");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editSource, setEditSource] = useState<Source | null>(null);
  const [deleteSource, setDeleteSource] = useState<Source | null>(null);
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<{ success?: number; failed?: number; error?: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (sourceType !== "all") params.set("source", sourceType);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/sources?${params}`);
      const data = await res.json();
      setSources(data.sources);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  }, [page, sourceType, debouncedSearch]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    const source = searchParams.get("source");
    if (source && source !== sourceType) {
      setSourceType(source);
      setPage(1);
    }
  }, [searchParams, sourceType]);

  const handleSourceTypeChange = (value: string) => {
    setSourceType(value);
    setPage(1);
    router.push(`/admin/sources${value !== "all" ? `?source=${value}` : ""}`);
  };

  const handleSaveSource = async () => {
    if (!editSource) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/sources/${editSource.id}`, {
        method: editSource.id.startsWith("new_") ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSource),
      });

      if (res.ok) {
        setShowEdit(false);
        setEditSource(null);
        fetchSources();
      }
    } catch (error) {
      console.error("Failed to save source:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSource = async () => {
    if (!deleteSource) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/sources/${deleteSource.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDelete(false);
        setDeleteSource(null);
        fetchSources();
      }
    } catch (error) {
      console.error("Failed to delete source:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImport = async () => {
    setActionLoading(true);
    setImportStatus(null);

    try {
      const parsed = JSON.parse(importJson);
      const sources = Array.isArray(parsed) ? parsed : [parsed];

      const res = await fetch("/api/admin/sources/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportStatus({ success: data.success, failed: data.failed });
        fetchSources();
        if (data.failed === 0) {
          setTimeout(() => {
            setShowImport(false);
            setImportJson("");
            setImportStatus(null);
          }, 2000);
        }
      } else {
        setImportStatus({ error: data.error });
      }
    } catch {
      setImportStatus({ error: "Invalid JSON format" });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearFilters = () => {
    setSearch("");
    setSourceType("all");
    setPage(1);
    router.push("/admin/sources");
  };

  const totalPages = Math.ceil(total / limit);
  const hasFilters = search || sourceType !== "all";
  const currentSourceType = sourceTypes.find(s => s.value === sourceType);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Sources</h1>
          <p className="text-slate-400 mt-1">
            Browse and manage your corpus data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={() => setShowImport(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => {
              setEditSource({
                id: `new_${Date.now()}`,
                reference: "",
                text: "",
                source: "secular",
              });
              setShowEdit(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  placeholder="Search sources by text or reference..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 h-11 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
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
            </div>
            
            {/* Source Type Filter */}
            <div className="flex gap-2">
              <Select value={sourceType} onValueChange={handleSourceTypeChange}>
                <SelectTrigger className="w-[200px] h-11 bg-slate-700/50 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {sourceTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-white focus:bg-slate-700 focus:text-white"
                    >
                      <span className="flex items-center gap-2">
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {hasFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {/* Active Filters Display */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
              <span className="text-sm text-slate-500">Active filters:</span>
              {sourceType !== "all" && (
                <Badge variant="secondary" className={`${sourceStyles[sourceType]?.bg || 'bg-slate-500/20'} ${sourceStyles[sourceType]?.text || 'text-slate-400'} border-0`}>
                  {currentSourceType?.label}
                </Badge>
              )}
              {search && (
                <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-0">
                  &quot;{search}&quot;
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-slate-400">
          <span className="text-white font-medium">{total.toLocaleString()}</span> sources found
        </p>
        
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-400 min-w-[100px] text-center">
            Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages || 1}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
          <p className="text-slate-400">Loading sources...</p>
        </div>
      ) : sources.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No sources found</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              {hasFilters 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Your corpus is empty. Import some data to get started."
              }
            </p>
            {hasFilters ? (
              <Button onClick={clearFilters} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setShowImport(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Upload className="w-4 h-4 mr-2" />
                Import Sources
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sources.map((source) => {
            const style = sourceStyles[source.source] || { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" };
            
            return (
              <Card
                key={source.id}
                className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-200 group`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`${style.bg} ${style.text} border-0 text-xs`}
                        >
                          {source.source.replace("_", " ")}
                        </Badge>
                        {source.category && (
                          <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 border-0 text-xs">
                            {source.category}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg text-white font-medium">
                        {source.reference}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                        onClick={() => copyToClipboard(source.text, source.id)}
                      >
                        {copiedId === source.id ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                        onClick={() => {
                          setEditSource(source);
                          setShowEdit(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        onClick={() => {
                          setDeleteSource(source);
                          setShowDelete(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {source.text.length > 500 ? `${source.text.slice(0, 500)}...` : source.text}
                  </p>
                  <p className="text-xs text-slate-500 mt-3 font-mono">ID: {source.id}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination */}
      {sources.length > 0 && totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-slate-400 px-4">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {editSource?.id.startsWith("new_") ? "Add New Source" : "Edit Source"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editSource?.id.startsWith("new_")
                ? "Create a new source entry in your corpus"
                : "Modify the source entry details"}
            </DialogDescription>
          </DialogHeader>
          {editSource && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Reference *</Label>
                  <Input
                    value={editSource.reference}
                    onChange={(e) =>
                      setEditSource({ ...editSource, reference: e.target.value })
                    }
                    placeholder="e.g., Quran 2:255"
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Source Type *</Label>
                  <Select
                    value={editSource.source}
                    onValueChange={(value) =>
                      setEditSource({ ...editSource, source: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {sourceTypes.slice(1).map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="text-white focus:bg-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            {type.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Text Content *</Label>
                <Textarea
                  value={editSource.text}
                  onChange={(e) =>
                    setEditSource({ ...editSource, text: e.target.value })
                  }
                  placeholder="The text content of this source..."
                  rows={8}
                  className="bg-slate-700/50 border-slate-600 text-white focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Book</Label>
                  <Input
                    value={editSource.book || ""}
                    onChange={(e) =>
                      setEditSource({ ...editSource, book: e.target.value })
                    }
                    placeholder="Optional"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Chapter</Label>
                  <Input
                    type="number"
                    value={editSource.chapter || ""}
                    onChange={(e) =>
                      setEditSource({
                        ...editSource,
                        chapter: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="Optional"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Verse</Label>
                  <Input
                    type="number"
                    value={editSource.verse || ""}
                    onChange={(e) =>
                      setEditSource({
                        ...editSource,
                        verse: parseInt(e.target.value) || undefined,
                      })
                    }
                    placeholder="Optional"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSource}
              disabled={actionLoading || !editSource?.reference || !editSource?.text}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Source"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Source</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this source? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteSource && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
              <p className="text-white font-medium">{deleteSource.reference}</p>
              <p className="text-slate-400 text-sm line-clamp-3">
                {deleteSource.text}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSource}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Import Sources
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Paste JSON data to bulk import sources into your corpus
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {importStatus?.error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{importStatus.error}</span>
              </div>
            )}
            {importStatus?.success !== undefined && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>
                  Successfully imported <strong>{importStatus.success}</strong> sources
                  {importStatus.failed ? ` (${importStatus.failed} failed)` : ""}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-slate-200">JSON Data</Label>
              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder={`[
  {
    "id": "unique_id",
    "reference": "Source Reference",
    "text": "The text content...",
    "source": "quran|bible|hadith_bukhari|hadith_muslim|secular"
  }
]`}
                rows={14}
                className="bg-slate-900/50 border-slate-600 text-white font-mono text-sm resize-none focus:border-emerald-500"
              />
              <p className="text-xs text-slate-500">
                Required fields: id, reference, text, source. Optional: book, chapter, verse, number, category
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowImport(false);
                setImportJson("");
                setImportStatus(null);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={actionLoading || !importJson.trim()}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
