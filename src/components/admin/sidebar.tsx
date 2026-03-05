"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
      { name: "All Sources", href: "/admin/sources", query: null },
      { name: "Quran", href: "/admin/sources", query: "quran" },
      { name: "Bible", href: "/admin/sources", query: "bible" },
      { name: "Hadith Bukhari", href: "/admin/sources", query: "hadith_bukhari" },
      { name: "Hadith Muslim", href: "/admin/sources", query: "hadith_muslim" },
      { name: "Secular", href: "/admin/sources", query: "secular" },
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
  const { data: session } = useSession();

  const userName = session?.user?.name || session?.user?.email || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card/50 backdrop-blur-sm border-r border-border/50 overflow-y-auto hidden lg:block">
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
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive || isParentActive ? "text-primary" : "text-muted-foreground"
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
                <div className="mt-1 ml-3 pl-5 border-l border-border/50 space-y-1">
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
                            ? "bg-secondary/50 text-foreground"
                            : "text-muted-foreground hover:text-muted-foreground hover:bg-secondary/30"
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
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
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-card/80">
        <div className="flex items-center gap-3 px-3 py-2">
          <Image src="/ala-logo.jpg" alt="ALA" width={32} height={32} className="rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">v1.0.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
