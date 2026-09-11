'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  Loader2,
  ArrowRight,
  Check,
  Search,
} from 'lucide-react';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface ClassItem {
  id: string;
  name: string;
}

interface StudentAttendance {
  id: string;
  name: string;
  studentId: string;
  className: string;
  status: AttendanceStatus;
  notes?: string;
}

export default function MarkAttendancePage() {
  const router = useRouter();

  // Dynamic API State
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSession, setTimeSession] = useState('08:30 AM - Morning Session');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1. Fetch created classes from API on mount
  useEffect(() => {
    const fetchClasses = async () => {
      setLoadingClasses(true);
      setError(null);
      const token = Cookies.get('token') || localStorage.getItem('token');

      try {
        const res = await api.get('/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const classData: ClassItem[] = res.data?.data || res.data || [];
        setClasses(classData);

        if (classData.length > 0) {
          setSelectedClass(classData[0].name || classData[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load classes:', err);
        setError(err.response?.data?.error || 'Failed to fetch class list from server.');
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  // 2. Fetch students belonging to the selected class
  useEffect(() => {
    if (!selectedClass) return;

    const fetchStudentsForClass = async () => {
      setLoadingStudents(true);
      setError(null);
      const token = Cookies.get('token') || localStorage.getItem('token');

      try {
        const res = await api.get(`/students?class=${encodeURIComponent(selectedClass)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const studentData = res.data?.data || res.data || [];
        
        // Map backend response into Attendance format
        const formattedStudents: StudentAttendance[] = studentData.map((s: any) => ({
          id: s.id,
          name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          studentId: s.studentId || s.id,
          className: s.grade || selectedClass,
          status: 'PRESENT',
        }));

        setStudents(formattedStudents);
      } catch (err: any) {
        console.error('Failed to load class roster:', err);
        setError(err.response?.data?.error || 'Failed to fetch students for this class.');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudentsForClass();
  }, [selectedClass]);

  // Status updates
  const handleStatusChange = (id: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) => (student.id === id ? { ...student, status } : student))
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      setError('Please select a valid class first.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      await api.post(
        '/attendance/bulk',
        {
          className: selectedClass,
          date,
          timeSession,
          records: students.map((s) => ({
            studentId: s.id,
            status: s.status,
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMsg('Attendance marked and recorded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save attendance record.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            Mark Class Attendance
          </h1>
          <p className="text-sm text-slate-500">
            Select date, time, and record student presence for the session.
          </p>
        </div>

        {successMsg && (
          <button
            onClick={() => router.push('/dashboard/admin/assignments')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all animate-bounce"
          >
            Proceed to Assignments
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Control Panel: Date, Time, Dynamic Class Picker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dynamic Class Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Select Class
          </label>
          <div className="relative">
            <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loadingClasses}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50"
            >
              {loadingClasses ? (
                <option value="">Loading classes...</option>
              ) : classes.length === 0 ? (
                <option value="">No classes found</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.name || cls.id}>
                    {cls.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Attendance Date
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Time / Session Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Time / Session
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={timeSession}
              onChange={(e) => setTimeSession(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="08:30 AM - Morning Session">08:30 AM - Morning Session</option>
              <option value="11:30 AM - Midday Session">11:30 AM - Midday Session</option>
              <option value="02:00 PM - Afternoon Session">02:00 PM - Afternoon Session</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 uppercase">Present</p>
            <p className="text-2xl font-bold text-emerald-700">{presentCount}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-800 uppercase">Absent</p>
            <p className="text-2xl font-bold text-rose-700">{absentCount}</p>
          </div>
          <XCircle className="w-8 h-8 text-rose-500 opacity-80" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-800 uppercase">Late</p>
            <p className="text-2xl font-bold text-amber-700">{lateCount}</p>
          </div>
          <Clock3 className="w-8 h-8 text-amber-500 opacity-80" />
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-xl text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/admin/assignments')}
            className="text-xs font-bold underline hover:text-emerald-900"
          >
            Next: Manage Assignments →
          </button>
        </div>
      )}

      {/* Student List & Status Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium mr-1">Quick Mark:</span>
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              className="px-2.5 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-semibold rounded-lg transition-colors"
            >
              All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="px-2.5 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-semibold rounded-lg transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>

        {/* Roster Table */}
        <form onSubmit={handleSubmit}>
          {loadingStudents ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-medium">Loading class roster...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700 text-sm">No students found in this class</p>
              <p className="text-xs">Add students to {selectedClass || 'this class'} to record attendance.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider bg-slate-50">
                  <th className="p-4">Student</th>
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Assigned Class</th>
                  <th className="p-4 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {student.name.charAt(0)}
                      </div>
                      {student.name}
                    </td>
                    <td className="p-4 text-slate-500 text-xs">{student.studentId}</td>
                    <td className="p-4 text-slate-600 text-xs font-medium">{student.className}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'PRESENT')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'ABSENT')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            student.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'LATE')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            student.status === 'LATE'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                          }`}
                        >
                          <Clock3 className="w-3.5 h-3.5" />
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Session: <span className="font-semibold text-slate-700">{selectedClass || 'N/A'} ({date})</span>
            </p>

            <button
              type="submit"
              disabled={submitting || students.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4" />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}