import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Store, Phone, MapPin, Clock, Mail, MessageCircle, FileText } from 'lucide-react';

const API_URL = '/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/settings`).then(res => res.json()).then(setSettings).catch(() => {});
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key) => {
    try {
      await fetch(`${API_URL}/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: settings[key] }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Erro ao salvar');
    }
  };

  const settingFields = [
    { key: 'store_name', label: 'Nome da Loja', icon: Store },
    { key: 'store_phone', label: 'Telefone', icon: Phone },
    { key: 'store_email', label: 'E-mail', icon: Mail },
    { key: 'store_cnpj', label: 'CNPJ', icon: FileText },
    { key: 'store_address', label: 'Endereço', icon: MapPin },
    { key: 'store_hours', label: 'Horário de Funcionamento', icon: Clock },
    { key: 'whatsapp_number', label: 'WhatsApp (com código do país)', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-bold text-gray-800">Configurações</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {saved && (
          <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg mb-6">
            ✓ Configurações salvas com sucesso!
          </div>
        )}

        <div className="card p-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Informações da Loja</h2>

          {settingFields.map(field => (
            <div key={field.key}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <field.icon className="w-4 h-4 text-primary-500" />
                {field.label}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings[field.key] || ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  className="input-field flex-1"
                />
                <button onClick={() => handleSave(field.key)} className="btn-secondary flex items-center gap-1">
                  <Save className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Access Info */}
        <div className="card p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Acesso ao Painel</h2>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
               O painel admin está disponível em: <strong>/admin</strong>
            </p>
            <p className="text-sm text-blue-700 mt-2">
              💡 Dica: Para proteger o acesso, considere adicionar autenticação em produção.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
