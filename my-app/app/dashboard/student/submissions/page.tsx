'use client';

import React, { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  X,
  ExternalLink,
  Loader2,
  Send,
  FileCheck,
  Video,
  RefreshCw,
  User,
  GraduationCap,
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  subject?: string;
  description?: string;
  dueDate: string;
  attachments?: string[];
}

interface Submission {
  id?: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentClass?: string;
  content: string;
  attachments: string[];
  status: 'Submitted' | 'Late' | 'Graded' | 'Pending';
  grade?: number;
  feedback?: string;
}

function getStoredStudent() {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(localStorage.getItem('user') || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

export default function StudentSubmissionsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Student & Form State
  const [studentName, setStudentName] = useState(() => {
    const user = getStoredStudent();
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '';
  });
  const [studentClass, setStudentClass] = useState(() => {
    const user = getStoredStudent();
    return user.grade || user.class || user.studentClass || '';
  });
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  async function fetchAssignments() {
    setLoading(true);
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
    } catch (err: unknown) {
      const responseError = err as { response?: { data?: { error?: string } } };
      setError(responseError.response?.data?.error || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }

  async function selectAssignment(assignment: Assignment) {
    setSelectedAssignment(assignment);
    setError(null);
    setSuccess(null);
    setContent('');
    setSelectedFiles([]);

    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const res = await api.get(`/submissions/assignment/${assignment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const submissionsList: Submission[] = Array.isArray(res.data) ? res.data : [];
      const userSub = submissionsList[0];

      if (userSub) {
        setCurrentSubmission(userSub);
        setContent(userSub.content || '');
        if (userSub.studentName) setStudentName(userSub.studentName);
        if (userSub.studentClass) setStudentClass(userSub.studentClass);
      } else {
        setCurrentSubmission(null);
      }
    } catch {
      setCurrentSubmission(null);
    }
  }

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchAssignments();
    }, 0);

    return () => window.clearTimeout(fetchTimer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(
        (file) => file.type.includes('pdf') || file.type.includes('video')
      );

      if (validFiles.length < filesArray.length) {
        setError('Only PDF documents and video files are supported.');
      }
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!content.trim() && selectedFiles.length === 0) {
      setError('Add a written response or attach a file before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    const formData = new FormData();
    formData.append('assignmentId', selectedAssignment.id);
    formData.append('studentName', studentName.trim());
    formData.append('studentClass', studentClass.trim());
    formData.append('content', content);

    selectedFiles.forEach((file) => {
      formData.append('attachments', file);
    });

    try {
      const res = await api.post('/submissions', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedSub = res.data?.data || res.data;
      setCurrentSubmission(updatedSub);
      setSelectedFiles([]);
      setSuccess(
        updatedSub.status === 'Late'
          ? 'Submitted (Marked as Late).'
          : 'Assignment turned in successfully!'
      );
    } catch (err: unknown) {
      const responseError = err as { response?: { data?: { error?: string } } };
      setError(responseError.response?.data?.error || 'Failed to turn in assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const getFullUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const isVideoFile = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-indigo-600 shrink-0" />
            Student Portal: Active Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View course materials, watch lesson videos, and submit your homework online.
          </p>
        </div>
        <button
          onClick={() => void fetchAssignments()}
          className="self-start sm:self-auto px-3 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2">Loading assignments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Assignments List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Available Assignments ({assignments.length})
            </h2>

            {assignments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No active assignments available.
              </p>
            ) : (
              <div className="space-y-2 max-h-125 lg:max-h-150 overflow-y-auto pr-1">
                {assignments.map((item) => {
                  const isSelected = selectedAssignment?.id === item.id;
                  const isOverdue = new Date() > new Date(item.dueDate);

                  return (
                    <button
                      key={item.id}
                      onClick={() => selectAssignment(item)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                          {item.subject || 'General'}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          Due {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            Past Due
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details & Submission Panel */}
          <div className="lg:col-span-8 space-y-6">
            {selectedAssignment ? (
              <>
                {/* Assignment Instructions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        {selectedAssignment.subject || 'Assignment'}
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                        {selectedAssignment.title}
                      </h2>
                    </div>

                    {currentSubmission ? (
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        {currentSubmission.status === 'Graded' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <Award className="w-3.5 h-3.5" /> Graded ({currentSubmission.grade}%)
                          </span>
                        )}
                        {currentSubmission.status === 'Submitted' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Turned In
                          </span>
                        )}
                        {currentSubmission.status === 'Late' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5" /> Submitted Late
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 self-start sm:self-auto">
                        Assigned
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line">
                    {selectedAssignment.description || 'No instructions specified.'}
                  </p>

                  {/* Teacher Attachments */}
                  {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Teacher Resources & Videos
                      </h4>

                      <div className="space-y-3">
                        {selectedAssignment.attachments.map((fileUrl, idx) => {
                          const targetUrl = getFullUrl(fileUrl);
                          const isVideo = isVideoFile(fileUrl);

                          return isVideo ? (
                            <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-black">
                              <video controls className="w-full max-h-90 object-contain">
                                <source src={targetUrl} />
                                Browser does not support video tag.
                              </video>
                              <div className="p-2.5 bg-slate-900 text-white text-xs flex items-center justify-between">
                                <span className="flex items-center gap-1.5 truncate">
                                  <Video className="w-4 h-4 text-rose-400 shrink-0" />
                                  Lesson Video #{idx + 1}
                                </span>
                                <a
                                  href={targetUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-300 hover:underline flex items-center gap-1 shrink-0"
                                >
                                  Open <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <a
                              key={idx}
                              href={targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl transition-colors"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="truncate">Document #{idx + 1} (PDF)</span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submission Form */}
                <form
                  onSubmit={handleSubmitWork}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4"
                >
                  <h3 className="text-base font-bold text-slate-900">
                    {currentSubmission ? 'Your Submission Status' : 'Submit Your Assignment'}
                  </h3>

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

                  {/* Student Name & Class Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Student Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          disabled={currentSubmission?.status === 'Graded'}
                          className="w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Class / Grade *
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Grade 10-A"
                          value={studentClass}
                          onChange={(e) => setStudentClass(e.target.value)}
                          disabled={currentSubmission?.status === 'Graded'}
                          className="w-full pl-9 pr-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission Text Content */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Written Response / Work Notes
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Enter calculations, answers, or submission details..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={currentSubmission?.status === 'Graded'}
                      className="w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                    />
                  </div>

                  {/* Render Previously Uploaded Files */}
                  {currentSubmission?.attachments && currentSubmission.attachments.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase">
                        Already Submitted Attachments
                      </label>
                      <div className="space-y-2">
                        {currentSubmission.attachments.map((fileUrl, index) => (
                          <a
                            key={index}
                            href={getFullUrl(fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-medium hover:bg-indigo-100/60 transition-colors"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="truncate">Uploaded File #{index + 1}</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teacher Feedback */}
                  {currentSubmission?.feedback && (
                    <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-indigo-900 uppercase tracking-wider block">
                        Teacher Feedback
                      </span>
                      <p className="text-indigo-800">{currentSubmission.feedback}</p>
                    </div>
                  )}

                  {/* File Upload Area */}
                  {currentSubmission?.status !== 'Graded' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Attach Solutions File (PDF / Video)
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3.5 border-2 border-dashed rounded-xl border-slate-200 hover:border-indigo-500 text-xs font-semibold text-slate-600 hover:bg-indigo-50/20 transition-all text-center"
                      >
                        Choose File from Local Storage
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="application/pdf,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {selectedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Files queued for upload:
                          </span>
                          {selectedFiles.map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 bg-slate-50 border rounded-xl text-xs"
                            >
                              <span className="truncate font-medium text-slate-700">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(i)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Turn in Button */}
                  {currentSubmission?.status !== 'Graded' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {currentSubmission ? 'Update Submission' : 'Turn In Work'}
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs sm:text-sm bg-white rounded-2xl border border-slate-200">
                Select an assignment to view details and submit your work.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}