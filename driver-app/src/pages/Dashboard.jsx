import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Package, Route, LogOut, Truck, Navigation, Wifi, WifiOff, History } from 'lucide-react';
import TimeClock from '../components/TimeClock';
import DeliveryList from '../components/DeliveryList';
import RouteView from '../components/RouteView';
import ActivityHistory from '../components/ActivityHistory';

const API = '/api';

export default function Dashboard() {
  const [driver, setDriver] = useState(null);
  const [tab, setTab] = useState('ponto');
  const [tracking, setTracking] = useState(false);
  const [online, setOnline] = useState(true);
  const lastPos = useRef(null);
  const lastLoggedPos = useRef(null);
  const pulseInterval = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('driver');
    if (!stored) return navigate('/login', { replace: true });
    const d = JSON.parse(stored);
    setDriver(d);
    startTracking(d);
    startGpsPulse(d);
    return () => {
      if (pulseInterval.current) clearInterval(pulseInterval.current);
    };
  }, []);

  const startTracking = (d) => {
    if (!navigator.geolocation) return;
    setTracking(true);
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        lastPos.current = { lat: latitude, lng: longitude, speed: speed || 0 };
        fetch(`${API}/drivers/${d.id}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: latitude, lng: longitude, accuracy, speed }),
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const startGpsPulse = (d) => {
    pulseInterval.current = setInterval(() => {
      if (!lastPos.current) return;
      const { lat, lng, speed } = lastPos.current;
      const movement = speed > 0.5 ? 'driving' : 'stopped';
      const wasMoving = lastLoggedPos.current?.speed > 0.5;
      const moved = lastLoggedPos.current && (
        Math.abs(lat - lastLoggedPos.current.lat) > 0.0005 ||
        Math.abs(lng - lastLoggedPos.current.lng) > 0.0005
      );
      lastLoggedPos.current = { lat, lng, speed };
      fetch(`${API}/drivers/${d.id}/gps-pulse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat, lng, speed, movement,
          moved: moved || false,
          was_moving: wasMoving || false,
        }),
      }).catch(() => {});
    }, 300000); // 5 minutes
  };

  const handleLogout = () => {
    if (pulseInterval.current) clearInterval(pulseInterval.current);
    localStorage.removeItem('driver');
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!driver) return null;

  const tabs = [
    { key: 'ponto', label: 'Ponto', icon: Clock },
    { key: 'pedidos', label: 'Pedidos', icon: Package },
    { key: 'rota', label: 'Rota', icon: Route },
    { key: 'historico', label: 'Histórico', icon: History },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-base">{driver.name}</h1>
                <p className="text-blue-200 text-xs">{driver.vehicle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {online ? (
                <Wifi className="w-4 h-4 text-green-300" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-300" />
              )}
              <button onClick={handleLogout} className="bg-white/10 p-2 rounded-lg">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* GPS Status */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
            <Navigation className={`w-4 h-4 ${tracking ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
            <span className="text-xs">{tracking ? 'Compartilhando localização' : 'GPS desativado'}</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                  tab === t.key
                    ? 'text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'ponto' && <TimeClock driver={driver} />}
        {tab === 'pedidos' && <DeliveryList driver={driver} />}
        {tab === 'rota' && <RouteView driver={driver} />}
        {tab === 'historico' && <ActivityHistory driver={driver} />}
      </main>
    </div>
  );
}
