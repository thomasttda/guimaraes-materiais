import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Download, FileText, DollarSign, Search, User, Phone, Calendar } from 'lucide-react';

const API_URL = '/api';

export default function AdminFiado() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFiado();
  }, []);

  const fetchFiado = async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API_URL}/notes?payment_method=Fiado`).then(r => r.json());
      setNotes(data.filter(n => n.status !== 'cancelled'));
    } catch {}
    setLoading(false);
  };

  const totalFiado = notes.reduce((s, n) => s + (n.total || 0), 0);

  const filtered = notes.filter(n =>
    (n.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.number || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.customer_phone || '').includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Vendas Fiado</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{notes.length}</p>
            <p className="text-sm text-gray-500">Notas Fiado em Aberto</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">R$ {totalFiado.toFixed(2).replace('.', ',')}</p>
            <p className="text-sm text-gray-500">Valor Total a Receber</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">R$ {totalFiado > 0 ? (totalFiado / notes.length).toFixed(2).replace('.', ',') : '0,00'}</p>
            <p className="text-sm text-gray-500">Média por Nota</p>
          </div>
        </div>

        {/* Search */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar por cliente, telefone ou número..." value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center text-gray-500 py-12">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12">Nenhuma venda fiado encontrada</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(note => (
              <div key={note.id} className="card p-4 border-l-4 border-purple-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{note.number || `#${note.id}`}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Fiado</span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-1"><User className="w-3.5 h-3.5" /> {note.customer_name || 'Consumidor'} {note.customer_phone && <><Phone className="w-3.5 h-3.5 ml-1" /> {note.customer_phone}</>}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(note.created_at).toLocaleDateString('pt-BR')} • {note.items?.length || 0} itens</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-purple-600">R$ {note.total.toFixed(2).replace('.', ',')}</p>
                    <Link to={`/admin/notas/${note.id}`} className="text-blue-600 hover:text-blue-800 p-2"><Eye className="w-5 h-5" /></Link>
                    <a href={`${API_URL}/notes/${note.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 p-2" title="PDF"><Download className="w-5 h-5" /></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}