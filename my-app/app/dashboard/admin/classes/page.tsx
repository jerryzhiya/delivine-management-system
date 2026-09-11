'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  BookMarked,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  UserRound,
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject?: string;
}

interface ClassRecord {
  id: string;
  name: string;
  capacity: number | null;
  studentCount: number;
  teacher?: Teacher | null;
}

interface ClassForm {
  name: string;
  teacherId: string;
  capacity: string;
}

const emptyForm: ClassForm = { name: '', teacherId: '', capacity: '30' };

const getToken = () => Cookies.get('token') || localStorage.getItem('token');

const getList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? data as T[] : [];
  }
  return [];
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null);
  const [formData, setFormData] = useState<ClassForm>(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const headers = { Authorization: `Bearer ${getToken()}` };

    try {
      const [classResponse, teacherResponse] = await Promise.all([
        api.get('/classes', { headers }),
        api.get('/teachers', { headers }),
      ]);
      setClasses(getList<ClassRecord>(classResponse.data));
      setTeachers(getList<Teacher>(teacherResponse.data));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load classes and teachers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3500);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return classes;
    return classes.filter((classRecord) =>
      classRecord.name.toLowerCase().includes(query) ||
      classRecord.teacher?.name.toLowerCase().includes(query)
    );
  }, [classes, searchQuery]);

  const totalStudents = classes.reduce((sum, classRecord) => sum + (classRecord.studentCount || 0), 0);
  const totalCapacity = classes.reduce((sum, classRecord) => sum + (classRecord.capacity || 0), 0);
  const assignedClasses = classes.filter((classRecord) => classRecord.teacher).length;

  const openCreateModal = () => {
    setEditingClass(null);
    setFormData(emptyForm);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (classRecord: ClassRecord) => {
    setEditingClass(classRecord);
    setFormData({
      name: classRecord.name,
      teacherId: classRecord.teacher?.id || '',
      capacity: String(classRecord.capacity || 30),
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const headers = { Authorization: `Bearer ${getToken()}` };
    const payload = {
      name: formData.name.trim(),
      teacherId: formData.teacherId || null,
      capacity: Number(formData.capacity),
    };

    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, payload, { headers });
        setSuccess('Class updated successfully.');
      } else {
        await api.post('/classes', payload, { headers });
        setSuccess('Class created successfully.');
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (classRecord: ClassRecord) => {
    if (!confirm(`Delete ${classRecord.name}? This cannot be undone.`)) return;
    setDeletingId(classRecord.id);
    setError(null);

    try {
      await api.delete(`/classes/${classRecord.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setClasses((previous) => previous.filter((item) => item.id !== classRecord.id));
      setSuccess(`${classRecord.name} deleted successfully.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete class.');
    } finally {
      setDeletingId(null);
    }
  };

  const getOccupancy = (classRecord: ClassRecord) => {
    const capacity = classRecord.capacity || 0;
    return capacity > 0 ? Math.min(100, Math.round((classRecord.studentCount / capacity) * 100)) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <BookMarked className="w-7 h-7 text-indigo-600" />
            Classes
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create classes, assign teachers, and monitor enrollment capacity.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={fetchData} className="flex-1 sm:flex-none px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={openCreateModal} className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Create Class
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-sm flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />{success}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Metric label="Total Classes" value={classes.length} />
        <Metric label="Enrolled Students" value={totalStudents} accent="indigo" />
        <Metric label="Total Capacity" value={totalCapacity} />
        <Metric label="Teacher Assigned" value={`${assignedClasses} / ${classes.length}`} accent="emerald" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by class or teacher..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl py-20 flex flex-col items-center text-slate-500"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /><p className="text-sm mt-2">Loading classes...</p></div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl py-16 text-center"><BookMarked className="w-10 h-10 text-slate-300 mx-auto" /><h2 className="font-bold text-slate-800 mt-3">No classes found</h2><p className="text-sm text-slate-500 mt-1">Create your first class to start organizing students.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.map((classRecord) => {
            const occupancy = getOccupancy(classRecord);
            const isFull = classRecord.capacity !== null && classRecord.studentCount >= (classRecord.capacity || 0);
            return (
              <div key={classRecord.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-lg font-bold text-slate-900 truncate">{classRecord.name}</p><p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><UserRound className="w-3.5 h-3.5" />{classRecord.teacher?.name || 'Teacher unassigned'}</p></div>
                  <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${isFull ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{isFull ? 'Full' : 'Open'}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Students</p><p className="text-xl font-extrabold text-slate-900 mt-1">{classRecord.studentCount}<span className="text-xs text-slate-400 font-medium"> / {classRecord.capacity || '—'}</span></p></div>
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Available</p><p className="text-xl font-extrabold text-slate-900 mt-1">{classRecord.capacity === null ? '—' : Math.max(0, classRecord.capacity - classRecord.studentCount)}</p></div>
                </div>
                <div className="mt-4"><div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5"><span>Capacity used</span><span>{occupancy}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isFull ? 'bg-rose-500' : occupancy > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${occupancy}%` }} /></div></div>
                <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100"><button onClick={() => openEditModal(classRecord)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Edit</button><button onClick={() => handleDelete(classRecord)} disabled={deletingId === classRecord.id} className="p-2 border border-rose-200 rounded-xl text-rose-600 hover:bg-rose-50 disabled:opacity-50" aria-label={`Delete ${classRecord.name}`}><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><h2 className="text-lg font-bold text-slate-900">{editingClass ? 'Edit Class' : 'Create Class'}</h2><p className="text-xs text-slate-500 mt-1">Set the class capacity and assign its teacher.</p></div><button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSave} className="space-y-4 mt-5">
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Class name</label><input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} placeholder="e.g. Grade 10-A" className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Assign teacher</label><select value={formData.teacherId} onChange={(event) => setFormData({ ...formData, teacherId: event.target.value })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"><option value="">Leave unassigned</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}{teacher.subject ? ` · ${teacher.subject}` : ''}</option>)}</select>{teachers.length === 0 && <p className="text-xs text-amber-600 mt-1.5">No teacher profiles are available yet.</p>}</div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Student capacity</label><input required min="1" type="number" value={formData.capacity} onChange={(event) => setFormData({ ...formData, capacity: event.target.value })} className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-slate-100"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl">Cancel</button><button disabled={submitting} type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50">{submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{editingClass ? 'Save Changes' : 'Create Class'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent = 'slate' }: { label: string; value: string | number; accent?: 'slate' | 'indigo' | 'emerald' }) {
  const valueColor = accent === 'indigo' ? 'text-indigo-600' : accent === 'emerald' ? 'text-emerald-600' : 'text-slate-900';
  return <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">{label}</p><p className={`text-2xl font-extrabold mt-1 ${valueColor}`}>{value}</p></div>;
}
