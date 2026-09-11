'use client';

import React, { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  GraduationCap,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  UserX,
  Filter,
  X,
  Edit3,
  Camera,
  Upload,
  Mail,
  Calendar,
} from 'lucide-react';

export type StudentStatus = 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'WITHDRAWN' | 'INACTIVE';

export interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  grade?: string;
  status: StudentStatus;
  isActive: boolean;
  enrollDate: string;
  avatar?: string;
  email?: string;
}

interface ClassRecord {
  id: string;
  name: string;
  capacity: number | null;
  studentCount: number;
}

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-dismiss success alert after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    grade: '',
    status: 'ACTIVE' as StudentStatus,
    avatar: '',
    email: '',
  });

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const res = await api.get('/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setClasses(data);
    } catch (err) {
      console.error('Failed to load available classes:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const queryParam = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/students${queryParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Student[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setStudents(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load students list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingStudent(null);
    setIsClassPickerOpen(false);
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      grade: '',
      status: 'ACTIVE',
      avatar: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsClassPickerOpen(false);
    setFormData({
      firstName: student.firstName,
      middleName: student.middleName || '',
      lastName: student.lastName,
      grade: student.grade || '',
      status: student.status || 'ACTIVE',
      avatar: student.avatar || '',
      email: student.email || '',
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Selected photo exceeds the 5MB size limit.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    const selectedClass = classes.find((classRecord) => classRecord.name === formData.grade);
    const isCurrentClass = editingStudent?.grade === formData.grade;
    if (formData.grade && (!selectedClass || (!isCurrentClass && selectedClass.capacity !== null && selectedClass.studentCount >= selectedClass.capacity))) {
      setError('Select an available class from the class search results.');
      return;
    }

    try {
      if (editingStudent) {
        const res = await api.put(`/students/${editingStudent.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents((prev) => prev.map((s) => (s.id === editingStudent.id ? res.data : s)));
        setSuccess('Student details updated successfully.');
      } else {
        const res = await api.post('/students', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents((prev) => [res.data, ...prev]);
        setSuccess('New student enrolled successfully.');
      }
      setIsModalOpen(false);
      await fetchClasses();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save student record.');
    }
  };

  const availableClasses = classes.filter((classRecord) => {
    const isCurrentClass = editingStudent?.grade === classRecord.name;
    const isFull = classRecord.capacity !== null && classRecord.studentCount >= classRecord.capacity;
    return isCurrentClass || !isFull;
  });

  const matchingClasses = availableClasses.filter((classRecord) =>
    classRecord.name.toLowerCase().includes(formData.grade.toLowerCase())
  );

  const handleSoftDelete = async (studentId: string, studentName: string) => {
    if (
      !confirm(
        `Are you sure you want to deactivate ${studentName}? Their profile will be marked as WITHDRAWN, preserving all historic grades and payment records.`
      )
    ) {
      return;
    }

    setActionLoadingId(studentId);
    setError(null);
    setSuccess(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      await api.delete(`/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: 'WITHDRAWN', isActive: false } : s))
      );
      setSuccess(`${studentName} deactivated successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to deactivate student.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      (student.grade && student.grade.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const getAvatarUrl = (student: Student) => {
    const fullName = `${student.firstName} ${student.lastName}`.trim();
    if (student.avatar && student.avatar.trim() !== '') {
      return student.avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      fullName
    )}&background=6366f1&color=fff&bold=true`;
  };

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'GRADUATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            Graduated
          </span>
        );
      case 'TRANSFERRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
            Transferred
          </span>
        );
      case 'WITHDRAWN':
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Withdrawn
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 font-sans">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 shrink-0" />
            Students Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage student profiles, monitor enrollment status, and maintain active academic records.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchStudents}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Student</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs sm:text-sm rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-600 font-medium w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="GRADUATED">Graduated</option>
              <option value="TRANSFERRED">Transferred</option>
              <option value="WITHDRAWN">Withdrawn / Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 mt-2 font-medium">Loading student directory...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <UserX className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No student records found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No matching students were found for your current search or filter criteria.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile & Tablet Card Layout (screens < 1024px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {filteredStudents.map((student) => {
              const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim();
              const isDeactivating = actionLoadingId === student.id;

              return (
                <div
                  key={student.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getAvatarUrl(student)}
                          alt={fullName}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-50 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              fullName
                            )}&background=6366f1&color=fff`;
                          }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                            {fullName}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Class: {student.grade || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(student.status)}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      {student.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Enrolled: {new Date(student.enrollDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditModal(student)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>

                    {student.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleSoftDelete(student.id, fullName)}
                        disabled={isDeactivating}
                        className="flex-1 px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isDeactivating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserX className="w-3.5 h-3.5" />
                        )}
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout (screens >= 1024px) */}
          <div className="hidden lg:block bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="p-4 pl-6">Student</th>
                    <th className="p-4">Class / Grade</th>
                    <th className="p-4">Enrollment Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim();
                    const isDeactivating = actionLoadingId === student.id;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={getAvatarUrl(student)}
                              alt={fullName}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  fullName
                                )}&background=6366f1&color=fff`;
                              }}
                            />
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{fullName}</p>
                              {student.email ? (
                                <p className="text-xs text-slate-400">{student.email}</p>
                              ) : (
                                <p className="text-xs text-slate-400">ID: {student.id.slice(0, 8)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-700">{student.grade || 'Unassigned'}</td>
                        <td className="p-4 text-slate-500 font-medium">
                          {new Date(student.enrollDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">{getStatusBadge(student.status)}</td>
                        <td className="p-4 pr-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors inline-flex items-center justify-center"
                            title="Edit Student Profile"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {student.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleSoftDelete(student.id, fullName)}
                              disabled={isDeactivating}
                              className="p-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors inline-flex items-center justify-center"
                              title="Deactivate Student (Soft Delete)"
                            >
                              {isDeactivating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <UserX className="w-4 h-4" />
                              )}
                            </button>
                          )}
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

      {/* Responsive Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {editingStudent ? 'Edit Student Record' : 'Enroll New Student'}
                </h3>
                <p className="text-xs text-slate-500">Provide student profile details and photo.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Profile Photo - Direct File Upload from Device */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="block text-xs font-semibold uppercase text-slate-600">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center border border-slate-300 shadow-inner">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            formData.firstName || 'Student'
                          )}&background=6366f1&color=fff`;
                        }}
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose from device</span>
                      </button>

                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                          className="px-3 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Upload JPG, PNG, or WEBP from your phone camera, gallery, or computer (max 5MB).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@school.edu"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Assign Class
                  </label>
                  <input
                    type="text"
                    placeholder={classes.length ? 'Search available classes...' : 'No classes created yet'}
                    value={formData.grade}
                    onFocus={() => setIsClassPickerOpen(true)}
                    onChange={(e) => {
                      setFormData({ ...formData, grade: e.target.value });
                      setIsClassPickerOpen(true);
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {isClassPickerOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1">
                      {matchingClasses.length > 0 ? (
                        matchingClasses.map((classRecord) => {
                          const remaining = classRecord.capacity === null
                            ? null
                            : Math.max(0, classRecord.capacity - classRecord.studentCount);
                          return (
                            <button
                              key={classRecord.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setFormData({ ...formData, grade: classRecord.name });
                                setIsClassPickerOpen(false);
                              }}
                              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-indigo-50 transition-colors"
                            >
                              <span className="text-xs font-semibold text-slate-800 truncate">{classRecord.name}</span>
                              <span className="text-[11px] text-slate-500 shrink-0">
                                {remaining === null ? 'Open capacity' : `${remaining} seat${remaining === 1 ? '' : 's'} left`}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-3 text-xs text-slate-500">
                          {classes.length === 0 ? 'Create a class first.' : 'No available classes match your search.'}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Full classes are hidden from new assignments.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as StudentStatus })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="GRADUATED">GRADUATED</option>
                    <option value="TRANSFERRED">TRANSFERRED</option>
                    <option value="WITHDRAWN">WITHDRAWN</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {editingStudent ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}