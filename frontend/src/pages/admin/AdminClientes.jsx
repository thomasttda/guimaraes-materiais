import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Search, X, ShoppingCart, Eye } from 'lucide-react';

const API_URL = '/api';

export default function AdminClientes() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', cpf: '', address: '', neighborhood: '', city: '', state: '', zip_code: '', notes: '' });

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    let url = `${API_URL}/customers`;
    if (search) url += `?search=${search}`;
    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setCustomers(data);
  };

  const fetchCustomerDetail = async (id) => {
    const data = await fetch(`${API_URL}/customers/${id}`).then(res => res.json());
    setSelected(data);
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
    } catch (err) { alert('Erro ao salvar'); }
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

        {/* Customer Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <button onClick={() => setSelected(null)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div><p className="text-sm text-gray-500">Telefone</p><p className="font-medium">{selected.phone}</p></div>
                  <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{selected.email || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">CPF</p><p className="font-medium">{selected.cpf || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Total Pedidos</p><p className="font-medium">{selected.total_orders}</p></div>
                  <div><p className="text-sm text-gray-500">Total Gasto</p><p className="font-medium text-primary-600">R$ {selected.total_spent?.toFixed(2).replace('.', ',')}</p></div>
                  <div><p className="text-sm text-gray-500">Endereço</p><p className="font-medium">{selected.address}, {selected.neighborhood} - {selected.city}/{selected.state}</p></div>
                </div>
                {selected.orders?.length > 0 && (
                  <div>
                    <h3 className="font-bold mb-3">Histórico de Pedidos</h3>
                    <div className="space-y-2">
                      {selected.orders.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">#{o.id}</p>
                            <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-600">R$ {o.total.toFixed(2).replace('.', ',')}</p>
                            <p className="text-xs text-gray-500">{o.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customers Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Telefone</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cidade</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Pedidos</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Total Gasto</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{c.phone}</td>
                    <td className="px-4 py-3 text-sm">{c.city}/{c.state}</td>
                    <td className="px-4 py-3 text-sm">{c.total_orders}</td>
                    <td className="px-4 py-3 text-sm font-medium text-primary-600">R$ {c.total_spent?.toFixed(2).replace('.', ',')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => fetchCustomerDetail(c.id)} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setEditing(c.id); setForm({ name: c.name, email: c.email, phone: c.phone, cpf: c.cpf, address: c.address, neighborhood: c.neighborhood, city: c.city, state: c.state, zip_code: c.zip_code, notes: c.notes }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {customers.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum cliente encontrado</p>}
        </div>
      </div>
    </div>
  );
}
