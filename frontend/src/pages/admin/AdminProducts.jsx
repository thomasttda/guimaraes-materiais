import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Search, X, Tag, Check } from 'lucide-react';

const API_URL = '/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', editName: null });
  const [catRefresh, setCatRefresh] = useState(0);
  const [form, setForm] = useState({
    name: '', description: '', price: '', unit: 'UND', category: '', featured: false, stock: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/categories`).then(res => res.json()).then(setCategories).catch(() => {});
  }, [catRefresh]);

  const fetchProducts = () => {
    fetch(`${API_URL}/products`).then(res => res.json()).then(setProducts).catch(() => {});
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };

    try {
      if (editing) {
        await fetch(`${API_URL}/products/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      fetchProducts();
      resetForm();
    } catch (err) {
      alert('Erro ao salvar produto');
    }
  };

  const handleEdit = (product) => {
    setEditing(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      unit: product.unit,
      category: product.category,
      featured: product.featured === 1,
      stock: product.stock,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este produto?')) return;
    try {
      await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      alert('Erro ao remover produto');
    }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', unit: 'UND', category: '', featured: false, stock: 0 });
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Gerenciar Produtos</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCatModal(true)} className="py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm">
              <Tag className="w-4 h-4" /> Categorias
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> Novo Produto
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Preço *</label>
                    <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unidade</label>
                    <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="input-field">
                      <option value="UND">Unidade</option>
                      <option value="SACO">Saco</option>
                      <option value="BAR">Barra</option>
                      <option value="LAT">Lata</option>
                      <option value="BAL">Balde</option>
                      <option value="ROL">Rolo</option>
                      <option value="M²">M²</option>
                      <option value="M">Metro</option>
                      <option value="KG">Kg</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria *</label>
                  <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required className="input-field" list="categories-list" />
                  <datalist id="categories-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Estoque</label>
                    <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="input-field" />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-5 h-5" />
                      <span className="text-sm font-medium">Destaque</span>
                    </label>
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

        {/* Category Management Modal */}
        {showCatModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Gerenciar Categorias</h2>
                <button onClick={() => { setShowCatModal(false); setCatForm({ name: '', editName: null }); }}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="p-4 border-b flex gap-2">
                <input type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="Nova categoria..." className="input-field flex-1" />
                <button onClick={async () => {
                  if (!catForm.name.trim()) return;
                  try {
                    if (catForm.editName) {
                      await fetch(`${API_URL}/categories/${encodeURIComponent(catForm.editName)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newName: catForm.name }) });
                    } else {
                      await fetch(`${API_URL}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catForm.name }) });
                    }
                    setCatForm({ name: '', editName: null });
                    setCatRefresh(c => c + 1);
                  } catch { alert('Erro ao salvar categoria'); }
                }} className="btn-primary whitespace-nowrap">
                  <Check className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                      {catForm.editName === cat ? (
                        <input type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="input-field flex-1 mr-2" autoFocus />
                      ) : (
                        <span className="font-medium text-sm">{cat}</span>
                      )}
                      <div className="flex items-center gap-2">
                        {catForm.editName === cat ? (
                          <>
                            <button onClick={() => setCatForm({ name: '', editName: null })} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setCatForm({ name: cat, editName: cat })} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={async () => {
                              if (!confirm(`Remover categoria "${cat}"?`)) return;
                              try {
                                await fetch(`${API_URL}/categories/${encodeURIComponent(cat)}`, { method: 'DELETE' });
                                setCatRefresh(c => c + 1);
                              } catch { alert('Erro ao remover categoria'); }
                            }} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-center py-8 text-gray-500">Nenhuma categoria</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Produto</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Categoria</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Preço</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estoque</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Destaque</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{product.description}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">{product.category}</span></td>
                    <td className="px-4 py-3 font-medium">R$ {product.price.toFixed(2).replace('.', ',')}</td>
                    <td className="px-4 py-3">
                      <span className={product.stock < 20 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.featured ? <span className="text-yellow-500">★</span> : <span className="text-gray-300">☆</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum produto encontrado</p>}
        </div>
      </div>
    </div>
  );
}
