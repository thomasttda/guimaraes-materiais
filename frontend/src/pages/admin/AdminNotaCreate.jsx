import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, FileText, ShoppingCart, User, Search, Minus, Check } from 'lucide-react';

const API_URL = '/api';

export default function AdminNotaCreate() {
  const navigate = useNavigate();
  const [type, setType] = useState('quote');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [settings, setSettings] = useState({});
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);

  const [note, setNote] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    customer_address: '', customer_cpf: '', attendant_name: '',
    items: [], subtotal: 0, discount: 0, discount_type: 'fixed',
    total: 0, observations: '', payment_method: ''
  });

  useEffect(() => {
    fetch(`${API_URL}/products`).then(res => res.json()).then(setProducts).catch(() => {});
    fetch(`${API_URL}/customers`).then(res => res.json()).then(setCustomers).catch(() => {});
    fetch(`${API_URL}/settings`).then(res => res.json()).then(setSettings).catch(() => {});
  }, []);

  const openQtySelector = (product) => {
    const existing = note.items.find(i => i.id === product.id);
    setSelectedProduct(product);
    setSelectedQty(existing ? existing.quantity + 1 : 1);
    setShowQtyModal(true);
    setShowProductModal(false);
  };

  const confirmAddItem = () => {
    if (!selectedProduct) return;
    const existing = note.items.find(i => i.id === selectedProduct.id);
    if (existing) {
      updateItem(selectedProduct.id, 'quantity', existing.quantity + selectedQty);
    } else {
      setNote(prev => ({
        ...prev,
        items: [...prev.items, {
          id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price,
          unit: selectedProduct.unit, quantity: selectedQty
        }]
      }));
    }
    setShowQtyModal(false);
    setSelectedProduct(null);
    setSelectedQty(1);
    setSearchProduct('');
  };

  const addCustomItem = () => {
    setNote(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Date.now(), name: 'Item personalizado', price: 0,
        unit: 'UND', quantity: 1, custom: true
      }]
    }));
  };

  const removeItem = (id) => {
    setNote(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id, field, value) => {
    setNote(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, [field]: field === 'name' ? value : parseFloat(value) || 0 } : i)
    }));
  };

  const selectCustomer = (customer) => {
    setNote(prev => ({
      ...prev,
      customer_name: customer.name, customer_phone: customer.phone,
      customer_email: customer.email || '', customer_address: customer.address || '',
      customer_cpf: customer.cpf || ''
    }));
    setShowCustomerModal(false);
  };

  const calculateTotals = () => {
    const subtotal = note.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = note.discount_type === 'percentage' ? subtotal * (note.discount / 100) : (note.discount || 0);
    const total = Math.max(0, subtotal - discountAmount);
    return { subtotal, total };
  };

  const { subtotal, total } = calculateTotals();

  const handleSubmit = async (status = 'draft') => {
    if (!note.customer_name || !note.customer_phone) {
      alert('Preencha nome e telefone do cliente');
      return;
    }
    if (note.items.length === 0) {
      alert('Adicione pelo menos um item');
      return;
    }

    const payload = {
      type, ...note, subtotal, total, status,
      attendant_name: note.attendant_name || settings.store_name
    };

    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      navigate(`/admin/notas/${data.id}`);

      // Auto-enviar WhatsApp se status for 'sent'
      if (status === 'sent' && note.customer_phone) {
        const cleanPhone = note.customer_phone.replace(/\D/g, '');
        const phone = cleanPhone.length <= 11 ? '55' + cleanPhone : cleanPhone;
        const pdfUrl = `${window.location.origin}${API_URL}/notes/${data.id}/pdf`;
        const typeLabel = type === 'quote' ? 'Orçamento' : 'Nota de Venda';
        const msg = `Olá querido cliente GUIMARÃES. Segue aqui o seu ${typeLabel} como solicitado! ${pdfUrl}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      alert('Erro ao salvar nota');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    c.phone.includes(searchCustomer)
  );

  const paymentMethods = [
    { value: '', label: 'Selecionar...' },
    { value: 'Dinheiro', label: 'Dinheiro' },
    { value: 'PIX', label: 'PIX' },
    { value: 'Cartão Crédito', label: 'Cartão Crédito' },
    { value: 'Cartão Débito', label: 'Cartão Débito' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/notas')} className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-bold text-gray-800">Nova Nota</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleSubmit('draft')} className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Save className="w-4 h-4" /> Salvar Rascunho
            </button>
            <button onClick={() => handleSubmit('sent')} className="btn-primary flex items-center gap-2">
              <FileText className="w-4 h-4" /> Finalizar e Enviar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Type Selection */}
        <div className="flex gap-4 mb-6">
          <button onClick={() => setType('quote')} className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 ${type === 'quote' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <FileText className={`w-8 h-8 ${type === 'quote' ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className="text-left">
              <p className="font-bold text-lg">Orçamento</p>
              <p className="text-sm text-gray-500">Proposta comercial</p>
            </div>
          </button>
          <button onClick={() => setType('sale')} className={`flex-1 p-4 rounded-xl border-2 flex items-center gap-3 ${type === 'sale' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <ShoppingCart className={`w-8 h-8 ${type === 'sale' ? 'text-green-600' : 'text-gray-400'}`} />
            <div className="text-left">
              <p className="font-bold text-lg">Venda</p>
              <p className="text-sm text-gray-500">Nota de venda</p>
            </div>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Customer & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2"><User className="w-5 h-5" /> Dados do Cliente</h2>
                <button onClick={() => setShowCustomerModal(true)} className="text-blue-600 text-sm hover:text-blue-800">Selecionar cliente</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input type="text" value={note.customer_name} onChange={e => setNote({...note, customer_name: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone (WhatsApp) *</label>
                  <input type="text" value={note.customer_phone} onChange={e => setNote({...note, customer_phone: e.target.value})} className="input-field" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={note.customer_email} onChange={e => setNote({...note, customer_email: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CPF</label>
                  <input type="text" value={note.customer_cpf} onChange={e => setNote({...note, customer_cpf: e.target.value})} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Endereço</label>
                  <input type="text" value={note.customer_address} onChange={e => setNote({...note, customer_address: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Atendente</label>
                  <input type="text" value={note.attendant_name} onChange={e => setNote({...note, attendant_name: e.target.value})} className="input-field" placeholder={settings.store_name} />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Itens</h2>
                <div className="flex gap-2">
                  <button onClick={() => { setShowProductModal(true); setSearchProduct(''); }} className="btn-secondary text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Do Estoque</button>
                  <button onClick={addCustomItem} className="py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Item Manual</button>
                </div>
              </div>

              {note.items.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Nenhum item adicionado</p>
              ) : (
                <div className="space-y-3">
                  {note.items.map((item, i) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-sm text-gray-500 w-6 pt-1">{i + 1}.</span>
                        <div className="flex-1 grid grid-cols-5 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Produto</label>
                            <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="input-field text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Qtd</label>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateItem(item.id, 'quantity', Math.max(1, (item.quantity || 1) - 1))} className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"><Minus className="w-3 h-3" /></button>
                              <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="input-field text-sm text-center w-14" />
                              <button onClick={() => updateItem(item.id, 'quantity', (item.quantity || 1) + 1)} className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Un</label>
                            <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} className="input-field text-sm">
                              <option value="UND">UND</option>
                              <option value="SACO">SACO</option>
                              <option value="BAR">BAR</option>
                              <option value="LAT">LAT</option>
                              <option value="BAL">BAL</option>
                              <option value="M2">M²</option>
                              <option value="M">M</option>
                              <option value="KG">KG</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Preço Unit.</label>
                            <input type="number" step="0.01" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="input-field text-sm" />
                          </div>
                        </div>
                        <div className="text-right pt-5">
                          <p className="font-bold text-primary-600">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                          <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 mt-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observations */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-800 mb-4">Observações</h2>
              <textarea value={note.observations} onChange={e => setNote({...note, observations: e.target.value})} rows={4} className="input-field" placeholder="Condições de pagamento, prazo de entrega, garantias..." />
            </div>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-bold text-gray-800 mb-4">Resumo</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Itens:</span>
                  <span className="font-medium">{note.items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>

                {type === 'sale' && (
                  <div className="border-t pt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Forma de Pagamento</label>
                    <select value={note.payment_method} onChange={e => setNote({...note, payment_method: e.target.value})} className="input-field text-sm">
                      {paymentMethods.map(pm => (
                        <option key={pm.value} value={pm.value}>{pm.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="border-t pt-3">
                  <label className="block text-xs text-gray-500 mb-1">Desconto</label>
                  <div className="flex gap-2">
                    <select value={note.discount_type} onChange={e => setNote({...note, discount_type: e.target.value})} className="input-field text-sm w-24">
                      <option value="fixed">R$</option>
                      <option value="percentage">%</option>
                    </select>
                    <input type="number" step="0.01" value={note.discount} onChange={e => setNote({...note, discount: parseFloat(e.target.value) || 0})} className="input-field text-sm" />
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button onClick={() => handleSubmit('draft')} className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Salvar Rascunho
                </button>
                <button onClick={() => handleSubmit('sent')} className="w-full btn-primary flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> Finalizar e Enviar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Search Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Selecionar Produto do Estoque</h2>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="Buscar produto..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} className="input-field pl-10" autoFocus />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                <div className="space-y-2">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => openQtySelector(p)} className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-gray-500">{p.category} • Estoque: {p.stock} {p.unit}</p>
                      </div>
                      <span className="font-bold text-primary-600">R$ {p.price.toFixed(2).replace('.', ',')}/{p.unit}</span>
                    </button>
                  ))}
                </div>
                {filteredProducts.length === 0 && <p className="text-center py-4 text-gray-500">Nenhum produto encontrado</p>}
              </div>
              <div className="p-4 border-t">
                <button onClick={() => setShowProductModal(false)} className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Selector Modal */}
        {showQtyModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{selectedProduct.name}</h2>
                <p className="text-sm text-gray-500 mb-6">{selectedProduct.category}</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Preço unitário</p>
                  <p className="text-2xl font-bold text-primary-600">R$ {selectedProduct.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus className="w-5 h-5" /></button>
                    <input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))} className="input-field text-center text-2xl font-bold w-24 h-12" />
                    <button onClick={() => setSelectedQty(selectedQty + 1)} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus className="w-5 h-5" /></button>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Valor total:</span>
                    <span className="text-2xl font-bold text-primary-600">R$ {(selectedProduct.price * selectedQty).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowQtyModal(false); setShowProductModal(true); }} className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium">Voltar</button>
                    <button onClick={confirmAddItem} className="flex-1 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-medium flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Adicionar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold">Selecionar Cliente</h2>
                <input type="text" placeholder="Buscar cliente..." value={searchCustomer} onChange={e => setSearchCustomer(e.target.value)} className="input-field mt-3" />
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                <div className="space-y-2">
                  {filteredCustomers.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.phone} • {c.city}/{c.state}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t">
                <button onClick={() => setShowCustomerModal(false)} className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}