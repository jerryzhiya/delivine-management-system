'use client';

import React, { useState } from 'react';
import Sidebar from '@/app/components/navigation/Sidebar'; 
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      {/* Sidebar Drawer Component */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Screen Container */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <span className="font-bold text-slate-900">EduPortal</span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex min-w-0 flex-1 justify-center overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="flex w-full min-w-0 justify-center *:w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}