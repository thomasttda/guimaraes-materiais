import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, User, AlertCircle } from 'lucide-react';

const API_URL = '/api';

export default function DriverLogin() {
  const [username, setUsername] = useState(() => localStorage.getItem('driver_user') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('driver_pass') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keep, setKeep] = useState(() => !!localStorage.getItem('driver_user'));
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/drivers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      const driver = await res.json();
      localStorage.setItem('driver', JSON.stringify(driver));
      if (keep) {
        localStorage.setItem('driver_user', username);
        localStorage.setItem('driver_pass', password);
      } else {
        localStorage.removeItem('driver_user');
        localStorage.removeItem('driver_pass');
      }
      navigate('/entregador');
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Portal do Entregador</h1>
          <p className="text-gray-500 mt-1">Guimarães Materiais</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Seu usuário"
                required
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="input-field pl-10"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={keep} onChange={e => setKeep(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500" />
            Manter conectado
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
          >
            <Truck className="w-5 h-5" />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <a href="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            ← Voltar para a loja
          </a>
        </div>
      </div>
    </div>
  );
}
