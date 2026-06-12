import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, X, DollarSign, CreditCard, Smartphone, Banknote, Receipt, User, LogOut } from 'lucide-react';

const API_URL = '/api';
const FMT = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`;

export default function AdminRelatorioDiario() {
  const [resumo, setResumo] = useState(null);
  const [showSangria, setShowSangria] = useState(false);
  const [sangriaForm, setSangriaForm] = useState({ amount: '', reason: '' });
  const [loading, setLoading] = useState(true);

  const fetchResumo = () => {
    setLoading(true);
    fetch(`${API_URL}/financeiro/resumo`)
      .then(r => r.json()).then(setResumo)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchResumo(); }, []);

  const handleSangria = async () => {
    const amount = parseFloat(sangriaForm.amount);
    if (!amount || amount <= 0) { alert('Valor inválido'); return; }
    try {
      const res = await fetch(`${API_URL}/financeiro/sangria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason: sangriaForm.reason })
      });
      if (!res.ok) { alert('Erro ao registrar sangria'); return; }
      setShowSangria(false);
      setSangriaForm({ amount: '', reason: '' });
      fetchResumo();
    } catch { alert('Erro ao registrar sangria'); }
  };

  const handleFecharDia = async () => {
    if (!confirm('Tem certeza que deseja finalizar o dia? Após fechado, não será possível alterar os registros de hoje.')) return;
    try {
      const res = await fetch(`${API_URL}/financeiro/fechar-dia`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Erro ao fechar dia'); return; }
      alert(`Dia fechado!\nTotal vendas: ${FMT(data.total)}\nSaldo final: ${FMT(data.saldoFinal)}`);
      fetchResumo();
    } catch { alert('Erro ao fechar dia'); }
  };

  const handlePrint = () => {
    if (!resumo) return;
    const date = new Date().toLocaleDateString('pt-BR');
    const lines = (s) => s + ' '.repeat(Math.max(1, 48 - String(s).length));
    const sep = '-'.repeat(48);
    const dsep = '='.repeat(48);
    const center = (s) => { const t = String(s).slice(0, 48); const p = 48 - t.length; return ' '.repeat(Math.floor(p / 2)) + t + ' '.repeat(Math.ceil(p / 2)); };
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatorio Diario</title>
<style>
  @page { width: 80mm; margin: 2mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; width: 80mm; padding: 4mm; }
  .c { text-align: center; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; font-weight: bold; }
  td { padding: 2px 0; }
  .r { text-align: right; }
  .b { border-top: 1px solid #000; }
</style></head><body>
<div class="c"><h2>RELATORIO DIARIO</h2><p>${date}</p></div>
${dsep}<br>
<h3>VENDAS POR PAGAMENTO</h3>${sep}<br>`;
    const paymentLabels = {
      'PIX': ['PIX', Smartphone],
      'Dinheiro': ['DINHEIRO', Banknote],
      'Cartão Crédito': ['CARTAO CREDITO', CreditCard],
      'Cartão Débito': ['CARTAO DEBITO', CreditCard],
      'Boleto': ['BOLETO', Receipt],
      'Transferência': ['TRANSFERENCIA', DollarSign],
      'Crediário': ['CREDIARIO', DollarSign],
      'Depósito': ['DEPOSITO', DollarSign]
    };
    for (const [pm, total] of Object.entries(resumo.porPagamento).sort((a,b) => b[1] - a[1])) {
      const label = (paymentLabels[pm] || [pm.toUpperCase()])[0];
      html += `${lines(label)}${FMT(total)}<br>`;
    }
    html += `${sep}<br>${lines('TOTAL GERAL')}${FMT(resumo.total)}<br>${dsep}<br>`;
    html += `<h3>VENDAS POR VENDEDOR</h3>${sep}<br>`;
    for (const [vendedor, total] of Object.entries(resumo.porVendedor).sort((a,b) => b[1] - a[1])) {
      html += `${lines(vendedor.toUpperCase())}${FMT(total)}<br>`;
    }
    if (resumo.sangrias && resumo.sangrias.length > 0) {
      html += `${dsep}<br><h3>SANGRIAS</h3>${sep}<br>`;
      for (const s of resumo.sangrias) {
        const hora = new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        html += `${lines(hora + ' ' + (s.description || 'Sangria'))}${FMT(s.amount)}<br>`;
      }
      html += `${sep}<br>${lines('TOTAL SANGRIA')}${FMT(resumo.totalSangrias)}<br>`;
    }
    const saldo = resumo.total - resumo.totalSangrias;
    html += `${dsep}<br>${lines('SALDO FINAL')}${FMT(saldo)}<br>${dsep}<br>`;
    html += `<div class="c">OBRIGADO!</div></body></html>`;
    const win = window.open('', '_blank', 'width=420,height=700');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const payMethods = [
    { key: 'PIX', label: 'PIX', icon: Smartphone, color: 'text-green-600 bg-green-50' },
    { key: 'Dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'Cartão Crédito', label: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
    { key: 'Cartão Débito', label: 'Cartão de Débito', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
    { key: 'Boleto', label: 'Boleto', icon: Receipt, color: 'text-orange-600 bg-orange-50' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Carregando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Relatório Diário</h1>
            {resumo?.fechado && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">DIA FECHADO</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button onClick={() => setShowSangria(true)} className="py-2 px-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 text-sm">
              <DollarSign className="w-4 h-4" /> Sangria
            </button>
            {!resumo?.fechado && (
              <button onClick={handleFecharDia} className="py-2 px-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-1 text-sm font-medium">
                <LogOut className="w-4 h-4" /> Finalizar Dia
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Total geral */}
        <div className="card p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">TOTAL DE VENDAS HOJE</p>
          <p className="text-4xl font-bold text-primary-600">{FMT(resumo?.total)}</p>
        </div>

        {/* Por pagamento */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-800 mb-4">Vendas por Forma de Pagamento</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {payMethods.map(pm => {
              const total = resumo?.porPagamento?.[pm.key] || 0;
              const Icon = pm.icon;
              return (
                <div key={pm.key} className={`rounded-xl p-4 ${pm.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{pm.label}</span>
                  </div>
                  <p className="text-xl font-bold">{FMT(total)}</p>
                </div>
              );
            })}
          </div>
          {/* Outros métodos */}
          {resumo && Object.entries(resumo.porPagamento).filter(([k]) => !payMethods.find(p => p.key === k)).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Outros</h3>
              {Object.entries(resumo.porPagamento).filter(([k]) => !payMethods.find(p => p.key === k)).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 text-sm">
                  <span>{k}</span><span className="font-medium">{FMT(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por vendedor */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-800 mb-4">Vendas por Vendedor</h2>
          {resumo && Object.keys(resumo.porVendedor).length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma venda hoje</p>
          ) : (
            <div className="space-y-3">
              {resumo && Object.entries(resumo.porVendedor)
                .sort((a, b) => b[1] - a[1])
                .map(([vendedor, total]) => (
                  <div key={vendedor} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{vendedor}</span>
                    </div>
                    <span className="font-bold text-primary-600">{FMT(total)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Sangrias do dia */}
        {resumo?.sangrias?.length > 0 && (
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4">Sangrias do Dia</h2>
            <div className="space-y-2">
              {resumo.sangrias.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{s.description || 'Sangria'}</p>
                    <p className="text-xs text-gray-500">{new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="font-bold text-red-600">-{FMT(s.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-4 border-t font-bold">
              <span>Total Sangrias</span>
              <span className="text-red-600">-{FMT(resumo.totalSangrias)}</span>
            </div>
          </div>
        )}

        {/* Saldo esperado */}
        <div className="card p-6 border-2 border-primary-300">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Saldo Esperado em Caixa</p>
              <p className="text-2xl font-bold text-primary-600">{FMT((resumo?.total || 0) - (resumo?.totalSangrias || 0))}</p>
            </div>
            <Receipt className="w-10 h-10 text-primary-300" />
          </div>
        </div>
      </div>

      {/* Sangria Modal */}
      {showSangria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Registrar Sangria</h2>
              <button onClick={() => setShowSangria(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                <input type="number" step="0.01" min="0.01" value={sangriaForm.amount} onChange={e => setSangriaForm({...sangriaForm, amount: e.target.value})} className="input-field" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Motivo</label>
                <textarea value={sangriaForm.reason} onChange={e => setSangriaForm({...sangriaForm, reason: e.target.value})} rows={3} className="input-field" placeholder="Ex: Troco para cliente, pagamento de fornecedor..." />
              </div>
              <button onClick={handleSangria} className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium">Registrar Sangria</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
