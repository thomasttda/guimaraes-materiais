import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Truck, Check, Clock, MapPin, Phone, X, User, Navigation, UserCheck } from 'lucide-react';

const API_URL = '/api';

export default function AdminEntregas() {
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ driver_name: '', driver_phone: '', estimated_date: '', notes: '', tracking_code: '' });

  useEffect(() => {
    fetchData();
    fetchDrivers();
  }, [filter]);

  const fetchData = async () => {
    let url = `${API_URL}/deliveries`;
    if (filter !== 'all') url += `?status=${filter}`;
    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setDeliveries(data);
  };

  const fetchDrivers = async () => {
    const data = await fetch(`${API_URL}/drivers?active=true`).then(res => res.json()).catch(() => []);
    setDrivers(data);
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API_URL}/deliveries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchData();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const assignDriver = async (deliveryId, driverId) => {
    await fetch(`${API_URL}/deliveries/${deliveryId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: driverId })
    });
    setShowAssign(false);
    fetchData();
  };

  const updateDelivery = async (id) => {
    await fetch(`${API_URL}/deliveries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    fetchData();
    setShowForm(false);
  };

  const statusLabels = { preparing: 'Preparando', ready: 'Pronto', out_for_delivery: 'Saiu para Entrega', delivered: 'Entregue', cancelled: 'Cancelado' };
  const statusColors = { preparing: 'bg-yellow-100 text-yellow-800', ready: 'bg-blue-100 text-blue-800', out_for_delivery: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };
  const statusFlow = ['preparing', 'ready', 'out_for_delivery', 'delivered'];

  const pendingCount = deliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length;
  const unassignedCount = deliveries.filter(d => !d.driver_id && d.status !== 'delivered').length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Entregas</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{pendingCount} pendentes</span>
            {unassignedCount > 0 && (
              <span className="text-sm text-orange-600 font-medium">{unassignedCount} sem motorista</span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[['all', 'Todas'], ['preparing', 'Preparando'], ['ready', 'Pronto'], ['out_for_delivery', 'Em Entrega'], ['delivered', 'Entregues']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === val ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border'}`}>{label}</button>
          ))}
        </div>

        {/* Assign Modal */}
        {showAssign && selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Atribuir Motorista</h2>
                <button onClick={() => setShowAssign(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Entrega #{selected.order_id} - {selected.customer_name}</p>
                <div className="space-y-3">
                  {drivers.map(d => (
                    <button
                      key={d.id}
                      onClick={() => assignDriver(selected.id, d.id)}
                      className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border flex items-center gap-4"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{d.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-sm text-gray-500">{d.vehicle} • {d.license_plate}</p>
                      </div>
                      <Truck className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
                {drivers.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum motorista ativo</p>}
              </div>
            </div>
          </div>
        )}

        {/* Deliveries */}
        <div className="space-y-4">
          {deliveries.map(delivery => (
            <div key={delivery.id} className="card p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">#{delivery.order_id} - {delivery.customer_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[delivery.status]}`}>{statusLabels[delivery.status]}</span>
                  </div>
                  
                  {/* Driver Info - Prominent */}
                  {delivery.driver_id ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-blue-800">{delivery.driver_name}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-blue-600">
                          {delivery.driver_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {delivery.driver_phone}</span>}
                          {delivery.vehicle && <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {delivery.vehicle} {delivery.license_plate ? `• ${delivery.license_plate}` : ''}</span>}
                        </div>
                      </div>
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-medium">Motorista</span>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-orange-800">Sem motorista atribuído</p>
                        <p className="text-xs text-orange-600">Atribua um motorista para esta entrega</p>
                      </div>
                      <button onClick={() => { setSelected(delivery); setShowAssign(true); }} className="btn-primary text-xs py-1 px-3">
                        Atribuir
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {delivery.customer_address}</span>
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {delivery.customer_phone}</span>
                    {delivery.estimated_date && <span>📅 Prev: {new Date(delivery.estimated_date).toLocaleDateString('pt-BR')}</span>}
                  </div>

                  {/* Status Flow */}
                  <div className="flex items-center gap-2 mb-3">
                    {statusFlow.map((s, i) => (
                      <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          statusFlow.indexOf(delivery.status) >= i ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {statusFlow.indexOf(delivery.status) > i ? <Check className="w-4 h-4" /> : i + 1}
                        </div>
                        {i < statusFlow.length - 1 && <div className={`w-8 h-0.5 ${statusFlow.indexOf(delivery.status) > i ? 'bg-primary-500' : 'bg-gray-200'}`} />}
                      </div>
                    ))}
                  </div>

                  {delivery.notes && <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded"> {delivery.notes}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
                    <button onClick={() => updateStatus(delivery.id, statusFlow[statusFlow.indexOf(delivery.status) + 1])} className="btn-primary flex items-center gap-1 text-sm">
                      <Truck className="w-4 h-4" /> Avançar Status
                    </button>
                  )}
                  {!delivery.driver_id && delivery.status !== 'delivered' && (
                    <button onClick={() => { setSelected(delivery); setShowAssign(true); }} className="btn-secondary flex items-center gap-1 text-sm">
                      <UserCheck className="w-4 h-4" /> Atribuir Motorista
                    </button>
                  )}
                  <button onClick={() => { setSelected(selected?.id === delivery.id ? null : delivery); setForm({ driver_name: delivery.driver_name || '', driver_phone: delivery.driver_phone || '', estimated_date: delivery.estimated_date || '', notes: delivery.notes || '', tracking_code: delivery.tracking_code || '' }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {deliveries.length === 0 && <p className="text-center py-8 text-gray-500">Nenhuma entrega encontrada</p>}

        {/* Edit Modal */}
        {showForm && selected && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Editar Entrega #{selected.order_id}</h2>
                <button onClick={() => setShowForm(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Motorista</label>
                    <input type="text" value={form.driver_name} onChange={e => setForm({...form, driver_name: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tel. Motorista</label>
                    <input type="text" value={form.driver_phone} onChange={e => setForm({...form, driver_phone: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data Estimada</label>
                  <input type="date" value={form.estimated_date} onChange={e => setForm({...form, estimated_date: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código Rastreio</label>
                  <input type="text" value={form.tracking_code} onChange={e => setForm({...form, tracking_code: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="input-field" />
                </div>
                <button onClick={() => updateDelivery(selected.id)} className="btn-primary w-full">Salvar Alterações</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
