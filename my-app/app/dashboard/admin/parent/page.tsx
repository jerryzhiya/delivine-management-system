'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  Users,
  User,
  Plus,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Link as LinkIcon,
  Unlink,
  Edit3,
  Trash2,
  RefreshCw,
  Camera,
  HeartHandshake,
  Filter,
} from 'lucide-react';

type ParentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade?: string;
}

interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  relationship?: string | null;
  address?: string | null;
  status: ParentStatus;
  studentIds?: string[];
  students?: Student[];
}

const toArray = <T,>(payload: any): T[] => {
  const data = payload?.data ?? payload;
  return Array.isArray(data) ? data : [];
};

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [selectedParentForChildren, setSelectedParentForChildren] = useState<Parent | null>(null);

  // Search & Form States
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [studentToLink, setStudentToLink] = useState('');
  const [linkingStudent, setLinkingStudent] = useState(false);
  const [formStudentSearch, setFormStudentSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: 'Father',
    address: '',
    avatar: '',
    status: 'ACTIVE' as ParentStatus,
    studentIds: [] as string[],
  });

  useEffect(() => {
    fetchParents();
    fetchAllStudents();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchParents = async () => {
    setLoading(true);
    setError(null);
    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const res = await api.get('/parents', { headers: { Authorization: `Bearer ${token}` } });
      setParents(toArray<Parent>(res.data));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch parents.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const res = await api.get('/students', { headers: { Authorization: `Bearer ${token}` } });
      setAllStudents(toArray<Student>(res.data));
    } catch {
      // Background fetch error ignored
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

  const handleOpenCreate = () => {
    setEditingParent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      relationship: 'Father',
      address: '',
      avatar: '',
      status: 'ACTIVE',
      studentIds: [],
    });
    setFormStudentSearch('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (parent: Parent) => {
    setEditingParent(parent);
    setFormData({
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      relationship: parent.relationship || 'Guardian',
      address: parent.address || '',
      avatar: parent.avatar || '',
      status: parent.status || 'ACTIVE',
      studentIds: parent.students?.map((s) => s.id) || parent.studentIds || [],
    });
    setFormStudentSearch('');
    setIsCreateModalOpen(true);
  };

  const toggleStudentInForm = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const handleSubmitParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editingParent) {
        const res = await api.put(`/parents/${editingParent.id}`, formData, { headers });
        const updated = res.data?.data || res.data;
        setParents((prev) => prev.map((p) => (p.id === editingParent.id ? { ...p, ...updated } : p)));
        setSuccess(`Updated parent record for "${formData.name}".`);
      } else {
        const res = await api.post('/parents', formData, { headers });
        const created = res.data?.data || res.data;
        setParents((prev) => [created, ...prev]);
        setSuccess(`Created parent record for "${formData.name}".`);
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteParent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      await api.delete(`/parents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setParents((prev) => prev.filter((p) => p.id !== id));
      setSuccess(`Parent "${name}" deleted.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete parent.');
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentForChildren || !studentToLink) return;

    setLinkingStudent(true);
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      const res = await api.post(
        `/parents/${selectedParentForChildren.id}/link-student`,
        { studentId: studentToLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedParent = res.data?.data || res.data;
      setParents((prev) => prev.map((p) => (p.id === updatedParent.id ? updatedParent : p)));
      setSelectedParentForChildren(updatedParent);
      setStudentToLink('');
      setStudentSearchQuery('');
      setSuccess('Student linked successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to link student.');
    } finally {
      setLinkingStudent(false);
    }
  };

  const handleUnlinkStudent = async (studentId: string) => {
    if (!selectedParentForChildren) return;
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      const res = await api.delete(
        `/parents/${selectedParentForChildren.id}/unlink-student/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedParent = res.data?.data || res.data;
      setParents((prev) => prev.map((p) => (p.id === updatedParent.id ? updatedParent : p)));
      setSelectedParentForChildren(updatedParent);
      setSuccess('Student unlinked successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to unlink student.');
    }
  };

  const renderStatusBadge = (status: ParentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Deactivated
          </span>
        );
      case 'GRADUATED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            <GraduationCap className="w-3 h-3 text-indigo-600" />
            Graduated
          </span>
        );
    }
  };

  const filteredParents = parents.filter((p) => {
    const matchesQuery =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const filteredStudentsToLink = allStudents.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.grade || ''}`
      .toLowerCase()
      .includes(studentSearchQuery.toLowerCase())
  );

  const filteredStudentsForForm = allStudents.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.grade || ''}`
      .toLowerCase()
      .includes(formStudentSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            Parents & Guardians Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage guardian profiles, statuses, photos, and linked student accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchParents}
            className="flex-1 sm:flex-initial px-3 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Parent
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl text-xs sm:text-sm bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-between">
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
        <div className="p-3.5 rounded-xl text-xs sm:text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Status Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
            <option value="GRADUATED">Graduated Only</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2 font-medium">Loading parents database...</p>
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
          No parent profiles found matching your search and filter criteria.
        </div>
      ) : (
        <>
          {/* Mobile View (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredParents.map((parent) => (
              <div key={parent.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {parent.avatar ? (
                      <img
                        src={parent.avatar}
                        alt={parent.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                        {parent.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{parent.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {parent.relationship || 'Guardian'}
                        </span>
                        {renderStatusBadge(parent.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(parent)} className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteParent(parent.id, parent.name)} className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{parent.email}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{parent.phone}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedParentForChildren(parent);
                      setStudentSearchQuery('');
                      setStudentToLink('');
                      setIsStudentDropdownOpen(false);
                    }}
                    className="w-full px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Children ({parent.students?.length || 0})
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (>= 768px) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="p-4">Parent Profile</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Relationship</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Linked Children</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParents.map((parent) => (
                    <tr key={parent.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          {parent.avatar ? (
                            <img src={parent.avatar} alt={parent.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                              {parent.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900">{parent.name}</span>
                            {parent.address && <p className="text-[11px] font-normal text-slate-400 truncate max-w-[180px]">{parent.address}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-600">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{parent.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{parent.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {parent.relationship || 'Guardian'}
                        </span>
                      </td>

                      <td className="p-4">{renderStatusBadge(parent.status)}</td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedParentForChildren(parent);
                            setStudentSearchQuery('');
                            setStudentToLink('');
                            setIsStudentDropdownOpen(false);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>{parent.students?.length || 0} Linked</span>
                        </button>
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            onClick={() => {
                              setSelectedParentForChildren(parent);
                              setStudentSearchQuery('');
                              setStudentToLink('');
                              setIsStudentDropdownOpen(false);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Manage Children"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(parent)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Parent"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteParent(parent.id, parent.name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Delete Parent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal 1: Create / Edit Parent */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingParent ? 'Edit Parent Profile' : 'Register New Parent'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitParent} className="space-y-3.5">
              {/* Profile Image */}
              <div className="flex flex-col items-center justify-center space-y-2 pb-2">
                <div className="relative group">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center text-indigo-600">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px] font-semibold mt-1">Upload</span>
                    </div>
                  )}

                  <label htmlFor="avatar-upload" className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-semibold">
                    Change
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                {formData.avatar && (
                  <button type="button" onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))} className="text-[11px] text-rose-500 hover:underline">
                    Remove Photo
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Relationship</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ParentStatus })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Deactivated</option>
                    <option value="GRADUATED">Graduated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 123 Main St, Springfield"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Multi-Student Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Link Children ({formData.studentIds.length} Selected)
                </label>
                <div className="p-2.5 border border-slate-200 rounded-xl space-y-2 bg-slate-50 max-h-36 overflow-y-auto">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter students..."
                      value={formStudentSearch}
                      onChange={(e) => setFormStudentSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>
                  {filteredStudentsForForm.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-1">No students found</p>
                  ) : (
                    filteredStudentsForForm.map((st) => {
                      const selected = formData.studentIds.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => toggleStudentInForm(st.id)}
                          className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            selected ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <span>{st.firstName} {st.lastName} {st.grade ? `(${st.grade})` : ''}</span>
                          <input type="checkbox" checked={selected} onChange={() => {}} className="rounded text-indigo-600 focus:ring-indigo-500" />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingParent ? 'Save Changes' : 'Create Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Linked Children & Link Student Handler */}
      {selectedParentForChildren && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl p-4 sm:p-6 space-y-4 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                {selectedParentForChildren.avatar ? (
                  <img src={selectedParentForChildren.avatar} alt={selectedParentForChildren.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">{selectedParentForChildren.name}'s Children</h3>
                  <p className="text-xs text-slate-500">{selectedParentForChildren.relationship || 'Guardian'} — {selectedParentForChildren.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedParentForChildren(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkStudent} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 shrink-0">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Link Additional Student to this Parent
              </label>

              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                  <input
                    type="text"
                    placeholder="Search student by name or grade..."
                    value={studentSearchQuery}
                    onFocus={() => setIsStudentDropdownOpen(true)}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      setStudentToLink('');
                      setIsStudentDropdownOpen(true);
                    }}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  {studentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSearchQuery('');
                        setStudentToLink('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isStudentDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 divide-y divide-slate-100">
                      {filteredStudentsToLink.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">No students found</div>
                      ) : (
                        filteredStudentsToLink.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              setStudentToLink(st.id);
                              setStudentSearchQuery(`${st.firstName} ${st.lastName}${st.grade ? ` (${st.grade})` : ''}`);
                              setIsStudentDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between transition-colors ${
                              studentToLink === st.id ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700'
                            }`}
                          >
                            <span>{st.firstName} {st.lastName}</span>
                            {st.grade && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{st.grade}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!studentToLink || linkingStudent}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {linkingStudent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                  Link
                </button>
              </div>
            </form>

            <div className="overflow-y-auto flex-1 pr-1 space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Currently Linked Students ({selectedParentForChildren.students?.length || 0})
              </h4>

              {!selectedParentForChildren.students || selectedParentForChildren.students.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No children currently linked to this parent profile.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedParentForChildren.students.map((st) => (
                    <div key={st.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {st.firstName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{st.firstName} {st.lastName}</h5>
                          {st.grade && <p className="text-[11px] text-slate-500 truncate">Grade: {st.grade}</p>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnlinkStudent(st.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs flex items-center gap-1 transition-colors shrink-0"
                        title="Unlink Student"
                      >
                        <Unlink className="w-4 h-4" />
                        <span className="hidden sm:inline">Unlink</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedParentForChildren(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}