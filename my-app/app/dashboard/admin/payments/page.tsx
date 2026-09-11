'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/app/lib/api';
import {
  CreditCard,
  DollarSign,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Filter,
  Loader2,
  X,
  User,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  grade?: string;
}

interface Payment {
  id: string;
  studentId: string;
  student?: Student;
  totalFee: number;
  amountPaid: number;
  type: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'CANCELLED' | string;
  date: string;
}

interface PaymentStats {
  totalRevenue: number;
  totalOutstanding: number;
  pendingCount: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    totalOutstanding: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal & Student Search State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    totalFee: '',
    amountPaid: '',
    type: 'School Fees',
    date: new Date().toISOString().split('T')[0],
  });

  const calculateStatus = (total: number, paid: number): string => {
    if (paid >= total && total > 0) return 'PAID';
    if (paid > 0 && paid < total) return 'PARTIAL';
    return 'PENDING';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [paymentsRes, statsRes, studentsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/stats'),
        api.get('/students'),
      ]);

      const rawPayments: Payment[] = paymentsRes.data || [];
      const formattedPayments = rawPayments.map((p: any) => {
        const totalFee = p.totalFee ?? p.amount ?? 0;
        const amountPaid = p.amountPaid ?? (p.status === 'PAID' ? totalFee : 0);
        return {
          ...p,
          totalFee,
          amountPaid,
          status: p.status || calculateStatus(totalFee, amountPaid),
        };
      });

      setPayments(formattedPayments);
      setStudents(studentsRes.data || []);

      const collected = formattedPayments.reduce((acc, curr) => acc + curr.amountPaid, 0);
      const expected = formattedPayments.reduce((acc, curr) => acc + curr.totalFee, 0);
      const pending = formattedPayments.filter((p) => p.amountPaid < p.totalFee).length;

      setStats({
        totalRevenue: statsRes.data?.totalRevenue ?? collected,
        totalOutstanding: statsRes.data?.totalOutstanding ?? expected - collected,
        pendingCount: statsRes.data?.pendingCount ?? pending,
      });
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.error || 'Failed to load payments data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      alert('Please select a student from the list.');
      return;
    }

    try {
      setSubmitting(true);
      const newPaymentAmount = parseFloat(formData.amountPaid) || 0;
      const newTotalFee = parseFloat(formData.totalFee) || 0;

      if (selectedPayment) {
        const updatedPaid = selectedPayment.amountPaid + newPaymentAmount;
        const updatedStatus = calculateStatus(selectedPayment.totalFee, updatedPaid);

        await api.patch(`/payments/${selectedPayment.id}/status`, {
          amountPaid: updatedPaid,
          status: updatedStatus,
        });
      } else {
        const calculatedStatus = calculateStatus(newTotalFee, newPaymentAmount);
        await api.post('/payments', {
          studentId: formData.studentId,
          totalFee: newTotalFee,
          amountPaid: newPaymentAmount,
          type: formData.type,
          status: calculatedStatus,
          date: formData.date,
        });
      }

      setIsModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPayment(null);
    setStudentSearch('');
    setIsStudentDropdownOpen(false);
    setFormData({
      studentId: '',
      totalFee: '',
      amountPaid: '',
      type: 'School Fees',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const openInstallmentModal = (payment: Payment) => {
    setSelectedPayment(payment);
    const remaining = payment.totalFee - payment.amountPaid;
    const studentName = payment.student
      ? `${payment.student.firstName} ${payment.student.lastName}`
      : payment.studentId;

    setStudentSearch(studentName);
    setFormData({
      studentId: payment.studentId,
      totalFee: payment.totalFee.toString(),
      amountPaid: remaining > 0 ? remaining.toString() : '0',
      type: payment.type,
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName} ${s.middleName || ''} ${s.lastName}`.toLowerCase();
    const gradeMatch = s.grade?.toLowerCase().includes(studentSearch.toLowerCase());
    return fullName.includes(studentSearch.toLowerCase()) || gradeMatch;
  });

  const selectedStudentObj = students.find((s) => s.id === formData.studentId);

  const filteredPayments = payments.filter((payment) => {
    const studentName = payment.student
      ? `${payment.student.firstName} ${payment.student.lastName}`.toLowerCase()
      : payment.studentId.toLowerCase();

    const matchesSearch =
      studentName.includes(searchTerm.toLowerCase()) ||
      payment.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || payment.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <Clock3 className="w-3.5 h-3.5" /> Partial
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
            <AlertCircle className="w-3.5 h-3.5" /> Unpaid
          </span>
        );
    }
  };

  const inputPaymentAmount = parseFloat(formData.amountPaid) || 0;
  const modalTotalFee = selectedPayment ? selectedPayment.totalFee : parseFloat(formData.totalFee) || 0;
  const modalPreviousPaid = selectedPayment ? selectedPayment.amountPaid : 0;
  const modalNewTotalPaid = modalPreviousPaid + inputPaymentAmount;
  const modalRemainingLeft = Math.max(0, modalTotalFee - modalNewTotalPaid);
  const modalCalculatedStatus = calculateStatus(modalTotalFee, modalNewTotalPaid);

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600 shrink-0" />
            Payments & Tuition
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage fee transactions, track partial payments, and search student accounts.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Record New Fee
        </button>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Total Revenue
            </p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
              ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Outstanding Balance
            </p>
            <p className="text-lg sm:text-2xl font-bold text-rose-600 truncate">
              ${stats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5 sm:col-span-2 lg:col-span-1">
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Pending / Partial Accounts
            </p>
            <p className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{stats.pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-between items-stretch sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or fee type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Fully Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PENDING">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Payments Data */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs sm:text-sm font-medium">Loading payments...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 flex items-center justify-center gap-2 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 text-sm">No payment records found</p>
            <p className="text-xs">Try adjusting your filters or record a new payment.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout (< 640px) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {filteredPayments.map((payment) => {
                const studentName = payment.student
                  ? `${payment.student.firstName} ${payment.student.middleName || ''} ${payment.student.lastName}`.trim()
                  : `ID: ${payment.studentId.substring(0, 8)}...`;
                const remainingBalance = Math.max(0, payment.totalFee - payment.amountPaid);

                return (
                  <div key={payment.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{studentName}</p>
                          <p className="text-xs text-slate-500">
                            {payment.type} {payment.student?.grade ? `• Grade ${payment.student.grade}` : ''}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total</span>
                        <span className="font-bold text-slate-900">${payment.totalFee.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Paid</span>
                        <span className="font-bold text-emerald-600">${payment.amountPaid.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Left</span>
                        <span className="font-bold text-rose-600">${remainingBalance.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      {remainingBalance > 0 ? (
                        <button
                          onClick={() => openInstallmentModal(payment)}
                          className="w-full text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 py-2 rounded-xl border border-indigo-100 text-center transition-all"
                        >
                          + Record Installment
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 w-full text-right py-1">
                          Fully Settled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table Layout (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Fee Type</th>
                    <th className="py-3.5 px-4">Total Fee</th>
                    <th className="py-3.5 px-4">Paid So Far</th>
                    <th className="py-3.5 px-4">Amount Left</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPayments.map((payment) => {
                    const studentName = payment.student
                      ? `${payment.student.firstName} ${payment.student.middleName || ''} ${payment.student.lastName}`.trim()
                      : `ID: ${payment.studentId.substring(0, 8)}...`;
                    const remainingBalance = Math.max(0, payment.totalFee - payment.amountPaid);

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">{studentName}</p>
                              {payment.student?.grade && (
                                <p className="text-xs text-slate-500">Grade: {payment.student.grade}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{payment.type}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          ${payment.totalFee.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">
                          ${payment.amountPaid.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">
                          ${remainingBalance.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4">{getStatusBadge(payment.status)}</td>
                        <td className="py-3.5 px-4 text-right">
                          {remainingBalance > 0 ? (
                            <button
                              onClick={() => openInstallmentModal(payment)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition-all"
                            >
                              + Record Installment
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600">Fully Settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal - Bottom Sheet on Mobile, Centered Modal on Tablet/Desktop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {selectedPayment ? 'Record Part Payment' : 'Record New Fee'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-700">Calculated Status:</span>
                {getStatusBadge(modalCalculatedStatus)}
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Total Fee:</span>
                <span className="font-semibold text-slate-900">${modalTotalFee.toFixed(2)}</span>
              </div>

              {selectedPayment && (
                <div className="flex justify-between text-slate-600">
                  <span>Previously Paid:</span>
                  <span className="font-semibold text-emerald-600">${modalPreviousPaid.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Amount Paid Now:</span>
                <span className="font-semibold text-indigo-600">${inputPaymentAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-semibold text-slate-700">
                <span>Total Paid After Transaction:</span>
                <span className="font-bold text-emerald-600">${modalNewTotalPaid.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Remaining Balance Left:</span>
                <span className={modalRemainingLeft > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  ${modalRemainingLeft.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              {/* Searchable Student Dropdown */}
              {!selectedPayment ? (
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Student
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Type student name or grade..."
                      value={
                        formData.studentId && selectedStudentObj
                          ? `${selectedStudentObj.firstName} ${selectedStudentObj.lastName} ${
                              selectedStudentObj.grade ? `(${selectedStudentObj.grade})` : ''
                            }`
                          : studentSearch
                      }
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setFormData({ ...formData, studentId: '' });
                        setIsStudentDropdownOpen(true);
                      }}
                      onFocus={() => setIsStudentDropdownOpen(true)}
                      className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Dropdown Options List */}
                  {isStudentDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">No students found</div>
                      ) : (
                        filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            onClick={() => {
                              setFormData({ ...formData, studentId: student.id });
                              setStudentSearch(`${student.firstName} ${student.lastName}`);
                              setIsStudentDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-indigo-50 cursor-pointer transition-colors flex justify-between items-center text-xs sm:text-sm"
                          >
                            <p className="font-semibold text-slate-900">
                              {student.firstName} {student.middleName || ''} {student.lastName}
                            </p>
                            {student.grade && (
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {student.grade}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Student
                  </label>
                  <input
                    type="text"
                    disabled
                    value={studentSearch}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 text-slate-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!selectedPayment && (
                  <div>
                    <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Total Fee ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="1200.00"
                      value={formData.totalFee}
                      onChange={(e) => setFormData({ ...formData, totalFee: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className={selectedPayment ? 'sm:col-span-2' : ''}>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {selectedPayment ? 'Part Payment Amount Now ($)' : 'Initial Amount Paid ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="500.00"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Fee Type
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!selectedPayment}
                    placeholder="School Fees"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}