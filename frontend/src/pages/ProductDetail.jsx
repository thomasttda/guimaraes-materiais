import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = '/api';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`).then(res => res.json()).then(setProduct).catch(() => {});
  }, [id]);

  if (!product) return <div className="max-w-7xl mx-auto px-4 py-16 text-center">Carregando...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20 md:pb-8">
      <Link to="/produtos" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6">
        <ArrowLeft className="w-5 h-5" /> Voltar aos produtos
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-64 md:h-96 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl"></span>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="text-sm text-primary-600 font-medium bg-primary-50 px-3 py-1 rounded-full">
            {product.category}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-4">{product.name}</h1>
          <p className="text-gray-600 mt-4">{product.description}</p>

          <div className="mt-6">
            <span className="text-4xl font-bold text-primary-600">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-gray-500 text-lg ml-2">/{product.unit}</span>
          </div>

          {product.stock > 0 && (
            <p className="text-green-600 text-sm mt-2">✓ Em estoque ({product.stock} disponíveis)</p>
          )}

          {/* Quantity Selector */}
          <div className="mt-6 flex items-center gap-4">
            <span className="font-medium text-gray-700">Quantidade:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={() => addToCart(product, quantity)}
            className="btn-primary mt-6 w-full md:w-auto flex items-center justify-center gap-2 text-lg py-3 px-8"
          >
            <ShoppingCart className="w-5 h-5" />
            Adicionar ao Carrinho
          </button>

          {/* Quote CTA */}
          <Link
            to="/orcamento"
            className="block mt-4 text-center bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Solicitar Orçamento
          </Link>
        </div>
      </div>
    </div>
  );
}
