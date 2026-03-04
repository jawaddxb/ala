import { getSourceStats, getAllUsers } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Database, TrendingUp, ArrowRight, Sparkles, Library, Upload } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const stats = getSourceStats();
  const users = getAllUsers();

  const totalSources = stats.reduce((acc, s) => acc + s.count, 0);
  const adminCount = users.filter((u) => u.role === "admin").length;

  const sourceData = [
    { name: "Quran", key: "quran", gradient: "from-primary to-primary/80" },
    { name: "Bible", key: "bible", gradient: "from-blue-500 to-indigo-600" },
    { name: "Hadith Bukhari", key: "hadith_bukhari", gradient: "from-amber-500 to-orange-600" },
    { name: "Hadith Muslim", key: "hadith_muslim", gradient: "from-orange-500 to-red-600" },
    { name: "Secular Wisdom", key: "secular", gradient: "from-purple-500 to-pink-600" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Overview of your corpus and system status</p>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sources
            </CardTitle>
            <div className="p-2 bg-primary/20 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {totalSources.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Active source types
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{users.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administrators
            </CardTitle>
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{adminCount}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Admin accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sources by Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Sources by Category</h2>
          <Link
            href="/admin/sources"
            className="text-sm text-primary hover:text-primary flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {sourceData.map((source) => {
            const stat = stats.find((s) => s.source === source.key);
            const count = stat?.count || 0;
            const percentage = totalSources > 0 ? ((count / totalSources) * 100).toFixed(1) : "0";

            return (
              <Link href={`/admin/sources?source=${source.key}`} key={source.key}>
                <Card className="bg-card/50 border-border hover:bg-card hover:border-input transition-all duration-300 cursor-pointer group h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${source.gradient} flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{source.name.charAt(0)}</span>
                      </div>
                      <div>
                        <CardTitle className="text-base text-foreground group-hover:text-primary transition-colors">
                          {source.name}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground text-sm">
                          {count.toLocaleString()} entries
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${source.gradient} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{percentage}% of total</span>
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          <ArrowRight className="w-3 h-3 inline" />
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>



      {/* Empty State Warning */}
      {totalSources === 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Sources Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Your corpus is empty. Import some data to get started with ALA&apos;s wisdom search.
            </p>
            <Link
              href="/admin/sources?import=true"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
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
