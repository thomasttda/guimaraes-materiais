import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Clock, Truck, AlertCircle, CheckCircle2, Filter, Download, Search, Play, Coffee, Utensils, LogOut, RotateCcw, MessageSquare } from 'lucide-react';

const API_URL = '/api';

const ACTION_LABELS = {
  'timeclock.entry': 'Entrada',
  'timeclock.lunch_start': 'Almoço',
  'timeclock.lunch_end': 'Retorno',
  'timeclock.exit': 'Saída',
  'timeclock.restart': 'Nova Jornada',
  'delivery.ready': 'Pronto',
  'delivery.out_for_delivery': 'Saiu p/ Entrega',
  'delivery.delivered': 'Entregue',
  'delivery.checklist': 'Checklist',
  'delivery.observation': 'Observação',
  'gps.stopped': 'Parada',
  'gps.driving': 'Em Movimento',
};

const ACTION_COLORS = {
  'timeclock.entry': 'bg-green-100 text-green-700',
  'timeclock.lunch_start': 'bg-yellow-100 text-yellow-700',
  'timeclock.lunch_end': 'bg-blue-100 text-blue-700',
  'timeclock.exit': 'bg-red-100 text-red-700',
  'timeclock.restart': 'bg-purple-100 text-purple-700',
  'delivery.delivered': 'bg-green-100 text-green-700',
  'gps.stopped': 'bg-orange-100 text-orange-700',
  'gps.driving': 'bg-indigo-100 text-indigo-700',
};

