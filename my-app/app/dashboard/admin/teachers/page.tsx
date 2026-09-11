'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  Users,
  UserPlus,
  Mail,
  BookOpen,
  Trash2,
  Edit3,
  Loader2,
  AlertCircle,
  X,
  Search,
  CheckCircle2,
  Phone,
  RefreshCw,
  School,
  Briefcase,
  Camera,
  Award,
} from 'lucide-react';

interface AssignedClass {
  id?: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject?: string;
  phone?: string | null;
  experience?: number | null;
  avatar?: string | null;
  classes?: (AssignedClass | string)[];
  createdAt?: string;
}

const toArray = <T,>(payload: any): T[] => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  return [];
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState('');

  // Notification Banners
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    phone: '',
    experience: 0,
    avatar: '',
  });

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await api.get('/teachers', { headers });
      setTeachers(toArray<Teacher>(res.data));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load faculty information.');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData((prev) => ({ ...prev, avatar: canvas.toDataURL('image/jpeg', 0.8) }));
      };
    };
    reader.readAsDataURL(file);
  };

  const openCreateModal = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      email: '',
      subject: '',
      phone: '',
      experience: 0,
      avatar: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      subject: teacher.subject || '',
      phone: teacher.phone || '',
      experience: teacher.experience || 0,
      avatar: teacher.avatar || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher.id}`, formData, { headers });
        setSuccess(`Teacher "${formData.name}" updated successfully.`);
      } else {
        await api.post('/teachers', formData, { headers });
        setSuccess(`Teacher "${formData.name}" added successfully.`);
      }

      setIsModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save teacher details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove teacher "${name}"?`)) return;

    setDeletingId(id);
    setError(null);
    setSuccess(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      await api.delete(`/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(`Teacher "${name}" deleted successfully.`);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete teacher.');
    } finally {
      setDeletingId(null);
    }
  };

  const safeTeachers = Array.isArray(teachers) ? teachers : [];

  const getClassNames = (classList?: (AssignedClass | string)[]): string[] => {
    if (!classList || !Array.isArray(classList)) return [];
    return classList.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean);
  };

  const filteredTeachers = safeTeachers.filter((t) => {
    const query = searchQuery.toLowerCase();
    const assignedClassesStr = getClassNames(t.classes).join(' ').toLowerCase();

    return (
      t.name?.toLowerCase().includes(query) ||
      t.email?.toLowerCase().includes(query) ||
      t.subject?.toLowerCase().includes(query) ||
      t.phone?.toLowerCase().includes(query) ||
      t.experience?.toString().includes(query) ||
      assignedClassesStr.includes(query)
    );
  });

  const uniqueSubjects = new Set(
    safeTeachers.map((t) => t.subject).filter(Boolean)
  ).size;

  const totalAssignedClasses = safeTeachers.reduce(
    (acc, t) => acc + getClassNames(t.classes).length,
    0
  );

  const avgExperience =
    safeTeachers.length > 0
      ? (
          safeTeachers.reduce((acc, t) => acc + (t.experience || 0), 0) / safeTeachers.length
        ).toFixed(1)
      : '0';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            Teachers & Faculty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Manage teacher profiles, photo directory, experience level, and assigned classes.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchTeachers}
            className="flex-1 sm:flex-initial px-3 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Faculty</p>
          <p className="text-xl sm:text-3xl font-bold text-slate-900 mt-1">{safeTeachers.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Subjects</p>
          <p className="text-xl sm:text-3xl font-bold text-indigo-600 mt-1">{uniqueSubjects}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Experience</p>
          <p className="text-xl sm:text-3xl font-bold text-amber-600 mt-1">{avgExperience} <span className="text-xs font-normal text-slate-500">yrs</span></p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Class Assignments</p>
          <p className="text-xl sm:text-3xl font-bold text-emerald-600 mt-1">{totalAssignedClasses}</p>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, email, subject, experience..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2 font-medium">Loading faculty members...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
          No teacher records match your criteria. Click "Add Teacher" to register a new faculty member.
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTeachers.map((t) => {
              const isDeletingThis = deletingId === t.id;
              const assignedClasses = getClassNames(t.classes);

              return (
                <div
                  key={t.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-100">
                          {t.name?.charAt(0).toUpperCase() || 'T'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-normal mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {t.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Subject</span>
                      {t.subject ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium text-[11px]">
                          <BookOpen className="w-3 h-3" />
                          {t.subject}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Experience</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-medium text-[11px]">
                        <Briefcase className="w-3 h-3" />
                        {t.experience || 0} yrs
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Phone</span>
                      {t.phone ? (
                        <span className="text-slate-700 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {t.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Classes Section */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                      Assigned Classes ({assignedClasses.length})
                    </span>
                    {assignedClasses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedClasses.map((className, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md font-medium text-[11px]"
                          >
                            <School className="w-3 h-3 text-emerald-600" />
                            {className}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No assigned classes</span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(t)}
                      className="flex-1 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
                      disabled={isDeletingThis}
                      className="flex-1 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      {isDeletingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="p-4">Teacher Profile</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Experience</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Assigned Classes</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((t) => {
                    const isDeletingThis = deletingId === t.id;
                    const assignedClasses = getClassNames(t.classes);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            {t.avatar ? (
                              <img
                                src={t.avatar}
                                alt={t.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-100">
                                {t.name?.charAt(0).toUpperCase() || 'T'}
                              </div>
                            )}
                            <span className="text-xs sm:text-sm font-semibold text-slate-900">{t.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {t.email}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700">
                          {t.subject ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                              <BookOpen className="w-3 h-3" />
                              {t.subject}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">General</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-700">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg text-xs font-medium">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            {t.experience || 0} Years
                          </span>
                        </td>
                        <td className="p-4 text-slate-700">
                          {t.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {t.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {assignedClasses.map((className, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md font-medium text-xs"
                                >
                                  <School className="w-3 h-3 text-emerald-600" />
                                  {className}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Edit Teacher"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id, t.name)}
                              disabled={isDeletingThis}
                              className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Teacher"
                            >
                              {isDeletingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
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

      {/* Modal Component (Create / Edit Teacher Profile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {editingTeacher ? 'Edit Teacher Profile' : 'Register New Teacher'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Profile Image Field */}
              <div className="flex flex-col items-center justify-center space-y-2 pb-2">
                <div className="relative group">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center text-indigo-600">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px] font-semibold mt-1">Upload</span>
                    </div>
                  )}

                  <label
                    htmlFor="teacher-avatar-upload"
                    className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-semibold"
                  >
                    Change
                  </label>
                  <input
                    id="teacher-avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. s.jenkins@school.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Primary Subject
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    placeholder="e.g. 5"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingTeacher ? 'Save Changes' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}