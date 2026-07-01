import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Download, Trash2, Search, Share2, FileText } from 'lucide-react';

const API_URL = '/api';

export default function AdminQuotes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchNotes();
  }, [statusFilter]);

  const fetchNotes = async () => {
    let url = `${API_URL}/notes?type=quote`;
    if (statusFilter !== 'all') url += `&status=${statusFilter}`;
    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setNotes(data);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este orçamento?')) return;
    await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
    fetchNotes();
  };

  const handleShare = async (note) => {
    const pdfUrl = `${window.location.origin}${API_URL}/notes/${note.id}/pdf`;
    const text = `Guimarães Materiais para Construção\nOrçamento: ${note.number}\nCliente: ${note.customer_name}\nTotal: R$ ${note.total.toFixed(2).replace('.', ',')}\n\n${pdfUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Orçamento ${note.number}`, text, url: pdfUrl }); return; } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredNotes = notes.filter(n =>
    n.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    n.number.toLowerCase().includes(search.toLowerCase())
  );

  const statusLabels = {
    draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado',
    confirmed: 'Confirmado', pending_approval: 'Pendente',
    completed: 'Concluído', cancelled: 'Cancelado'
  };
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800', sent: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800', confirmed: 'bg-green-100 text-green-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Orçamentos</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/notas/nova" state={{ initialType: 'quote' }} className="btn-primary flex items-center gap-2">
              <FileText className="w-5 h-5" /> Novo Orçamento
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{notes.length}</p>
            <p className="text-sm text-gray-500">Total de Orçamentos</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{notes.filter(n => n.status === 'approved' || n.status === 'confirmed' || n.status === 'completed').length}</p>
            <p className="text-sm text-gray-500">Aprovados</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{notes.filter(n => n.status === 'cancelled').length}</p>
            <p className="text-sm text-gray-500">Cancelados</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <input type="text" placeholder="Cliente ou número..." value={search} onChange={e => setSearch(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
                <option value="all">Todos</option>
                <option value="draft">Rascunho</option>
                <option value="sent">Enviado</option>
                <option value="approved">Aprovado</option>
                <option value="confirmed">Confirmado</option>
                <option value="pending_approval">Pendente</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredNotes.map(note => (
            <div key={note.id} className="card p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{note.number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[note.status]}`}>{statusLabels[note.status]}</span>
                    </div>
                    <p className="text-sm text-gray-600">{note.customer_name || 'Consumidor'} {note.customer_phone ? `• ${note.customer_phone}` : ''}</p>
                    <p className="text-xs text-gray-500">{new Date(note.created_at).toLocaleDateString('pt-BR')} • {note.items?.length || 0} itens{note.payment_method ? ` • ${note.payment_method}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-primary-600">R$ {note.total.toFixed(2).replace('.', ',')}</p>
                  <div className="flex gap-2">
                    <Link to={`/admin/notas/${note.id}`} className="text-blue-600 hover:text-blue-800 p-2"><Eye className="w-5 h-5" /></Link>
                    <a href={`${API_URL}/notes/${note.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 p-2" title="Baixar PDF"><Download className="w-5 h-5" /></a>
                    <button onClick={() => handleShare(note)} className="text-emerald-600 hover:text-emerald-800 p-2" title="Compartilhar via WhatsApp"><Share2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-800 p-2"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredNotes.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum orçamento encontrado</p>}
      </div>
    </div>
  );
}