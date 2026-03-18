"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  DoorOpen,
  BookOpen,
  Calendar,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Rooms", href: "/admin/rooms", icon: DoorOpen },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Timetables", href: "/admin/timetables", icon: Calendar },
  { name: "Students", href: "/admin/students", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  adminName?: string;
  adminEmail?: string;
}

export default function AdminSidebar({
  adminName = "Admin User",
  adminEmail = "admin@university.edu",
}: AdminSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    import("@/lib/logout").then((m) => m.logout());
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={`
          group relative flex items-center gap-3 px-4 py-3 rounded-xl
          transition-all duration-300 ease-out
          ${
            active
              ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-300 shadow-lg shadow-emerald-500/10"
              : "text-slate-300 hover:text-white hover:bg-gray-800/60"
          }
        `}
      >
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full" />
        )}

        <Icon
          className={`w-5 h-5 transition-transform duration-300 ${
            active ? "scale-110" : "group-hover:scale-105"
          }`}
        />

        <span className="font-medium tracking-wide">{item.name}</span>

        {item.badge && (
          <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
            {item.badge}
          </span>
        )}

        {active && <ChevronRight className="ml-auto w-4 h-4 opacity-60" />}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* User Profile */}
      <div className="px-4 py-6 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-900" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate tracking-wide">
              {adminName}
            </h3>
            <p className="text-sm text-slate-400 truncate">{adminEmail}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800/50">
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3 px-4 py-3 rounded-xl
            text-slate-300 hover:text-red-300 hover:bg-red-500/10
            transition-all duration-300 ease-out
            group
          "
        >
          <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" />
          <span className="font-medium tracking-wide">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-slate-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isMobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-gray-900 border-r border-gray-800/50 fixed left-0 top-0 bottom-0 z-30">
        <div className="px-6 py-6 border-b border-gray-800/50">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium tracking-wide">
            University Management
          </p>
        </div>

        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`
          lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gray-900 border-r border-gray-800/50 z-50
          transition-transform duration-300 ease-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="px-6 py-6 border-b border-gray-800/50 mt-16">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium tracking-wide">
            University Management
          </p>
        </div>

        <SidebarContent />
      </aside>
    </>
  );
}