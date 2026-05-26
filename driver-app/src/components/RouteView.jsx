import { useState, useEffect, useCallback } from 'react';
import { Route, MapPin, Phone, GripVertical, CheckCircle2, Clock, Truck, Navigation } from 'lucide-react';

const API = '/api';

const STATUS_MAP = {
  ready: { label: 'Pronto', color: 'bg-blue-100 text-blue-700' },
  out_for_delivery: { label: 'Saiu', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
};

export default function RouteView({ driver }) {
  const [deliveries, setDeliveries] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchRoute = useCallback(async () => {
    const data = await fetch(`${API}/drivers/${driver.id}/route`).then(r => r.json()).catch(() => []);
    setDeliveries(data);
  }, [driver.id]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  const moveItem = (index, direction) => {
    const newList = [...deliveries];
    const target = index + direction;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setDeliveries(newList);
  };

  const saveOrder = async () => {
    setSaving(true);
    const ids = deliveries.map(d => d.id);
    await fetch(`${API}/drivers/${driver.id}/route-order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delivery_ids: ids }),
    });
    setSaving(false);
  };

  const activeCount = deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length;
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;

  return (
    <div className="p-4 pb-24">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <Truck className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{activeCount}</p>
          <p className="text-xs text-gray-500">Pendentes</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-800">{deliveredCount}</p>
          <p className="text-xs text-gray-500">Entregues</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-700">Organize a ordem das entregas. Use os botões para reordenar.</p>
      </div>

      {/* Save Order Button */}
      {deliveries.length > 0 && (
        <button
          onClick={saveOrder}
          disabled={saving}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-4 transition-colors disabled:opacity-50"
        >
          <Route className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Ordem da Rota'}
        </button>
      )}

      {/* Deliveries ordered by route */}
      {deliveries.length === 0 ? (
        <div className="text-center py-16">
          <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma entrega na rota</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deliveries.map((delivery, index) => {
            const st = STATUS_MAP[delivery.status] || { label: delivery.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={delivery.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Position Number */}
                <div className={`px-4 py-2 flex items-center justify-between ${
                  delivery.status === 'delivered' ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      delivery.status === 'delivered' ? 'bg-green-500' : 'bg-blue-600'
                    }`}>
                      {delivery.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">Pedido #{delivery.order_id}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold">{delivery.customer_name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{delivery.customer_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{delivery.customer_address}</span>
                      </p>
                    </div>
                  </div>

                  {/* Order Total */}
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-bold text-blue-700">
                      R$ {(delivery.order_total || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {delivery.estimated_date && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Previsão:</span>
                      <span className="font-medium text-gray-700">
                        {new Date(delivery.estimated_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}

                  {/* Reorder Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg text-xs font-medium disabled:opacity-30"
                    >
                      ▲ Subir
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === deliveries.length - 1}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg text-xs font-medium disabled:opacity-30"
                    >
                      ▼ Descer
                    </button>
                    <a
                      href={`tel:${delivery.customer_phone}`}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.customer_address || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
                    >
                      <MapPin className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
