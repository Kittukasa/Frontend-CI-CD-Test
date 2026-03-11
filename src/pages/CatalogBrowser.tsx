import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type CatalogProduct = {
  id: string;
  name: string;
  image?: string;
  product_retailer_id?: string;
  price?: string;
  availability?: string | null;
};

const CatalogBrowser: React.FC = () => {
  const [catalogId, setCatalogId] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const buildAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(typeof window !== 'undefined'
      ? { Authorization: `Bearer ${localStorage.getItem('bb_token') || ''}` }
      : {}),
  });

  const loadCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const catalogResponse = await fetch('/api/whatsapp/catalog', {
        headers: buildAuthHeaders(),
      });
      const catalogData = await catalogResponse.json().catch(() => ({}));
      if (!catalogResponse.ok) {
        throw new Error(catalogData?.error || 'Unable to load catalog settings.');
      }

      const resolvedCatalogId =
        typeof catalogData?.catalogId === 'string' ? catalogData.catalogId.trim() : '';
      if (!resolvedCatalogId) {
        throw new Error('No catalog is connected yet.');
      }

      setCatalogId(resolvedCatalogId);

      const query = new URLSearchParams({
        catalogId: resolvedCatalogId,
        limit: '200',
      });
      const productsResponse = await fetch(`/api/whatsapp/catalog/products?${query.toString()}`, {
        headers: buildAuthHeaders(),
      });
      const productsData = await productsResponse.json().catch(() => ({}));
      if (!productsResponse.ok) {
        throw new Error(productsData?.error || 'Unable to load catalog products.');
      }

      const items = Array.isArray(productsData?.products) ? productsData.products : [];
      setProducts(items);
    } catch (err) {
      setProducts([]);
      setError(err instanceof Error ? err.message : 'Unable to load catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return products;
    }
    return products.filter(product => {
      const fields = [
        product.name || '',
        product.product_retailer_id || '',
        product.price || '',
        product.availability || '',
      ];
      return fields.some(field => field.toLowerCase().includes(term));
    });
  }, [products, search]);

  return (
    <div className="min-h-screen bg-[#eef4ff] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Catalog</h1>
              <p className="mt-1 text-sm text-gray-600">
                {catalogId ? `Catalog ID: ${catalogId}` : 'Loading catalog details...'}
              </p>
            </div>
            <Button variant="outline" onClick={loadCatalog} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <div className="mt-4">
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="Search products by name, price, SKU..."
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="mb-4 text-sm font-semibold text-gray-700">
            Products ({filteredProducts.length})
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 h-40 overflow-hidden rounded-md bg-gray-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name || 'Product'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {product.name || 'Unnamed product'}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {product.product_retailer_id || 'No SKU'}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-800">
                    {product.price || '-'}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {product.availability || 'Availability not set'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogBrowser;
