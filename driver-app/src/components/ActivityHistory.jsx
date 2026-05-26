import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Truck, CheckCircle2, Navigation, Play, Coffee, Utensils, LogOut, RotateCcw, MessageSquare, ListFilter } from 'lucide-react';

const API = '/api';

const ACTION_ICONS = {
  'timeclock.entry': Play,
  'timeclock.lunch_start': Utensils,
  'timeclock.lunch_end': Coffee,
  'timeclock.exit': LogOut,
  'timeclock.restart': RotateCcw,
  'delivery.ready': Truck,
  'delivery.out_for_delivery': Truck,
  'delivery.delivered': CheckCircle2,
  'delivery.checklist': CheckCircle2,
  'delivery.observation': MessageSquare,
  'gps.stopped': MapPin,
  'gps.driving': Navigation,
};

const ACTION_COLORS = {
  'timeclock.entry': 'bg-green-100 text-green-600',
  'timeclock.lunch_start': 'bg-yellow-100 text-yellow-600',
  'timeclock.lunch_end': 'bg-blue-100 text-blue-600',
  'timeclock.exit': 'bg-red-100 text-red-600',
  'timeclock.restart': 'bg-purple-100 text-purple-600',
  'delivery.ready': 'bg-blue-100 text-blue-600',
  'delivery.out_for_delivery': 'bg-purple-100 text-purple-600',
  'delivery.delivered': 'bg-green-100 text-green-600',
  'delivery.checklist': 'bg-teal-100 text-teal-600',
  'delivery.observation': 'bg-gray-100 text-gray-600',
  'gps.stopped': 'bg-orange-100 text-orange-600',
  'gps.driving': 'bg-indigo-100 text-indigo-600',
};

function getActionLabel(action) {
  const labels = {
    'timeclock.entry': 'Entrada',
    'timeclock.lunch_start': 'Início Almoço',
    'timeclock.lunch_end': 'Fim Almoço',
    'timeclock.exit': 'Saída',
    'timeclock.restart': 'Nova Jornada',
    'delivery.ready': 'Pedido Pronto',
    'delivery.out_for_delivery': 'Saiu para Entrega',
    'delivery.delivered': 'Entregue',
    'delivery.checklist': 'Checklist',
    'delivery.observation': 'Observação',
    'gps.stopped': 'Parada',
    'gps.driving': 'Em Movimento',
  };
  return labels[action] || action;
}

export default function ActivityHistory({ driver }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [stops, setStops] = useState([]);
  const [showMap, setShowMap] = useState(false);

  const fetchLogs = useCallback(async () => {
    const data = await fetch(`${API}/drivers/${driver.id}/activity-logs?limit=200`).then(r => r.json()).catch(() => []);
    setLogs(data);
  }, [driver.id]);

  const fetchStops = useCallback(async () => {
    const data = await fetch(`${API}/drivers/${driver.id}/gps-stops`).then(r => r.json()).catch(() => []);
    setStops(data);
  }, [driver.id]);

  useEffect(() => { fetchLogs(); fetchStops(); }, [fetchLogs, fetchStops]);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.created_at?.startsWith(today));
  const todayStops = stops.filter(s => s.created_at?.startsWith(today));

  const filteredLogs = filter === 'all' ? todayLogs : todayLogs.filter(l => l.action === filter);

  const totalWorked = () => {
    const entry = todayLogs.find(l => l.action === 'timeclock.entry');
    const exit = todayLogs.find(l => l.action === 'timeclock.exit');
    if (!entry?.created_at) return null;
    const start = new Date(entry.created_at);
    const end = exit ? new Date(exit.created_at) : new Date();
    const diff = (end - start) / 1000;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return `${h}h ${m}min`;
  };

  const filterOptions = [
    { key: 'all', label: 'Todas' },
    { key: 'timeclock.entry', label: 'Entrada' },
    { key: 'timeclock.lunch_start', label: 'Almoço' },
    { key: 'timeclock.lunch_end', label: 'Retorno' },
    { key: 'timeclock.exit', label: 'Saída' },
    { key: 'delivery.delivered', label: 'Entregas' },
    { key: 'gps.stopped', label: 'Paradas' },
  ];

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{totalWorked() || '—'}</p>
          <p className="text-xs text-gray-500">Trabalhado</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{todayLogs.filter(l => l.action === 'delivery.delivered').length}</p>
          <p className="text-xs text-gray-500">Entregas</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <MapPin className="w-5 h-5 text-orange-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{todayStops.length}</p>
          <p className="text-xs text-gray-500">Paradas</p>
        </div>
      </div>

      {/* Stops Map Button */}
      {todayStops.length > 0 && (
        <button
          onClick={() => setShowMap(!showMap)}
          className="w-full bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-gray-700">Ver paradas no mapa</span>
          </div>
          <span className="text-sm text-gray-400">{showMap ? '▲' : '▼'}</span>
        </button>
      )}

      {/* Map Container */}
      {showMap && todayStops.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div style={{ height: '400px' }}>
            {todayStops.length === 1 ? (
              <iframe
                title="Paradas"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${todayStops[0].lng - 0.003}%2C${todayStops[0].lat - 0.003}%2C${todayStops[0].lng + 0.003}%2C${todayStops[0].lat + 0.003}&layer=mapnik&marker=${todayStops[0].lat}%2C${todayStops[0].lng}`}
              />
            ) : (
              <iframe
                title="Paradas"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(...todayStops.map(s => s.lng)) - 0.01}%2C${Math.min(...todayStops.map(s => s.lat)) - 0.01}%2C${Math.max(...todayStops.map(s => s.lng)) + 0.01}%2C${Math.max(...todayStops.map(s => s.lat)) + 0.01}&layer=mapnik`}
              />
            )}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterOptions.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum registro hoje</p>
          </div>
        ) : (
          filteredLogs.map((log, i) => {
            const Icon = ACTION_ICONS[log.action] || Clock;
            const colorClass = ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600';
            const time = log.created_at ? new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <div key={log.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-800">{getActionLabel(log.action)}</p>
                      <span className="text-xs text-gray-400">{time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{log.description}</p>
                    {log.address && (
                      <div className="flex items-start gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-500">{log.address}</p>
                      </div>
                    )}
                    {log.lat && log.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${log.lat},${log.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                      >
                        Ver no mapa →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
