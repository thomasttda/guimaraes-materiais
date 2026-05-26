import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X, Tag, Check } from 'lucide-react';

const API_URL = '/api';

export default function AdminCupons() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_purchase: '', max_uses: '', valid_from: '', valid_until: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const data = await fetch(`${API_URL}/coupons`).then(res => res.json()).catch(() => []);
    setCoupons(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, discount_value: parseFloat(form.discount_value), min_purchase: parseFloat(form.min_purchase) || 0, max_uses: parseInt(form.max_uses) || 0 };
    try {
      if (editing) {
        await fetch(`${API_URL}/coupons/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch(`${API_URL}/coupons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      fetchData();
      resetForm();
    } catch (err) { alert('Erro ao salvar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este cupom?')) return;
    await fetch(`${API_URL}/coupons/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetForm = () => {
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_purchase: '', max_uses: '', valid_from: '', valid_until: '' });
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Cupons e Promoções</h1>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Novo Cupom
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editing ? 'Editar Cupom' : 'Novo Cupom'}</h2>
                <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Código *</label>
                    <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="input-field uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Desconto</label>
                    <select value={form.discount_type} onChange={e => setForm({...form, discount_type: e.target.value})} className="input-field">
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Valor do Desconto *</label>
                    <input type="number" step="0.01" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Compra Mínima (R$)</label>
                    <input type="number" step="0.01" value={form.min_purchase} onChange={e => setForm({...form, min_purchase: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Máx. Usos</label>
                    <input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Válido De</label>
                    <input type="date" value={form.valid_from} onChange={e => setForm({...form, valid_from: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Válido Até</label>
                    <input type="date" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} className="input-field" />
                  </div>
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
          {coupons.map(coupon => (
            <div key={coupon.id} className={`card p-6 ${!coupon.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary-500" />
                  <span className="text-xl font-bold text-primary-600">{coupon.code}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {coupon.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
              <div className="space-y-2 text-sm">
                <p>Desconto: <strong>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value.toFixed(2)}`}</strong></p>
                {coupon.min_purchase > 0 && <p>Compra mín: R$ {coupon.min_purchase.toFixed(2)}</p>}
                <p>Usos: {coupon.used_count} / {coupon.max_uses || '∞'}</p>
                {coupon.valid_until && <p>Válido até: {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}</p>}
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button onClick={() => { setEditing(coupon.id); setForm({ code: coupon.code, description: coupon.description, discount_type: coupon.discount_type, discount_value: coupon.discount_value.toString(), min_purchase: coupon.min_purchase.toString(), max_uses: coupon.max_uses.toString(), valid_from: coupon.valid_from || '', valid_until: coupon.valid_until || '' }); setShowForm(true); }} className="flex-1 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 text-sm py-2 border rounded-lg"><Edit2 className="w-4 h-4" /> Editar</button>
                <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-800 p-2 border rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
        {coupons.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum cupom cadastrado</p>}
      </div>
    </div>
  );
}
