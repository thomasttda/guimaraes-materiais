import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Search, X, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download } from 'lucide-react';

const API_URL = '/api';

export default function AdminFinanceiro() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'income', category: '', description: '', amount: '', payment_method: 'cash' });

  useEffect(() => {
    fetchData();
  }, [filter, dateRange]);

  const fetchData = async () => {
    let url = `${API_URL}/cash-flow`;
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('type', filter);
    if (dateRange.start) params.set('start_date', dateRange.start);
    if (dateRange.end) params.set('end_date', dateRange.end);
    if (params.toString()) url += `?${params.toString()}`;

    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setEntries(data);

    const income = data.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = data.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    setSummary({ income, expense, balance: income - expense });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    try {
      if (editing) {
        await fetch(`${API_URL}/cash-flow/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${API_URL}/cash-flow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      fetchData();
      resetForm();
    } catch (err) { alert('Erro ao salvar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este registro?')) return;
    await fetch(`${API_URL}/cash-flow/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetForm = () => {
    setForm({ type: 'income', category: '', description: '', amount: '', payment_method: 'cash' });
    setEditing(null);
    setShowForm(false);
  };

  const categories = {
    income: ['vendas', 'servicos', 'devolucoes', 'outros'],
    expense: ['fornecedores', 'aluguel', 'funcionarios', 'energia', 'agua', 'internet', 'transporte', 'marketing', 'impostos', 'manutencao', 'outros'],
  };

  const paymentMethods = ['cash', 'pix', 'card', 'boleto', 'transfer'];
  const paymentLabels = { cash: 'Dinheiro', pix: 'PIX', card: 'Cartão', boleto: 'Boleto', transfer: 'Transferência' };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Financeiro</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Novo Lançamento
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-6 border-l-4 border-green-500">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Entradas</p>
                <p className="text-2xl font-bold text-green-600">R$ {summary.income.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>
          <div className="card p-6 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Saídas</p>
                <p className="text-2xl font-bold text-red-600">R$ {summary.expense.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>
          <div className={`card p-6 border-l-4 ${summary.balance >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
            <div className="flex items-center gap-3">
              <DollarSign className={`w-8 h-8 ${summary.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
              <div>
                <p className="text-sm text-gray-500">Saldo</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {summary.balance.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field">
                <option value="all">Todos</option>
                <option value="income">Entradas</option>
                <option value="expense">Saídas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">De</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Até</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="input-field" />
            </div>
            <button onClick={fetchData} className="btn-secondary flex items-center gap-1"><Filter className="w-4 h-4" /> Filtrar</button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editing ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
                <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value, category: ''})} className="input-field">
                      <option value="income">Entrada</option>
                      <option value="expense">Saída</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor *</label>
                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required className="input-field">
                    <option value="">Selecione...</option>
                    {categories[form.type].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                  <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="input-field">
                    {paymentMethods.map(m => <option key={m} value={m}>{paymentLabels[m]}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="flex-1 btn-primary">{editing ? 'Salvar' : 'Adicionar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entries Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Data</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tipo</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Categoria</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Descrição</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Pagamento</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Valor</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {entry.type === 'income' ? '↑ Entrada' : '↓ Saída'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{entry.category}</td>
                    <td className="px-4 py-3 text-sm">{entry.description}</td>
                    <td className="px-4 py-3 text-sm">{paymentLabels[entry.payment_method]}</td>
                    <td className={`px-4 py-3 text-right font-medium ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.type === 'income' ? '+' : '-'} R$ {entry.amount.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditing(entry.id); setForm({ type: entry.type, category: entry.category, description: entry.description, amount: entry.amount.toString(), payment_method: entry.payment_method }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {entries.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum lançamento encontrado</p>}
        </div>
      </div>
    </div>
  );
}
