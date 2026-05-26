import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, Check, Navigation, Camera, MessageSquare, Truck } from 'lucide-react';

const API_URL = '/api';

export default function DriverDeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [driver, setDriver] = useState(null);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('driver');
    if (!stored) {
      navigate('/entregador/login');
      return;
    }
    setDriver(JSON.parse(stored));
    fetchDelivery();
  }, [id]);

  // GPS Tracking
  useEffect(() => {
    if (!driver) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        setLocation({ lat: latitude, lng: longitude, accuracy, speed });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driver]);

  const fetchDelivery = async () => {
    const data = await fetch(`${API_URL}/deliveries/${id}/track`).then(res => res.json());
    setDelivery(data);
  };

  const updateStatus = async (newStatus) => {
    if (!confirm(`Confirmar: ${statusLabels[newStatus]}?`)) return;
    setUpdating(true);

    const payload = {
      status: newStatus,
      driver_id: driver.id,
      notes: notes,
    };

    if (location) {
      payload.lat = location.lat;
      payload.lng = location.lng;
    }

    try {
      await fetch(`${API_URL}/deliveries/${id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setNotes('');
      fetchDelivery();
    } catch (err) {
      alert('Erro ao atualizar');
    } finally {
      setUpdating(false);
    }
  };

  const openMaps = () => {
    if (location && delivery?.customer_address) {
      const dest = encodeURIComponent(delivery.customer_address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`, '_blank');
    }
  };

  if (!delivery || !driver) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Carregando...</div>;

  const statusLabels = {
    preparing: 'Preparando',
    ready: 'Pronto',
    out_for_delivery: 'Saiu para Entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  const statusFlow = ['preparing', 'ready', 'out_for_delivery', 'delivered'];
  const currentStep = statusFlow.indexOf(delivery.status);

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/entregador')} className="text-white/80 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Entrega #{delivery.id}</h1>
              <p className="text-blue-200 text-sm">Pedido #{delivery.order_id}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Progress */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-bold text-gray-800 mb-4">Status da Entrega</h2>
          <div className="flex items-center justify-between">
            {statusFlow.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  currentStep >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > i ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${currentStep > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {statusFlow.map(s => (
              <span key={s} className={`text-xs ${currentStep >= statusFlow.indexOf(s) ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                {statusLabels[s]}
              </span>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-bold text-gray-800 mb-4">Dados do Cliente</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">{delivery.customer_name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-bold text-gray-800">{delivery.customer_name}</p>
                <p className="text-sm text-gray-600">{delivery.customer_phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span>{delivery.customer_address}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <a href={`tel:${delivery.customer_phone}`} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <Phone className="w-5 h-5" /> Ligar
            </a>
            <a href={`https://wa.me/${delivery.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <MessageSquare className="w-5 h-5" /> WhatsApp
            </a>
            <button onClick={openMaps} className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <Navigation className="w-5 h-5" /> Rotas
            </button>
          </div>
        </div>

        {/* GPS Location */}
        {location && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              Sua Localização
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Latitude: {location.lat.toFixed(6)}</p>
              <p className="text-sm text-gray-600">Longitude: {location.lng.toFixed(6)}</p>
              <p className="text-sm text-gray-600">Precisão: ±{location.accuracy?.toFixed(0)}m</p>
              {location.speed && <p className="text-sm text-gray-600">Velocidade: {(location.speed * 3.6).toFixed(1)} km/h</p>}
            </div>
            <a
              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-blue-600 text-sm hover:text-blue-700"
            >
              Ver no Google Maps →
            </a>
          </div>
        )}

        {/* Order Items */}
        {delivery.items?.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Itens do Pedido
            </h2>
            <div className="space-y-2">
              {delivery.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-gray-700">{item.name} x{item.quantity || 1}</span>
                  <span className="font-medium text-sm">R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary-600">R$ {delivery.total?.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-bold text-gray-800 mb-4">Observações</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Adicione observações sobre a entrega..."
            rows={3}
            className="input-field"
          />
        </div>

        {/* Delivery History */}
        {delivery.updates?.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-gray-800 mb-4">Histórico</h2>
            <div className="space-y-3">
              {delivery.updates.map((update, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{statusLabels[update.status]}</p>
                    <p className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleString('pt-BR')}</p>
                    {update.notes && <p className="text-xs text-gray-600 mt-1">{update.notes}</p>}
                    {update.lat && (
                      <a
                        href={`https://www.google.com/maps?q=${update.lat},${update.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Ver localização →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Update Buttons */}
        {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-bold text-gray-800 mb-4">Atualizar Status</h2>
            <div className="grid grid-cols-2 gap-3">
              {delivery.status === 'ready' && (
                <button
                  onClick={() => updateStatus('out_for_delivery')}
                  disabled={updating}
                  className="btn-primary py-4 flex items-center justify-center gap-2 text-lg"
                >
                  <Truck className="w-6 h-6" />
                  {updating ? 'Enviando...' : 'Saiu para Entrega'}
                </button>
              )}
              {delivery.status === 'out_for_delivery' && (
                <button
                  onClick={() => updateStatus('delivered')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 text-lg"
                >
                  <Check className="w-6 h-6" />
                  {updating ? 'Enviando...' : 'Confirmar Entrega'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Delivered Badge */}
        {delivery.status === 'delivered' && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700">Entrega Concluída!</h2>
            <p className="text-green-600 mt-2">Entregue em {delivery.delivered_date ? new Date(delivery.delivered_date).toLocaleString('pt-BR') : 'data não registrada'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
