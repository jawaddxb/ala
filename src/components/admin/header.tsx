"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Home, Shield, Menu, BookOpen } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminHeaderProps {
  user: {
    name: string;
    email: string;
    role: "user" | "admin";
  };
}

const mobileNav = [
  { name: "Dashboard", href: "/admin" },
  { name: "Thesis", href: "/admin/thesis" },
  { name: "Voice", href: "/admin/voice" },
  { name: "Topics", href: "/admin/topics" },
  { name: "Knowledge", href: "/admin/knowledge" },
  { name: "Sources", href: "/admin/sources" },
  { name: "Users", href: "/admin/users" },
];

export function AdminHeader({ user }: AdminHeaderProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-50 h-16 bg-card/90 backdrop-blur-md border-b border-border/50">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left side - Logo and mobile menu */}
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-card border-border p-0">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="flex items-center gap-3 text-foreground">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary-foreground" />
                  </div>
                  ALA Admin
                </SheetTitle>
              </SheetHeader>
              <nav className="p-4 space-y-2">
                {mobileNav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary/50" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
                <div className="border-t border-border my-4" />
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>Back to App</span>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-shadow">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-foreground">ALA</span>
              <span className="text-lg font-normal text-muted-foreground ml-1.5">Admin</span>
            </div>
          </Link>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Back to app button */}
          <Link href="/" className="hidden sm:flex">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Back to App</span>
            </Button>
          </Link>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-ring/50 transition-all">
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 bg-card border-border shadow-xl"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Shield className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="text-muted-foreground focus:bg-secondary focus:text-foreground cursor-pointer py-2.5 px-4">
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="text-red-400 focus:bg-red-500/20 focus:text-red-400 cursor-pointer py-2.5 px-4"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
