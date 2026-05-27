import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Search, X, Phone, Mail, MapPin, ShoppingBag } from 'lucide-react';

const API_URL = '/api';

export default function AdminClientes() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', cpf: '', address: '', neighborhood: '', city: '', state: '', zip_code: '', notes: '' });

  useEffect(() => { fetchData(); }, [search]);

  const fetchData = async () => {
    let url = `${API_URL}/customers`;
    if (search) url += `?search=${search}`;
    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setCustomers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await fetch(`${API_URL}/customers/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch(`${API_URL}/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      fetchData();
      resetForm();
    } catch { alert('Erro ao salvar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este cliente?')) return;
    await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', cpf: '', address: '', neighborhood: '', city: '', state: '', zip_code: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Clientes</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Novo Cliente
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por nome, telefone ou email..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <Link key={c.id} to={`/admin/clientes/${c.id}`} className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md hover:border-primary-200 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-5 h-5 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">{c.name}</p>
                  {c.email && <p className="text-xs text-gray-500 truncate">{c.email}</p>}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {c.phone}</p>
                {(c.city || c.state) && <p className="text-gray-600 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /> {c.city}/{c.state}</p>}
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                <span className="text-gray-500">{c.total_orders || 0} pedidos</span>
                <span className="font-medium text-primary-600">R$ {(c.total_spent || 0).toFixed(2).replace('.', ',')}</span>
              </div>
            </Link>
          ))}
        </div>
        {customers.length === 0 && <p className="text-center py-12 text-gray-500">Nenhum cliente encontrado</p>}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone *</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CPF</label>
                  <input type="text" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Endereço</label>
                  <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-field" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bairro</label>
                    <input type="text" value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cidade</label>
                    <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <input type="text" value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CEP</label>
                  <input type="text" value={form.zip_code} onChange={e => setForm({...form, zip_code: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="input-field" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="flex-1 btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
