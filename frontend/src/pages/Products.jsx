import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';

const API_URL = '/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || '');
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`${API_URL}/categories`).then(res => res.json()).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let url = `${API_URL}/products`;
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (search) params.set('search', search);
    if (params.toString()) url += `?${params.toString()}`;
    fetch(url).then(res => res.json()).then(setProducts).catch(() => {});
  }, [selectedCategory, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-20 md:pb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nossos Produtos</h1>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2"
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Filtros</span>
        </button>
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-500'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-primary-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className="card hover:shadow-xl transition-shadow">
              <Link to={`/produto/${product.id}`}>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-40 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl"></span>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <span className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                <Link to={`/produto/${product.id}`}>
                  <h3 className="font-semibold text-gray-800 text-sm mt-2 mb-1 line-clamp-2 hover:text-primary-600">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-primary-600 font-bold text-xl">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">/{product.unit}</span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-blue-700 hover:bg-blue-800 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
