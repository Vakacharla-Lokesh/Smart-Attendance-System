"use client";

import React from "react";
import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  adminName?: string;
  adminEmail?: string;
}

export default function AdminLayout({
  children,
  adminName,
  adminEmail,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <AdminSidebar
        adminName={adminName}
        adminEmail={adminEmail}
      />

      {/* Main Content Area */}
      <main className="lg:pl-72 min-h-screen">
        {/* Mobile spacing for header */}
        <div className="lg:hidden h-14" />

        {/* Content wrapper with padding and max-width */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
