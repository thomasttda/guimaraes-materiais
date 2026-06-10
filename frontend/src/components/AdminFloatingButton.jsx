import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ShoppingCart, FileText, List, X } from 'lucide-react';

export default function AdminFloatingButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  if (!isAdminRoute) return null;

  const handleClick = (path, type) => {
    setOpen(false);
    if (path) {
      if (type) {
        navigate(path, { state: { initialType: type } });
      } else {
        navigate(path);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <button onClick={() => handleClick('/admin/notas/nova', 'sale')} className="flex items-center gap-3 bg-green-500 text-white px-5 py-3 rounded-full shadow-lg hover:bg-green-600 transition-all text-sm font-medium whitespace-nowrap">
            <ShoppingCart className="w-5 h-5" />
            Nova Venda
          </button>
          <button onClick={() => handleClick('/admin/notas/nova', 'quote')} className="flex items-center gap-3 bg-blue-500 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-all text-sm font-medium whitespace-nowrap">
            <FileText className="w-5 h-5" />
            Novo Orçamento
          </button>
          <button onClick={() => handleClick('/admin/notas')} className="flex items-center gap-3 bg-gray-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-gray-700 transition-all text-sm font-medium whitespace-nowrap">
            <List className="w-5 h-5" />
            Notas
          </button>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 ${open ? 'bg-red-500 rotate-45' : 'bg-blue-600'}`}>
        {open ? <X className="w-7 h-7 text-white" /> : <Plus className="w-7 h-7 text-white" />}
      </button>
    </div>
  );
}
