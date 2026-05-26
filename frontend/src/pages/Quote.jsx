import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = '/api';

export default function Quote() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, total, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    message: '',
  });

  useEffect(() => {
    fetch(`${API_URL}/settings`).then(res => res.json()).then(setSettings).catch(() => {});
  }, []);

  const fromCart = location.state?.fromCart;
  const items = fromCart ? cart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    unit: item.unit,
  })) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      items,
      total: fromCart ? total : 0,
    };

    try {
      if (fromCart) {
        await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        clearCart();
      } else {
        await fetch(`${API_URL}/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setSubmitted(true);
    } catch (err) {
      alert('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {fromCart ? 'Pedido Enviado!' : 'Orçamento Solicitado!'}
        </h2>
        <p className="text-gray-600 mb-6">
          {fromCart
            ? 'Seu pedido foi recebido. Entraremos em contato em breve para confirmar.'
            : 'Sua solicitação de orçamento foi recebida. Nossa equipe entrará em contato.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/')} className="btn-primary">
            Voltar ao Início
          </button>
          <button onClick={() => navigate('/produtos')} className="btn-secondary">
            Ver Produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        {fromCart ? 'Finalizar Pedido' : 'Solicitar Orçamento'}
      </h1>
      <p className="text-gray-600 mb-8">
        {fromCart
          ? 'Preencha seus dados para finalizar o pedido'
          : 'Preencha o formulário abaixo e nossa equipe entrará em contato com um orçamento personalizado'}
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
            <input
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
            <input
              type="tel"
              name="customer_phone"
              value={form.customer_phone}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              name="customer_email"
              value={form.customer_email}
              onChange={handleChange}
              className="input-field"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de entrega</label>
            <input
              type="text"
              name="customer_address"
              value={form.customer_address}
              onChange={handleChange}
              className="input-field"
              placeholder="Rua, número, bairro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={4}
              className="input-field"
              placeholder="Informações adicionais sobre seu pedido..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Enviando...' : fromCart ? 'Enviar Pedido' : 'Solicitar Orçamento'}
          </button>
        </form>

        {/* Order Summary */}
        {fromCart && items.length > 0 && (
          <div className="card p-6 h-fit">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Resumo do Pedido</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-500">{item.quantity}x R$ {item.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        )}

        {!fromCart && (
          <div className="card p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Como funciona?</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium">Preencha o formulário</p>
                  <p className="text-gray-500 text-sm">Informe seus dados e os materiais que precisa</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium">Receba o orçamento</p>
                  <p className="text-gray-500 text-sm">Nossa equipe preparará um orçamento personalizado</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium">Aprovação e entrega</p>
                  <p className="text-gray-500 text-sm">Após aprovação, agendamos a entrega</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                📞 Ou ligue diretamente: <strong>{settings.store_phone}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
