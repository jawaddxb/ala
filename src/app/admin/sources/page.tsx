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
  quran: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  bible: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  torah: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  hadith_bukhari: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  hadith_muslim: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  secular: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
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

  const limit = 50;

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
      setSources(data.sources ?? []);
      setTotal(data.total ?? 0);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Sources</h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage your corpus data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-input text-muted-foreground hover:bg-secondary hover:text-foreground"
            onClick={() => setShowImport(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-foreground"
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
      <Card className="bg-card/50 border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search sources by text or reference..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 h-11 bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
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
            </div>

            {/* Source Type Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={sourceType} onValueChange={handleSourceTypeChange}>
                <SelectTrigger className="w-full sm:w-[200px] h-11 bg-secondary/50 border-input text-foreground">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {sourceTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-foreground focus:bg-secondary focus:text-foreground"
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
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {sourceType !== "all" && (
                <Badge variant="secondary" className={`${sourceStyles[sourceType]?.bg || 'bg-muted/50'} ${sourceStyles[sourceType]?.text || 'text-muted-foreground'} border-0`}>
                  {currentSourceType?.label}
                </Badge>
              )}
              {search && (
                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-0">
                  &quot;{search}&quot;
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-muted-foreground">
          <span className="text-foreground font-medium">{total.toLocaleString()}</span> sources found
        </p>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="border-input text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[100px] text-center">
            Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages || 1}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="border-input text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading sources...</p>
        </div>
      ) : sources.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No sources found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {hasFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Your corpus is empty. Import some data to get started."
              }
            </p>
            {hasFilters ? (
              <Button onClick={clearFilters} variant="outline" className="border-input text-muted-foreground hover:bg-secondary">
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setShowImport(true)} className="bg-primary hover:bg-primary/90">
                <Upload className="w-4 h-4 mr-2" />
                Import Sources
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card/50 border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-[200px]">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Text</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-[120px]">Source</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {sources.map((source) => {
                  const style = sourceStyles[source.source] || { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border/50" };
                  return (
                    <tr key={source.id} className="hover:bg-secondary/20 transition-colors group">
                      <td className="px-4 py-2.5 align-top">
                        <span className="font-medium text-foreground text-xs leading-tight block">{source.reference}</span>
                        {source.book && <span className="text-muted-foreground text-xs block truncate max-w-[180px]">{source.book}</span>}
                      </td>
                      <td className="px-4 py-2.5 align-top max-w-0">
                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
                          {source.text}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 align-top">
                        <Badge variant="secondary" className={`${style.bg} ${style.text} border-0 text-xs whitespace-nowrap`}>
                          {source.source.replace(/-/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 align-top text-right">
                        <div className="flex gap-1 justify-end sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => copyToClipboard(source.text, source.id)}>
                            {copiedId === source.id ? <CheckCircle className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary" onClick={() => { setEditSource(source); setShowEdit(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20" onClick={() => { setDeleteSource(source); setShowDelete(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
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
              className="border-input text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="border-input text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">
              {editSource?.id.startsWith("new_") ? "Add New Source" : "Edit Source"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editSource?.id.startsWith("new_")
                ? "Create a new source entry in your corpus"
                : "Modify the source entry details"}
            </DialogDescription>
          </DialogHeader>
          {editSource && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Reference *</Label>
                  <Input
                    value={editSource.reference}
                    onChange={(e) =>
                      setEditSource({ ...editSource, reference: e.target.value })
                    }
                    placeholder="e.g., Quran 2:255"
                    className="bg-secondary/50 border-input text-foreground focus:border-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Source Type *</Label>
                  <Select
                    value={editSource.source}
                    onValueChange={(value) =>
                      setEditSource({ ...editSource, source: value })
                    }
                  >
                    <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {sourceTypes.slice(1).map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="text-foreground focus:bg-secondary"
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
                <Label className="text-foreground">Text Content *</Label>
                <Textarea
                  value={editSource.text}
                  onChange={(e) =>
                    setEditSource({ ...editSource, text: e.target.value })
                  }
                  placeholder="The text content of this source..."
                  rows={8}
                  className="bg-secondary/50 border-input text-foreground focus:border-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Book</Label>
                  <Input
                    value={editSource.book || ""}
                    onChange={(e) =>
                      setEditSource({ ...editSource, book: e.target.value })
                    }
                    placeholder="Optional"
                    className="bg-secondary/50 border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Chapter</Label>
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
                    className="bg-secondary/50 border-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Verse</Label>
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
                    className="bg-secondary/50 border-input text-foreground"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              className="border-input text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSource}
              disabled={actionLoading || !editSource?.reference || !editSource?.text}
              className="bg-primary hover:bg-primary/90"
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
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Source</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this source? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteSource && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
              <p className="text-foreground font-medium">{deleteSource.reference}</p>
              <p className="text-muted-foreground text-sm line-clamp-3">
                {deleteSource.text}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              className="border-input text-muted-foreground hover:bg-secondary"
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
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Import Sources
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
              <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>
                  Successfully imported <strong>{importStatus.success}</strong> sources
                  {importStatus.failed ? ` (${importStatus.failed} failed)` : ""}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-foreground">JSON Data</Label>
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
                className="bg-muted border-input text-foreground font-mono text-sm resize-none focus:border-ring"
              />
              <p className="text-xs text-muted-foreground">
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
              className="border-input text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={actionLoading || !importJson.trim()}
              className="bg-primary hover:bg-primary/90"
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
