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
    { name: "Quran", key: "quran", gradient: "from-emerald-500 to-teal-600" },
    { name: "Bible", key: "bible", gradient: "from-blue-500 to-indigo-600" },
    { name: "Hadith Bukhari", key: "hadith_bukhari", gradient: "from-amber-500 to-orange-600" },
    { name: "Hadith Muslim", key: "hadith_muslim", gradient: "from-orange-500 to-red-600" },
    { name: "Secular Wisdom", key: "secular", gradient: "from-purple-500 to-pink-600" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 text-lg">Overview of your corpus and system status</p>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Sources
            </CardTitle>
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Database className="h-5 w-5 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalSources.toLocaleString()}
            </div>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Categories
            </CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.length}</div>
            <p className="text-sm text-slate-400 mt-1">
              Active source types
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Users
            </CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{users.length}</div>
            <p className="text-sm text-slate-400 mt-1">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Administrators
            </CardTitle>
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{adminCount}</div>
            <p className="text-sm text-slate-400 mt-1">
              Admin accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sources by Category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Sources by Category</h2>
          <Link 
            href="/admin/sources" 
            className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
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
                <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 cursor-pointer group h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${source.gradient} flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{source.name.charAt(0)}</span>
                      </div>
                      <div>
                        <CardTitle className="text-base text-white group-hover:text-emerald-400 transition-colors">
                          {source.name}
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-sm">
                          {count.toLocaleString()} entries
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${source.gradient} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">{percentage}% of total</span>
                        <span className="text-slate-400 group-hover:text-white transition-colors">
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

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/sources">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:bg-emerald-500/30 transition-colors">
                    <Library className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white group-hover:text-emerald-400 transition-colors">
                      Browse Sources
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      View and manage all corpus entries
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white group-hover:text-blue-400 transition-colors">
                      Manage Users
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      View and manage user accounts
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/sources?import=true">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                    <Upload className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white group-hover:text-purple-400 transition-colors">
                      Import Data
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Bulk import sources from JSON
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Empty State Warning */}
      {totalSources === 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Sources Yet</h3>
            <p className="text-slate-400 mb-4 max-w-md mx-auto">
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
