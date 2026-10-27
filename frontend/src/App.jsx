import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API = 'http://localhost:5000/api/expenses';
const categories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { title: '', amount: '', category: 'Food', date: today() };

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadExpenses() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API);
      setExpenses(await readResponse(response));
    } catch (err) {
      setError(`${err.message} Make sure the backend is running on port 5000.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
    [expenses]
  );

  const visibleExpenses = filter === 'All'
    ? expenses
    : expenses.filter((expense) => expense.category === filter);

  function changeForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function submitExpense(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.title.trim() || !form.date || Number(form.amount) <= 0) {
      setError('Enter a title, a valid date, and an amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editingId ? `${API}/${editingId}` : API, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, title: form.title.trim(), amount: Number(form.amount) }),
      });
      await readResponse(response);
      await loadExpenses();
      setMessage(editingId ? 'Expense updated.' : 'Expense added.');
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function editExpense(expense) {
    setEditingId(expense._id);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: new Date(expense.date).toISOString().slice(0, 10),
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteExpense(expense) {
    if (!window.confirm(`Delete “${expense.title}”? This cannot be undone.`)) return;
    setMessage('');
    setError('');
    try {
      const response = await fetch(`${API}/${expense._id}`, { method: 'DELETE' });
      await readResponse(response);
      await loadExpenses();
      setMessage('Expense deleted.');
      if (editingId === expense._id) resetForm();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Pennywise home">
          <span className="brand-mark">p</span>
          <span>pennywise<span className="brand-dot">.</span></span>
        </a>
        <span className="top-note"><span className="status-dot" /> Your money, in focus</span>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">YOUR PERSONAL FINANCE SPACE</p>
          <h1>Every rupee,<br /><span>accounted for.</span></h1>
          <p className="intro-copy">A little clarity goes a long way. Keep track of where your money goes, one day at a time.</p>
        </div>
        <div className="summary-card">
          <div className="summary-label"><span className="summary-icon">↗</span> TOTAL SPENT</div>
          <div className="summary-total">{formatMoney(total)}</div>
          <div className="summary-foot"><span>{expenses.length}</span> {expenses.length === 1 ? 'expense' : 'expenses'} recorded</div>
          <div className="summary-decoration">₹</div>
        </div>
      </section>

      <div className="content-grid">
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MAKE A NOTE</p>
              <h2>{editingId ? 'Edit expense' : 'Add an expense'}</h2>
            </div>
            <span className="heading-icon">＋</span>
          </div>

          <form onSubmit={submitExpense}>
            <label className="field-label" htmlFor="title">What was it for?</label>
            <input id="title" name="title" value={form.title} onChange={changeForm} placeholder="e.g. Lunch with friends" maxLength="100" required />

            <div className="field-row">
              <div>
                <label className="field-label" htmlFor="amount">Amount</label>
                <div className="amount-input"><span>₹</span><input id="amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={changeForm} placeholder="0.00" required /></div>
              </div>
              <div>
                <label className="field-label" htmlFor="date">Date</label>
                <input id="date" name="date" type="date" value={form.date} onChange={changeForm} required />
              </div>
            </div>

            <label className="field-label" htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={changeForm}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>

            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add expense'} <span>↗</span>
            </button>
            {editingId && <button className="cancel-button" type="button" onClick={resetForm}>Cancel editing</button>}
          </form>
        </section>

        <section className="panel expenses-panel">
          <div className="list-heading">
            <div>
              <p className="eyebrow">YOUR ACTIVITY</p>
              <h2>Recent expenses <span className="count-badge">{expenses.length}</span></h2>
            </div>
            <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter by category">
              <option>All</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </div>

          {message && <div className="notice success">{message}</div>}
          {error && <div className="notice error">{error}</div>}

          {loading ? <div className="empty-state">Loading your expenses…</div> : visibleExpenses.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✳</span>
              <strong>{expenses.length ? 'No expenses in this category' : 'A fresh start.'}</strong>
              <p>{expenses.length ? 'Choose another filter to see your expenses.' : 'Add your first expense to see it here.'}</p>
            </div>
          ) : (
            <div className="expense-list">
              {visibleExpenses.map((expense) => (
                <article className="expense-item" key={expense._id}>
                  <div className={`category-icon icon-${expense.category.toLowerCase()}`}>{expense.category === 'Food' ? '◒' : expense.category === 'Travel' ? '↗' : expense.category === 'Bills' ? '▤' : expense.category === 'Shopping' ? '◇' : '✳'}</div>
                  <div className="expense-info">
                    <strong>{expense.title}</strong>
                    <span>{expense.category} <i>·</i> {formatDate(expense.date)}</span>
                  </div>
                  <div className="expense-end">
                    <strong>{formatMoney(expense.amount)}</strong>
                    <div className="item-actions">
                      <button type="button" onClick={() => editExpense(expense)} aria-label={`Edit ${expense.title}`}>Edit</button>
                      <button type="button" className="delete-action" onClick={() => deleteExpense(expense)} aria-label={`Delete ${expense.title}`}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="list-footer"><span className="status-dot" /> Synced with your expense log</div>
        </section>
      </div>
      <footer>Made for mindful spending <span>✳</span></footer>
    </main>
  );
}