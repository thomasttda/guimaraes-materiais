import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = '/api';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`${API_URL}/banners`).then(res => res.json()).then(setBanners).catch(() => {});
    fetch(`${API_URL}/products?featured=true`).then(res => res.json()).then(setFeaturedProducts).catch(() => {});
    fetch(`${API_URL}/categories`).then(res => res.json()).then(setCategories).catch(() => {});
  }, []);

  const bannerColors = [
    'from-blue-600 to-blue-800',
    'from-primary-500 to-primary-700',
    'from-blue-500 to-primary-600',
  ];

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-blue-700 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Guimarães Materiais para Construção
            </h1>
            <p className="text-lg md:text-xl text-blue-200 mb-8">
              Tudo para sua obra em um só lugar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/produtos" className="btn-primary text-lg px-8 py-3">
                Ver Produtos
              </Link>
              <Link to="/orcamento" className="bg-white text-blue-700 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors text-lg">
                Solicitar Orçamento
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Banners */}
      {banners.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-4">
            {banners.map((banner, i) => (
              <div
                key={banner.id}
                className={`bg-gradient-to-r ${bannerColors[i % bannerColors.length]} rounded-2xl p-6 md:p-8 text-white shadow-lg`}
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h3>
                {banner.subtitle && <p className="text-white/80">{banner.subtitle}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote CTA */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Link
          to="/orcamento"
          className="block bg-white border-2 border-blue-700 rounded-xl p-6 text-center hover:bg-blue-50 transition-colors shadow-md"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-blue-700 font-medium text-sm uppercase tracking-wide">Faça agora seu</p>
              <p className="text-primary-600 text-3xl font-bold italic">Orçamento</p>
            </div>
            <span className="text-4xl">👆</span>
          </div>
        </Link>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Categorias</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map(cat => (
            <Link
              key={cat}
              to={`/produtos?categoria=${cat}`}
              className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-primary-600 text-lg">️</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{cat}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Produtos em Destaque</h2>
          <Link to="/produtos" className="text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700">
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProducts.map(product => (
            <div key={product.id} className="card hover:shadow-xl transition-shadow">
              <Link to={`/produto/${product.id}`}>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-40 flex items-center justify-center">
                  <span className="text-6xl"></span>
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/produto/${product.id}`}>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 hover:text-primary-600">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-primary-600 font-bold text-xl">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">{product.unit}</span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-blue-700 hover:bg-blue-800 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Votomassa Banner */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white text-center shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-primary-400">Toda Linha</span> Votomassa
          </h2>
          <p className="text-xl mb-4">É na Guimarães Materiais para Construção</p>
          <Link to="/produtos?categoria=Argamassas" className="btn-primary inline-block">
            Ver Produtos Votomassa
          </Link>
        </div>
      </div>
    </div>
  );
}
