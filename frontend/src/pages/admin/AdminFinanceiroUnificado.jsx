import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, Filter,
  TrendingUp, TrendingDown, DollarSign,
  Printer, X, CreditCard, Smartphone, Banknote, Receipt, User, LogOut,
  Calendar, Sun, Moon, Package, AlertTriangle, Truck, FileText, Users
} from 'lucide-react';

const API_URL = '/api';
const FMT = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',')}`;

const paymentLabels = { cash: 'Dinheiro', pix: 'PIX', card: 'Cartão', boleto: 'Boleto', transfer: 'Transferência' };

const payMethods = [
  { key: 'PIX', label: 'PIX', icon: Smartphone, color: 'text-green-600 bg-green-50' },
  { key: 'Dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
  { key: 'Cartão Crédito', label: 'Cartão de Crédito', icon: CreditCard, color: 'text-blue-600 bg-blue-50' },
  { key: 'Cartão Débito', label: 'Cartão de Débito', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50' },
  { key: 'Boleto', label: 'Boleto', icon: Receipt, color: 'text-orange-600 bg-orange-50' },
  { key: 'Fiado', label: 'Fiado', icon: FileText, color: 'text-purple-600 bg-purple-50' },
];

export default function AdminFinanceiroUnificado() {
  const [tab, setTab] = useState('relatorio');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-bold text-gray-800">Financeiro & Caixa</h1>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'relatorio' && <RelatorioActions />}
            {tab === 'caixa' && <CaixaActions />}
            {tab === 'lancamentos' && <LancamentosActions />}
            {tab === 'funcionarios' && <FuncionariosActions />}
          </div>
        </div>
        {/* Sub-tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex border-b gap-1">
            {[
              { key: 'relatorio', label: 'Relatório de Vendas', icon: Receipt },
              { key: 'caixa', label: 'Caixa', icon: DollarSign },
              { key: 'lancamentos', label: 'Lançamentos', icon: TrendingUp },
              { key: 'funcionarios', label: 'Funcionários', icon: Users },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'relatorio' && <RelatorioVendas />}
        {tab === 'caixa' && <Caixa />}
        {tab === 'lancamentos' && <Lancamentos />}
        {tab === 'funcionarios' && <Funcionarios />}
      </div>
    </div>
  );
}

function RelatorioActions() {
  return null;
}

function RelatorioVendas() {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('hoje');
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().slice(0, 10));
  const [vendasDetalhadas, setVendasDetalhadas] = useState([]);

  const fetchResumo = async (start, end) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ start_date: start, end_date: end });
      const data = await fetch(`${API_URL}/financeiro/resumo?${p}`).then(r => r.json());
      setResumo(data);
      // Fetch detailed notas for this period
      const p2 = new URLSearchParams({ start_date: start, end_date: end + 'T23:59:59' });
      const notas = await fetch(`${API_URL}/notes?${p2}`).then(r => r.json()).catch(() => []);
      setVendasDetalhadas(notas);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    if (periodo === 'hoje') {
      setDataInicio(hoje);
      setDataFim(hoje);
      fetchResumo(hoje, hoje);
    } else if (periodo === 'semana') {
      const d = new Date(); d.setDate(d.getDate() - d.getDay());
      const start = d.toISOString().slice(0, 10);
      setDataInicio(start);
      setDataFim(hoje);
      fetchResumo(start, hoje);
    } else if (periodo === 'mes') {
      const start = new Date().toISOString().slice(0, 7) + '-01';
      setDataInicio(start);
      setDataFim(hoje);
      fetchResumo(start, hoje);
    }
  }, [periodo]);

  const handleFilter = () => {
    fetchResumo(dataInicio, dataFim);
  };

  const handlePrint = () => {
    if (!resumo) return;
    const lines = (s) => s + ' '.repeat(Math.max(1, 48 - String(s).length));
    const sep = '-'.repeat(48);
    const dsep = '='.repeat(48);
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatorio</title>
<style>@page{width:80mm;margin:2mm}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;font-weight:bold;width:80mm;padding:4mm}
.c{text-align:center}table{width:100%;border-collapse:collapse;font-size:12px;font-weight:bold}
td{padding:2px 0}.r{text-align:right}.b{border-top:1px solid #000}</style></head><body>
<div class="c"><h2>RELATORIO DE VENDAS</h2><p>${new Date(dataInicio).toLocaleDateString('pt-BR')} - ${new Date(dataFim).toLocaleDateString('pt-BR')}</p></div>
${dsep}<br>
<h3>VENDAS POR PAGAMENTO</h3>${sep}<br>`;
    for (const [pm, total] of Object.entries(resumo.porPagamento || {}).sort((a,b) => b[1] - a[1])) {
      html += `${lines(pm)}${FMT(total)}<br>`;
    }
    html += `${sep}<br>${lines('TOTAL GERAL')}${FMT(resumo.total)}<br>${dsep}<br>`;
    html += `<h3>VENDAS POR VENDEDOR</h3>${sep}<br>`;
    for (const [vendedor, total] of Object.entries(resumo.porVendedor || {}).sort((a,b) => b[1] - a[1])) {
      html += `${lines(vendedor)}${FMT(total)}<br>`;
    }
    if (resumo.sangrias && resumo.sangrias.length > 0) {
      html += `${dsep}<br><h3>SANGRIAS</h3>${sep}<br>`;
      for (const s of resumo.sangrias) {
        const hora = new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        html += `${lines(hora + ' ' + (s.description || 'Sangria'))}${FMT(s.amount)}<br>`;
      }
      html += `${sep}<br>${lines('TOTAL SANGRIA')}${FMT(resumo.totalSangrias)}<br>`;
    }
    const saldo = resumo.total - (resumo.totalSangrias || 0);
    html += `${dsep}<br>${lines('SALDO FINAL')}${FMT(saldo)}<br>${dsep}<br>`;
    html += `<div class="c">OBRIGADO!</div></body></html>`;
    const win = window.open('', '_blank', 'width=420,height=700');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  if (loading && !resumo) return <p className="text-center text-gray-500 py-12">Carregando...</p>;

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {['hoje', 'semana', 'mes'].map(p => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                periodo === p ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Esta Semana' : 'Este Mês'}
            </button>
          ))}
          <div className="h-6 w-px bg-gray-300 mx-1" />
          <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="input-field text-sm" />
          <span className="text-gray-400">até</span>
          <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input-field text-sm" />
          <button onClick={handleFilter} className="btn-secondary text-sm flex items-center gap-1"><Filter className="w-4 h-4" />Filtrar</button>
          <button onClick={handlePrint} className="btn-secondary text-sm flex items-center gap-1 ml-auto"><Printer className="w-4 h-4" />Imprimir</button>
        </div>
      </div>

      {/* Total */}
      <div className="card p-6 text-center">
        <p className="text-sm text-gray-500 mb-1">TOTAL DE VENDAS</p>
        <p className="text-4xl font-bold text-primary-600">{FMT(resumo?.total)}</p>
        <p className="text-xs text-gray-400 mt-1">{new Date(dataInicio).toLocaleDateString('pt-BR')} - {new Date(dataFim).toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Por pagamento */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-800 mb-4">Vendas por Forma de Pagamento</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        {resumo && Object.entries(resumo.porPagamento || {}).filter(([k]) => !payMethods.find(p => p.key === k)).length > 0 && (
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
        {resumo && Object.keys(resumo.porVendedor || {}).length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma venda no período</p>
        ) : (
          <div className="space-y-3">
            {resumo && Object.entries(resumo.porVendedor || {})
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

      {/* Sangrias */}
      {resumo?.sangrias?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-800 mb-4">Sangrias do Período</h2>
          <div className="space-y-2">
            {resumo.sangrias.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{s.description || 'Sangria'}</p>
                  <p className="text-xs text-gray-500">{new Date(s.created_at).toLocaleString('pt-BR')}</p>
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

      {/* Vendas detalhadas */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-800 mb-4">Vendas do Período</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Pagamento</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {vendasDetalhadas.filter(n => !['draft'].includes(n.status) || n.payment_method).map(n => (
                <tr key={n.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{n.number || n.id}</td>
                  <td className="px-3 py-2">{n.customer_name || 'Consumidor'}</td>
                  <td className="px-3 py-2">{n.payment_method || '-'}</td>
                  <td className="px-3 py-2 text-right font-medium">{FMT(n.total)}</td>
                </tr>
              ))}
              {vendasDetalhadas.length === 0 && (
                <tr><td colSpan={4} className="text-center py-6 text-gray-500">Nenhuma venda no período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saldo */}
      <div className="card p-6 border-2 border-primary-300">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Saldo Esperado em Caixa</p>
            <p className="text-2xl font-bold text-primary-600">{FMT((resumo?.total || 0) - (resumo?.totalSangrias || 0))}</p>
          </div>
          <DollarSign className="w-10 h-10 text-primary-300" />
        </div>
      </div>
    </div>
  );
}

function CaixaActions() {
  return null;
}

function Caixa() {
  const [caixaStatus, setCaixaStatus] = useState(null);
  const [resumoCaixa, setResumoCaixa] = useState(null);
  const [showAbrir, setShowAbrir] = useState(false);
  const [valorInicial, setValorInicial] = useState('');
  const [showSangria, setShowSangria] = useState(false);
  const [sangriaForm, setSangriaForm] = useState({ amount: '', reason: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const status = await fetch(`${API_URL}/caixa/status`).then(r => r.json());
      setCaixaStatus(status);
      if (status.aberto) {
        const r = await fetch(`${API_URL}/caixa/resumo-caixa`).then(r => r.json());
        setResumoCaixa(r);
      } else {
        setResumoCaixa(null);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAbrirCaixa = async () => {
    try {
      const res = await fetch(`${API_URL}/caixa/abrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_inicial: parseFloat(valorInicial) || 0 })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Erro ao abrir caixa'); return; }
      setShowAbrir(false);
      setValorInicial('');
      fetchData();
    } catch { alert('Erro ao abrir caixa'); }
  };

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
      fetchData();
    } catch { alert('Erro ao registrar sangria'); }
  };

  const handleFecharDia = async () => {
    if (!confirm('Tem certeza que deseja finalizar o dia? Após fechado, não será possível alterar os registros de hoje.')) return;
    try {
      const res = await fetch(`${API_URL}/financeiro/fechar-dia`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Erro ao fechar dia'); return; }
      alert(`Dia fechado!\nTotal vendas: ${FMT(data.total)}\nSaldo final: ${FMT(data.saldoFinal)}`);
      fetchData();
    } catch { alert('Erro ao fechar dia'); }
  };

  if (loading) return <p className="text-center text-gray-500 py-12">Carregando...</p>;

  return (
    <div className="space-y-6">
      {/* Status do Caixa */}
      <div className={`card p-6 ${caixaStatus?.aberto ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {caixaStatus?.aberto ? (
              <Sun className="w-10 h-10 text-green-500" />
            ) : (
              <Moon className="w-10 h-10 text-gray-400" />
            )}
            <div>
              <p className="text-lg font-bold">{caixaStatus?.aberto ? 'Caixa Aberto' : 'Caixa Fechado'}</p>
              {caixaStatus?.aberto && caixaStatus?.dados && (
                <p className="text-sm text-gray-500">
                  Iniciado com {FMT(caixaStatus.dados.valor_inicial)} em {new Date(caixaStatus.dados.abertoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!caixaStatus?.aberto && (
              <button onClick={() => setShowAbrir(true)} className="btn-primary flex items-center gap-1 text-sm">
                <Sun className="w-4 h-4" /> Abrir Caixa
              </button>
            )}
            {caixaStatus?.aberto && (
              <>
                <button onClick={() => setShowSangria(true)} className="py-2 px-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 text-sm">
                  <TrendingDown className="w-4 h-4" /> Sangria
                </button>
                <button onClick={handleFecharDia} className="py-2 px-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-1 text-sm font-medium">
                  <LogOut className="w-4 h-4" /> Finalizar Dia
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {caixaStatus?.aberto && resumoCaixa && (
        <>
          {/* Resumo do Dia */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Vendas</p>
              <p className="text-2xl font-bold text-primary-600">{FMT(resumoCaixa.totalVendas)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Fiado Aberto</p>
              <p className="text-2xl font-bold text-purple-600">{resumoCaixa.fiadoQtd} ({FMT(resumoCaixa.totalFiado)})</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Sangrias</p>
              <p className="text-2xl font-bold text-red-600">{FMT(resumoCaixa.totalSangrias)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Saldo Previsto</p>
              <p className="text-2xl font-bold text-green-600">{FMT(resumoCaixa.totalVendas - resumoCaixa.totalSangrias)}</p>
            </div>
          </div>

          {/* Start-of-day box: alerts */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Avisos do Dia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/produtos" className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                <Package className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Estoque Baixo</p>
                  <p className="text-xs text-amber-600">{resumoCaixa.lowStock} produtos</p>
                </div>
              </Link>
              <Link to="/admin/clientes" className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Fiado Pendente</p>
                  <p className="text-xs text-purple-600">{resumoCaixa.fiadoQtd} notas ({FMT(resumoCaixa.totalFiado)})</p>
                </div>
              </Link>
              <Link to="/admin/contas-pagar" className="flex items-center gap-3 p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                <DollarSign className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Contas a Pagar</p>
                  <p className="text-xs text-red-600">{resumoCaixa.billsCount} pendentes</p>
                </div>
              </Link>
              <Link to="/admin/entregas" className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                <Truck className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Entregas Pendentes</p>
                  <p className="text-xs text-blue-600">{resumoCaixa.deliveriesCount} entregas</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Vendas por pagamento no caixa de hoje */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4">Vendas Hoje por Pagamento</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(resumoCaixa.porPagamento || {}).map(([pm, total]) => {
                const pmInfo = payMethods.find(p => p.key === pm);
                const Icon = pmInfo?.icon || DollarSign;
                const color = pmInfo?.color || 'text-gray-600 bg-gray-50';
                return (
                  <div key={pm} className={`rounded-xl p-3 ${color}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{pmInfo?.label || pm}</span>
                    </div>
                    <p className="text-lg font-bold">{FMT(total)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vendas por vendedor */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-800 mb-4">Vendas Hoje por Vendedor</h2>
            <div className="space-y-3">
              {Object.entries(resumoCaixa.porVendedor || {}).sort((a, b) => b[1] - a[1]).map(([v, total]) => (
                <div key={v} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{v}</span>
                  </div>
                  <span className="font-bold text-primary-600">{FMT(total)}</span>
                </div>
              ))}
              {Object.keys(resumoCaixa.porVendedor || {}).length === 0 && (
                <p className="text-gray-500 text-sm">Nenhuma venda hoje</p>
              )}
            </div>
          </div>
        </>
      )}

      {!caixaStatus?.aberto && !showAbrir && (
        <div className="card p-12 text-center">
          <Moon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Caixa não foi aberto hoje</p>
          <p className="text-gray-400 text-sm mt-1">Abra o caixa para começar o dia</p>
        </div>
      )}

      {/* Abrir Caixa Modal */}
      {showAbrir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Abrir Caixa</h2>
              <button onClick={() => setShowAbrir(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Informe o valor inicial em dinheiro no caixa:</p>
              <div>
                <label className="block text-sm font-medium mb-1">Valor Inicial (R$)</label>
                <input type="number" step="0.01" min="0" value={valorInicial} onChange={e => setValorInicial(e.target.value)} className="input-field" autoFocus placeholder="0,00" />
              </div>
              <button onClick={handleAbrirCaixa} className="w-full btn-primary">Abrir Caixa</button>
            </div>
          </div>
        </div>
      )}

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

function LancamentosActions() {
  return null;
}

function Lancamentos() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ type: 'income', category: '', description: '', amount: '', payment_method: 'cash', employee_id: '' });
  const [employees, setEmployees] = useState([]);

  useEffect(() => { fetch(`${API_URL}/employees`).then(r => r.json()).then(setEmployees).catch(() => {}); }, []);

  useEffect(() => {
    fetchData();
  }, [filter, dateRange]);

  const fetchData = async () => {
    let url = `${API_URL}/cash-flow`;
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('type', filter);
    if (dateRange.start) params.set('start_date', dateRange.start);
    if (dateRange.end) params.set('end_date', dateRange.end);
    if (params.toString()) url += `?${params.toString()}`;

    const data = await fetch(url).then(res => res.json()).catch(() => []);
    setEntries(data);

    const income = data.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = data.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    setSummary({ income, expense, balance: income - expense });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    delete payload.employee_id;
    try {
      if (editing) {
        await fetch(`${API_URL}/cash-flow/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        const cashRes = await fetch(`${API_URL}/cash-flow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const cashData = await cashRes.json();
        // If an employee was selected and it's an expense, also record as employee expense
        if (form.employee_id && form.type === 'expense') {
          const emp = employees.find(e => e.id == form.employee_id);
          await fetch(`${API_URL}/employees/${form.employee_id}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: 'Outro',
              description: form.description || payload.category,
              amount: parseFloat(form.amount),
              date: new Date().toISOString().slice(0, 10),
              payment_method: form.payment_method || 'dinheiro',
              notes: `Lançamento financeiro #${cashData.id}`
            })
          });
        }
      }
      fetchData();
      resetForm();
    } catch (err) { alert('Erro ao salvar'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este registro?')) return;
    await fetch(`${API_URL}/cash-flow/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const resetForm = () => {
    setForm({ type: 'income', category: '', description: '', amount: '', payment_method: 'cash', employee_id: '' });
    setEditing(null);
    setShowForm(false);
  };

  const categories = {
    income: ['vendas', 'servicos', 'devolucoes', 'outros'],
    expense: ['fornecedores', 'aluguel', 'funcionarios', 'energia', 'agua', 'internet', 'transporte', 'marketing', 'impostos', 'manutencao', 'outros'],
  };

  const lancPaymentMethods = ['cash', 'pix', 'card', 'boleto', 'transfer'];
  const lancPaymentLabels = { cash: 'Dinheiro', pix: 'PIX', card: 'Cartão', boleto: 'Boleto', transfer: 'Transferência' };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => { setForm({ type: 'income', category: '', description: '', amount: '', payment_method: 'cash', employee_id: '' }); setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Novo Lançamento
        </button>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Entradas</p>
              <p className="text-2xl font-bold text-green-600">{FMT(summary.income)}</p>
            </div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Saídas</p>
              <p className="text-2xl font-bold text-red-600">{FMT(summary.expense)}</p>
            </div>
          </div>
        </div>
        <div className={`card p-6 border-l-4 ${summary.balance >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
          <div className="flex items-center gap-3">
            <DollarSign className={`w-8 h-8 ${summary.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
            <div>
              <p className="text-sm text-gray-500">Saldo</p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{FMT(summary.balance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field">
              <option value="all">Todos</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">De</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Até</label>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="input-field" />
          </div>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-1"><Filter className="w-4 h-4" /> Filtrar</button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
              <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value, category: ''})} className="input-field">
                    <option value="income">Entrada</option>
                    <option value="expense">Saída</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required className="input-field">
                  <option value="">Selecione...</option>
                  {categories[form.type].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
                <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="input-field">
                  {lancPaymentMethods.map(m => <option key={m} value={m}>{lancPaymentLabels[m]}</option>)}
                </select>
              </div>
              {form.type === 'expense' && (
              <div>
                <label className="block text-sm font-medium mb-1">Funcionário (opcional)</label>
                <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="input-field">
                  <option value="">Nenhum</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
                {form.employee_id && <p className="text-xs text-gray-500 mt-1">Também será registrado como despesa no perfil do funcionário</p>}
              </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">{editing ? 'Salvar' : 'Adicionar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Data</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Categoria</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Descrição</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Pagamento</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Valor</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {entry.type === 'income' ? '↑ Entrada' : '↓ Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{entry.category}</td>
                  <td className="px-4 py-3 text-sm">{entry.description}</td>
                  <td className="px-4 py-3 text-sm">{lancPaymentLabels[entry.payment_method]}</td>
                  <td className={`px-4 py-3 text-right font-medium ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.type === 'income' ? '+' : '-'} R$ {entry.amount.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditing(entry.id); setForm({ type: entry.type, category: entry.category, description: entry.description, amount: entry.amount.toString(), payment_method: entry.payment_method, employee_id: '' }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum lançamento encontrado</p>}
      </div>
    </div>
  );
}

const expenseCategories = ['Vale', 'Gasolina', 'Passagem', 'Salário', 'Alimentação', 'Ferramentas', 'Outro'];

function FuncionariosActions() {
  return null;
}

function Funcionarios() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', role: 'funcionario', salary: '' });
  const [selectedEmp, setSelectedEmp] = useState(null);

  const fetchEmployees = () => fetch(`${API_URL}/employees`).then(r => r.json()).then(setEmployees).catch(() => {});
  useEffect(() => { fetchEmployees(); }, []);

  const resetForm = () => { setForm({ name: '', phone: '', role: 'funcionario', salary: '' }); setEditing(null); setShowForm(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, salary: parseFloat(form.salary) || 0 };
    if (editing) {
      await fetch(`${API_URL}/employees/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch(`${API_URL}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    fetchEmployees();
    resetForm();
  };

  const handleEdit = (emp) => {
    setEditing(emp.id);
    setForm({ name: emp.name, phone: emp.phone || '', role: emp.role || 'funcionario', salary: emp.salary?.toString() || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover funcionário?')) return;
    await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
    fetchEmployees();
  };

  if (selectedEmp) return <EmployeeDetail employee={selectedEmp} onBack={() => setSelectedEmp(null)} />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setForm({ name: '', phone: '', role: 'funcionario', salary: '' }); setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Novo Funcionário
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-2xl font-bold">{employees.length}</p>
          <p className="text-sm text-gray-500">Funcionários</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Telefone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cargo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEmp(emp)}>
                  <td className="px-4 py-3 text-sm font-medium">{emp.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.role || 'funcionario'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(emp); }} className="text-blue-600 hover:text-blue-800 mr-2"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {employees.length === 0 && <p className="text-center py-8 text-gray-500">Nenhum funcionário cadastrado</p>}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
              <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cargo</label>
                <input type="text" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Salário</label>
                <input type="number" step="0.01" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} className="input-field" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">{editing ? 'Salvar' : 'Adicionar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeDetail({ employee, onBack }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, count: 0, byCategory: {} });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: 'Vale', description: '', amount: '', date: new Date().toISOString().slice(0, 10), payment_method: 'dinheiro', notes: '' });
  const [filterCat, setFilterCat] = useState('');

  const fetchExpenses = () => {
    fetch(`${API_URL}/employees/${employee.id}/expenses`).then(r => r.json()).then(setExpenses).catch(() => {});
    fetch(`${API_URL}/employees/${employee.id}/summary`).then(r => r.json()).then(s => { if (s) setSummary(s); }).catch(() => {});
  };
  useEffect(() => { fetchExpenses(); }, [employee.id]);

  const resetForm = () => {
    setForm({ category: 'Vale', description: '', amount: '', date: new Date().toISOString().slice(0, 10), payment_method: 'dinheiro', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) || 0 };
    if (editing) {
      await fetch(`${API_URL}/employee-expenses/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch(`${API_URL}/employees/${employee.id}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    fetchExpenses();
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover despesa?')) return;
    await fetch(`${API_URL}/employee-expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
  };

  const filtered = filterCat ? expenses.filter(e => e.category === filterCat) : expenses;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-600 hover:text-primary-600"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-xl font-bold">{employee.name}</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{employee.role}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-2xl font-bold text-red-600">{FMT(summary.total)}</p>
          <p className="text-sm text-gray-500">Total de Despesas</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold">{summary.count || 0}</p>
          <p className="text-sm text-gray-500">Lançamentos</p>
        </div>
        <div className="card p-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Por Categoria</p>
          {expenseCategories.map(cat => (
            summary.byCategory[cat] ? <div key={cat} className="flex justify-between text-xs mb-1"><span>{cat}</span><span className="font-medium">{FMT(summary.byCategory[cat])}</span></div> : null
          ))}
        </div>
        <div className="card p-4 flex items-center justify-center">
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Nova Despesa</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Filtrar:</span>
          <button onClick={() => setFilterCat('')} className={`px-3 py-1 rounded-full text-xs font-medium ${!filterCat ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todas</button>
          {expenseCategories.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`px-3 py-1 rounded-full text-xs font-medium ${filterCat === cat ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Data</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Categoria</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Descrição</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Valor</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Pagamento</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(exp => (
                <tr key={exp.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(exp.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-sm"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{exp.category}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{exp.description || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-red-600">{FMT(exp.amount)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{exp.payment_method}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditing(exp.id); setForm({ category: exp.category, description: exp.description || '', amount: exp.amount.toString(), date: exp.date, payment_method: exp.payment_method || 'dinheiro', notes: exp.notes || '' }); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 mr-2"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(exp.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center py-8 text-gray-500">Nenhuma despesa encontrada</p>}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? 'Editar Despesa' : 'Nova Despesa'}</h2>
              <button onClick={resetForm}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required className="input-field">
                    {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" placeholder="Ex: Vale transporte" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pagamento</label>
                  <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="input-field">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao">Cartão</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="input-field" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 btn-primary">{editing ? 'Salvar' : 'Adicionar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
