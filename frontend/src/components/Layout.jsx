import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Bell, Home, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import logo from '/logo.png';

const API_URL = '/api';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const { itemCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    fetch(`${API_URL}/settings`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  const navItems = [
    { path: '/', label: 'Início', icon: Home },
    { path: '/produtos', label: 'Produtos' },
    { path: '/orcamento', label: 'Orçamento' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Guimarães" className="h-12 w-auto" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-primary-500'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="relative text-gray-600 hover:text-primary-500">
                <Bell className="w-6 h-6" />
              </button>
              <Link to="/carrinho" className="relative text-gray-600 hover:text-primary-500">
                <ShoppingCart className="w-6 h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
              <button
                className="md:hidden text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 font-medium ${
                    location.pathname === item.path
                      ? 'text-primary-600'
                      : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary-500 text-white shadow-lg z-50">
        <div className="flex items-center justify-around py-3">
          <Link to="/" className="flex flex-col items-center gap-1">
            <Home className="w-6 h-6" />
            <span className="text-xs">Início</span>
          </Link>
          <Link to="/carrinho" className="flex flex-col items-center gap-1 relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs">Carrinho</span>
            {itemCount > 0 && (
              <span className="absolute -top-1 right-2 bg-white text-primary-600 text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          <Link to="/orcamento" className="flex flex-col items-center gap-1">
            <User className="w-6 h-6" />
            <span className="text-xs">Orçamento</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 md:mb-0 mb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <img src={logo} alt="Guimarães" className="h-16 w-auto mb-4 bg-white rounded-lg p-2" />
              <p className="text-gray-400 text-sm">{settings.store_name}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-primary-400">Contato</h3>
              <p className="text-gray-400 text-sm">📞 {settings.store_phone}</p>
              <p className="text-gray-400 text-sm">📧 {settings.store_email}</p>
              <p className="text-gray-400 text-sm">📍 {settings.store_address}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-primary-400">Horário</h3>
              <p className="text-gray-400 text-sm">{settings.store_hours}</p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-500 text-sm">
            © 2026 Guimarães Materiais para Construção. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
