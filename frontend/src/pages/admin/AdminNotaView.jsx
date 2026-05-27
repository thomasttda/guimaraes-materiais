import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Edit2, Check, X, FileText, ShoppingCart, Share2, MessageCircle } from 'lucide-react';

const API_URL = '/api';

export default function AdminNotaView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchNote();
    fetch(`${API_URL}/settings`).then(res => res.json()).then(setSettings).catch(() => {});
  }, [id]);

  const fetchNote = async () => {
    try {
      const res = await fetch(`${API_URL}/notes/${id}`);
      if (!res.ok) { setError(true); setLoading(false); return; }
      const data = await res.json();
      if (!data || !data.items) { setError(true); setLoading(false); return; }
      setNote(data);
    } catch { setError(true); }
    setLoading(false);
  };

  const updateStatus = async (status) => {
    await fetch(`${API_URL}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchNote();
  };

  const openPDF = () => {
    window.open(`${API_URL}/notes/${id}/pdf`, '_blank');
  };

  const printPDF = () => {
    const printWindow = window.open(`${API_URL}/notes/${id}/pdf`, '_blank');
    if (printWindow) printWindow.onload = () => printWindow.print();
  };

  const handleShare = async () => {
    if (!note) return;
    const pdfUrl = `${window.location.origin}${API_URL}/notes/${id}/pdf`;
    const text = `Guimarães Materiais para Construção\nNota: ${note.number}\nCliente: ${note.customer_name}\nTotal: R$ ${note.total.toFixed(2).replace('.', ',')}\n\n${pdfUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Nota ${note.number}`, text, url: pdfUrl });
        return;
      } catch {}
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const sendWhatsApp = () => {
    if (!note) return;
    const cleanPhone = note.customer_phone.replace(/\D/g, '');
    const phone = cleanPhone.length <= 11 ? '55' + cleanPhone : cleanPhone;
    const pdfUrl = `${window.location.origin}${API_URL}/notes/${id}/pdf`;
    const typeLabel = note.type === 'quote' ? 'Orçamento' : 'Nota de Venda';
    const msg = `Olá querido cliente GUIMARÃES. Segue aqui o seu ${typeLabel} como solicitado! ${pdfUrl}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (error) return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-600 text-lg">Nota não encontrada</p>
      <button onClick={() => navigate('/admin/notas')} className="btn-primary px-6 py-2 rounded-lg">Voltar para Notas</button>
    </div>
  );
  if (loading || !note) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Carregando...</div>;

  const statusLabels = {
    draft: 'Rascunho', sent: 'Enviado', approved: 'Aprovado',
    completed: 'Concluído', cancelled: 'Cancelado'
  };
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800', sent: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800', completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const paymentLabels = {
    Dinheiro: 'Dinheiro', PIX: 'PIX', 'Cartão Crédito': 'Cartão Crédito', 'Cartão Débito': 'Cartão Débito'
  };

  const subtotal = note.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = note.discount_type === 'percentage' ? subtotal * (note.discount / 100) : note.discount;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/notas" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="font-bold text-gray-800">{note.number}</h1>
              <p className="text-sm text-gray-500">{note.type === 'quote' ? 'Orçamento' : 'Venda'} • {new Date(note.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[note.status]}`}>{statusLabels[note.status]}</span>
            {note.customer_phone && (
              <button onClick={sendWhatsApp} className="py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"><MessageCircle className="w-4 h-4" /> Enviar WhatsApp</button>
            )}
            <button onClick={handleShare} className="py-2 px-4 border border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 flex items-center gap-1"><Share2 className="w-4 h-4" /> Compartilhar</button>
            <button onClick={openPDF} className="btn-secondary flex items-center gap-1"><Download className="w-4 h-4" /> PDF</button>
            <button onClick={printPDF} className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"><Printer className="w-4 h-4" /> Imprimir</button>
            <Link to={`/admin/notas/${id}/editar`} className="text-blue-600 hover:text-blue-800 p-2"><Edit2 className="w-5 h-5" /></Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Note Preview */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden" style={{ minHeight: '800px' }}>
          {/* Header */}
          <div className="bg-blue-700 text-white p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{settings.store_name || 'Guimaraes Materiais para Construcao'}</h1>
                <p className="text-blue-200 mt-1">Materiais para Construcao</p>
                <p className="text-blue-200 text-sm mt-1">CNPJ: {settings.store_cnpj || '51.803.643/0001-04'}</p>
                <div className="mt-4 text-sm text-blue-200 space-y-1">
                  <p>Tel: {settings.store_phone}</p>
                  <p>Email: {settings.store_email}</p>
                  <p>{settings.store_address}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-orange-500 text-white px-6 py-2 rounded-lg inline-block mb-3">
                  <span className="font-bold text-lg">{note.type === 'quote' ? 'ORCAMENTO' : 'VENDA'}</span>
                </div>
                <p className="text-blue-200">Nº {note.number}</p>
                <p className="text-blue-200">{new Date(note.created_at).toLocaleDateString('pt-BR')}</p>
                {note.type === 'sale' && note.payment_method && (
                  <p className="text-blue-200 text-sm mt-1">Pagamento: {note.payment_method}</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-8 border-b">
            <h2 className="text-blue-700 font-bold mb-4">DADOS DO CLIENTE</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nome</p>
                <p className="font-medium">{note.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Telefone</p>
                <p className="font-medium">{note.customer_phone}</p>
              </div>
              {note.customer_email && <div><p className="text-gray-500">Email</p><p className="font-medium">{note.customer_email}</p></div>}
              {note.customer_cpf && <div><p className="text-gray-500">CPF</p><p className="font-medium">{note.customer_cpf}</p></div>}
              {note.customer_address && <div className="col-span-2"><p className="text-gray-500">Endereco</p><p className="font-medium">{note.customer_address}</p></div>}
              {note.attendant_name && <div><p className="text-gray-500">Atendente</p><p className="font-medium">{note.attendant_name}</p></div>}
            </div>
          </div>

          {/* Items */}
          <div className="p-8">
            <h2 className="text-blue-700 font-bold mb-4">ITENS</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Produto</th>
                  <th className="text-center py-3 px-4 font-medium w-20">Qtd</th>
                  <th className="text-center py-3 px-4 font-medium w-16">Un</th>
                  <th className="text-right py-3 px-4 font-medium w-28">Preco Unit.</th>
                  <th className="text-right py-3 px-4 font-medium w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {note.items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-center">{item.unit}</td>
                    <td className="py-3 px-4 text-right">R$ {item.price.toFixed(2).replace('.', ',')}</td>
                    <td className="py-3 px-4 text-right font-medium">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {note.discount > 0 && (
                  <div className="flex justify-between py-2 text-sm text-red-600">
                    <span>Desconto ({note.discount_type === 'percentage' ? note.discount + '%' : 'R$'}):</span>
                    <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-blue-700 text-xl font-bold text-blue-700">
                  <span>TOTAL:</span>
                  <span>R$ {note.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observations */}
          {note.observations && (
            <div className="p-8 border-t bg-gray-50">
              <h2 className="text-blue-700 font-bold mb-2">OBSERVACOES</h2>
              <p className="text-gray-600 text-sm whitespace-pre-line">{note.observations}</p>
            </div>
          )}

          {/* Footer */}
          <div className="p-8 border-t text-center text-gray-500 text-xs">
            <p>{settings.store_name} - CNPJ {settings.store_cnpj || '51.803.643/0001-04'} - Documento gerado eletronicamente</p>
          </div>
        </div>

        {/* Status Actions */}
        {note.status !== 'completed' && note.status !== 'cancelled' && (
          <div className="mt-6 flex gap-3 justify-center">
            {note.status === 'draft' && (
              <button onClick={() => updateStatus('sent')} className="btn-primary flex items-center gap-2"><Check className="w-4 h-4" /> Marcar como Enviado</button>
            )}
            {note.status === 'sent' && (
              <>
                <button onClick={() => updateStatus('approved')} className="btn-primary flex items-center gap-2"><Check className="w-4 h-4" /> Aprovar</button>
                <button onClick={() => updateStatus('cancelled')} className="py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
              </>
            )}
            {note.status === 'approved' && (
              <button onClick={() => updateStatus('completed')} className="btn-primary flex items-center gap-2"><Check className="w-4 h-4" /> Concluir Venda</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}