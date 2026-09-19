import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Product } from '../types';
import { api, ApiError } from '../lib/api';

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  error: string;
  /** Re-fetch the catalogue (after the admin adds, edits or deletes a product) */
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { products } = await api.listProducts();
      setProducts(products);
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Imeshindikana kupata bidhaa.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  return (
    <ProductsContext.Provider value={{ products, isLoading, error, refreshProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
