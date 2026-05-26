import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, FileText, ShoppingCart, Settings, BarChart3, LogOut, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, Truck, Bell, DollarSign, Calendar, Users, Tag, Building2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = '/api';

export default function Admin() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = () => {
    fetch(`${API_URL}/dashboard`).then(res => res.json()).then(setStats).catch(() => {});
    fetch(`${API_URL}/orders`).then(res => res.json()).then(data => setRecentOrders(data.slice(0, 5))).catch(() => {});
    fetch(`${API_URL}/deliveries`).then(res => res.json()).then(data => setRecentDeliveries(data.slice(0, 5))).catch(() => {});
    fetch(`${API_URL}/notifications?unread=true`).then(res => res.json()).then(setNotifications).catch(() => {});
  };

  if (!stats) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Carregando...</div>;

  const statusLabels = {
    pending: 'Pendente', approved: 'Aprovado', processing: 'Em separação',
    shipped: 'Enviado', completed: 'Entregue', cancelled: 'Cancelado',
  };
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800', shipped: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
  };

  const deliveryStatusLabels = {
    preparing: 'Preparando', ready: 'Pronto', out_for_delivery: 'Saiu para entrega',
    delivered: 'Entregue', cancelled: 'Cancelado',
  };
  const deliveryStatusColors = {
    preparing: 'bg-yellow-100 text-yellow-800', ready: 'bg-blue-100 text-blue-800',
    out_for_delivery: 'bg-purple-100 text-purple-800', delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const mainStats = [
    { label: 'Produtos', value: stats.totalProducts, icon: Package, color: 'bg-blue-500', link: '/admin/produtos' },
    { label: 'Orçamentos', value: stats.totalQuotes, icon: FileText, color: 'bg-green-500', link: '/admin/orcamentos' },
    { label: 'Pedidos', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-primary-500', link: '/admin/pedidos' },
    { label: 'Receita', value: `R$ ${stats.totalRevenue.toFixed(2).replace('.', ',')}`, icon: BarChart3, color: 'bg-purple-500', link: '/admin/financeiro' },
    { label: 'Saldo Caixa', value: `R$ ${stats.cashBalance.toFixed(2).replace('.', ',')}`, icon: DollarSign, color: stats.cashBalance >= 0 ? 'bg-green-600' : 'bg-red-600', link: '/admin/financeiro' },
    { label: 'Entregas Pendentes', value: stats.pendingDeliveries, icon: Truck, color: 'bg-indigo-500', link: '/admin/entregas' },
    { label: 'Contas a Pagar', value: stats.pendingBills, icon: Calendar, color: 'bg-orange-500', link: '/admin/contas' },
    { label: 'Clientes', value: '-', icon: Users, color: 'bg-teal-500', link: '/admin/clientes' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Painel Admin</h1>
              <p className="text-xs text-gray-500">Guimarães Materiais</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {admin && (
              <span className="text-sm text-gray-600 hidden sm:block">{admin.name}</span>
            )}
            {stats.unreadNotifications > 0 && (
              <Link to="/admin/notificacoes" className="relative text-gray-600 hover:text-primary-600">
                <Bell className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {stats.unreadNotifications}
                </span>
              </Link>
            )}
            <button onClick={() => { logout(); navigate('/admin/login'); }} className="text-gray-600 hover:text-red-600 flex items-center gap-1 text-sm">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {mainStats.map(stat => (
            <Link key={stat.label} to={stat.link} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card p-6 mb-8">
          <h3 className="font-bold text-gray-800 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Produtos', icon: Package, link: '/admin/produtos', color: 'text-blue-600' },
              { label: 'Financeiro', icon: DollarSign, link: '/admin/financeiro', color: 'text-green-600' },
              { label: 'Contas', icon: Calendar, link: '/admin/contas', color: 'text-orange-600' },
              { label: 'Entregas', icon: Truck, link: '/admin/entregas', color: 'text-indigo-600' },
              { label: 'Motoristas', icon: UserCheck, link: '/admin/motoristas', color: 'text-violet-600' },
              { label: 'Clientes', icon: Users, link: '/admin/clientes', color: 'text-teal-600' },
              { label: 'Cupons', icon: Tag, link: '/admin/cupons', color: 'text-pink-600' },
              { label: 'Fornecedores', icon: Building2, link: '/admin/fornecedores', color: 'text-cyan-600' },
              { label: 'Config', icon: Settings, link: '/admin/configuracoes', color: 'text-gray-600' },
            ].map(item => (
              <Link key={item.label} to={item.link} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <item.icon className={`w-6 h-6 ${item.color}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {stats.lowStock.length > 0 && (
          <div className="card p-6 mb-8 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-gray-800">Alertas de Estoque Baixo ({stats.lowStock.length})</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.lowStock.slice(0, 8).map(p => (
                <div key={p.id} className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-red-600">{p.stock} / mín {p.min_stock}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-4">Receita Mensal</h3>
            {stats.monthlyRevenue.length > 0 ? (
              <div className="space-y-3">
                {stats.monthlyRevenue.map(m => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">{m.month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${Math.min(100, (m.total / stats.totalRevenue) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium w-24 text-right">R$ {m.total.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-sm">Sem dados</p>}
          </div>

          {/* Categories */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-4">Produtos por Categoria</h3>
            {stats.categories.length > 0 ? (
              <div className="space-y-3">
                {stats.categories.map(cat => (
                  <div key={cat.category} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-32 truncate">{cat.category}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className="bg-primary-500 h-3 rounded-full" style={{ width: `${(cat.count / stats.totalProducts) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{cat.count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-sm">Sem dados</p>}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Pedidos Recentes</h3>
              <Link to="/admin/pedidos" className="text-primary-600 text-sm">Ver todos</Link>
            </div>
            {recentOrders.length === 0 ? <p className="text-gray-500 text-sm">Nenhum pedido</p> : (
              <div className="space-y-3">
                {recentOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">#{o.id} - {o.customer_name}</p>
                      <p className="text-xs text-gray-500">R$ {o.total.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Deliveries */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Entregas Recentes</h3>
              <Link to="/admin/entregas" className="text-primary-600 text-sm">Ver todas</Link>
            </div>
            {recentDeliveries.length === 0 ? <p className="text-gray-500 text-sm">Nenhuma entrega</p> : (
              <div className="space-y-3">
                {recentDeliveries.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">#{d.order_id} - {d.customer_name}</p>
                      <p className="text-xs text-gray-500">{d.customer_address?.substring(0, 30)}...</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${deliveryStatusColors[d.status]}`}>{deliveryStatusLabels[d.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Unread Notifications */}
        {notifications.length > 0 && (
          <div className="card p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Notificações Recentes</h3>
              <Link to="/admin/notificacoes" className="text-primary-600 text-sm">Ver todas</Link>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Bell className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-600">{n.message}</p>
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
