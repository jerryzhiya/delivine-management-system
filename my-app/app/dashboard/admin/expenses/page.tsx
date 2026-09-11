'use client';

import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import axios from 'axios';
import { api } from '@/app/lib/api';
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  Edit3,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | string;
  expenseDate: string;
  notes?: string | null;
}

interface ExpenseStats {
  totalExpenses: number;
  paidExpenses: number;
  pendingCount: number;
  topCategory: { name: string; amount: number } | null;
}

const categories = ['Utilities', 'Supplies', 'Maintenance', 'Transport', 'Events', 'Insurance', 'Other'];
const initialForm = {
  title: '',
  category: 'Utilities',
  amount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  notes: '',
};
const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
});
const getErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) ? error.response?.data?.error || fallback : fallback;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({ totalExpenses: 0, paidExpenses: 0, pendingCount: 0, topCategory: null });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState(initialForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesResponse, statsResponse] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/stats'),
      ]);
      setExpenses(expensesResponse.data || []);
      setStats(statsResponse.data || { totalExpenses: 0, paidExpenses: 0, pendingCount: 0, topCategory: null });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to load school expenses.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const filteredExpenses = useMemo(() => {
    const query = search.toLowerCase();
    return expenses.filter((expense) =>
      `${expense.title} ${expense.category} ${expense.status} ${expense.expenseDate}`.toLowerCase().includes(query)
    );
  }, [expenses, search]);

  const statCards: Array<{ label: string; value: string; icon: ComponentType<{ className?: string }>; color: string }> = [
    { label: 'All recorded', value: currency.format(stats.totalExpenses), icon: CircleDollarSign, color: 'text-indigo-600' },
    { label: 'Paid expenses', value: currency.format(stats.paidExpenses), icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Awaiting payment', value: String(stats.pendingCount), icon: Clock3, color: 'text-amber-600' },
    { label: 'Top category', value: stats.topCategory?.name || 'None yet', icon: AlertCircle, color: 'text-slate-600' },
  ];

  const openCreateModal = () => {
    setEditingExpense(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate.slice(0, 10),
      notes: expense.notes || '',
    });
    setIsModalOpen(true);
  };

  const saveExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const payload = { ...form, amount: Number(form.amount) };
      if (editingExpense) await api.put(`/expenses/${editingExpense.id}`, payload);
      else await api.post('/expenses', payload);
      setForm(initialForm);
      setEditingExpense(null);
      setIsModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, editingExpense ? 'Unable to update school expense.' : 'Unable to create school expense.'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (expense: Expense) => {
    if (!window.confirm(`Delete expense "${expense.title}"?`)) return;
    try {
      await api.delete(`/expenses/${expense.id}`);
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to delete school expense.'));
    }
  };

  const createExpense = saveExpense;


  const exportCsv = () => {
    const header = ['Title', 'Category', 'Amount (NGN)', 'Date', 'Status', 'Notes'];
    const rows = filteredExpenses.map((expense) => [expense.title, expense.category, expense.amount, expense.expenseDate.slice(0, 10), expense.status, expense.notes || '']);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `school-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateStatus = async (expense: Expense, status: string) => {
    try {
      await api.patch(`/expenses/${expense.id}/status`, { status });
      await fetchData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update expense status.'));
    }
  };

  const formatDate = (date: string) => new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
  }).format(new Date(date));

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Admin finance</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">School expenses</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Track operational spending and keep every school expense visible in one place.</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto">
          <Plus className="h-4 w-4" /> Add expense
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-500">{label}</span><Icon className={`h-5 w-5 shrink-0 ${color}`} /></div>
            <p className="mt-3 truncate text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-slate-900">Expense records</h2><button onClick={exportCsv} disabled={filteredExpenses.length === 0} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" /> Export</button></div>
          <div className="relative w-full sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expenses" className="min-h-10 w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 sm:p-12">No expenses match this view.</div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredExpenses.map((expense) => (
                <article key={expense.id} className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-semibold text-slate-900">{expense.title}</p><p className="truncate text-xs text-slate-500">{expense.category}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${expense.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : expense.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{expense.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm"><div><p className="text-xs text-slate-500">Amount</p><p className="font-semibold text-slate-900">{currency.format(expense.amount)}</p></div><div><p className="text-xs text-slate-500">Date</p><p className="text-slate-600">{formatDate(expense.expenseDate)}</p></div></div>
                  {expense.status === 'PENDING' && <button onClick={() => updateStatus(expense, 'PAID')} className="min-h-10 w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">Mark paid</button>}
                  {expense.status === 'PAID' && <button onClick={() => updateStatus(expense, 'PENDING')} className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">Reopen</button>}
                  <div className="grid grid-cols-2 gap-2"><button onClick={() => openEditModal(expense)} className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Edit3 className="mr-1 inline h-4 w-4" />Edit</button><button onClick={() => deleteExpense(expense)} className="min-h-10 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="mr-1 inline h-4 w-4" />Delete</button></div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Expense</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredExpenses.map((expense) => <tr key={expense.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{expense.title}</p>{expense.notes && <p className="max-w-xs truncate text-xs text-slate-500">{expense.notes}</p>}</td><td className="px-5 py-4 text-slate-600">{expense.category}</td><td className="px-5 py-4 text-slate-600">{formatDate(expense.expenseDate)}</td><td className="px-5 py-4 font-semibold text-slate-900">{currency.format(expense.amount)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${expense.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : expense.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}>{expense.status}</span></td><td className="space-x-2 px-5 py-4">{expense.status === 'PENDING' && <button onClick={() => updateStatus(expense, 'PAID')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Mark paid</button>}{expense.status === 'PAID' && <button onClick={() => updateStatus(expense, 'PENDING')} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Reopen</button>}<button onClick={() => openEditModal(expense)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">Edit</button><button onClick={() => deleteExpense(expense)} className="text-xs font-semibold text-rose-600 hover:text-rose-800">Delete</button></td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/40 p-0 sm:items-center sm:p-4"><div className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">Add school expense</h2><p className="text-sm text-slate-500">Record an operational expense.</p></div><button onClick={() => setIsModalOpen(false)} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X className="h-5 w-5" /></button></div><form onSubmit={createExpense} className="space-y-4"><label className="block text-sm font-medium text-slate-700">Expense title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Electricity bill" className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Amount<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label></div><label className="block text-sm font-medium text-slate-700">Expense date<input required type="date" value={form.expenseDate} onChange={(event) => setForm({ ...form, expenseDate: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label><label className="block text-sm font-medium text-slate-700">Notes<span className="font-normal text-slate-400"> (optional)</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="mt-1 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-indigo-500" /></label><button disabled={submitting} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save expense</button></form></div></div>}
    </div>
  );
}
