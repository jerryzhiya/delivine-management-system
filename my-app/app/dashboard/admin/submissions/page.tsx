'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Check,
  MessageSquare,
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  subject?: string;
  dueDate: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments: string[];
  status: 'Submitted' | 'Late' | 'Graded';
  grade?: number;
  feedback?: string;
  submittedAt?: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    grade?: string;
  };
}

export default function AdminSubmissionsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Grading form state
  const [gradeInput, setGradeInput] = useState<{ [key: string]: number }>({});
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    setError(null);
    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const res = await api.get('/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Assignment[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAssignments(data);

      if (data.length > 0) {
        selectAssignment(data[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assignments.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const selectAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setLoadingSubmissions(true);
    setError(null);
    setSuccess(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const res = await api.get(`/submissions/assignment/${assignment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Submission[] = Array.isArray(res.data) ? res.data : [];
      setSubmissions(data);

      // Pre-fill existing grades and feedback into form state
      const initialGrades: { [key: string]: number } = {};
      const initialFeedback: { [key: string]: string } = {};
      data.forEach((sub) => {
        if (sub.grade !== undefined) initialGrades[sub.id] = sub.grade;
        if (sub.feedback) initialFeedback[sub.id] = sub.feedback;
      });
      setGradeInput(initialGrades);
      setFeedbackInput(initialFeedback);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch submissions for this assignment.');
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    const grade = gradeInput[submissionId];
    const feedback = feedbackInput[submissionId] || '';

    if (grade === undefined || grade < 0) {
      setError('Please enter a valid non-negative numeric grade.');
      return;
    }

    setGradingId(submissionId);
    setError(null);
    setSuccess(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const res = await api.put(
        `/submissions/${submissionId}/grade`,
        { grade, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedSub = res.data;

      // Update local submissions list
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, ...updatedSub, status: 'Graded' } : s))
      );
      setSuccess('Grade and feedback saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save grade.');
    } finally {
      setGradingId(null);
    }
  };

  const getFullUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const name = sub.student
      ? `${sub.student.firstName} ${sub.student.lastName}`.toLowerCase()
      : '';
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600 shrink-0" />
            Admin & Teacher: Submissions Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review student responses, download attached files, and assign grades with feedback.
          </p>
        </div>
        <button
          onClick={fetchAssignments}
          className="self-start sm:self-auto px-3 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAssignments ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loadingAssignments ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2">Loading assignments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Assignments Sidebar */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Assignment ({assignments.length})
            </h2>

            {assignments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assignments available.</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {assignments.map((item) => {
                  const isSelected = selectedAssignment?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => selectAssignment(item)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                        {item.subject || 'General'}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {item.title}
                      </h3>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due{' '}
                        {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submissions List & Grading Panel */}
          <div className="lg:col-span-8 space-y-4">
            {selectedAssignment ? (
              <>
                {/* Search & Stats Bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <span className="text-xs font-semibold text-slate-600">
                    Total Submissions: {submissions.length}
                  </span>
                </div>

                {loadingSubmissions ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    <p className="text-xs text-slate-500 mt-2">Fetching submissions...</p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
                    No submissions found for this assignment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSubmissions.map((sub) => {
                      const isGradingThis = gradingId === sub.id;
                      const studentName = sub.student
                        ? `${sub.student.firstName} ${sub.student.lastName}`
                        : 'Unknown Student';

                      return (
                        <div
                          key={sub.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4"
                        >
                          {/* Student Info & Status */}
                          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                            <div>
                              <h3 className="text-base font-bold text-slate-900">{studentName}</h3>
                              <p className="text-xs text-slate-500">
                                Class: {sub.student?.grade || 'N/A'}{' '}
                                {sub.submittedAt &&
                                  `• Submitted: ${new Date(sub.submittedAt).toLocaleString()}`}
                              </p>
                            </div>

                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                sub.status === 'Graded'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.status === 'Late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </div>

                          {/* Written Work Content */}
                          <div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              Student Answer / Work Notes
                            </span>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-700 whitespace-pre-line">
                              {sub.content || 'No text content provided.'}
                            </div>
                          </div>

                          {/* File Attachments */}
                          {sub.attachments && sub.attachments.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                                Attached Solutions
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {sub.attachments.map((fileUrl, idx) => (
                                  <a
                                    key={idx}
                                    href={getFullUrl(fileUrl)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    View Attachment #{idx + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Grading Controls */}
                          <div className="pt-3 border-t border-slate-100 space-y-3">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-indigo-600" /> Grade Submission
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                                  Grade (%) *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="e.g. 85"
                                  value={gradeInput[sub.id] ?? ''}
                                  onChange={(e) =>
                                    setGradeInput({
                                      ...gradeInput,
                                      [sub.id]: Number(e.target.value),
                                    })
                                  }
                                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
                                  Teacher Feedback / Comments
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Good effort! Fix section 2 calculations..."
                                    value={feedbackInput[sub.id] ?? ''}
                                    onChange={(e) =>
                                      setFeedbackInput({
                                        ...feedbackInput,
                                        [sub.id]: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  />
                                  <button
                                    onClick={() => handleGradeSubmission(sub.id)}
                                    disabled={isGradingThis}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                                  >
                                    {isGradingThis ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                    Save Grade
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
                Select an assignment from the left sidebar to view student submissions.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};