'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import {
  Bell,
  Pin,
  Calendar,
  Users,
  Loader2,
  X,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  BookOpen,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  ShieldCheck,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

// Chart Datasets
const chartColors = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

interface DashboardOverview {
  metrics: {
    totalStudents: { value: number; change: string };
    totalTeachers: { value: number; change: string };
    activeClasses: { value: number; subtext: string };
    revenue: { value: string; subtext: string };
  };
  charts: {
    attendanceTrends: Array<{ month: string; rate: number }>;
    gradeDistribution: Array<{ grade: string; percentage: number }>;
  };
}

interface GradeDistributionPoint {
  name: string;
  value: number;
  color: string;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: overview } = useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => (await api.get('/dashboard')).data,
  });

  const attendanceData = overview?.charts?.attendanceTrends || [];
  const gradeDistributionData: GradeDistributionPoint[] = (overview?.charts?.gradeDistribution || []).map(
    (item: { grade: string; percentage: number }, index: number) => ({
      name: `Grade ${item.grade}`,
      value: item.percentage,
      color: chartColors[index % chartColors.length],
    })
  );

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    targetAudience: 'All Staff',
    isPinned: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch Announcements via TanStack Query
  const {
    data: announcements = [],
    isLoading: loadingAnnouncements,
    isError,
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await api.get('/announcements');
      const raw = response.data;
      return Array.isArray(raw) ? raw : raw?.announcements || raw?.data || [];
    },
  });

  // 2. Pin / Unpin Mutation
  const togglePinMutation = useMutation({
    mutationFn: async (item: Announcement) => {
      const itemId = item.id || item._id;
      const updatedStatus = !item.isPinned;
      await api.patch(`/announcement/${itemId}`, { isPinned: updatedStatus }).catch(() =>
        api.patch(`/announcements/${itemId}`, { isPinned: updatedStatus })
      );
      return updatedStatus;
    },
    onSuccess: (updatedStatus) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showToast(updatedStatus ? 'Announcement pinned!' : 'Announcement unpinned!');
    },
  });

  // 3. Edit Announcement Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: typeof formData }) => {
      return api.patch(`/announcements/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showToast('Announcement updated successfully!');
      setIsModalOpen(false);
    },
  });

  // 4. Delete Announcement Mutation
  const deleteMutation = useMutation({
    mutationFn: async (item: Announcement) => {
      const itemId = item.id || item._id;
      return api.delete(`/announcements/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      showToast('Announcement deleted.');
    },
  });

  // Sorting pinned announcements to top
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    }
    return a.isPinned ? -1 : 1;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:top-5 sm:right-5 z-50 flex items-center justify-center sm:justify-start gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium transition-all">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-200 pb-5 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-semibold w-fit shrink-0">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          Admin Privileges Active
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Total Students</span>
            <GraduationCap className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{overview?.metrics?.totalStudents?.value ?? 0}</p>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +12% from last month
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Total Teachers</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{overview?.metrics?.totalTeachers?.value ?? 0}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{overview?.metrics?.totalTeachers?.change || 'No recent change'}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Active Classes</span>
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{overview?.metrics?.activeClasses?.value ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{overview?.metrics?.activeClasses?.subtext || 'Active classes'}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider">Revenue</span>
            <DollarSign className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{overview?.metrics?.revenue?.value || '₦0'}</p>
            <p className="text-xs text-gray-500 mt-1">{overview?.metrics?.revenue?.subtext || 'This semester'}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Announcements + Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Important Announcements Section */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-200/80 rounded-xl shrink-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Important Announcements</h2>
            </div>
          </div>

          {loadingAnnouncements ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">Loading announcements...</p>
            </div>
          ) : isError ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to load announcements. Please check backend.</span>
            </div>
          ) : sortedAnnouncements.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No announcements at this time.</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {sortedAnnouncements.map((item, index) => (
                <div
                  key={item.id || item._id || index}
                  className={`bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-all ${
                    item.isPinned ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.isPinned && (
                        <Pin className="w-4 h-4 text-indigo-600 rotate-45 shrink-0 fill-indigo-600" />
                      )}
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{item.title}</h3>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 shrink-0">
                      {item.category || 'General'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed wrap-break-word">
                    {item.description || item.content}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.date || item.createdAt
                          ? new Date(item.date || item.createdAt!).toISOString().split('T')[0]
                          : 'Today'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.targetAudience || 'All'}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-0 border-slate-50">
                      <button
                        onClick={() => {
                          setEditingAnnouncementId(item.id || item._id || null);
                          setFormData({
                            title: item.title,
                            description: item.description || item.content || '',
                            category: item.category || 'General',
                            targetAudience: item.targetAudience || 'All',
                            isPinned: item.isPinned,
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-slate-500 hover:text-indigo-700 transition-colors p-1"
                        aria-label="Edit announcement"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => togglePinMutation.mutate(item)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 text-xs"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {item.isPinned ? 'Unpin' : 'Pin'}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Delete this announcement?')) deleteMutation.mutate(item);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        aria-label="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Analytics Charts */}
        <div className="space-y-5 sm:space-y-6">
          {/* Monthly Attendance Trend (Line Chart) */}
          <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2 truncate">
                <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
                Monthly Attendance
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                {attendanceData.length > 0
                  ? `${Math.round(attendanceData.reduce((sum: number, item: { rate: number }) => sum + item.rate, 0) / attendanceData.length)}% Avg`
                  : 'No data'}
              </span>
            </div>

            <div className="h-44 sm:h-48 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis domain={[80, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    formatter={(value) => [`${value ?? 0}%`, 'Attendance']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grade Distribution Donut Circle */}
          <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600 shrink-0" />
              Grade Distribution
            </h3>

            <div className="h-40 sm:h-44 w-full flex items-center justify-center min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                    formatter={(value: string | number | readonly (string | number)[] | undefined) => {
                      const numericValue = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
                      return [`${numericValue}%`, 'Share'];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
              {gradeDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 truncate text-[11px] sm:text-xs">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-[11px] sm:text-xs">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities Feed */}
          <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              Recent Activities
            </h3>
            <div className="space-y-3 text-xs">
              <div className="border-l-2 border-indigo-500 pl-3 py-0.5 space-y-0.5">
                <p className="font-semibold text-gray-900">New student enrolled</p>
                <p className="text-gray-500 text-[11px] sm:text-xs">Emma Johnson • 2 hours ago</p>
              </div>
              <div className="border-l-2 border-emerald-500 pl-3 py-0.5 space-y-0.5">
                <p className="font-semibold text-gray-900">Fee payment received</p>
                <p className="text-gray-500 text-[11px] sm:text-xs">Michael Chen • 3 hours ago</p>
              </div>
              <div className="border-l-2 border-blue-500 pl-3 py-0.5 space-y-0.5">
                <p className="font-semibold text-gray-900">Attendance marked</p>
                <p className="text-gray-500 text-[11px] sm:text-xs">Class 10-A • 6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Editing Announcement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Edit Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingAnnouncementId) {
                  updateMutation.mutate({ id: editingAnnouncementId, payload: formData });
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Parent-Teacher Meeting"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Event">Event</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="All">All</option>
                    <option value="Parents">Parents</option>
                    <option value="Teachers">Teachers</option>
                    <option value="Students">Students</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Write full announcement details..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinToggle"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <label htmlFor="pinToggle" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Pin to top of list
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}