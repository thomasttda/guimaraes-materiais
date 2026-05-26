import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X, Building2, Phone, Mail, MapPin } from 'lucide-react';

const API_URL = '/api';

export default function AdminFornecedores() {
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', contact_name: '', phone: '', email: '', address: '', cnpj: '', notes: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const data = await fetch(`${API_URL}/suppliers`).then(res => res.json()).catch(() => []);
    setSuppliers(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await fetch(`${API_URL}/suppliers/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch(`${API_URL}/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      fetchData();
      resetForm();
    } catch (err) { alert('Erro ao salvar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este fornecedor?')) return;
    await fetch(`${API_URL}/suppliers/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetForm = () => {
    setForm({ name: '', contact_name: '', phone: '', email: '', address: '', cnpj: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Fornecedores</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Novo Fornecedor
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
                <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contato</label>
                    <input type="text" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CNPJ</label>
                    <input type="text" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Endereço</label>
                  <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-field" />
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className={`card p-6 ${!s.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{s.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{s.active ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {s.contact_name && <p className="flex items-center gap-2"><span className="w-4"></span> {s.contact_name}</p>}
                {s.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {s.phone}</p>}
                {s.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {s.email}</p>}
                {s.address && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {s.address}</p>}
                {s.cnpj && <p className="text-xs">CNPJ: {s.cnpj}</p>}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button onClick={() => { setEditing(s.id); setForm({ name: s.name, contact_name: s.contact_name, phone: s.phone, email: s.email, address: s.address, cnpj: s.cnpj, notes: s.notes }); setShowForm(true); }} className="flex-1 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 text-sm py-2 border rounded-lg"><Edit2 className="w-4 h-4" /> Editar</button>
                <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800 p-2 border rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
        {suppliers.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum fornecedor cadastrado</p>}
      </div>
    </div>
  );
}
