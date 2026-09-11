'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  GraduationCap,
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  BookOpen,
  Award,
  Calculator,
  UserCheck,
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  grade?: string;
}

interface ClassItem {
  id: string;
  name: string;
  capacity?: number | null;
  studentCount?: number;
}

interface GradeRecord {
  id: string;
  studentId: string;
  student?: Student;
  subject: string;
  ca1?: number;
  ca2?: number;
  ca3?: number;
  exam?: number;
  score: number;
  grade: string;
  term: string;
  remark?: string;
  createdAt?: string;
}

const toArray = <T,>(payload: any): T[] => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  return [];
};

const normalizeClassName = (value?: string) =>
  (value || '').trim().replace(/\s+/g, ' ').toLowerCase();

// Auto grade letter calculator matching backend logic
const calculateGradeLetter = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const getGradeBadgeColor = (grade: string) => {
  switch (grade?.toUpperCase()) {
    case 'A':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'B':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'C':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'D':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    default:
      return 'bg-rose-50 text-rose-700 border-rose-200';
  }
};

export default function GradeRecordsPage() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTermFilter, setSelectedTermFilter] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [formClass, setFormClass] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    subject: '',
    term: '1st Term',
    ca1: '',
    ca2: '',
    ca3: '',
    exam: '',
    remark: '',
  });

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
    if (!isModalOpen || !formClass) {
      setClassStudents([]);
      return;
    }

    const fetchStudentsForClass = async () => {
      setLoadingClassStudents(true);
      const token = Cookies.get('token') || localStorage.getItem('token');

      try {
        const response = await api.get(`/students?class=${encodeURIComponent(formClass)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const selectedStudents = toArray<Student>(response.data);
        setClassStudents(selectedStudents);
        setFormData((previous) => ({
          ...previous,
          studentId: selectedStudents.some((student) => student.id === previous.studentId)
            ? previous.studentId
            : selectedStudents[0]?.id || '',
        }));
      } catch (err) {
        console.error('Failed to load students for selected class:', err);
        setClassStudents([]);
      } finally {
        setLoadingClassStudents(false);
      }
    };

    fetchStudentsForClass();
  }, [formClass, isModalOpen]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [gradesRes, studentsRes] = await Promise.allSettled([
        api.get('/grades', { headers }),
        api.get('/students', { headers }),
      ]);

      const classesRes = await api.get('/classes', { headers });

      if (gradesRes.status === 'fulfilled') {
        setGrades(toArray<GradeRecord>(gradesRes.value.data));
      } else {
        setError('Failed to fetch grade records.');
      }

      if (studentsRes.status === 'fulfilled') {
        setStudents(toArray<Student>(studentsRes.value.data));
      }
      setClasses(toArray<ClassItem>(classesRes.data));
    } catch (err: any) {
      setError('Error loading grade management system.');
    } finally {
      setLoading(false);
    }
  };

  // Calculated score totals for modal preview
  const parsedCa1 = Math.min(15, Math.max(0, parseFloat(formData.ca1) || 0));
  const parsedCa2 = Math.min(15, Math.max(0, parseFloat(formData.ca2) || 0));
  const parsedCa3 = Math.min(10, Math.max(0, parseFloat(formData.ca3) || 0));
  const parsedExam = Math.min(60, Math.max(0, parseFloat(formData.exam) || 0));
  const computedTotalScore = Math.min(100, parsedCa1 + parsedCa2 + parsedCa3 + parsedExam);
  const computedGradeLetter = calculateGradeLetter(computedTotalScore);

  const openCreateModal = () => {
    setEditingGrade(null);
    const initialClass = selectedClassFilter !== 'ALL' ? selectedClassFilter : classes[0]?.name || '';
    const classStudents = students.filter((student) => normalizeClassName(student.grade) === normalizeClassName(initialClass));
    setFormClass(initialClass);
    setFormData({
      studentId: classStudents[0]?.id || '',
      subject: '',
      term: '1st Term',
      ca1: '',
      ca2: '',
      ca3: '',
      exam: '',
      remark: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (grade: GradeRecord) => {
    setEditingGrade(grade);
    setFormClass(grade.student?.grade || '');
    setFormData({
      studentId: grade.studentId || grade.student?.id || '',
      subject: grade.subject || '',
      term: grade.term || '1st Term',
      ca1: grade.ca1 !== undefined ? String(grade.ca1) : '',
      ca2: grade.ca2 !== undefined ? String(grade.ca2) : '',
      ca3: grade.ca3 !== undefined ? String(grade.ca3) : '',
      exam: grade.exam !== undefined ? String(grade.exam) : '',
      remark: grade.remark || '',
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

    const payload = {
      studentId: formData.studentId,
      subject: formData.subject.trim(),
      score: computedTotalScore,
      grade: computedGradeLetter,
      term: formData.term,
      remark: formData.remark.trim() || getDefaultRemark(computedGradeLetter),
      ca1: parsedCa1,
      ca2: parsedCa2,
      ca3: parsedCa3,
      exam: parsedExam,
    };

    try {
      if (editingGrade) {
        await api.put(`/grades/${editingGrade.id}`, payload, { headers });
        setSuccess('Grade record updated successfully.');
      } else {
        await api.post('/grades', payload, { headers });
        setSuccess('New assessment grade recorded successfully.');
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save grade record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grade record?')) return;

    setDeletingId(id);
    setError(null);
    setSuccess(null);
    const token = Cookies.get('token') || localStorage.getItem('token');

    try {
      await api.delete(`/grades/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Grade record deleted successfully.');
      setGrades((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete grade record.');
    } finally {
      setDeletingId(null);
    }
  };

  const getDefaultRemark = (grade: string) => {
    switch (grade) {
      case 'A': return 'Excellent Performance';
      case 'B': return 'Very Good';
      case 'C': return 'Good Effort';
      case 'D': return 'Fair / Pass';
      default: return 'Needs Improvement';
    }
  };

  const safeGrades = Array.isArray(grades) ? grades : [];

  const filteredGrades = safeGrades.filter((g) => {
    const studentName = `${g.student?.firstName || ''} ${g.student?.lastName || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      studentName.includes(query) ||
      g.subject?.toLowerCase().includes(query) ||
      g.grade?.toLowerCase().includes(query);

    const matchesTerm = selectedTermFilter === 'ALL' || g.term === selectedTermFilter;
    const matchesClass = selectedClassFilter === 'ALL' || normalizeClassName(g.student?.grade) === normalizeClassName(selectedClassFilter);

    return matchesSearch && matchesTerm && matchesClass;
  });

  const formStudents = classStudents.length > 0
    ? classStudents
    : students.filter((student) => normalizeClassName(student.grade) === normalizeClassName(formClass));

  // Calculate Metrics
  const totalRecords = safeGrades.length;
  const avgScore = totalRecords > 0
    ? (safeGrades.reduce((sum, g) => sum + (g.score || 0), 0) / totalRecords).toFixed(1)
    : '0';
  const topPerformersCount = safeGrades.filter((g) => g.grade === 'A' || g.grade === 'B').length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
            Student Grade Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Record, update, and compute 1st CA, 2nd CA, 3rd CA, and Examination scores.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchInitialData}
            className="flex-1 sm:flex-initial px-3 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Grade
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Records</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{totalRecords}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Average Score</p>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-1">{avgScore}%</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Top Grades (A & B)</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">{topPerformersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Banners */}
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

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, subject, or grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium shrink-0">Class:</label>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
          >
            <option value="ALL">All Classes</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.name}>{classItem.name}</option>
            ))}
          </select>
          <label className="text-xs text-slate-500 font-medium shrink-0">Term:</label>
          <select
            value={selectedTermFilter}
            onChange={(e) => setSelectedTermFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
          >
            <option value="ALL">All Terms</option>
            <option value="1st Term">1st Term</option>
            <option value="2nd Term">2nd Term</option>
            <option value="3rd Term">3rd Term</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2 font-medium">Fetching grade records...</p>
        </div>
      ) : filteredGrades.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
          No assessment records found. Click "Record Grade" to log new student scores.
        </div>
      ) : (
        <>
          {/* Mobile View (< 768px) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredGrades.map((g) => {
              const isDeletingThis = deletingId === g.id;
              const studentName = g.student
                ? `${g.student.firstName} ${g.student.middleName || ''} ${g.student.lastName}`.trim()
                : 'Student Record';

              return (
                <div key={g.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{studentName}</h3>
                      <p className="text-xs text-indigo-600 font-medium mt-0.5">{g.subject} • {g.term}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{g.student?.grade || 'Unassigned'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getGradeBadgeColor(g.grade)}`}>
                      Grade {g.grade}
                    </span>
                  </div>

                  {/* Scores Grid */}
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-50 rounded-xl text-center text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">1st CA</span>
                      <span className="font-bold text-slate-700">{g.ca1 ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">2nd CA</span>
                      <span className="font-bold text-slate-700">{g.ca2 ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">3rd CA</span>
                      <span className="font-bold text-slate-700">{g.ca3 ?? '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Exam</span>
                      <span className="font-bold text-slate-700">{g.exam ?? '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Total Score: <strong className="text-slate-900">{g.score}/100</strong></span>
                    {g.remark && <span className="text-slate-400 italic text-[11px] truncate max-w-37.5">{g.remark}</span>}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(g)}
                      className="flex-1 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
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
                    <th className="p-4">Student</th>
                    <th className="p-4">Subject & Term</th>
                    <th className="p-4 text-center">1st CA (15)</th>
                    <th className="p-4 text-center">2nd CA (15)</th>
                    <th className="p-4 text-center">3rd CA (10)</th>
                    <th className="p-4 text-center">Exam (60)</th>
                    <th className="p-4 text-center">Total (100)</th>
                    <th className="p-4 text-center">Grade</th>
                    <th className="p-4">Remark</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGrades.map((g) => {
                    const isDeletingThis = deletingId === g.id;
                    const studentName = g.student
                      ? `${g.student.firstName} ${g.student.middleName || ''} ${g.student.lastName}`.trim()
                      : 'Unknown Student';

                    return (
                      <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-900">{studentName}</span>
                          </div>
                          <span className="block text-[11px] text-slate-400 ml-10">{g.student?.grade || 'Unassigned'}</span>
                        </td>
                        <td className="p-4 text-slate-700">
                          <div className="font-medium text-slate-900">{g.subject}</div>
                          <div className="text-[11px] text-slate-400">{g.term}</div>
                        </td>
                        <td className="p-4 text-center font-medium text-slate-700">{g.ca1 ?? '—'}</td>
                        <td className="p-4 text-center font-medium text-slate-700">{g.ca2 ?? '—'}</td>
                        <td className="p-4 text-center font-medium text-slate-700">{g.ca3 ?? '—'}</td>
                        <td className="p-4 text-center font-medium text-slate-700">{g.exam ?? '—'}</td>
                        <td className="p-4 text-center font-bold text-slate-900">{g.score}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${getGradeBadgeColor(g.grade)}`}>
                            {g.grade}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 text-xs italic">{g.remark || '—'}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(g)}
                              className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Edit Grade"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(g.id)}
                              disabled={isDeletingThis}
                              className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Grade"
                            >
                              {isDeletingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Record / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                {editingGrade ? 'Edit Grade Record' : 'Record Student Grade'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Class Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Class *
                  </label>
                  <select
                    required
                    value={formClass}
                    onChange={(e) => {
                      const nextClass = e.target.value;
                      const nextStudents = students.filter((student) => normalizeClassName(student.grade) === normalizeClassName(nextClass));
                      setFormClass(nextClass);
                      setFormData({ ...formData, studentId: nextStudents[0]?.id || '' });
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="" disabled>Select a class...</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.name}>{classItem.name}</option>
                    ))}
                  </select>
                </div>

                {/* Student Selection */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Student *
                  </label>
                  {loadingClassStudents ? (
                    <div className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Loading students for this class...
                    </div>
                  ) : formStudents.length > 0 ? (
                    <select
                      required
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      <option value="" disabled>Select a student...</option>
                      {formStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.middleName || ''} {s.lastName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="px-3.5 py-2.5 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                      No students are assigned to this class yet.
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Term */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Term / Semester *
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                </div>
              </div>

              {/* Assessment Breakdown Header */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 block mb-2">Continuous Assessments & Exam</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      1st CA (15)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      step="0.5"
                      placeholder="0"
                      value={formData.ca1}
                      onChange={(e) => setFormData({ ...formData, ca1: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      2nd CA (15)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      step="0.5"
                      placeholder="0"
                      value={formData.ca2}
                      onChange={(e) => setFormData({ ...formData, ca2: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      3rd CA (10)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      placeholder="0"
                      value={formData.ca3}
                      onChange={(e) => setFormData({ ...formData, ca3: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                      Exam (60)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      step="0.5"
                      placeholder="0"
                      value={formData.exam}
                      onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Total Live Computation Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Computed Total</span>
                  <span className="text-lg font-bold text-slate-900">{computedTotalScore} / 100</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Derived Grade</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getGradeBadgeColor(computedGradeLetter)}`}>
                    Grade {computedGradeLetter}
                  </span>
                </div>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Teacher Remark
                </label>
                <input
                  type="text"
                  placeholder={`Default: ${getDefaultRemark(computedGradeLetter)}`}
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
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
                  {editingGrade ? 'Save Changes' : 'Record Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}