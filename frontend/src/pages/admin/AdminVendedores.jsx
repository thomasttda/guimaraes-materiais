import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, X, UserCheck, Phone, Mail } from 'lucide-react';

const API_URL = '/api';

export default function AdminVendedores() {
  const [sellers, setSellers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const data = await fetch(`${API_URL}/sellers`).then(res => res.json()).catch(() => []);
    setSellers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Nome é obrigatório');
    try {
      const res = await fetch(`${API_URL}/sellers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || 'Erro ao salvar vendedor'); return; }
      fetchData();
      setForm({ name: '', phone: '', email: '', password: '' });
      setShowForm(false);
    } catch { alert('Erro ao salvar vendedor'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este vendedor?')) return;
    await fetch(`${API_URL}/sellers/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Vendedores</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Novo Vendedor</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {sellers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhum vendedor cadastrado</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sellers.map(s => (
              <div key={s.id} className="bg-white rounded-xl p-5 shadow-sm border flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center"><UserCheck className="w-5 h-5 text-indigo-600" /></div>
                  <div>
                    <p className="font-bold text-gray-800">{s.name}</p>
                    {s.phone && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {s.phone}</p>}
                    {s.email && <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email} <span className="text-green-600 text-xs font-medium">(acesso admin)</span></p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Novo Vendedor</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (login)</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Senha (login)</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field" placeholder="guimaraes@2026" />
                </div>
                <button type="submit" className="w-full btn-primary py-3 rounded-xl">Salvar</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
