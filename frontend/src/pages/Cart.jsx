import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-500 mb-6">Adicione produtos para começar</p>
        <Link to="/produtos" className="btn-primary inline-block">
          Ver Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Carrinho</h1>
        <button onClick={clearCart} className="text-red-500 hover:text-red-700 text-sm">
          Limpar carrinho
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="card p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl"></span>
                </div>
                <div className="flex-1">
                  <Link to={`/produto/${item.id}`} className="font-semibold text-gray-800 hover:text-primary-600">
                    {item.name}
                  </Link>
                  <p className="text-gray-500 text-sm">{item.category}</p>
                  <p className="text-primary-600 font-bold mt-1">
                    R$ {item.price.toFixed(2).replace('.', ',')} /{item.unit}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-bold text-gray-800">
                    R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Resumo</h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} x{item.quantity}</span>
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
          <Link
            to="/orcamento"
            state={{ fromCart: true }}
            className="btn-primary block text-center mt-6"
          >
            Finalizar Pedido
          </Link>
          <Link to="/produtos" className="block text-center text-primary-600 font-medium mt-3 hover:text-primary-700">
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
