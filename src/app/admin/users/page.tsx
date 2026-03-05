"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  User,
  Mail,
  Calendar,
  UserPlus,
  Search,
  Users as UsersIcon,
} from "lucide-react";

interface UserData {
  id: number;
  email: string;
  name: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user" as "user" | "admin" });
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users ?? []);
      setFilteredUsers(data.users ?? []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u =>
        u.name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      setError("Email and password are required");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("User created successfully");
        setShowCreate(false);
        setNewUser({ name: "", email: "", password: "", role: "user" });
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUser) return;

    setActionLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUser.name,
          email: editUser.email,
          role: editUser.role,
        }),
      });

      if (res.ok) {
        setSuccess("User updated successfully");
        setShowEdit(false);
        setEditUser(null);
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update user");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    setActionLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("User deleted successfully");
        setShowDelete(false);
        setDeleteUser(null);
        fetchUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete user");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const adminCount = users.filter(u => u.role === "admin").length;
  const userCount = users.filter(u => u.role === "user").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and roles</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-foreground"
          onClick={() => setShowCreate(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary rounded-lg">
                <UsersIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                <p className="text-sm text-muted-foreground">Administrators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{userCount}</p>
                <p className="text-sm text-muted-foreground">Regular Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto hover:text-red-300">×</button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Users Table */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-foreground">All Users</CardTitle>
              <CardDescription className="text-muted-foreground">
                A list of all registered users in your system
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <UsersIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">
                {searchQuery ? "No users match your search" : "No users found"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreate(true)} variant="link" className="text-primary">
                  Create your first user
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">User</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden sm:table-cell">Created</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-border/50 hover:bg-secondary/30 group">
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.role === "admin"
                              ? "bg-primary/20"
                              : "bg-secondary"
                          }`}>
                            {user.role === "admin" ? (
                              <Shield className="w-5 h-5 text-primary" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            user.role === "admin"
                              ? "bg-primary/20 text-primary border-0"
                              : "bg-muted/20 text-muted-foreground border-0"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => {
                              setEditUser(user);
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
                              setDeleteUser(user);
                              setShowDelete(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Create User
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new user account to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground">Name</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="John Doe"
                className="bg-secondary/50 border-input text-foreground focus:border-ring"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@example.com"
                className="bg-secondary/50 border-input text-foreground focus:border-ring"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Password *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
                className="bg-secondary/50 border-input text-foreground focus:border-ring"
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: "user" | "admin") =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="user" className="text-foreground focus:bg-secondary">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      User
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" className="text-foreground focus:bg-secondary">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="border-input text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={actionLoading || !newUser.email || !newUser.password}
              className="bg-primary hover:bg-primary/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Edit User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modify user account details
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Name</Label>
                <Input
                  value={editUser.name || ""}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  className="bg-secondary/50 border-input text-foreground focus:border-ring"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Email</Label>
                <Input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="bg-secondary/50 border-input text-foreground focus:border-ring"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Role</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value: "user" | "admin") =>
                    setEditUser({ ...editUser, role: value })
                  }
                >
                  <SelectTrigger className="bg-secondary/50 border-input text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="user" className="text-foreground focus:bg-secondary">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        User
                      </div>
                    </SelectItem>
                    <SelectItem value="admin" className="text-foreground focus:bg-secondary">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
              onClick={handleUpdateUser}
              disabled={actionLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete User</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteUser && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  deleteUser.role === "admin" ? "bg-primary/20" : "bg-secondary"
                }`}>
                  {deleteUser.role === "admin" ? (
                    <Shield className="w-5 h-5 text-primary" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-foreground font-medium">{deleteUser.name || "Unnamed"}</p>
                  <p className="text-muted-foreground text-sm">{deleteUser.email}</p>
                </div>
              </div>
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
              onClick={handleDeleteUser}
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
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
