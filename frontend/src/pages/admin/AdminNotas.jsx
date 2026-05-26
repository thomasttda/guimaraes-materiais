import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, ShoppingCart, Eye, Download, Trash2, Search, Check, X } from 'lucide-react';

const API_URL = '/api';

export default function AdminNotas() {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchNotes();
  }, [filter, typeFilter]);

  const fetchNotes = async () => {
    let url = `${API_URL}/notes`;
    const params = new URLSearchParams();
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (filter !== 'all') params.set('status', filter);
    if (params.toString()) url += `?${params.toString()}`;
    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setNotes(data);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover esta nota?')) return;
    await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
    fetchNotes();
  };

  const filteredNotes = notes.filter(n =>
    n.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    n.number.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabels = {
    draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado',
    completed: 'Concluído', cancelled: 'Cancelado'
  };
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800', sent: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800', completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const totalSales = notes.filter(n => n.type === 'sale' && n.status === 'completed').reduce((s, n) => s + n.total, 0);
  const totalQuotes = notes.filter(n => n.type === 'quote').length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Orçamentos e Vendas</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/notas/nova" className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> Nova Nota
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{notes.length}</p>
            <p className="text-sm text-gray-500">Total de Notas</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalQuotes}</p>
            <p className="text-sm text-gray-500">Orçamentos</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">R$ {totalSales.toFixed(2).replace('.', ',')}</p>
            <p className="text-sm text-gray-500">Vendas Concluídas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <input type="text" placeholder="Cliente ou número..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field">
                <option value="all">Todos</option>
                <option value="quote">Orçamentos</option>
                <option value="sale">Vendas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field">
                <option value="all">Todos</option>
                <option value="draft">Rascunho</option>
                <option value="sent">Enviado</option>
                <option value="approved">Aprovado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          {filteredNotes.map(note => (
            <div key={note.id} className="card p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${note.type === 'quote' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {note.type === 'quote' ? <FileText className="w-6 h-6 text-blue-600" /> : <ShoppingCart className="w-6 h-6 text-green-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{note.number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[note.status]}`}>{statusLabels[note.status]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${note.type === 'quote' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                        {note.type === 'quote' ? 'Orçamento' : 'Venda'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{note.customer_name} • {note.customer_phone}</p>
                    <p className="text-xs text-gray-500">{new Date(note.created_at).toLocaleDateString('pt-BR')} • {note.items?.length || 0} itens</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-primary-600">R$ {note.total.toFixed(2).replace('.', ',')}</p>
                  <div className="flex gap-2">
                    <Link to={`/admin/notas/${note.id}`} className="text-blue-600 hover:text-blue-800 p-2"><Eye className="w-5 h-5" /></Link>
                    <a href={`${API_URL}/notes/${note.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 p-2"><Download className="w-5 h-5" /></a>
                    <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredNotes.length === 0 && <p className="text-center py-8 text-gray-500">Nenhuma nota encontrada</p>}
      </div>
    </div>
  );
}
