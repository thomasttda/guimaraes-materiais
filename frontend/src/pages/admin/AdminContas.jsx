import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, AlertTriangle, Calendar, Bell } from 'lucide-react';

const API_URL = '/api';

export default function AdminContas() {
  const [bills, setBills] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', amount: '', due_date: '', reminder_days: 3, supplier: '', barcode: '' });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    let url = `${API_URL}/bills`;
    if (filter !== 'all') url += `?status=${filter}`;
    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setBills(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    try {
      if (editing) {
        await fetch(`${API_URL}/bills/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${API_URL}/bills`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      fetchData();
      resetForm();
    } catch (err) { alert('Erro ao salvar'); }
  };

  const handlePay = async (id) => {
    await fetch(`${API_URL}/bills/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'paid', paid_date: new Date().toISOString().split('T')[0], payment_method: 'pix' }) });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover esta conta?')) return;
    await fetch(`${API_URL}/bills/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetForm = () => {
    setForm({ title: '', description: '', amount: '', due_date: '', reminder_days: 3, supplier: '', barcode: '' });
    setEditing(null);
    setShowForm(false);
  };

  const statusLabels = { pending: 'Pendente', paid: 'Pago', overdue: 'Vencido', cancelled: 'Cancelado' };
  const statusColors = { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', overdue: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-800' };

  const today = new Date().toISOString().split('T')[0];
  const totalPending = bills.filter(b => b.status === 'pending').reduce((s, b) => s + b.amount, 0);
  const totalOverdue = bills.filter(b => b.status === 'pending' && b.due_date < today).reduce((s, b) => s + b.amount, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Contas a Pagar</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nova Conta
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-6 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">Total Pendente</p>
            <p className="text-2xl font-bold text-yellow-600">R$ {totalPending.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="card p-6 border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Vencidas</p>
            <p className="text-2xl font-bold text-red-600">R$ {totalOverdue.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="card p-6 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Qtd Pendente</p>
            <p className="text-2xl font-bold text-blue-600">{bills.filter(b => b.status === 'pending').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[['all', 'Todas'], ['pending', 'Pendentes'], ['paid', 'Pagas'], ['overdue', 'Vencidas']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === val ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border'}`}>{label}</button>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editing ? 'Editar Conta' : 'Nova Conta'}</h2>
                <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Título *</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor *</label>
                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vencimento *</label>
                    <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} required className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Lembrar (dias antes)</label>
                    <input type="number" value={form.reminder_days} onChange={e => setForm({...form, reminder_days: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fornecedor</label>
                    <input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código de Barras</label>
                  <input type="text" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} className="input-field" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="flex-1 btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bills List */}
        <div className="space-y-4">
          {bills.map(bill => {
            const isOverdue = bill.status === 'pending' && bill.due_date < today;
            return (
              <div key={bill.id} className={`card p-6 ${isOverdue ? 'border-l-4 border-red-500' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">{bill.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[bill.status]}`}>{statusLabels[bill.status]}</span>
                      {bill.reminder_sent === 1 && <Bell className="w-4 h-4 text-blue-500" title="Lembrete enviado" />}
                    </div>
                    {bill.description && <p className="text-sm text-gray-500">{bill.description}</p>}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Venc: {new Date(bill.due_date).toLocaleDateString('pt-BR')}</span>
                      {bill.supplier && <span>🏢 {bill.supplier}</span>}
                      <span>💰 R$ {bill.amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {bill.status === 'pending' && (
                      <button onClick={() => handlePay(bill.id)} className="btn-primary flex items-center gap-1 text-sm">
                        <Check className="w-4 h-4" /> Pagar
                      </button>
                    )}
                    <button onClick={() => { setEditing(bill.id); setForm({ title: bill.title, description: bill.description, amount: bill.amount.toString(), due_date: bill.due_date, reminder_days: bill.reminder_days, supplier: bill.supplier, barcode: bill.barcode }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(bill.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {bills.length === 0 && <p className="text-center py-8 text-gray-500">Nenhuma conta encontrada</p>}
      </div>
    </div>
  );
}
