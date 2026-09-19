import React from 'react';
import { useProducts } from '../context/ProductsContext';
import { HeroBanner } from '../components/storefront/HeroBanner';
import { CategoryTabs } from '../components/storefront/CategoryTabs';
import { ProductGrid } from '../components/storefront/ProductGrid';
import type { ProductCategory } from '../types';

interface HomePageProps {
  searchQuery: string;
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  onExploreClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  searchQuery,
  selectedCategory,
  onSelectCategory,
  onExploreClick
}) => {
  const { products, isLoading, error, refreshProducts } = useProducts();

  return (
    <>
      <HeroBanner products={products} onExploreClick={onExploreClick} />

      <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />

      {error ? (
        <section id="products-section" style={{ padding: '3rem 1.25rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            Bidhaa hazijapatikana
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
          <button onClick={refreshProducts} className="btn btn-outline-gold" style={{ marginTop: '1.2rem' }}>
            Jaribu Tena
          </button>
        </section>
      ) : isLoading && products.length === 0 ? (
        <section id="products-section" style={{ padding: '1.6rem 1.25rem 2.5rem' }}>
          <div className="product-grid" aria-busy="true" aria-label="Inapakia bidhaa">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        </section>
      ) : (
        <ProductGrid
          products={products}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      )}
    </>
  );
};
