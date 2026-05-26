import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Check, Truck } from 'lucide-react';

const API_URL = '/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/orders`).then(res => res.json()).then(setOrders).catch(() => {});
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (selected?.id === id) setSelected({ ...selected, status });
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    processing: 'Em separação',
    shipped: 'Enviado',
    completed: 'Entregue',
    cancelled: 'Cancelado',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Pedidos</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Receita Total</p>
            <p className="text-xl font-bold text-primary-600">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 text-lg">Nenhum pedido recebido ainda</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <div key={order.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">#{order.id} - {order.customer_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>📞 {order.customer_phone}</span>
                      {order.customer_email && <span>📧 {order.customer_email}</span>}
                      {order.customer_address && <span> {order.customer_address}</span>}
                      <span>📅 {new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-primary-600">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <button onClick={() => updateStatus(order.id, 'approved')} className="btn-primary flex items-center gap-1 text-sm">
                          <Check className="w-4 h-4" /> Aprovar
                        </button>
                      )}
                      {order.status === 'approved' && (
                        <button onClick={() => updateStatus(order.id, 'processing')} className="btn-secondary flex items-center gap-1 text-sm">
                          <Truck className="w-4 h-4" /> Separar
                        </button>
                      )}
                      <button onClick={() => setSelected(selected?.id === order.id ? null : order)} className="text-gray-600 hover:text-primary-600">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {selected?.id === order.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-3">Itens do Pedido ({order.items.length})</h4>
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg">
                          <span>{item.name} x{item.quantity || 1}</span>
                          <span className="font-medium">R$ {(item.price * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary-600">R$ {order.total.toFixed(2).replace('.', ',')}</span>
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
