'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  BookOpen,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Award,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react';

interface GradeRecord {
  id: string;
  subject: string;
  ca1?: number;
  ca2?: number;
  exam?: number;
  total?: number;
  grade?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

interface PaymentRecord {
  id: string;
  title: string;
  amount: number;
  amountPaid: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade?: string;
  gradeRecords?: GradeRecord[];
  attendance?: AttendanceRecord[];
  payments?: PaymentRecord[];
}

interface ParentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  students: Student[];
}

export default function ParentPortalPage() {
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'grades' | 'attendance' | 'payments'>('grades');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParentDetails();
  }, []);

  const fetchParentDetails = async () => {
    setLoading(true);
    setError(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    let rawId = localStorage.getItem('parentId') || Cookies.get('parentId');

    if (rawId) {
      rawId = rawId.replace(/\.\d+$/, '').trim();
    }

    const isValidId = /^[0-9a-fA-F]{24}$/.test(rawId || '');
    const endpointId = isValidId ? rawId : 'me';
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await api.get(`/parents/${endpointId}`, { headers });
      const data: ParentProfile = res.data?.data || res.data;

      setParent(data);
      if (data?.students?.length > 0) {
        setSelectedStudent(data.students[0]);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          'Failed to load student records. Please ensure parent profile is active.'
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceStats = (records?: AttendanceRecord[]) => {
    if (!records || records.length === 0) return { present: 0, absent: 0, late: 0, rate: 0 };
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const rate = Math.round(((present + late) / records.length) * 100);
    return { present, absent, late, rate };
  };

  const calculateFeeSummary = (payments?: PaymentRecord[]) => {
    if (!payments || payments.length === 0) return { total: 0, paid: 0, balance: 0 };
    const total = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const paid = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
    return { total, paid, balance: total - paid };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading child records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider bg-indigo-800/60 px-2.5 py-1 rounded-md inline-block">
              Parent Portal
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">Welcome, {parent?.name || 'Guardian'}</h1>
            <div className="flex flex-wrap gap-4 text-xs text-indigo-200 pt-1">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {parent?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {parent?.phone}
              </span>
            </div>
          </div>

          <button
            onClick={fetchParentDetails}
            className="w-fit border border-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Portal
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs sm:text-sm bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Linked Students ({parent?.students?.length || 0})
        </h2>

        {!parent?.students || parent.students.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
            No children currently linked to your parent account. Please contact the school admin.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {parent.students.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {student.firstName?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className={`text-xs truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {student.grade ? `Grade: ${student.grade}` : 'Student Profile'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('grades')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 ${
                activeTab === 'grades' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" /> Academic Results
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 ${
                activeTab === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" /> Attendance
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 ${
                activeTab === 'payments' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Fees & Payments
            </button>
          </div>

          {activeTab === 'grades' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Academic Results
              </h3>
              {!selectedStudent.gradeRecords?.length ? (
                <div className="p-8 text-center text-slate-400 text-xs sm:text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No academic grade records released yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
                        <th className="p-3.5">Subject</th>
                        <th className="p-3.5 text-center">1st CA (20)</th>
                        <th className="p-3.5 text-center">2nd CA (20)</th>
                        <th className="p-3.5 text-center">Exam (60)</th>
                        <th className="p-3.5 text-center">Total (100)</th>
                        <th className="p-3.5 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudent.gradeRecords.map((r) => {
                        const total = r.total ?? (r.ca1 || 0) + (r.ca2 || 0) + (r.exam || 0);
                        return (
                          <tr key={r.id}>
                            <td className="p-3.5 font-bold text-slate-900">{r.subject}</td>
                            <td className="p-3.5 text-center">{r.ca1 ?? '-'}</td>
                            <td className="p-3.5 text-center">{r.ca2 ?? '-'}</td>
                            <td className="p-3.5 text-center">{r.exam ?? '-'}</td>
                            <td className="p-3.5 text-center font-bold text-indigo-600">{total}</td>
                            <td className="p-3.5 text-right font-bold">
                              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs">
                                {r.grade || (total >= 70 ? 'A' : total >= 60 ? 'B' : 'C')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {(() => {
                const stats = calculateAttendanceStats(selectedStudent.attendance);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs text-slate-500">Overall Rate</span>
                      <p className="text-xl font-bold text-indigo-600">{stats.rate}%</p>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-1">
                      <span className="text-xs text-emerald-700">Days Present</span>
                      <p className="text-xl font-bold text-emerald-700">{stats.present}</p>
                    </div>
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-1">
                      <span className="text-xs text-amber-700">Times Late</span>
                      <p className="text-xl font-bold text-amber-700">{stats.late}</p>
                    </div>
                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-1">
                      <p className="text-xs text-rose-700">Days Absent</p>
                      <p className="text-xl font-bold text-rose-700">{stats.absent}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              {(() => {
                const fee = calculateFeeSummary(selectedStudent.payments);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs text-slate-500">Total Billed</span>
                      <p className="text-xl font-bold text-slate-900">${fee.total.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-1">
                      <span className="text-xs text-emerald-700">Amount Paid</span>
                      <p className="text-xl font-bold text-emerald-700">${fee.paid.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-1">
                      <span className="text-xs text-rose-700">Balance</span>
                      <p className="text-xl font-bold text-rose-700">${fee.balance.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}