import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Check, X } from 'lucide-react';

const API_URL = '/api';

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/quotes`).then(res => res.json()).then(setQuotes).catch(() => {});
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    completed: 'Concluído',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-bold text-gray-800">Orçamentos</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {quotes.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 text-lg">Nenhum orçamento recebido ainda</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {quotes.map(quote => (
              <div key={quote.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{quote.customer_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[quote.status]}`}>
                        {statusLabels[quote.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>📞 {quote.customer_phone}</span>
                      {quote.customer_email && <span> {quote.customer_email}</span>}
                      <span>📅 {new Date(quote.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {quote.message && <p className="text-sm text-gray-500 mt-2">💬 {quote.message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {quote.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(quote.id, 'approved')} className="btn-primary flex items-center gap-1 text-sm">
                          <Check className="w-4 h-4" /> Aprovar
                        </button>
                        <button onClick={() => updateStatus(quote.id, 'rejected')} className="py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm flex items-center gap-1">
                          <X className="w-4 h-4" /> Rejeitar
                        </button>
                      </>
                    )}
                    <button onClick={() => setSelected(selected?.id === quote.id ? null : quote)} className="text-gray-600 hover:text-primary-600">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {selected?.id === quote.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-3">Itens solicitados ({quote.items.length})</h4>
                    <div className="space-y-2">
                      {quote.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg">
                          <span>{item.name} {item.quantity && `x${item.quantity}`}</span>
                          <span className="font-medium">
                            {item.price ? `R$ ${(item.price * (item.quantity || 1)).toFixed(2).replace('.', ',')}` : 'A cotar'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
