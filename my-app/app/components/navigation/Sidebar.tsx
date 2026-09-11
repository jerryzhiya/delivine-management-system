'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  GraduationCap,
  BookOpen,
  FileSpreadsheet,
  UploadCloud,
  FileCheck,
  ClipboardCheck,
  CreditCard,
  Megaphone,
  Settings,
  User,
  Calendar,
  BookMarked,
  X,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('ADMIN');

  // Automatically close mobile sidebar when the route changes
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [pathname]);

  useEffect(() => {
    const storedRole = Cookies.get('user_role');
    if (storedRole) {
      setUserRole(storedRole.toUpperCase());
    } else {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.role) setUserRole(user.role.toUpperCase());
        } catch {
          console.error('Failed to parse user data');
        }
      }
    }
  }, []);

  const masterSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
        { label: 'Announcements', href: '/dashboard/admin/announcements', icon: Megaphone, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
      ],
    },
    {
      title: 'User Management',
      items: [
        { label: 'Register New User', href: '/dashboard/admin/users/create', icon: UserPlus, roles: ['ADMIN'] },
        { label: 'Students Directory', href: '/dashboard/admin/students', icon: GraduationCap, roles: ['ADMIN', 'TEACHER'] },
        { label: 'Parent Directory', href: '/dashboard/admin/parent', icon: User, roles: ['ADMIN'] },
        { label: 'Teachers Directory', href: '/dashboard/admin/teachers', icon: Users, roles: ['ADMIN'] },
      ],
    },
    {
      title: 'Academics & Work',
      items: [
        { label: 'Subjects', href: '/dashboard/subjects', icon: BookOpen, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { label: 'Timetable', href: '/dashboard/timetable', icon: Calendar, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { label: 'Student Record', href: '/dashboard/grade', icon: BookOpen, roles: ['ADMIN', 'TEACHER'] },
        { label: 'Classes', href: '/dashboard/admin/classes', icon: BookMarked, roles: ['ADMIN'] },
        { label: 'Assignments', href: '/dashboard/admin/assignments', icon: FileSpreadsheet, roles: ['ADMIN', 'TEACHER'] },
        { label: 'Review Submissions', href: '/dashboard/admin/submissions', icon: FileCheck, roles: ['ADMIN', 'TEACHER'] },
        { label: 'Submit Work (Student)', href: '/dashboard/student/submissions', icon: UploadCloud, roles: ['STUDENT'] },
        { label: 'Attendance Records', href: '/dashboard/teacher/attendance', icon: ClipboardCheck, roles: ['ADMIN', 'TEACHER'] },
      ],
    },
    {
      title: 'Finance & System',
      items: [
        { label: 'Payments & Tuition', href: '/dashboard/admin/payments', icon: CreditCard, roles: ['ADMIN'] },
        { label: 'Payment Gateway', href: '/dashboard/paymentgateway', icon: CreditCard, roles: ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'] },
        { label: 'Portal Settings', href: '/dashboard/admin/settings', icon: Settings, roles: ['ADMIN', 'PARENT', 'TEACHER', 'STUDENT'] },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Admin Profile', href: '/dashboard/profile', icon: User, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
      ],
    },
  ];

  const menuSections: NavSection[] = masterSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(userRole)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Touch-Friendly Mobile Backdrop */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden w-full h-full border-0 cursor-default"
        />
      )}

      {/* Dynamic Mobile Viewport Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-[100dvh] w-64 shrink-0 bg-slate-900 text-slate-300 p-4 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <span className="font-bold text-white text-lg tracking-wide">EduPortal</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold uppercase">
              {userRole}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto space-y-5 pt-4 pr-1">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md font-semibold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}