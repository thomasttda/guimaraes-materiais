import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, ShoppingBag, Clock, ChevronDown, ChevronUp, FileText, DollarSign, User } from 'lucide-react';

const API_URL = '/api';

const statusLabels = { draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado', completed: 'Concluído', cancelled: 'Cancelado' };
const statusColors = { draft: 'bg-gray-100 text-gray-800', sent: 'bg-blue-100 text-blue-800', approved: 'bg-green-100 text-green-800', completed: 'bg-purple-100 text-purple-800', cancelled: 'bg-red-100 text-red-800' };

export default function AdminClienteDetalhe() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState([]);
  const [logs, setLogs] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const c = await fetch(`${API_URL}/customers/${id}`).then(r => r.json()).catch(() => null);
      setCustomer(c);
      if (c?.phone) {
        const n = await fetch(`${API_URL}/notes?customer_phone=${encodeURIComponent(c.phone)}`).then(r => r.json()).catch(() => []);
        setNotes(n);
        if (n.length) {
          const ids = n.map(x => x.id).join(',');
          const l = await fetch(`${API_URL}/admin/activity-logs/admin?resource_type=note&resource_id=${ids}`).then(r => r.json()).catch(() => []);
          const grouped = {};
          l.forEach(log => {
            if (!grouped[log.resource_id]) grouped[log.resource_id] = [];
            grouped[log.resource_id].push(log);
          });
          setLogs(grouped);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const toggleExpand = (noteId) => setExpanded(prev => ({ ...prev, [noteId]: !prev[noteId] }));

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Carregando...</div>;
  if (!customer) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Cliente não encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/clientes" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">{customer.name}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Customer Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center"><ShoppingBag className="w-7 h-7 text-teal-600" /></div>
            <div>
              <h2 className="text-xl font-bold">{customer.name}</h2>
              <p className="text-gray-500 text-sm">Cliente desde {new Date(customer.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" /> {customer.phone}</div>
            <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" /> {customer.email || '-'}</div>
            <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-gray-400" /> {customer.city || customer.state ? `${customer.city || ''}/${customer.state || ''}` : '-'}</div>
            <div className="flex items-center gap-2 text-gray-600"><FileText className="w-4 h-4 text-gray-400" /> CPF: {customer.cpf || '-'}</div>
            <div className="flex items-center gap-2 text-gray-600"><DollarSign className="w-4 h-4 text-gray-400" /> Total gasto: <span className="font-medium text-primary-600">R$ {(customer.total_spent || 0).toFixed(2).replace('.', ',')}</span></div>
            <div className="flex items-center gap-2 text-gray-600"><ShoppingBag className="w-4 h-4 text-gray-400" /> {customer.total_orders || 0} pedidos</div>
          </div>
          {customer.address && <p className="mt-3 text-sm text-gray-600"><MapPin className="w-4 h-4 inline text-gray-400" /> {customer.address}{customer.neighborhood ? `, ${customer.neighborhood}` : ''}</p>}
        </div>

        {/* Notes History */}
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Histórico de Notas</h2>
        {notes.length === 0 ? (
          <p className="text-center py-8 text-gray-500 bg-white rounded-xl border">Nenhuma nota encontrada</p>
        ) : (
          <div className="space-y-4">
            {notes.map(note => {
              const noteLogs = logs[note.id] || [];
              const typeLabel = note.type === 'quote' ? 'Orçamento' : 'Venda';
              return (
                <div key={note.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  {/* Note Header */}
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(note.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${note.type === 'quote' ? 'bg-orange-100' : 'bg-green-100'}`}>
                        <FileText className={`w-5 h-5 ${note.type === 'quote' ? 'text-orange-600' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{note.number}</p>
                        <p className="text-xs text-gray-500">{typeLabel} • {new Date(note.created_at).toLocaleDateString('pt-BR')} • {note.attendant_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[note.status]}`}>{statusLabels[note.status]}</span>
                      <span className="font-bold text-primary-600">R$ {note.total.toFixed(2).replace('.', ',')}</span>
                      {expanded[note.id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expanded[note.id] && (
                    <div className="border-t px-4 py-4 space-y-4 bg-gray-50">
                      {/* Note Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-gray-500">Cliente:</span><p className="font-medium">{note.customer_name}</p></div>
                        <div><span className="text-gray-500">Telefone:</span><p className="font-medium">{note.customer_phone}</p></div>
                        {note.customer_email && <div><span className="text-gray-500">Email:</span><p className="font-medium">{note.customer_email}</p></div>}
                        <div><span className="text-gray-500">Vendedor:</span><p className="font-medium">{note.attendant_name || '-'}</p></div>
                        {note.payment_method && <div><span className="text-gray-500">Pagamento:</span><p className="font-medium">{note.payment_method}</p></div>}
                        {note.observations && <div className="col-span-2"><span className="text-gray-500">Obs:</span><p className="font-medium">{note.observations}</p></div>}
                      </div>

                      {/* Items */}
                      {Array.isArray(note.items) && note.items.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">ITENS</p>
                          <div className="space-y-1">
                            {note.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm bg-white px-3 py-2 rounded">
                                <span className="text-gray-700">{item.name}</span>
                                <span className="text-gray-500">{item.quantity}x R$ {(item.price || 0).toFixed(2).replace('.', ',')} = <span className="font-medium text-gray-800">R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status Logs */}
                      {noteLogs.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">HISTÓRICO DE STATUS</p>
                          <div className="space-y-1">
                            {noteLogs.map((log, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded">
                                <div className="w-2 h-2 rounded-full bg-primary-500" />
                                <span className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                                <span className="text-gray-600">{log.action === 'status_change' ? log.description : log.action}</span>
                                {log.user_name && <span className="text-xs text-gray-400">— {log.user_name}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Observações */}
        {customer.notes && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-800 mb-2">Observações</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{customer.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
