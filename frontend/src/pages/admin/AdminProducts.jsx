import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, Search, X, Tag, Check, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockFile, setStockFile] = useState(null);
  const [stockPreview, setStockPreview] = useState([]);
  const stockItemsRef = useRef([]);
  const [stockValid, setStockValid] = useState(null);
  const [stockSending, setStockSending] = useState(false);
  const [stockResult, setStockResult] = useState(null);
  const [stockCreateMissing, setStockCreateMissing] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', price: '', unit: 'UND', category: '', featured: false, stock: 0, min_stock: 10, image: '',
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
    const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0, min_stock: parseInt(form.min_stock) || 10 };

    try {
      const url = editing ? `${API_URL}/products/${editing}` : `${API_URL}/products`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Erro desconhecido' })); alert(err.error || err.detail || 'Erro ao salvar produto'); return; }
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
      min_stock: product.min_stock || 10,
      image: product.image || '',
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
    setForm({ name: '', description: '', price: '', unit: 'UND', category: '', featured: false, stock: 0, min_stock: 10, image: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleExport = () => {
    const data = products.map((p, i) => ({
      '#': i + 1,
      Nome: p.name,
      Descricao: p.description || '',
      Preco: p.price,
      Unidade: p.unit,
      Categoria: p.category,
      Estoque: p.stock,
      Destaque: p.featured ? 'Sim' : 'Nao'
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    XLSX.writeFile(wb, 'produtos.xlsx');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws);
          const products = rows.map(row => {
            const name = (row['Nome'] || row['nome'] || '').toString().trim();
            if (!name) return null;
            let price = parseFloat(row['Preco'] || row['preco'] || 0);
            if (isNaN(price)) price = 0;
            return {
              name,
              description: (row['Descricao'] || row['descricao'] || '').toString().trim(),
              price,
              unit: (row['Unidade'] || row['unidade'] || 'UND').toString().trim(),
              category: (row['Categoria'] || row['categoria'] || '').toString().trim(),
              stock: parseInt(row['Estoque'] || row['estoque'] || 0) || 0
            };
          }).filter(Boolean);
          if (products.length === 0) { alert('Nenhum produto válido na planilha'); return; }
          const res = await fetch(`${API_URL}/products/bulk-import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
          alert(data.message);
          fetchProducts();
        } catch (err) { alert('Erro ao importar: ' + err.message); }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
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
            <button onClick={handleExport} className="py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button onClick={handleImport} className="py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm">
              <Upload className="w-4 h-4" /> Importar
            </button>
            <button onClick={() => { stockItemsRef.current = []; setStockFile(null); setStockPreview([]); setStockValid(null); setStockResult(null); setShowStockModal(true); }} className="py-2 px-3 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1 text-sm">
              <Upload className="w-4 h-4" /> Atualizar Estoque
            </button>
            <button onClick={async () => {
              if (!confirm('Tem certeza que deseja EXCLUIR TODOS OS PRODUTOS? Essa ação não pode ser desfeita.')) return;
              if (!confirm('CONFIRMA NOVAMENTE? Todos os produtos serão permanentemente removidos.')) return;
              try {
                const res = await fetch(`${API_URL}/products/delete-all`, { method: 'POST' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                alert(`${data.message}`);
                fetchProducts();
              } catch (err) {
                alert('Erro ao excluir: ' + err.message);
              }
            }} className="py-2 px-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 text-sm">
              <Trash2 className="w-4 h-4" /> Excluir Todos
            </button>
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
                <div>
                  <label className="block text-sm font-medium mb-1">Imagem</label>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => setForm({...form, image: ev.target.result});
                        reader.readAsDataURL(file);
                      }} className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                      {form.image && <button type="button" onClick={() => setForm({...form, image: ''})} className="text-xs text-red-600 hover:text-red-800 mt-1">Remover imagem</button>}
                    </div>
                    {form.image && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
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
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Estoque</label>
                    <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estoque Mínimo</label>
                    <input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} className="input-field" title="Abaixo desse valor, um alerta de reposição será disparado" />
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

        {/* Stock Update Modal */}
        {showStockModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Atualizar Estoque</h2>
                <button onClick={() => setShowStockModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                {!stockResult ? (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50" onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.xlsx,.xls';
                      input.onchange = (e) => {
                        const f = e.target.files[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          try {
                            const wb = XLSX.read(ev.target.result, { type: 'array' });
                            const ws = wb.Sheets[wb.SheetNames[0]];
                            const rows = XLSX.utils.sheet_to_json(ws);
                            const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
                            const hasNome = cols.some(c => /nome/i.test(c));
                            const hasEstoque = cols.some(c => /estoque/i.test(c));
                            if (!hasNome || !hasEstoque) {
                              setStockValid(false);
                              setStockPreview([]);
                              setStockFile(null);
                              return;
                            }
                            const items = rows.map(r => ({
                              name: String(r['Nome'] || r['nome'] || '').trim(),
                              stock: parseInt(r['Estoque'] || r['estoque'] || 0) || 0
                            })).filter(i => i.name);
                            stockItemsRef.current = items;
                            setStockFile(f);
                            setStockValid(true);
                            setStockPreview(items.slice(0, 10));
                          } catch { setStockValid(false); }
                        };
                        reader.readAsArrayBuffer(f);
                      };
                      input.click();
                    }}>
                      {stockFile ? (
                        <p className="font-medium text-primary-600">{stockFile.name}</p>
                      ) : (
                        <div className="text-gray-400">
                          <Upload className="w-10 h-10 mx-auto mb-2" />
                          <p>Clique para selecionar planilha</p>
                          <p className="text-xs mt-1">Formatos: .xlsx, .xls</p>
                        </div>
                      )}
                    </div>

                    {stockValid === false && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        Documento inválido — necessário colunas "Nome" e "Estoque".
                      </div>
                    )}

                    {stockValid === true && (
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                          Documento válido! {stockPreview.length} produto(s) lidos. {stockItemsRef.current.length > 10 && <span className="text-xs">(mostrando 10 de {stockItemsRef.current.length})</span>}
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input type="checkbox" checked={stockCreateMissing} onChange={e => setStockCreateMissing(e.target.checked)} className="rounded border-gray-300" />
                          Criar produtos não encontrados
                        </label>
                        {stockPreview.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 text-xs">
                            <p className="font-medium text-gray-600 mb-2">Amostra (primeiros {stockPreview.length}):</p>
                            {stockPreview.map((p, i) => (
                              <div key={i} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                                <span>{p.name}</span><span className="font-bold">{p.stock}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <button disabled={!stockValid || stockSending} onClick={async () => {
                      setStockSending(true);
                      const controller = new AbortController();
                      const timer = setTimeout(() => controller.abort(), 120000);
                      try {
                        const res = await fetch(`${API_URL}/products/stock/bulk`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ items: stockItemsRef.current, createMissing: stockCreateMissing }),
                          signal: controller.signal
                        });
                        clearTimeout(timer);
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
                        setStockResult(data);
                        fetchProducts();
                      } catch (err) {
                        setStockResult({ error: true, message: err.name === 'AbortError' ? 'Tempo excedido (120s) — verifique se o backend está online' : err.message || 'Erro ao enviar' });
                      }
                      setStockSending(false);
                    }} className={`w-full py-3 rounded-xl font-medium text-white ${stockValid && !stockSending ? 'bg-primary-500 hover:bg-primary-600' : 'bg-gray-300 cursor-not-allowed'}`}>
                      {stockSending ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Enviando...
                        </span>
                      ) : 'Enviar'}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    {stockResult.error ? (
                      <div className="text-red-600 font-medium mb-4">{stockResult.message || 'Erro ao atualizar estoque'}</div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="font-bold text-lg mb-2">Atualização Concluída!</h3>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span>Atualizados:</span><span className="font-bold text-green-600">{stockResult.updated}</span></div>
                  {stockResult.created !== undefined && <div className="flex justify-between"><span>Criados:</span><span className="font-bold text-blue-600">{stockResult.created}</span></div>}
                  <div className="flex justify-between"><span>Não encontrados:</span><span className="font-bold text-orange-600">{stockResult.notFound || 0}</span></div>
                  <div className="flex justify-between"><span>Total na planilha:</span><span className="font-bold">{(stockResult.updated || 0) + (stockResult.created || 0) + (stockResult.notFound || 0)}</span></div>
                        </div>
                        {stockResult.notFound > 0 && (
                          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-left text-orange-700 max-h-24 overflow-y-auto">
                            {stockResult.debug?.filter(d => d.status === 'not_found').map(d => <div key={d.name}>✕ {d.name}</div>)}
                          </div>
                        )}
                        <button onClick={() => { setShowStockModal(false); setStockResult(null); }} className="w-full mt-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-medium">Fechar</button>
                      </>
                    )}
                  </div>
                )}
              </div>
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Imagem</th>
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
                    <td className="px-4 py-2">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Sem img</div>
                      )}
                    </td>
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
