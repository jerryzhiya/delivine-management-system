'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import { User, Mail, ShieldCheck, CalendarDays, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Profile { id: string; name: string; email: string; role: string; createdAt: string; }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = Cookies.get('token') || localStorage.getItem('token');
        const response = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
        const user = response.data as Profile;
        setProfile(user);
        setFormData({ name: user.name, email: user.email });
        localStorage.setItem('user', JSON.stringify(user));
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load your profile.');
      } finally { setLoading(false); }
    };
    loadProfile();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = Cookies.get('token') || localStorage.getItem('token');
      const response = await api.put('/users/me', formData, { headers: { Authorization: `Bearer ${token}` } });
      const updatedUser = response.data.user as Profile;
      setProfile(updatedUser); setFormData({ name: updatedUser.name, email: updatedUser.email });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update your profile.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="max-w-3xl mx-auto py-20 flex justify-center"><Loader2 className="w-7 h-7 text-indigo-600 animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-900">My Profile</h1><p className="text-sm text-slate-500 mt-1">View and update your account details.</p></div>
      {error && <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {success && <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{success}</div>}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-2xl font-bold">{profile?.name?.charAt(0).toUpperCase() || <User />}</div><div><h2 className="text-xl font-bold">{profile?.name}</h2><p className="text-sm text-slate-300">{profile?.email}</p></div></div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><div className="p-3 rounded-xl bg-slate-50 flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-indigo-600" /><span><strong className="block text-[11px] uppercase text-slate-500">Role</strong>{profile?.role}</span></div><div className="p-3 rounded-xl bg-slate-50 flex items-center gap-3"><CalendarDays className="w-4 h-4 text-indigo-600" /><span><strong className="block text-[11px] uppercase text-slate-500">Member since</strong>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</span></div></div>
          <form onSubmit={handleSave} className="space-y-4 border-t border-slate-100 pt-5"><div><label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Full name</label><div className="relative"><User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div></div><div><label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Email address</label><div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div></div><div className="flex justify-end"><button disabled={saving} type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold flex items-center gap-2"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</button></div></form>
        </div>
      </div>
    </div>
  );
}
