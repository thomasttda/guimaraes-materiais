import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Check, CheckCheck, AlertTriangle, Truck, Calendar, Package } from 'lucide-react';

const API_URL = '/api';

export default function AdminNotificacoes() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    let url = `${API_URL}/notifications`;
    if (filter === 'unread') url += '?unread=true';
    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setNotifications(data);
  };

  const markRead = async (id) => {
    await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PUT' });
    fetchData();
  };

  const markAllRead = async () => {
    await fetch(`${API_URL}/notifications/read-all`, { method: 'PUT' });
    fetchData();
  };

  const typeIcons = {
    bill_reminder: Calendar,
    order_status: Truck,
    stock_alert: AlertTriangle,
    general: Bell,
  };
  const typeColors = {
    bill_reminder: 'bg-orange-100 text-orange-600',
    order_status: 'bg-blue-100 text-blue-600',
    stock_alert: 'bg-red-100 text-red-600',
    general: 'bg-gray-100 text-gray-600',
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Notificações</h1>
            {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount} não lidas</span>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary flex items-center gap-1 text-sm">
              <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {[['all', 'Todas'], ['unread', 'Não Lidas']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === val ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border'}`}>{label}</button>
          ))}
        </div>

        <div className="space-y-3">
          {notifications.map(n => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <div key={n.id} className={`card p-4 flex items-start gap-4 ${n.read ? 'opacity-60' : 'border-l-4 border-primary-500'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[n.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800">{n.title}</h3>
                    <span className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                    <Check className="w-5 h-5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
}
