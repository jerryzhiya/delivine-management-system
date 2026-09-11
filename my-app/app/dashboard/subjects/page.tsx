'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  User,
  GraduationCap,
  Filter,
} from 'lucide-react';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  teacherId?: string | null;
  classId?: string | null;
  teacher?: { id: string; name: string; email?: string } | null;
  class?: { id: string; name: string } | null;
  createdAt?: string;
}

export interface ClassItem {
  id: string;
  name: string;
}

export interface TeacherItem {
  id: string;
  name: string;
  email?: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [teacherFilter, setTeacherFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    classId: '',
    teacherId: '',
  });

  // Auto-dismiss success notification after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [classFilter, teacherFilter]);

  const fetchAuxiliaryData = async () => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const [classRes, teacherRes] = await Promise.allSettled([
        api.get('/classes', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/users?role=TEACHER', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (classRes.status === 'fulfilled') {
        const data = classRes.value.data;
        setClasses(Array.isArray(data) ? data : data?.data || []);
      }
      if (teacherRes.status === 'fulfilled') {
        const data = teacherRes.value.data;
        setTeachers(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (err) {
      console.error('Error fetching dropdown choices:', err);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      const params: Record<string, string> = {};
      if (classFilter !== 'ALL') params.classId = classFilter;
      if (teacherFilter !== 'ALL') params.teacherId = teacherFilter;

      // GET /api/subjects
      const res = await api.get('/subjects', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch subjects list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      classId: '',
      teacherId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      classId: subject.classId || '',
      teacherId: subject.teacherId || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    const payload = {
      name: formData.name,
      code: formData.code.trim().toUpperCase(),
      description: formData.description,
      classId: formData.classId || null,
      teacherId: formData.teacherId || null,
    };

    try {
      if (editingSubject) {
        // PUT /api/subjects/:id -> Returns { message, subject }
        const res = await api.put(`/subjects/${editingSubject.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updated = res.data?.subject || res.data;

        setSubjects((prev) => prev.map((s) => (s.id === editingSubject.id ? updated : s)));
        setSuccess(res.data?.message || 'Subject updated successfully.');
      } else {
        // POST /api/subjects -> Returns { message, subject }
        const res = await api.post('/subjects', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const created = res.data?.subject || res.data;

        setSubjects((prev) => [created, ...prev]);
        setSuccess(res.data?.message || 'Subject created successfully.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save subject record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to delete the course "${subjectName}"?`)) return;

    setActionLoadingId(id);
    setError(null);
    setSuccess(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      // DELETE /api/subjects/:id
      const res = await api.delete(`/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSubjects((prev) => prev.filter((s) => s.id !== id));
      setSuccess(res.data?.message || 'Subject deleted successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete subject.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const query = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      (s.description && s.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            Subjects & Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage academic subjects, assign course codes, and map instructors to classes.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchSubjects}
            className="flex-1 sm:flex-initial px-3 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl flex items-center justify-between gap-2 transition-all duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by subject name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
          >
            <option value="ALL">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Directory */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2">Loading subjects...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
          No subject records found matching your filters.
        </div>
      ) : (
        <>
          {/* Mobile Cards (screens < 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredSubjects.map((subject) => {
              const isDeleting = actionLoadingId === subject.id;

              return (
                <div
                  key={subject.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold tracking-wider mb-1">
                        {subject.code}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{subject.name}</h3>
                    </div>
                  </div>

                  {subject.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{subject.description}</p>
                  )}

                  <div className="space-y-1 pt-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Class: {subject.class?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Teacher: {subject.teacher?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditModal(subject)}
                      className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id, subject.name)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (screens >= 768px) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="p-4">Code</th>
                    <th className="p-4">Subject Name</th>
                    <th className="p-4">Assigned Class</th>
                    <th className="p-4">Instructor</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.map((subject) => {
                    const isDeleting = actionLoadingId === subject.id;

                    return (
                      <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-indigo-600 font-mono">{subject.code}</td>
                        <td className="p-4 font-bold text-slate-900">{subject.name}</td>
                        <td className="p-4 text-slate-600">{subject.class?.name || '—'}</td>
                        <td className="p-4 text-slate-600">{subject.teacher?.name || '—'}</td>
                        <td className="p-4 text-slate-500 max-w-xs truncate">
                          {subject.description || '—'}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(subject)}
                            className="p-1.5 border rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Edit Subject"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject.id, subject.name)}
                            disabled={isDeleting}
                            className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Subject"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {editingSubject ? 'Edit Subject / Course' : 'Create New Subject'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH101"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Mathematics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assign Class
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Unassigned</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assign Instructor / Teacher
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Unassigned</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Course outline or brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
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
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}