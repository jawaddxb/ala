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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LayoutGrid,
  Check,
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Topic {
  id: string;
  name: string;
  category: string;
  status: "active" | "draft" | "disabled";
  stance_summary: string | null;
  deflection_message: string | null;
  updated_at: string;
}

interface Suggestion {
  id: string;
  query: string;
  suggested_category: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  draft: "bg-yellow-500/20 text-yellow-400",
  disabled: "bg-red-500/20 text-red-400",
};

const statusIcons: Record<string, string> = {
  active: "🟢",
  draft: "🟡",
  disabled: "🔴",
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Topic>>({});
  const [addForm, setAddForm] = useState({
    name: "",
    category: "",
    status: "active" as Topic["status"],
    stance_summary: "",
    deflection_message: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingSuggestion, setApprovingSuggestion] = useState<Suggestion | null>(null);
  const [approveForm, setApproveForm] = useState({
    name: "",
    category: "",
    stance_summary: "",
  });

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/topics");
      const data = await res.json();
      setTopics(data.topics);
      setCategories(data.categories);
    } catch (error) {
      console.error("Failed to fetch topics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/topics/suggestions");
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
    fetchSuggestions();
  }, [fetchTopics, fetchSuggestions]);

  const handleAddTopic = async () => {
    if (!addForm.name || !addForm.category) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        setShowAdd(false);
        setAddForm({ name: "", category: "", status: "active", stance_summary: "", deflection_message: "" });
        fetchTopics();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTopic = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/topics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        setEditForm({});
        fetchTopics();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    await fetch(`/api/admin/topics/${id}`, { method: "DELETE" });
    fetchTopics();
  };

  const handleCycleStatus = async (topic: Topic) => {
    const cycle: Record<string, Topic["status"]> = {
      active: "draft",
      draft: "disabled",
      disabled: "active",
    };
    await fetch(`/api/admin/topics/${topic.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: cycle[topic.status] }),
    });
    fetchTopics();
  };

  const handleSuggestionAction = async (suggestion: Suggestion, action: "approved" | "rejected") => {
    if (action === "approved") {
      setApprovingSuggestion(suggestion);
      setApproveForm({
        name: suggestion.query.slice(0, 60),
        category: suggestion.suggested_category || "",
        stance_summary: "",
      });
      setShowApproveDialog(true);
      return;
    }

    await fetch(`/api/admin/topics/suggestions/${suggestion.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
    fetchSuggestions();
  };

  const handleApproveAndCreate = async () => {
    if (!approvingSuggestion || !approveForm.name || !approveForm.category) return;
    setActionLoading(true);
    try {
      // Create the topic
      await fetch("/api/admin/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: approveForm.name,
          category: approveForm.category,
          stance_summary: approveForm.stance_summary,
          status: "draft",
        }),
      });
      // Mark suggestion as approved
      await fetch(`/api/admin/topics/suggestions/${approvingSuggestion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setShowApproveDialog(false);
      setApprovingSuggestion(null);
      fetchTopics();
      fetchSuggestions();
    } finally {
      setActionLoading(false);
    }
  };

  const startEditing = (topic: Topic) => {
    setEditingId(topic.id);
    setEditForm({
      name: topic.name,
      category: topic.category,
      status: topic.status,
      stance_summary: topic.stance_summary,
      deflection_message: topic.deflection_message,
    });
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Topics</h1>
          <p className="text-slate-400 mt-1">Manage what the AI can discuss</p>
        </div>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Topic
        </Button>
      </div>

      <Tabs defaultValue="topics">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger
            value="topics"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Topics ({topics.length})
          </TabsTrigger>
          <TabsTrigger
            value="suggestions"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Suggestions ({pendingSuggestions.length})
          </TabsTrigger>
        </TabsList>

        {/* Topics Tab */}
        <TabsContent value="topics" className="mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
              <p className="text-slate-400">Loading topics...</p>
            </div>
          ) : topics.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <LayoutGrid className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No topics yet</h3>
                <p className="text-slate-400 mb-6">Add topics to control what the AI discusses.</p>
                <Button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Topic
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Category</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Stance Summary</TableHead>
                    <TableHead className="text-slate-400">Updated</TableHead>
                    <TableHead className="text-slate-400 w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.map((topic) => {
                    const isEditing = editingId === topic.id;

                    if (isEditing) {
                      return (
                        <TableRow key={topic.id} className="border-slate-700 bg-slate-800">
                          <TableCell>
                            <Input
                              value={editForm.name || ""}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="bg-slate-700/50 border-slate-600 text-white h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={editForm.category}
                              onValueChange={(v) => setEditForm({ ...editForm, category: v })}
                            >
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id} className="text-white focus:bg-slate-700 focus:text-white">
                                    {cat.icon} {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={editForm.status}
                              onValueChange={(v) => setEditForm({ ...editForm, status: v as Topic["status"] })}
                            >
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white h-8 text-sm w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="active" className="text-white focus:bg-slate-700 focus:text-white">🟢 Active</SelectItem>
                                <SelectItem value="draft" className="text-white focus:bg-slate-700 focus:text-white">🟡 Draft</SelectItem>
                                <SelectItem value="disabled" className="text-white focus:bg-slate-700 focus:text-white">🔴 Disabled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Textarea
                              value={editForm.stance_summary || ""}
                              onChange={(e) => setEditForm({ ...editForm, stance_summary: e.target.value })}
                              rows={2}
                              className="bg-slate-700/50 border-slate-600 text-white text-sm resize-none"
                            />
                          </TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/20"
                                onClick={() => handleUpdateTopic(topic.id)}
                                disabled={actionLoading}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-slate-400 hover:bg-slate-700"
                                onClick={() => { setEditingId(null); setEditForm({}); }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return (
                      <TableRow
                        key={topic.id}
                        className="border-slate-700 hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => startEditing(topic)}
                      >
                        <TableCell className="text-white font-medium">{topic.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 border-0 text-xs">
                            {categories.find((c) => c.id === topic.category)?.name || topic.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCycleStatus(topic);
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusStyles[topic.status]}`}
                          >
                            {statusIcons[topic.status]} {topic.status}
                          </button>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                          {topic.stance_summary || "—"}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {new Date(topic.updated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTopic(topic.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-4">
          {pendingSuggestions.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No pending suggestions</h3>
                <p className="text-slate-400">
                  Questions the AI can&apos;t answer will appear here for review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm leading-relaxed">&ldquo;{suggestion.query}&rdquo;</p>
                        <div className="flex items-center gap-2 mt-2">
                          {suggestion.suggested_category && (
                            <Badge variant="secondary" className="bg-slate-700/50 text-slate-400 border-0 text-xs">
                              {categories.find((c) => c.id === suggestion.suggested_category)?.name || suggestion.suggested_category}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            {new Date(suggestion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 h-8"
                          onClick={() => handleSuggestionAction(suggestion, "approved")}
                        >
                          <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/20 h-8"
                          onClick={() => handleSuggestionAction(suggestion, "rejected")}
                        >
                          <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Topic Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Add Topic</DialogTitle>
            <DialogDescription className="text-slate-400">
              Define a new topic the AI can engage with
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g., Bitcoin market cycles"
                className="bg-slate-700/50 border-slate-600 text-white focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Category *</Label>
                <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select" />
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
              <div className="space-y-2">
                <Label className="text-slate-200">Status</Label>
                <Select
                  value={addForm.status}
                  onValueChange={(v) => setAddForm({ ...addForm, status: v as Topic["status"] })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="active" className="text-white focus:bg-slate-700 focus:text-white">🟢 Active</SelectItem>
                    <SelectItem value="draft" className="text-white focus:bg-slate-700 focus:text-white">🟡 Draft</SelectItem>
                    <SelectItem value="disabled" className="text-white focus:bg-slate-700 focus:text-white">🔴 Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Stance Summary</Label>
              <Textarea
                value={addForm.stance_summary}
                onChange={(e) => setAddForm({ ...addForm, stance_summary: e.target.value })}
                placeholder="Brief summary of position on this topic..."
                rows={3}
                className="bg-slate-700/50 border-slate-600 text-white resize-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Deflection Message (if disabled)</Label>
              <Input
                value={addForm.deflection_message}
                onChange={(e) => setAddForm({ ...addForm, deflection_message: e.target.value })}
                placeholder="I haven't shared my view on that."
                className="bg-slate-700/50 border-slate-600 text-white focus:border-emerald-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleAddTopic}
              disabled={actionLoading || !addForm.name || !addForm.category}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Suggestion Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Create Topic from Suggestion</DialogTitle>
            <DialogDescription className="text-slate-400">
              {approvingSuggestion && `"${approvingSuggestion.query}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Topic Name *</Label>
              <Input
                value={approveForm.name}
                onChange={(e) => setApproveForm({ ...approveForm, name: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Category *</Label>
              <Select value={approveForm.category} onValueChange={(v) => setApproveForm({ ...approveForm, category: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select category" />
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
            <div className="space-y-2">
              <Label className="text-slate-200">Stance Summary</Label>
              <Textarea
                value={approveForm.stance_summary}
                onChange={(e) => setApproveForm({ ...approveForm, stance_summary: e.target.value })}
                rows={3}
                className="bg-slate-700/50 border-slate-600 text-white resize-none focus:border-emerald-500"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </Button>
            <Button
              onClick={handleApproveAndCreate}
              disabled={actionLoading || !approveForm.name || !approveForm.category}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Create Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
