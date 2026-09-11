'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/app/lib/api';
import {
  Bell,
  Pin,
  Calendar,
  Users,
  Loader2,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface Announcement {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  content?: string;
  date?: string;
  createdAt?: string;
  category: string;
  targetAudience: string;
  isPinned: boolean;
}

interface AnnouncementsProps {
  isAdmin?: boolean;
}

export default function Announcements({ isAdmin: propIsAdmin }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState<boolean>(propIsAdmin || false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    targetAudience: 'All Staff',
    isPinned: false,
  });

  useEffect(() => {
    if (propIsAdmin !== undefined) {
      setIsAdmin(propIsAdmin);
    } else {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const role = storedUser?.role?.toLowerCase();
        setIsAdmin(role === 'admin' || role === 'superadmin');
      } catch {
        setIsAdmin(false);
      }
    }

    fetchAnnouncements();
  }, [propIsAdmin]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      // Endpoint fallback handling singular vs plural
      const response = await api.get('/announcements').catch(() => api.get('/announcements'));
      const rawData = response.data;
      const dataArray = Array.isArray(rawData)
        ? rawData
        : rawData?.announcements || rawData?.data || [];

      setAnnouncements(dataArray);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      const dateA = new Date(a.date || a.createdAt || Date.now()).getTime();
      const dateB = new Date(b.date || b.createdAt || Date.now()).getTime();
      return dateB - dateA;
    }
    return a.isPinned ? -1 : 1;
  });

  const handleTogglePin = async (item: Announcement) => {
    if (!isAdmin) return;
    const itemId = item.id || item._id;
    if (!itemId) return;

    const updatedStatus = !item.isPinned;

    setAnnouncements((prev) =>
      prev.map((ann) =>
        (ann.id === itemId || ann._id === itemId) ? { ...ann, isPinned: updatedStatus } : ann
      )
    );

    try {
      await api.patch(`/announcements/${itemId}`, { isPinned: updatedStatus }).catch(() =>
        api.patch(`/announcements/${itemId}`, { isPinned: updatedStatus })
      );
      showToast(updatedStatus ? 'Announcement pinned!' : 'Announcement unpinned!');
    } catch (err) {
      console.error('Failed to update pin status:', err);
      fetchAnnouncements();
      alert('Failed to update pin status.');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);

    const payload = {
      ...formData,
      date: new Date().toISOString(),
    };

    try {
      const response = await api.post('/announcements', payload).catch(() =>
        api.post('/announcements', payload)
      );
      const createdItem = response.data.announcement || response.data;
      const newAnnouncement: Announcement = {
        ...payload,
        id: createdItem.id || createdItem._id || Date.now().toString(),
      };

      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      showToast('Announcement published successfully!');
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'General',
        targetAudience: 'All Staff',
        isPinned: false,
      });
    } catch (err: any) {
      console.error('Failed to create announcement:', err);
      alert(err.response?.data?.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: Announcement) => {
    if (!isAdmin) return;
    const itemId = item.id || item._id;
    if (!itemId) return;

    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await api.delete(`/announcements/${itemId}`).catch(() =>
        api.delete(`/announcements/${itemId}`)
      );
      setAnnouncements((prev) => prev.filter((a) => (a.id || a._id) !== itemId));
      showToast('Announcement deleted.');
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      alert('Failed to delete announcement.');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-sm text-gray-500">Loading announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm text-center flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-100/70 border border-gray-200 rounded-2xl p-5 md:p-6 w-full space-y-4">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
          <div className="p-2 bg-gray-200/80 rounded-lg">
            <Bell className="w-5 h-5 text-gray-700" />
          </div>
          <h2>Important Announcements</h2>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sortedAnnouncements.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No announcements at this time.</p>
        ) : (
          sortedAnnouncements.map((item, index) => {
            const itemId = item.id || item._id || index.toString();
            return (
              <div
                key={itemId}
                className={`bg-white rounded-xl p-5 border transition-all duration-200 space-y-3 ${
                  item.isPinned
                    ? 'border-blue-200 ring-1 ring-blue-100 shadow-md'
                    : 'border-gray-100 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.isPinned && (
                      <Pin className="w-4 h-4 text-blue-600 rotate-45 shrink-0 fill-blue-600" />
                    )}
                    <h3 className="font-semibold text-gray-900 text-base leading-snug">
                      {item.title}
                    </h3>
                  </div>
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                    {item.category}
                  </span>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description || item.content}
                </p>

                <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50 gap-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {item.date || item.createdAt
                          ? new Date(item.date || item.createdAt!).toISOString().split('T')[0]
                          : 'Today'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>{item.targetAudience || 'All'}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item)}
                        className={`font-semibold flex items-center gap-1 transition-colors ${
                          item.isPinned
                            ? 'text-blue-600 hover:text-blue-800'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {item.isPinned ? 'Unpin' : 'Pin'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="text-gray-400 hover:text-rose-600 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Create New Announcement</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., End of Term Faculty Meeting"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
                  >
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Event">Event</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700"
                  >
                    <option value="All Staff">All Staff</option>
                    <option value="Teachers">Teachers Only</option>
                    <option value="Students">Students Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Write full announcement details..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinToggle"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="pinToggle" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Pin to top of list
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}