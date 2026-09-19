import React from 'react';
import { Product, ProductCategory } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  searchQuery: string;
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  searchQuery,
  selectedCategory,
  onSelectCategory
}) => {
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'vyote' || product.category === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="products-section" style={{ padding: '1.6rem 1.25rem 2.5rem' }}>

      {/* Section Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '0.5rem 1rem',
        marginBottom: '1.3rem'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.25rem, 2.2vw, 1.7rem)',
          fontWeight: 800,
          color: 'var(--text-primary)'
        }}>
          Mavazi na Vifaa vya Hadhi ya Juu
        </h2>

        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Vitu {filteredProducts.length} vilivyopo stoo
        </span>
      </div>

      {/* Grid */}
      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--gold-border)'
        }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.4rem' }}>
            Hakuna vazi lililopatikana
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
            Jaribu kubadilisha neno la kutafuta au chagua aina nyingine ya nguo kutoka kwenye orodha hapo juu.
          </p>
          <button
            onClick={() => onSelectCategory('vyote')}
            className="btn btn-outline-gold"
            style={{ marginTop: '1.2rem' }}
          >
            Angalia Mkusanyiko Wote
          </button>
        </div>
      )}

    </section>
  );
};
