import { useState, useEffect, useCallback } from 'react';
import { Package, MapPin, Phone, Search, CheckCircle2, Circle, AlertCircle, MessageSquare, Save } from 'lucide-react';

const API = '/api';

const STATUS_MAP = {
  ready: { label: 'Pronto', color: 'bg-blue-100 text-blue-700' },
  out_for_delivery: { label: 'Saiu para Entrega', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  preparing: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function DeliveryList({ driver }) {
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDeliveries = useCallback(async () => {
    let url = `${API}/drivers/${driver.id}/deliveries`;
    if (filter === 'active') url += '?status=out_for_delivery';
    else if (filter === 'pending') url += '?status=ready';
    else if (filter === 'delivered') url += '?status=delivered';
    const data = await fetch(url).then(r => r.json()).catch(() => []);
    setDeliveries(data);
  }, [driver.id, filter]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const openDelivery = async (delivery) => {
    setSelectedDelivery(delivery);
    setObservation(delivery.observation || '');

    const cl = await fetch(`${API}/deliveries/${delivery.id}/checklist`).then(r => r.json());
    setChecklist(cl.items || []);
  };

  const toggleChecklistItem = async (itemId, checked) => {
    await fetch(`${API}/deliveries/${selectedDelivery.id}/checklist/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !checked, driver_id: driver.id }),
    });
    setChecklist(prev => prev.map(i =>
      i.id === itemId ? { ...i, checked: !checked, checked_at: !checked ? new Date().toISOString() : null } : i
    ));
  };

  const saveObservation = async () => {
    setLoading(true);
    await fetch(`${API}/deliveries/${selectedDelivery.id}/observation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observation, driver_id: driver.id }),
    });
    setLoading(false);
  };

  const updateStatus = async (deliveryId, newStatus) => {
    const payload = { status: newStatus, driver_id: driver.id, notes: '' };
    try {
      await fetch(`${API}/deliveries/${deliveryId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchDeliveries();
      if (selectedDelivery?.id === deliveryId) setSelectedDelivery(null);
    } catch {
      alert('Erro ao atualizar status');
    }
  };

  const filtered = deliveries.filter(d =>
    d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.customer_address?.toLowerCase().includes(search.toLowerCase())
  );

  const filters = [
    { key: 'active', label: 'Em Entrega' },
    { key: 'pending', label: 'Prontas' },
    { key: 'delivered', label: 'Entregues' },
  ];

  if (selectedDelivery) {
    const st = STATUS_MAP[selectedDelivery.status] || { label: selectedDelivery.status, color: 'bg-gray-100 text-gray-700' };
    return (
      <div className="p-4 pb-24 space-y-4">
        <button onClick={() => setSelectedDelivery(null)} className="text-blue-700 font-medium flex items-center gap-1">
          ← Voltar
        </button>

        {/* Delivery Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-gray-800">Pedido #{selectedDelivery.order_id}</h2>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">{selectedDelivery.customer_name?.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{selectedDelivery.customer_name}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 flex-shrink-0" /> {selectedDelivery.customer_address}
              </p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Pré-entrega — Conferir Produtos
          </h3>
          {checklist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum item na lista</p>
          ) : (
            <div className="space-y-2">
              {checklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id, item.checked)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    item.checked ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {item.checked ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${item.checked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                      {item.item_name}
                    </p>
                    <p className="text-xs text-gray-400">Qtd: {item.item_quantity}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="w-4 h-4" />
            Toque em cada item para conferir
          </div>
        </div>

        {/* Observation */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Observação
          </h3>
          <textarea
            value={observation}
            onChange={e => setObservation(e.target.value)}
            placeholder="Algo a sinalizar sobre este pedido?"
            rows={3}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={saveObservation}
            disabled={loading}
            className="mt-3 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Salvando...' : 'Salvar Observação'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <a
            href={`tel:${selectedDelivery.customer_phone}`}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-4 rounded-xl flex items-center justify-center gap-2 font-medium"
          >
            <Phone className="w-5 h-5" /> Ligar
          </a>
          <a
            href={`https://wa.me/${selectedDelivery.customer_phone?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-4 rounded-xl flex items-center justify-center gap-2 font-medium"
          >
            <MessageSquare className="w-5 h-5" /> WhatsApp
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDelivery.customer_address || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-4 rounded-xl flex items-center justify-center gap-2 font-medium"
          >
            <MapPin className="w-5 h-5" /> Rota
          </a>
        </div>

        {/* Status Update */}
        {selectedDelivery.status === 'ready' && (
          <button
            onClick={() => updateStatus(selectedDelivery.id, 'out_for_delivery')}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg"
          >
            Saiu para Entrega
          </button>
        )}
        {selectedDelivery.status === 'out_for_delivery' && (
          <button
            onClick={() => updateStatus(selectedDelivery.id, 'delivered')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg"
          >
            <CheckCircle2 className="w-6 h-6" /> Confirmar Entrega
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente ou endereço..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma entrega encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(delivery => {
            const st = STATUS_MAP[delivery.status] || { label: delivery.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <button
                key={delivery.id}
                onClick={() => openDelivery(delivery)}
                className="w-full bg-white rounded-2xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800">#{delivery.order_id}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">{delivery.customer_name?.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{delivery.customer_name}</p>
                    <p className="text-xs text-gray-500 truncate">{delivery.customer_address}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
