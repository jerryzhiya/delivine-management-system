'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  Calendar,
  Clock,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Trash2,
  Coffee,
  BookOpen,
  User,
  MapPin,
  Edit3,
} from 'lucide-react';

export interface SchedulePeriod {
  id: string;
  classId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  isBreak: boolean;
  class?: { id: string; name: string };
  subject?: { id: string; name: string; code?: string };
  teacher?: { id: string; name: string; email?: string };
}

export interface ClassItem {
  id: string;
  name: string;
}

export interface SubjectItem {
  id: string;
  name: string;
}

export interface TeacherItem {
  id: string;
  name: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [schedule, setSchedule] = useState<SchedulePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<string>('Monday');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<SchedulePeriod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '09:00',
    subjectId: '',
    teacherId: '',
    room: '',
    isBreak: false,
  });

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchSchedule(selectedClassId);
    }
  }, [selectedClassId]);

  const fetchInitialData = async () => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const [classRes, subjectRes, teacherRes] = await Promise.allSettled([
        api.get('/classes', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/subjects', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/users?role=TEACHER', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (classRes.status === 'fulfilled') {
        const classList = Array.isArray(classRes.value.data) ? classRes.value.data : classRes.value.data?.data || [];
        setClasses(classList);
        if (classList.length > 0) setSelectedClassId(classList[0].id);
      }
      if (subjectRes.status === 'fulfilled') {
        setSubjects(Array.isArray(subjectRes.value.data) ? subjectRes.value.data : []);
      }
      if (teacherRes.status === 'fulfilled') {
        setTeachers(Array.isArray(teacherRes.value.data) ? teacherRes.value.data : []);
      }
    } catch (err) {
      setError('Failed to load classes or resource data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (classId: string) => {
    setLoading(true);
    setError(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      // Calls GET /api/schedule?classId=...
      const res = await api.get('/schedules', {
        params: { classId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedule(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch timetable.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPeriod(null);
    setFormData({
      dayOfWeek: activeDay,
      startTime: '08:00',
      endTime: '09:00',
      subjectId: '',
      teacherId: '',
      room: '',
      isBreak: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (period: SchedulePeriod) => {
    setEditingPeriod(period);
    setFormData({
      dayOfWeek: period.dayOfWeek,
      startTime: period.startTime,
      endTime: period.endTime,
      subjectId: period.subject?.id || '',
      teacherId: period.teacher?.id || '',
      room: period.room || '',
      isBreak: period.isBreak,
    });
    setIsModalOpen(true);
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    const payload = {
      classId: selectedClassId,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      subjectId: formData.isBreak ? null : formData.subjectId || null,
      teacherId: formData.isBreak ? null : formData.teacherId || null,
      room: formData.room,
      isBreak: formData.isBreak,
    };

    try {
      if (editingPeriod) {
        // PUT /api/schedule/:id
        const res = await api.put(`/schedules/${editingPeriod.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchedule((prev) => prev.map((p) => (p.id === editingPeriod.id ? res.data : p)));
        setSuccess('Schedule period updated successfully.');
      } else {
        // POST /api/schedule
        const res = await api.post('/schedules', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchedule((prev) => [...prev, res.data]);
        setSuccess('New schedule period added successfully.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save schedule period.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule period?')) return;

    setActionLoadingId(id);
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      // DELETE /api/schedule/:id
      await api.delete(`/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedule((prev) => prev.filter((p) => p.id !== id));
      setSuccess('Schedule period deleted successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete schedule period.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredPeriods = schedule
    .filter((p) => p.dayOfWeek.toLowerCase() === activeDay.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            Class Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage subject allocations, break slots, and classroom schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 border rounded-xl text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenCreateModal}
            disabled={!selectedClassId}
            className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Period
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Days Selector Bar */}
      <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1.5 rounded-2xl no-scrollbar">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`flex-1 min-w-[90px] py-2 px-3 text-xs font-bold rounded-xl transition-all ${
              activeDay === day
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2">Loading timetable schedule...</p>
        </div>
      ) : filteredPeriods.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
          No periods scheduled for {activeDay}.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredPeriods.map((period) => {
            const isDeleting = actionLoadingId === period.id;

            return (
              <div
                key={period.id}
                className={`border rounded-2xl p-4 space-y-3 relative group transition-all ${
                  period.isBreak
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {period.startTime} - {period.endTime}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(period)}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Edit Period"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePeriod(period.id)}
                      disabled={isDeleting}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Period"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {period.isBreak ? (
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm py-2">
                    <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                    Break / Recess
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                      {period.subject?.name || 'Unassigned Subject'}
                    </h3>

                    {period.teacher && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {period.teacher.name}
                      </p>
                    )}

                    {period.room && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Room {period.room}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {editingPeriod ? 'Edit Schedule Period' : 'Add Schedule Period'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Day of Week *
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="isBreakToggle"
                  checked={formData.isBreak}
                  onChange={(e) => setFormData({ ...formData, isBreak: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isBreakToggle" className="text-xs font-semibold text-slate-700">
                  Mark as Break / Recess Period
                </label>
              </div>

              {!formData.isBreak && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Subject
                    </label>
                    <select
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Teacher
                    </label>
                    <select
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Room Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 101"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingPeriod ? 'Save Changes' : 'Add Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}