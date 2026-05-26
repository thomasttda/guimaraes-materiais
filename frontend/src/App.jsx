import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Quote from './pages/Quote';
import AdminLogin from './pages/admin/AdminLogin';
import Admin from './pages/admin/Admin';
import AdminProducts from './pages/admin/AdminProducts';
import AdminQuotes from './pages/admin/AdminQuotes';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettings from './pages/admin/AdminSettings';
import AdminFinanceiro from './pages/admin/AdminFinanceiro';
import AdminContas from './pages/admin/AdminContas';
import AdminEntregas from './pages/admin/AdminEntregas';
import AdminClientes from './pages/admin/AdminClientes';
import AdminCupons from './pages/admin/AdminCupons';
import AdminFornecedores from './pages/admin/AdminFornecedores';
import AdminNotificacoes from './pages/admin/AdminNotificacoes';
import AdminMotoristas from './pages/admin/AdminMotoristas';
import AdminNotas from './pages/admin/AdminNotas';
import AdminNotaCreate from './pages/admin/AdminNotaCreate';
import AdminNotaView from './pages/admin/AdminNotaView';
import AdminMonitorMap from './pages/admin/AdminMonitorMap';
import AdminLogsMotoristas from './pages/admin/AdminLogsMotoristas';
import DriverLogin from './pages/DriverLogin';
import DriverDashboard from './pages/DriverDashboard';
import DriverDeliveryDetail from './pages/DriverDeliveryDetail';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="produtos" element={<Products />} />
              <Route path="produto/:id" element={<ProductDetail />} />
              <Route path="carrinho" element={<Cart />} />
              <Route path="orcamento" element={<Quote />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/admin/produtos" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/orcamentos" element={<ProtectedRoute><AdminQuotes /></ProtectedRoute>} />
            <Route path="/admin/pedidos" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/configuracoes" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/financeiro" element={<ProtectedRoute><AdminFinanceiro /></ProtectedRoute>} />
            <Route path="/admin/contas" element={<ProtectedRoute><AdminContas /></ProtectedRoute>} />
            <Route path="/admin/entregas" element={<ProtectedRoute><AdminEntregas /></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute><AdminClientes /></ProtectedRoute>} />
            <Route path="/admin/cupons" element={<ProtectedRoute><AdminCupons /></ProtectedRoute>} />
            <Route path="/admin/fornecedores" element={<ProtectedRoute><AdminFornecedores /></ProtectedRoute>} />
            <Route path="/admin/notificacoes" element={<ProtectedRoute><AdminNotificacoes /></ProtectedRoute>} />
            <Route path="/admin/motoristas" element={<ProtectedRoute><AdminMotoristas /></ProtectedRoute>} />
            <Route path="/admin/monitor" element={<ProtectedRoute><AdminMonitorMap /></ProtectedRoute>} />
            <Route path="/admin/logs-motoristas" element={<ProtectedRoute><AdminLogsMotoristas /></ProtectedRoute>} />
            <Route path="/admin/notas" element={<ProtectedRoute><AdminNotas /></ProtectedRoute>} />
            <Route path="/admin/notas/nova" element={<ProtectedRoute><AdminNotaCreate /></ProtectedRoute>} />
            <Route path="/admin/notas/:id" element={<ProtectedRoute><AdminNotaView /></ProtectedRoute>} />
            <Route path="/entregador/login" element={<DriverLogin />} />
            <Route path="/entregador" element={<DriverDashboard />} />
            <Route path="/entregador/entrega/:id" element={<DriverDeliveryDetail />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;
