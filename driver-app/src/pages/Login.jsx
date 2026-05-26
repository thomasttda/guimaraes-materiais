import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, MapPin } from 'lucide-react';

const API = '/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('driver')) navigate('/', { replace: true });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/drivers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Falha no login');
        return;
      }

      const driver = await res.json();
      localStorage.setItem('driver', JSON.stringify(driver));
      navigate('/', { replace: true });
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-blue-700 to-blue-900 flex flex-col items-center justify-center p-6">
      <img src="/logo_motorista.png" alt="Guimarães" className="w-28 h-28 object-contain mb-4" />
      <h1 className="text-2xl font-bold text-white mb-1">Guimarães</h1>
      <p className="text-blue-200 text-sm mb-8">App do Entregador</p>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
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
                placeholder="thiago.motorista"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
                autoCapitalize="none"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Acessar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-2">Usuário: thiago.motorista | Senha: thiago.guimaraes</p>
        <p className="text-center text-xs text-gray-400">Usuário: thiago.gordo | Senha: thiago.guimaraes</p>
      </div>

      <div className="flex items-center gap-1 text-blue-200 text-xs mt-8">
        <MapPin className="w-3 h-3" />
        Rastreamento ativado após o login
      </div>
    </div>
  );
}
