'use client';

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import axios from 'axios';
import { api } from '@/app/lib/api';
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject?: string;
}

interface PayrollRecord {
  id: string;
  teacherId: string;
  teacher: Teacher;
  period: string;
  baseSalary: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | string;
  paidAt?: string | null;
}

interface PayrollStats {
  totalPayroll: number;
  paidPayroll: number;
  pendingCount: number;
  teacherCount: number;
}

const initialForm = {
  teacherId: '',
  period: new Date().toISOString().slice(0, 7),
  baseSalary: '',
  deductions: '0',
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
});

const getErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) ? error.response?.data?.error || fallback : fallback;

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<PayrollStats>({ totalPayroll: 0, paidPayroll: 0, pendingCount: 0, teacherCount: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [payrollResponse, statsResponse, teachersResponse] = await Promise.all([
        api.get('/payroll'),
        api.get('/payroll/stats'),
        api.get('/teachers'),
      ]);
      setRecords(payrollResponse.data || []);
      setStats(statsResponse.data || { totalPayroll: 0, paidPayroll: 0, pendingCount: 0, teacherCount: 0 });
      setTeachers(teachersResponse.data || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to load payroll records.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const filteredRecords = useMemo(() => {
    const query = search.toLowerCase();
    return records.filter((record) =>
      `${record.teacher?.name} ${record.teacher?.email} ${record.period} ${record.status}`.toLowerCase().includes(query)
    );
  }, [records, search]);

  const statCards: Array<{ label: string; value: string; icon: ComponentType<{ className?: string }>; color: string }> = [
    { label: 'Payroll scheduled', value: currency.format(stats.totalPayroll), icon: CircleDollarSign, color: 'text-indigo-600' },
    { label: 'Paid this period', value: currency.format(stats.paidPayroll), icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Awaiting payment', value: String(stats.pendingCount), icon: Clock3, color: 'text-amber-600' },
    { label: 'Teachers covered', value: String(stats.teacherCount), icon: Users, color: 'text-slate-600' },
  ];

  const createRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.post('/payroll', {
        ...form,
        baseSalary: Number(form.baseSalary),
        deductions: Number(form.deductions || 0),
      });
      setForm(initialForm);
      setIsModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to create payroll record.'));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (record: PayrollRecord, status: string) => {
    try {
      await api.patch(`/payroll/${record.id}/status`, { status });
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update payroll status.'));
    }
  };

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Admin finance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Teacher payroll</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Prepare, track, and mark teacher salary payments for each month.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Add payroll record
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 className="font-semibold text-slate-900">Payroll records</h2>
          <div className="relative w-full sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teacher or period" className="min-h-10 w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading payroll...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 sm:p-12">No payroll records match this view.</div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredRecords.map((record) => (
                <article key={record.id} className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{record.teacher?.name || 'Unknown teacher'}</p>
                      <p className="truncate text-xs text-slate-500">{record.teacher?.subject || record.teacher?.email}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : record.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{record.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div><p className="text-xs text-slate-500">Period</p><p className="font-medium text-slate-700">{record.period}</p></div>
                    <div><p className="text-xs text-slate-500">Net pay</p><p className="font-semibold text-slate-900">{currency.format(record.netSalary)}</p></div>
                    <div><p className="text-xs text-slate-500">Gross</p><p className="text-slate-600">{currency.format(record.baseSalary)}</p></div>
                    <div><p className="text-xs text-slate-500">Deductions</p><p className="text-slate-600">{currency.format(record.deductions)}</p></div>
                  </div>
                  {record.status === 'PENDING' && <button onClick={() => updateStatus(record, 'PAID')} className="min-h-10 w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">Mark paid</button>}
                  {record.status === 'PAID' && <button onClick={() => updateStatus(record, 'PENDING')} className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">Reopen</button>}
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Teacher</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">Gross</th><th className="px-5 py-3">Deductions</th><th className="px-5 py-3">Net pay</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => <tr key={record.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{record.teacher?.name || 'Unknown teacher'}</p><p className="text-xs text-slate-500">{record.teacher?.subject || record.teacher?.email}</p></td><td className="px-5 py-4 text-slate-600">{record.period}</td><td className="px-5 py-4 text-slate-600">{currency.format(record.baseSalary)}</td><td className="px-5 py-4 text-slate-600">{currency.format(record.deductions)}</td><td className="px-5 py-4 font-semibold text-slate-900">{currency.format(record.netSalary)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : record.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{record.status}</span></td><td className="px-5 py-4">{record.status === 'PENDING' && <button onClick={() => updateStatus(record, 'PAID')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Mark paid</button>}{record.status === 'PAID' && <button onClick={() => updateStatus(record, 'PENDING')} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Reopen</button>}</td></tr>)}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/40 p-0 sm:items-center sm:p-4"><div className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">Add payroll record</h2><p className="text-sm text-slate-500">Create one monthly record for a teacher.</p></div><button onClick={() => setIsModalOpen(false)} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X className="h-5 w-5" /></button></div><form onSubmit={createRecord} className="space-y-4"><label className="block text-sm font-medium text-slate-700">Teacher<select required value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500"><option value="">Select a teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} {teacher.subject ? `- ${teacher.subject}` : ''}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Payroll month<input required type="month" value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label><label className="block text-sm font-medium text-slate-700">Base salary<input required min="0.01" step="0.01" type="number" value={form.baseSalary} onChange={(event) => setForm({ ...form, baseSalary: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label></div><label className="block text-sm font-medium text-slate-700">Deductions<input min="0" step="0.01" type="number" value={form.deductions} onChange={(event) => setForm({ ...form, deductions: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label><button disabled={submitting} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save payroll record</button></form></div></div>}
    </div>
  );
}
