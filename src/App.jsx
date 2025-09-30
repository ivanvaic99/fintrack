import React, { useEffect, useRef, useState } from 'react';
import { db } from './db.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO, isSameMonth } from 'date-fns';

// Predefined categories for simplicity. Feel free to extend.
const CATEGORIES = [
  'Salary',
  'Freelance',
  'Food',
  'Rent',
  'Utilities',
  'Transport',
  'Entertainment',
  'Other',
];

// Colours for the pie chart.
const COLORS = ['#4f46e5', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6'];

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const [searchTerm, setSearchTerm] = useState('');
  const amountRef = useRef();
  const categoryRef = useRef();
  const typeRef = useRef();
  const dateRef = useRef();
  const noteRef = useRef();
  const fileInputRef = useRef();

  // Load transactions on mount.
  useEffect(() => {
    const load = async () => {
      const all = await db.transactions.toArray();
      setTransactions(all);
    };
    load();
  }, []);

  // Add a new transaction.
  const addTransaction = async (e) => {
    e.preventDefault();
    const amount = parseFloat(amountRef.current.value);
    if (isNaN(amount)) return;
    const category = categoryRef.current.value;
    const type = typeRef.current.value;
    const date = dateRef.current.value;
    if (!date) return;
    const note = noteRef.current.value.trim();
    const id = await db.transactions.add({ amount, category, type, date, note });
    const newT = { id, amount, category, type, date, note };
    setTransactions((prev) => [...prev, newT]);
    amountRef.current.value = '';
    noteRef.current.value = '';
  };

  // Delete a transaction.
  const deleteTransaction = async (id) => {
    await db.transactions.delete(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Export CSV
  const exportCSV = () => {
    const header = 'id,amount,category,type,date,note\n';
    const lines = transactions.map((t) => {
      return [t.id, t.amount, escapeCsv(t.category), escapeCsv(t.type), t.date, escapeCsv(t.note || '')].join(',');
    });
    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fintrack_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  const escapeCsv = (val) => {
    const str = String(val).replace(/"/g, '""');
    return /[,\n"]/g.test(str) ? '"' + str + '"' : str;
  };

  // Import CSV
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const [idStr, amountStr, category, type, date, note] = parseCsvLine(lines[i]);
        const amount = parseFloat(amountStr);
        const obj = { amount, category, type, date, note };
        const id = await db.transactions.add(obj);
        imported.push({ id, ...obj });
      }
      setTransactions((prev) => [...prev, ...imported]);
      fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };
  const parseCsvLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Filter transactions by selected month and search term.
  const monthFiltered = transactions.filter((t) => {
    const date = parseISO(t.date);
    const [year, month] = selectedMonth.split('-');
    return isSameMonth(date, new Date(Number(year), Number(month) - 1)) &&
      (t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase())));
  });

  // Compute totals and chart data for selected month.
  const incomeTotal = monthFiltered.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = monthFiltered.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = incomeTotal - expenseTotal;

  const categoryData = CATEGORIES.map((cat) => {
    const totalExpense = monthFiltered
      .filter((t) => t.category === cat && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, value: totalExpense };
  }).filter((d) => d.value > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow">
        <h1 className="text-2xl font-bold">FinTrack</h1>
      </header>
      <main className="flex-1 p-4 overflow-auto space-y-6">
        {/* Form */}
        <form onSubmit={addTransaction} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
          <input
            ref={amountRef}
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            className="border rounded p-2"
            required
          />
          <select ref={categoryRef} className="border rounded p-2">
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select ref={typeRef} className="border rounded p-2">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            ref={dateRef}
            type="date"
            className="border rounded p-2"
            required
          />
          <input
            ref={noteRef}
            type="text"
            placeholder="Note (optional)"
            className="border rounded p-2"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </form>
        {/* Filters and actions */}
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-1">
            <span>Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded p-2"
            />
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes/category..."
            className="border rounded p-2 flex-1"
          />
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700"
          >
            Import CSV
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
            <p className="text-gray-500 dark:text-gray-400">Income</p>
            <p className="text-2xl font-bold text-green-600">{incomeTotal.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
            <p className="text-gray-500 dark:text-gray-400">Expenses</p>
            <p className="text-2xl font-bold text-red-600">{expenseTotal.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded shadow text-center">
            <p className="text-gray-500 dark:text-gray-400">Net</p>
            <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{net.toFixed(2)}</p>
          </div>
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
          <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
            <h3 className="font-medium mb-2">Expenses by Category</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No expenses this month.</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded shadow p-4 overflow-auto">
            <h3 className="font-medium mb-2">Transactions</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-1 text-left">Date</th>
                  <th className="py-1 text-left">Category</th>
                  <th className="py-1 text-left">Type</th>
                  <th className="py-1 text-right">Amount</th>
                  <th className="py-1 text-left">Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {monthFiltered.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-1">{format(parseISO(t.date), 'dd MMM yyyy')}</td>
                    <td className="py-1">{t.category}</td>
                    <td className="py-1 capitalize">{t.type}</td>
                    <td className="py-1 text-right">{t.amount.toFixed(2)}</td>
                    <td className="py-1">{t.note}</td>
                    <td className="py-1">
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete transaction"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <footer className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Built with React, Tailwind, Dexie and Recharts. Data is stored locally in your browser.
      </footer>
    </div>
  );
}