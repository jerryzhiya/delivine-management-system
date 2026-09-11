'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT', // Default role
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      const response = await api.post('/auth/register', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMsg(
        response.data.message || `${formData.role} account created successfully!`
      );
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to create user account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-600" />
            Create New Account
          </h1>
          <p className="text-sm text-slate-500">
            Provision new Student, Teacher, Parent, or Admin access for the portal.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Status Alerts */}
        {error && (
          <div className="p-4 rounded-xl text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select User Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-sm font-medium transition-all ${
                  formData.role === 'STUDENT'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <GraduationCap className="w-5 h-5 mb-1 text-indigo-600" />
                Student
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'TEACHER' })}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-sm font-medium transition-all ${
                  formData.role === 'TEACHER'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <BookOpen className="w-5 h-5 mb-1 text-emerald-600" />
                Teacher
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'PARENT' })}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-sm font-medium transition-all ${
                  formData.role === 'PARENT'
                    ? 'border-purple-600 bg-purple-50/50 text-purple-700 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Users className="w-5 h-5 mb-1 text-purple-600" />
                Parent
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-sm font-medium transition-all ${
                  formData.role === 'ADMIN'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-700 font-semibold shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Shield className="w-5 h-5 mb-1 text-amber-600" />
                Admin
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="name"
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                placeholder="user@school.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Default Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="password"
                required
                placeholder="Set initial password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create {formData.role} Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}