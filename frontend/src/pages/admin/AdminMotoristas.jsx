import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Search, X, Truck, Phone, MapPin, UserCheck, Navigation, Map, Clock } from 'lucide-react';

const API_URL = '/api';

export default function AdminMotoristas() {
  const [drivers, setDrivers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', phone: '', email: '', cpf: '', cnh: '', vehicle: '', license_plate: '', password: '123456' });

  useEffect(() => {
    fetchDrivers();
    fetchDeliveries();
  }, []);

  const fetchDrivers = async () => {
    const data = await fetch(`${API_URL}/drivers`).then(res => res.json()).catch(() => []);
    setDrivers(data);
  };

  const fetchDeliveries = async () => {
    const data = await fetch(`${API_URL}/deliveries`).then(res => res.json()).catch(() => []);
    setDeliveries(data.filter(d => !d.driver_id || d.status === 'preparing'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await fetch(`${API_URL}/drivers/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch(`${API_URL}/drivers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      fetchDrivers();
      resetForm();
    } catch (err) { alert('Erro ao salvar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este entregador?')) return;
    await fetch(`${API_URL}/drivers/${id}`, { method: 'DELETE' });
    fetchDrivers();
  };

  const handleAssign = async (driverId) => {
    if (!selectedDelivery) return;
    await fetch(`${API_URL}/deliveries/${selectedDelivery.id}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: driverId }),
    });
    setShowAssign(false);
    setSelectedDelivery(null);
    fetchDeliveries();
  };

  const resetForm = () => {
    setForm({ name: '', username: '', phone: '', email: '', cpf: '', cnh: '', vehicle: '', license_plate: '', password: '123456' });
    setEditing(null);
    setShowForm(false);
  };

  const openDriverMap = (driver) => {
    setSelectedDriver(driver);
    setShowMap(true);
  };

  const closeDriverMap = () => {
    setShowMap(false);
    setSelectedDriver(null);
  };

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Motoristas / Entregadores</h1>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/monitor" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
              <Map className="w-4 h-4" /> Monitorar
            </Link>
            <Link to="/admin/logs-motoristas" className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4" /> Logs
            </Link>
            <button onClick={() => { setSelectedDelivery(null); setShowAssign(true); }} className="btn-secondary flex items-center gap-2">
              <UserCheck className="w-5 h-5" /> Atribuir Entrega
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> Novo Motorista
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{drivers.length}</p>
            <p className="text-sm text-gray-500">Motoristas</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{drivers.filter(d => d.active).length}</p>
            <p className="text-sm text-gray-500">Ativos</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{deliveries.length}</p>
            <p className="text-sm text-gray-500">Entregas Pendentes</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{drivers.reduce((s, d) => s + (d.total_deliveries || 0), 0)}</p>
            <p className="text-sm text-gray-500">Total Entregas</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editing ? 'Editar Motorista' : 'Novo Motorista'}</h2>
                <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usuário (login) *</label>
                  <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required className="input-field" placeholder="thiago.motorista" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone *</label>
                    <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">CPF</label>
                    <input type="text" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CNH</label>
                    <input type="text" value={form.cnh} onChange={e => setForm({...form, cnh: e.target.value})} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Veículo</label>
                    <input type="text" value={form.vehicle} onChange={e => setForm({...form, vehicle: e.target.value})} className="input-field" placeholder="Ex: Fiorino 2020" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Placa</label>
                    <input type="text" value={form.license_plate} onChange={e => setForm({...form, license_plate: e.target.value.toUpperCase()})} className="input-field uppercase" placeholder="ABC-1234" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Senha</label>
                  <input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="input-field" />
                  <p className="text-xs text-gray-500 mt-1">Padrão: 123456</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="flex-1 btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssign && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">Atribuir Entrega</h2>
                <button onClick={() => { setShowAssign(false); setSelectedDelivery(null); }}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="p-6">
                {!selectedDelivery ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">Selecione uma entrega para atribuir:</p>
                    <div className="space-y-3">
                      {deliveries.map(d => (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDelivery(d)}
                          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">#{d.order_id} - {d.customer_name}</span>
                            <span className="text-sm text-gray-500">{d.customer_address?.substring(0, 30)}...</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {deliveries.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma entrega pendente</p>}
                  </div>
                ) : (
                  <div>
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="font-bold">Entrega #{selectedDelivery.order_id}</p>
                      <p className="text-sm text-gray-600">{selectedDelivery.customer_name} - {selectedDelivery.customer_address}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Selecione o motorista:</p>
                    <div className="space-y-3">
                      {drivers.filter(d => d.active).map(d => (
                        <button
                          key={d.id}
                          onClick={() => handleAssign(d.id)}
                          className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 border flex items-center gap-4"
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">{d.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{d.name}</p>
                            <p className="text-sm text-gray-500">{d.vehicle} • {d.license_plate}</p>
                            <p className="text-xs text-gray-400">{d.total_deliveries || 0} entregas realizadas</p>
                          </div>
                          <Truck className="w-5 h-5 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Drivers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map(d => (
            <div key={d.id} className={`card p-6 ${!d.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xl">{d.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{d.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {d.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {d.phone}</p>
                {d.vehicle && <p className="flex items-center gap-2"><Truck className="w-4 h-4" /> {d.vehicle} • {d.license_plate}</p>}
                {d.cnh && <p className="text-xs">CNH: {d.cnh}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{d.total_deliveries || 0}</p>
                  <p className="text-xs text-gray-500">Entregas</p>
                </div>
                <button
                  onClick={() => openDriverMap(d)}
                  className="bg-gray-50 rounded-lg p-3 text-center hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <p className="text-xl font-bold text-green-600">{d.current_lat ? '📍' : '—'}</p>
                  <p className="text-xs text-gray-500">Ver no Mapa</p>
                </button>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Link to={`/admin/motorista/${d.id}`} className="flex-1 text-blue-600 hover:text-blue-800 text-center py-2 border rounded-lg text-sm">Ver Detalhes</Link>
                <button onClick={() => { setEditing(d.id); setForm({ name: d.name, phone: d.phone, email: d.email || '', cpf: d.cpf || '', cnh: d.cnh || '', vehicle: d.vehicle || '', license_plate: d.license_plate || '', password: d.password }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 p-2 border rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:text-red-800 p-2 border rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
        {filteredDrivers.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum motorista encontrado</p>}

        {/* Map Slide-Up */}
        {showMap && selectedDriver && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/50" onClick={closeDriverMap}></div>
            <div className="relative bg-white w-full rounded-t-3xl overflow-hidden animate-slide-up" style={{ maxHeight: '85vh' }}>
              {/* Header */}
              <div className="bg-blue-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="font-bold text-lg">{selectedDriver.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{selectedDriver.name}</h3>
                      <p className="text-blue-200 text-sm">{selectedDriver.vehicle} • {selectedDriver.license_plate}</p>
                    </div>
                  </div>
                  <button onClick={closeDriverMap} className="p-2 hover:bg-white/20 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Driver Info Bar */}
              <div className="bg-gray-50 px-4 py-3 flex items-center gap-4 text-sm border-b">
                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {selectedDriver.phone}</span>
                <span className="flex items-center gap-1"><Navigation className="w-4 h-4" /> {selectedDriver.total_deliveries || 0} entregas</span>
                {selectedDriver.last_location_update && (
                  <span className="text-gray-500">Atualizado: {new Date(selectedDriver.last_location_update).toLocaleTimeString('pt-BR')}</span>
                )}
              </div>

              {/* Map Container */}
              <div className="relative" style={{ height: '60vh' }}>
                <iframe
                  title={`Mapa - ${selectedDriver.name}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedDriver.current_lng - 0.005}%2C${selectedDriver.current_lat - 0.003}%2C${selectedDriver.current_lng + 0.005}%2C${selectedDriver.current_lat + 0.003}&layer=mapnik&marker=${selectedDriver.current_lat}%2C${selectedDriver.current_lng}`}
                  style={{ border: 0 }}
                />
                {/* Address Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">Localização Atual</p>
                      <p className="text-sm text-gray-600">Rua D - Iguape</p>
                      <p className="text-sm text-gray-500">Ilhéus, BA | CEP 45658-446</p>
                      <p className="text-xs text-gray-400 mt-1">Lat: {selectedDriver.current_lat?.toFixed(4)} | Lng: {selectedDriver.current_lng?.toFixed(4)}</p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedDriver.current_lat},${selectedDriver.current_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Map className="w-4 h-4" /> Abrir
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
