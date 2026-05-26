import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Clock, Truck, Circle, Wifi, WifiOff } from 'lucide-react';

const API_URL = '/api';

export default function AdminMonitorMap() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchDrivers = async () => {
    try {
      const data = await fetch(`${API_URL}/admin/drivers/map`).then(r => r.json());
      setDrivers(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const getStatusColor = (driver) => {
    if (!driver.current_lat) return 'bg-gray-400';
    if (driver.today_exit) return 'bg-red-400';
    if (driver.today_lunch_start && !driver.today_lunch_end) return 'bg-yellow-400';
    if (driver.today_entry) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusLabel = (driver) => {
    if (driver.today_exit) return 'Saída';
    if (driver.today_lunch_start && !driver.today_lunch_end) return 'Almoço';
    if (driver.today_entry) return 'Trabalhando';
    return 'Não iniciou';
  };

  const timeSince = (timestamp) => {
    if (!timestamp) return '';
    const diff = (new Date() - new Date(timestamp)) / 1000;
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/motoristas" className="text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Monitoramento em Tempo Real</h1>
              <p className="text-sm text-gray-500">Atualização automática a cada 15s</p>
            </div>
          </div>
          <button onClick={fetchDrivers} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Atualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Carregando motoristas...</p>
          </div>
        ) : (
          <>
            {/* Combined Map */}
            {drivers.filter(d => d.current_lat).length > 0 && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
                <div className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Mapa de Motoristas
                  </h2>
                  <span className="text-sm text-blue-200">{drivers.filter(d => d.current_lat).length} online</span>
                </div>
                <div style={{ height: '500px' }}>
                  <iframe
                    title="Mapa de Motoristas"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=-39.2%2C-14.9%2C-38.9%2C-14.7&layer=mapnik`}
                  />
                </div>
              </div>
            )}

            {/* Drivers List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drivers.map(driver => (
                <div key={driver.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
                  driver.current_lat ? 'border-green-500' : 'border-gray-300'
                }`}>
                  {/* Header */}
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getStatusColor(driver)}`}>
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{driver.name}</p>
                        <p className="text-xs text-gray-500">{driver.vehicle} • {driver.license_plate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">{driver.active_deliveries || 0}</p>
                      <p className="text-xs text-gray-500">entregas</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="px-4 py-3 bg-gray-50">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{getStatusLabel(driver)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {driver.current_lat ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-gray-400" />}
                        {driver.current_lat ? (
                          <span className="text-green-600">{timeSince(driver.last_location_update)}</span>
                        ) : (
                          <span className="text-gray-400">offline</span>
                        )}
                      </div>
                    </div>

                    {/* Timeclock Details */}
                    <div className="mt-2 grid grid-cols-4 gap-1 text-center text-xs">
                      <div className={`p-1 rounded ${driver.today_entry ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <p className="font-medium">Entrada</p>
                        <p className="text-gray-500">{driver.today_entry || '—'}</p>
                      </div>
                      <div className={`p-1 rounded ${driver.today_lunch_start ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                        <p className="font-medium">Almoço</p>
                        <p className="text-gray-500">{driver.today_lunch_start || '—'}</p>
                      </div>
                      <div className={`p-1 rounded ${driver.today_lunch_end ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <p className="font-medium">Retorno</p>
                        <p className="text-gray-500">{driver.today_lunch_end || '—'}</p>
                      </div>
                      <div className={`p-1 rounded ${driver.today_exit ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <p className="font-medium">Saída</p>
                        <p className="text-gray-500">{driver.today_exit || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Actions */}
                  <div className="px-4 py-3">
                    {driver.current_lat ? (
                      <div className="flex items-center gap-3">
                        <Navigation className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-gray-600">
                          {driver.current_lat.toFixed(4)}, {driver.current_lng.toFixed(4)}
                        </p>
                        <a
                          href={`https://www.google.com/maps?q=${driver.current_lat},${driver.current_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-full"
                        >
                          Mapa
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Localização indisponível
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {drivers.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum motorista cadastrado</p>
                  <Link to="/admin/motoristas" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                    Cadastrar motoristas →
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
