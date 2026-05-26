import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, MapPin, Phone, Clock, Check, LogOut, Navigation, Package, AlertCircle } from 'lucide-react';

const API_URL = '/api';

export default function DriverDashboard() {
  const [driver, setDriver] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('active');
  const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('driver');
    if (!stored) {
      navigate('/entregador/login');
      return;
    }
    setDriver(JSON.parse(stored));
    fetchDeliveries(JSON.parse(stored));
  }, [filter]);

  // GPS Tracking
  useEffect(() => {
    if (!driver || !tracking) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        setLocation({ lat: latitude, lng: longitude, accuracy, speed });
        // Send location to server
        fetch(`${API_URL}/drivers/${driver.id}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: latitude, lng: longitude, accuracy, speed }),
        }).catch(() => {});
      },
      (err) => console.error('GPS Error:', err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driver, tracking]);

  const fetchDeliveries = async (d) => {
    let url = `${API_URL}/drivers/${d.id}/deliveries`;
    if (filter === 'active') url += '?status=out_for_delivery';
    else if (filter === 'pending') url += '?status=ready';
    else if (filter === 'delivered') url += '?status=delivered';
    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setDeliveries(data);
  };

  const updateStatus = async (deliveryId, newStatus) => {
    if (!confirm(`Confirmar status: ${statusLabels[newStatus]}?`)) return;

    const payload = {
      status: newStatus,
      driver_id: driver.id,
      notes: '',
    };

    // Include GPS if available
    if (location) {
      payload.lat = location.lat;
      payload.lng = location.lng;
    }

    try {
      await fetch(`${API_URL}/deliveries/${deliveryId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      fetchDeliveries(driver);
    } catch (err) {
      alert('Erro ao atualizar status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driver');
    navigate('/entregador/login');
  };

  const statusLabels = {
    preparing: 'Preparando',
    ready: 'Pronto',
    out_for_delivery: 'Saiu para Entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  const statusColors = {
    preparing: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-blue-100 text-blue-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const nextStatus = {
    ready: 'out_for_delivery',
    out_for_delivery: 'delivered',
  };

  if (!driver) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Carregando...</div>;

  const activeDeliveries = deliveries.filter(d => d.status === 'out_for_delivery').length;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{driver.name}</h1>
                <p className="text-blue-200 text-sm">{driver.vehicle} • {driver.license_plate}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-white/80 hover:text-white">
              <LogOut className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{activeDeliveries}</p>
              <p className="text-xs text-blue-200">Em Entrega</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{driver.total_deliveries || 0}</p>
              <p className="text-xs text-blue-200">Total Entregas</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{deliveries.length}</p>
              <p className="text-xs text-blue-200">Atribuídas</p>
            </div>
          </div>

          {/* GPS Status */}
          <div className="mt-4 flex items-center justify-between bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Navigation className={`w-5 h-5 ${tracking ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
              <span className="text-sm">{tracking ? 'Rastreamento ativo' : 'Rastreamento desativado'}</span>
            </div>
            <button
              onClick={() => setTracking(!tracking)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${tracking ? 'bg-green-500 text-white' : 'bg-white/20 text-white'}`}
            >
              {tracking ? 'Desativar' : 'Ativar GPS'}
            </button>
          </div>

          {location && (
            <div className="mt-2 text-xs text-blue-200">
              📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)} (±{location.accuracy?.toFixed(0)}m)
            </div>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[['active', 'Em Entrega'], ['pending', 'Prontas'], ['delivered', 'Entregues'], ['all', 'Todas']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${filter === val ? 'bg-blue-700 text-white' : 'bg-white text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries List */}
      <div className="max-w-4xl mx-auto px-4 space-y-4">
        {deliveries.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma entrega {filter === 'active' ? 'em andamento' : 'neste filtro'}</p>
          </div>
        ) : (
          deliveries.map(delivery => (
            <div key={delivery.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Status Header */}
              <div className={`px-4 py-3 ${statusColors[delivery.status]} flex items-center justify-between`}>
                <span className="font-bold text-sm">Pedido #{delivery.order_id}</span>
                <span className="text-xs font-medium">{statusLabels[delivery.status]}</span>
              </div>

              <div className="p-4">
                {/* Customer Info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">{delivery.customer_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{delivery.customer_name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {delivery.customer_address}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" /> {delivery.customer_phone}
                    </p>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-bold text-primary-600">R$ {delivery.order_total?.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {delivery.estimated_date && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Previsão:</span>
                      <span className="font-medium">{new Date(delivery.estimated_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                {delivery.items?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Itens do pedido:</p>
                    <div className="space-y-1">
                      {delivery.items.slice(0, 3).map((item, i) => (
                        <p key={i} className="text-sm text-gray-700">• {item.name} x{item.quantity || 1}</p>
                      ))}
                      {delivery.items.length > 3 && (
                        <p className="text-xs text-gray-500">+{delivery.items.length - 3} itens...</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/entregador/entrega/${delivery.id}`}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Ver Detalhes
                  </Link>

                  {nextStatus[delivery.status] && (
                    <button
                      onClick={() => updateStatus(delivery.id, nextStatus[delivery.status])}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4" />
                      {statusLabels[nextStatus[delivery.status]]}
                    </button>
                  )}

                  {/* Call customer */}
                  <a
                    href={`tel:${delivery.customer_phone}`}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                  >
                    <Phone className="w-5 h-5" />
                  </a>

                  {/* Open maps */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.customer_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
                  >
                    <MapPin className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
