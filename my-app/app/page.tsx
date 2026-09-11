// app/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowRight,
  Play,
  Calendar,
  Users,
  Pin,
  Menu,
  X,
} from 'lucide-react';
import { useAnnouncements } from '@/app/hook/useSchoolData';

export default function PublicLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Fetch only public announcements using React Query hook
  const { data: announcements = [], isLoading, error } = useAnnouncements(true);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. HERO SECTION WITH BACKGROUND VIDEO */}
      <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Background Video Layer */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1920&auto=format&fit=crop"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>

        {/* Video Dark Overlay for Legibility */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-900/50 via-slate-900/30 to-slate-950/50 backdrop-blur-[1px] z-10" />

        {/* Navigation Bar */}
        <header className="relative z-20 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/90 backdrop-blur-md rounded-2xl shadow-lg shadow-indigo-600/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">EduPulse</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#announcements" className="hover:text-white transition-colors">
              Announcements
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
          </nav>

          {/* Action Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm font-semibold rounded-xl backdrop-blur-md transition-all shadow-sm"
            >
              Portal Sign In
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="relative z-30 md:hidden bg-slate-900/95 border-b border-slate-800 px-6 py-4 space-y-3 backdrop-blur-lg">
            <a href="#announcements" className="block text-sm font-medium text-slate-300 py-1">
              Announcements
            </a>
            <Link
              href="/login"
              className="block text-center py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
            >
              Portal Sign In
            </Link>
          </div>
        )}

        {/* Hero Content */}
        <main className="relative z-20 max-w-5xl mx-auto px-6 py-20 text-center my-auto space-y-8">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Your Journey Toward <br />
            <div/>
              <span className='text-blue-900'>
              Learning Just Got Easier 
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Access real-time announcements, campus directories, academic schedules, and administrative tools in one unified platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#announcements"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm rounded-2xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              Public Bulletins
            </a>
          </div>
        </main>

        {/* Hero Footer Stats */}
        <div className="relative z-20 border-t border-white/10 bg-slate-950/40 backdrop-blur-md py-6">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">99.9%</p>
              <p className="text-xs text-slate-400 mt-1">Uptime Reliability</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">10k+</p>
              <p className="text-xs text-slate-400 mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">500+</p>
              <p className="text-xs text-slate-400 mt-1">Teaching Staff</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">Real-Time</p>
              <p className="text-xs text-slate-400 mt-1">Sync Engine</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PUBLIC ANNOUNCEMENTS SECTION */}
      <section id="announcements" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
              Campus Announcements
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Stay updated with real-time public notices from school administration.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            {isLoading ? (
              <div className="text-slate-500 text-center py-12 text-sm">
                Fetching latest public announcements...
              </div>
            ) : error ? (
              <div className="text-rose-400 text-center py-12 text-sm">
                Unable to load announcements. Please check API connection.
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-slate-500 text-center py-12 text-sm">
                No public announcements broadcasted at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((item: any) => (
                  <div
                    key={item._id || item.id}
                    className={`bg-slate-800/60 rounded-2xl p-5 border transition-all duration-200 space-y-3 ${
                      item.isPinned
                        ? 'border-indigo-500/50 bg-indigo-950/20 shadow-md'
                        : 'border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {item.isPinned && (
                          <Pin className="w-4 h-4 text-indigo-400 rotate-45 shrink-0 fill-indigo-400" />
                        )}
                        <h3 className="font-semibold text-white text-base leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <span className="bg-indigo-950 text-indigo-300 text-xs font-medium px-3 py-1 rounded-full border border-indigo-800/50 shrink-0">
                        {item.category || 'General'}
                      </span>
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed">
                      {item.description || item.content}
                    </p>

                    <div className="flex items-center gap-6 text-xs text-slate-400 pt-3 border-t border-slate-700/40">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(item.createdAt || item.date || Date.now()).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {item.targetAudience || 'All'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-slate-300">EduPulse Platform</span>
          </div>
          <p>© {new Date().getFullYear()} EduPulse Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}