export default function AdminLogsMotoristas() {
  const [drivers, setDrivers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchDrivers();
    fetchLogs();
    fetchStops();
    const interval = setInterval(() => { fetchLogs(); fetchStops(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStops();
  }, [selectedDriver, selectedAction]);

  const fetchDrivers = async () => {
    const data = await fetch(`${API_URL}/admin/drivers/summary`).then(r => r.json()).catch(() => []);
    setDrivers(data);
  };

  const fetchLogs = async () => {
    setLoading(true);
    let url = `${API_URL}/admin/activity-logs?limit=300`;
    if (selectedDriver !== 'all') url += `&driver_id=${selectedDriver}`;
    if (selectedAction !== 'all') url += `&action=${selectedAction}`;
    const data = await fetch(url).then(r => r.json()).catch(() => []);
    setLogs(data);
    setLoading(false);
  };

  const fetchStops = async () => {
    let url = `${API_URL}/admin/gps-stops?limit=100`;
    if (selectedDriver !== 'all') url += `&driver_id=${selectedDriver}`;
    const data = await fetch(url).then(r => r.json()).catch(() => []);
    setStops(data);
  };

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.created_at?.startsWith(today));

  const actionFilterOptions = [
    { key: 'all', label: 'Todas' },
    { key: 'timeclock.entry', label: 'Entrada' },
    { key: 'timeclock.lunch_start', label: 'Almoço' },
    { key: 'timeclock.lunch_end', label: 'Retorno' },
    { key: 'timeclock.exit', label: 'Saída' },
    { key: 'delivery.delivered', label: 'Entregas' },
    { key: 'gps.stopped', label: 'Paradas' },
    { key: 'gps.driving', label: 'Movimento' },
  ];

  const getActionIcon = (action) => {
    const icons = {
      'timeclock.entry': '▶', 'timeclock.lunch_start': '🍽', 'timeclock.lunch_end': '☕',
      'timeclock.exit': '🚪', 'timeclock.restart': '🔄', 'delivery.delivered': '✅',
      'delivery.checklist': '📋', 'delivery.observation': '📝', 'gps.stopped': '📍', 'gps.driving': '🚚',
    };
    return icons[action] || '•';
  };

  const getStatusColor = (driver) => {
    if (driver.today_exit) return 'border-red-500';
    if (driver.today_lunch_start && !driver.today_lunch_end) return 'border-yellow-500';
    if (driver.today_entry) return 'border-green-500';
    return 'border-gray-300';
  };

  const getStatusLabel = (driver) => {
    if (driver.today_exit) return 'Saída';
    if (driver.today_lunch_start && !driver.today_lunch_end) return 'Almoço';
    if (driver.today_entry) return 'Trabalhando';
    return 'Offline';
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((new Date() - new Date(ts)) / 60000);
    if (diff < 1) return 'agora';
    if (diff < 60) return `${diff}min`;
    return `${Math.floor(diff / 60)}h${diff % 60}m`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Logs dos Motoristas</h1>
              <p className="text-sm text-gray-500">Acompanhe todas as ações em tempo real</p>
            </div>
          </div>
          <button onClick={() => { fetchLogs(); fetchStops(); fetchDrivers(); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Atualizar
          </button>
        </div>

        {/* Drivers Online */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {drivers.map(driver => (
            <button
              key={driver.id}
              onClick={() => setSelectedDriver(selectedDriver === driver.id ? 'all' : driver.id)}
              className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 transition-all ${getStatusColor(driver)} ${selectedDriver === driver.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-800 text-sm">{driver.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    driver.today_exit ? 'bg-red-100 text-red-700' :
                    driver.today_entry ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getStatusLabel(driver)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>{driver.vehicle} • {driver.license_plate}</p>
                  <div className="grid grid-cols-4 gap-1 mt-2">
                    <div className="text-center p-1 rounded bg-gray-50">
                      <p className="text-[10px] text-gray-400">E</p>
                      <p className="font-medium">{driver.today_entry || '—'}</p>
                    </div>
                    <div className="text-center p-1 rounded bg-gray-50">
                      <p className="text-[10px] text-gray-400">A</p>
                      <p className="font-medium">{driver.today_lunch_start || '—'}</p>
                    </div>
                    <div className="text-center p-1 rounded bg-gray-50">
                      <p className="text-[10px] text-gray-400">R</p>
                      <p className="font-medium">{driver.today_lunch_end || '—'}</p>
                    </div>
                    <div className="text-center p-1 rounded bg-gray-50">
                      <p className="text-[10px] text-gray-400">S</p>
                      <p className="font-medium">{driver.today_exit || '—'}</p>
                    </div>
                  </div>
                  {driver.current_lat && (
                    <p className="flex items-center gap-1 mt-2 text-green-600">
                      <Navigation className="w-3 h-3" />
                      {timeAgo(driver.last_location_update)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Motorista:</span>
              <select
                value={selectedDriver}
                onChange={e => setSelectedDriver(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all">Todos</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {actionFilterOptions.map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedAction(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    selectedAction === f.key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stops Map */}
        {stops.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <button
              onClick={() => setShowMap(!showMap)}
              className="w-full px-4 py-3 flex items-center justify-between bg-orange-50"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-700">Paradas registradas ({stops.length})</span>
              </div>
              <span className="text-sm text-gray-400">{showMap ? '▲' : '▼'}</span>
            </button>
            {showMap && (
              <div style={{ height: '450px' }}>
                <iframe
                  title="Paradas"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=-39.2%2C-14.9%2C-38.9%2C-14.7&layer=mapnik`}
                />
              </div>
            )}
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Atividades Recentes</h2>
            <span className="text-sm text-gray-500">{todayLogs.length} hoje</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Horário</th>
                  <th className="text-left px-4 py-3 font-medium">Motorista</th>
                  <th className="text-left px-4 py-3 font-medium">Ação</th>
                  <th className="text-left px-4 py-3 font-medium">Descrição</th>
                  <th className="text-left px-4 py-3 font-medium">Local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">Carregando...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">Nenhum registro encontrado</td>
                  </tr>
                ) : (
                  logs.slice(0, 100).map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{log.driver_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                          {getActionIcon(log.action)} {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{log.description}</td>
                      <td className="px-4 py-3">
                        {log.lat && log.lng ? (
                          <a
                            href={`https://www.google.com/maps?q=${log.lat},${log.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            {log.lat.toFixed(4)}, {log.lng.toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GPS Stops Detail */}
        {stops.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-6">
            <div className="px-4 py-3 border-b">
              <h2 className="font-bold text-gray-800">Registro de Paradas</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {stops.slice(0, 30).map(stop => (
                <div key={stop.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-800">{stop.driver_name}</p>
                        <span className="text-xs text-gray-500">
                          {stop.created_at ? new Date(stop.created_at).toLocaleString('pt-BR') : '—'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{stop.description}</p>
                      {stop.lat && stop.lng && (
                        <a
                          href={`https://www.google.com/maps?q=${stop.lat},${stop.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                        >
                          Abrir no Google Maps →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
