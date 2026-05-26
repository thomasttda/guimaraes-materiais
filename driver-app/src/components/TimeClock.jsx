import { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Coffee, Utensils, LogOut, History, CheckCircle2, RotateCcw } from 'lucide-react';

const API = '/api';

const STEPS = [
  { key: 'entry', label: 'Entrada', icon: Play, color: 'bg-green-500' },
  { key: 'lunch_start', label: 'Almoço', icon: Utensils, color: 'bg-yellow-500' },
  { key: 'lunch_end', label: 'Retorno', icon: Coffee, color: 'bg-blue-500' },
  { key: 'exit', label: 'Saída', icon: LogOut, color: 'bg-red-500' },
];

export default function TimeClock({ driver }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchToday = useCallback(async () => {
    const data = await fetch(`${API}/drivers/${driver.id}/timeclock/today`).then(r => r.json());
    setRecord(data);
  }, [driver.id]);

  const fetchHistory = useCallback(async () => {
    const data = await fetch(`${API}/drivers/${driver.id}/timeclock?limit=20`).then(r => r.json());
    setHistory(data);
  }, [driver.id]);

  useEffect(() => { fetchToday(); fetchHistory(); }, [fetchToday, fetchHistory]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const register = async (type) => {
    setLoading(true);
    try {
      await fetch(`${API}/drivers/${driver.id}/timeclock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      await fetchToday();
      await fetchHistory();
    } catch (e) {
      alert('Erro ao registrar ponto');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (!record) return 'entry';
    if (!record.entry_time) return 'entry';
    if (!record.lunch_start) return 'lunch_start';
    if (!record.lunch_end) return 'lunch_end';
    if (!record.exit_time) return 'exit';
    return null;
  };

  const next = nextStep();
  const completedSteps = STEPS.filter(s => record && record[s.key]);

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Current Time Display */}
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
        <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <p className="text-4xl font-bold text-gray-800">
          {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Status Steps */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-4">Jornada de hoje</h2>
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = record && record[step.key];
            const isNext = step.key === next;
            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isDone ? `${step.color} text-white` : isNext ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDone ? 'text-gray-800' : isNext ? 'text-blue-700' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {isDone && (
                    <p className="text-xs text-gray-500">{record[step.key]}</p>
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Register Button */}
        {next && (
          <button
            onClick={() => register(next)}
            disabled={loading}
            className="w-full mt-5 bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-lg"
          >
            <Play className="w-6 h-6" />
            {loading ? 'Registrando...' : `Registrar ${STEPS.find(s => s.key === next)?.label}`}
          </button>
        )}

        {!next && (
          <div className="mt-5 bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-green-700">Jornada completa!</p>
            <p className="text-sm text-green-600">Bom descanso!</p>
            <button
              onClick={() => register('restart')}
              disabled={loading}
              className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-lg"
            >
              <RotateCcw className="w-6 h-6" />
              {loading ? 'Reiniciando...' : 'Nova Jornada'}
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Histórico</span>
          </div>
          <span className="text-sm text-gray-400">{showHistory ? '▲' : '▼'}</span>
        </button>

        {showHistory && (
          <div className="mt-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum registro anterior</p>
            ) : (
              history.map(h => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-600">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {h.entry_time && <span>E: {h.entry_time}</span>}
                    {h.lunch_start && <span>A: {h.lunch_start}</span>}
                    {h.lunch_end && <span>R: {h.lunch_end}</span>}
                    {h.exit_time && <span>S: {h.exit_time}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
