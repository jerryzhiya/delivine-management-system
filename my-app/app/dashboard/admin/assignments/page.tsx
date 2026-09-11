'use client';

import React, { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/app/lib/api';
import {
  FileText,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  Calendar,
  Video,
  ExternalLink,
  BookOpen,
  UploadCloud,
  FileCheck,
  Users,
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  type: string;
  classId: string;
  subject?: string;
  description?: string;
  attachments: string[];
  dueDate: string;
  totalStudents: number;
  submissionsCount?: number;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'HOMEWORK',
    classId: '',
    subject: '',
    description: '',
    dueDate: '',
    totalStudents: 30,
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      const res = await api.get('/assignments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAssignments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingAssignment(null);
    setSelectedFiles([]);
    setExistingAttachments([]);
    setFormData({
      title: '',
      type: 'HOMEWORK',
      classId: '',
      subject: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      totalStudents: 30,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setSelectedFiles([]);
    setExistingAttachments(assignment.attachments || []);
    setFormData({
      title: assignment.title || '',
      type: assignment.type || 'HOMEWORK',
      classId: assignment.classId || '',
      subject: assignment.subject || '',
      description: assignment.description || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
      totalStudents: assignment.totalStudents || 30,
    });
    setIsModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    try {
      await api.delete(`/assignments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Assignment deleted successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete assignment.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFullUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const isVideoFile = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i) !== null;
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const token = Cookies.get('token') || localStorage.getItem('token');
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('classId', formData.classId);
      data.append('subject', formData.subject);
      data.append('description', formData.description);
      data.append('dueDate', formData.dueDate);
      data.append('totalStudents', String(formData.totalStudents));

      existingAttachments.forEach((url) => data.append('attachments', url));
      selectedFiles.forEach((file) => {
        data.append('files', file);
      });

      let res;
      if (editingAssignment) {
        res = await api.put(`/assignments/${editingAssignment.id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        res = await api.post('/assignments', data, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      const updatedOrCreated = res.data?.data || res.data;

      // Update state directly so changes are instantly visible
      if (editingAssignment) {
        setAssignments((prev) =>
          prev.map((item) => (item.id === editingAssignment.id ? updatedOrCreated : item))
        );
      } else {
        setAssignments((prev) => [updatedOrCreated, ...prev]);
      }

      setSuccess(`Assignment ${editingAssignment ? 'updated' : 'published'} successfully.`);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.subject?.toLowerCase().includes(q) ||
      item.classId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600 shrink-0" />
            Classroom Assignments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create coursework, attach PDFs or lesson videos, and view student progress.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl text-sm bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, subject, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <span className="text-xs text-slate-400 self-start sm:self-center">
          Showing {filteredAssignments.length} of {assignments.length} assignments
        </span>
      </div>

      {/* Main Grid: Assignment Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2">Loading assignments...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl space-y-3">
          <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-700">No assignments found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery ? 'Try matching another title or subject.' : 'Click "Create Assignment" to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => {
            const isOverdue = new Date() > new Date(assignment.dueDate);

            return (
              <div
                key={assignment.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-sm hover:shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 uppercase tracking-wider">
                      {assignment.type || 'HOMEWORK'}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Class: {assignment.classId}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{assignment.title}</h3>
                    {assignment.subject && (
                      <p className="text-xs font-medium text-indigo-600 mt-0.5">{assignment.subject}</p>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {assignment.description || 'No detailed instructions available.'}
                  </p>

                  {/* Attachment Previews */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Attached Resources ({assignment.attachments.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {assignment.attachments.map((fileUrl, idx) => {
                          const targetUrl = getFullUrl(fileUrl);
                          const isVideo = isVideoFile(fileUrl);

                          return (
                            <a
                              key={idx}
                              href={targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 rounded-lg transition-colors"
                            >
                              {isVideo ? (
                                <Video className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              )}
                              <span>File #{idx + 1}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className={isOverdue ? 'text-amber-600 font-medium' : ''}>
                      Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(assignment)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit Assignment"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      disabled={deletingId === assignment.id}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Delete Assignment"
                    >
                      {deletingId === assignment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Device File Selection */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingAssignment ? 'Edit Assignment' : 'New Assignment & Media Upload'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Class ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 bg-white"
                  >
                    <option value="HOMEWORK">Homework</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="PROJECT">Project</option>
                    <option value="EXAM">Exam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Native File Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Upload PDF or Video Files
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all"
                >
                  <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    Click to browse files from laptop or phone
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports PDF documents and MP4/MOV videos
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="application/pdf,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Existing Attachments List */}
                {existingAttachments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-xs font-medium text-slate-500">Existing Media:</span>
                    {existingAttachments.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <span className="truncate text-slate-700 font-medium">{url}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingAttachment(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Local Queued Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-xs font-medium text-slate-500">Ready to Upload:</span>
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {file.type.includes('video') ? (
                            <Video className="w-4 h-4 text-rose-500 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                          <span className="font-medium text-slate-800 truncate">{file.name}</span>
                          <span className="text-slate-400 text-[10px]">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save & Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}