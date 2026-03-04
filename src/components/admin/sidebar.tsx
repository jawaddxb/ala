"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  ChevronRight,
  Lightbulb,
  Mic,
  LayoutGrid,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview & stats"
  },
  {
    name: "Thesis",
    href: "/admin/thesis",
    icon: Lightbulb,
    description: "Worldview positions"
  },
  {
    name: "Voice",
    href: "/admin/voice",
    icon: Mic,
    description: "Voice & personality"
  },
  {
    name: "Topics",
    href: "/admin/topics",
    icon: LayoutGrid,
    description: "Topic management"
  },
  {
    name: "Knowledge",
    href: "/admin/knowledge",
    icon: BookOpen,
    description: "Knowledge library"
  },
  {
    name: "Sources",
    href: "/admin/sources",
    icon: BookOpen,
    description: "Manage corpus",
    children: [
      { name: "All Sources", href: "/admin/sources", query: null, icon: "📚" },
      { name: "Quran", href: "/admin/sources", query: "quran", icon: "📖" },
      { name: "Bible", href: "/admin/sources", query: "bible", icon: "✝️" },
      { name: "Hadith Bukhari", href: "/admin/sources", query: "hadith_bukhari", icon: "📜" },
      { name: "Hadith Muslim", href: "/admin/sources", query: "hadith_muslim", icon: "📜" },
      { name: "Secular", href: "/admin/sources", query: "secular", icon: "💡" },
    ],
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage accounts"
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Configuration"
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSource = searchParams.get("source");

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 overflow-y-auto hidden lg:block">
      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href && !item.children;
          const isParentActive = item.children && pathname.startsWith(item.href);
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive || isParentActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive || isParentActive ? "text-emerald-400" : "text-slate-500"
                )} />
                <div className="flex-1 min-w-0">
                  <span className="block">{item.name}</span>
                </div>
                {item.children && (
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isParentActive && "rotate-90"
                  )} />
                )}
              </Link>
              
              {/* Children - Source filters */}
              {item.children && isParentActive && (
                <div className="mt-1 ml-3 pl-5 border-l border-slate-700/50 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = 
                      (child.query === null && !currentSource) ||
                      (child.query === currentSource);
                    
                    return (
                      <Link
                        key={child.name}
                        href={child.query ? `${child.href}?source=${child.query}` : child.href}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          isChildActive
                            ? "bg-slate-700/50 text-white"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/30"
                        )}
                      >
                        <span className="text-base">{child.icon}</span>
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-800/80">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">ALA Admin</p>
            <p className="text-xs text-slate-500 truncate">v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
