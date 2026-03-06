import { getSourceStats, getAllUsers } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Database, TrendingUp, ArrowRight, Upload } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const stats = getSourceStats();
  const users = getAllUsers();

  const totalSources = stats.reduce((acc, s) => acc + s.count, 0);
  const adminCount = users.filter((u) => u.role === "admin").length;

  const sourceData = [
    { name: "Quran", key: "quran" },
    { name: "Bible", key: "bible" },
    { name: "Torah", key: "torah" },
    { name: "Hadith Bukhari", key: "hadith-bukhari" },
    { name: "Hadith Muslim", key: "hadith-muslim" },
    { name: "Secular Wisdom", key: "secular" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your corpus and system status</p>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sources</CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-3xl font-bold text-foreground">{totalSources.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-3xl font-bold text-foreground">{stats.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active source types</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-3xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-sm transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administrators</CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-3xl font-bold text-foreground">{adminCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Admin accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Sources by Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Sources by Category</h2>
          <Link href="/admin/sources" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {sourceData.map((source) => {
            const stat = stats.find((s) => s.source === source.key);
            const count = stat?.count || 0;
            const percentage = totalSources > 0 ? ((count / totalSources) * 100).toFixed(1) : "0";

            return (
              <Link href={`/admin/sources?source=${source.key}`} key={source.key}>
                <Card className="border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer group h-full">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-muted-foreground">{source.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {source.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          {count.toLocaleString()} entries
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 pb-4">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground/20 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span className="text-muted-foreground">{percentage}% of total</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {totalSources === 0 && (
        <Card className="border-border bg-muted/30">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No Sources Yet</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              Your corpus is empty. Import some data to get started with ALA&apos;s wisdom search.
            </p>
            <Link
              href="/admin/sources?import=true"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import Sources
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
