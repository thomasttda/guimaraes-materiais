import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HardHat, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem('admin_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('admin_pass') || '');
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(() => !!localStorage.getItem('admin_email'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (keep) {
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_pass', password);
      } else {
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_pass');
      }
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-700 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
          <p className="text-blue-200 text-sm mt-1">Guimarães Materiais para Construção</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm text-center border border-red-200">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Seu email"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type={show ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600">
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={keep} onChange={e => setKeep(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500" />
            Manter conectado
          </label>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
