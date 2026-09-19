import React, { useEffect, useState } from 'react';
import type { Product } from '../../types';
import { api, ApiError } from '../../lib/api';
import { useProducts } from '../../context/ProductsContext';
import { ProductForm } from './ProductForm';

interface ProductManagerProps {
  /** Called when the server answers 401/403: the session is no longer an admin session */
  onAuthError?: (message: string) => void;
}

const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

const flagStyle = (tone: 'success' | 'danger' | 'gold'): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.15rem 0.55rem',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.7rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  background: tone === 'gold' ? 'var(--gold-tint)' : `var(--${tone}-bg)`,
  color: tone === 'gold' ? 'var(--gold-text)' : `var(--${tone})`,
  border: `1px solid ${tone === 'gold' ? 'var(--gold-border)' : `var(--${tone}-border)`}`
});

export const ProductManager: React.FC<ProductManagerProps> = ({ onAuthError }) => {
  const { products, isLoading, error, refreshProducts } = useProducts();

  // `undefined` = form closed, `null` = adding a new product, a Product = editing it
  const [formTarget, setFormTarget] = useState<Product | null | undefined>(undefined);
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState<boolean | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Ask the server once whether image uploads are available
  useEffect(() => {
    let cancelled = false;
    api.config()
      .then(config => {
        if (!cancelled) setCloudinaryEnabled(config.cloudinaryEnabled);
      })
      .catch(() => {
        // Unknown: leave the file input usable, the server will answer clearly if uploads are off
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (product: Product) => {
    if (deletingId) return;
    const confirmed = window.confirm(`Una uhakika unataka kufuta "${product.name}"? Hatua hii haiwezi kutenduliwa.`);
    if (!confirmed) return;

    setDeletingId(product.id);
    setActionError('');
    setActionMessage('');
    try {
      await api.deleteProduct(product.id);
      await refreshProducts();
      setActionMessage(`"${product.name}" imefutwa.`);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Imeshindikana kufuta bidhaa. Tafadhali jaribu tena.';
      setActionError(message);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403) && onAuthError) onAuthError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async (saved: Product) => {
    const wasEditing = formTarget !== null && formTarget !== undefined;
    await refreshProducts();
    setFormTarget(undefined);
    setActionError('');
    setActionMessage(wasEditing ? `"${saved.name}" imehifadhiwa.` : `"${saved.name}" imeongezwa.`);
  };

  const openForm = (target: Product | null) => {
    setActionError('');
    setActionMessage('');
    setFormTarget(target);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Bidhaa za Duka ({products.length})
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Ongeza, hariri au futa bidhaa zinazoonekana dukani.
          </div>
        </div>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="btn btn-gold"
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}
        >
          Ongeza Bidhaa
        </button>
      </div>

      {(actionError || error) && (
        <div role="alert" style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.7rem 0.9rem',
          fontSize: '0.84rem',
          color: 'var(--danger)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem'
        }}>
          <span>{actionError || error}</span>
          {!actionError && (
            <button
              type="button"
              onClick={() => { refreshProducts(); }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--danger)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px'
              }}
            >
              Jaribu tena
            </button>
          )}
        </div>
      )}

      {actionMessage && (
        <div role="status" style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.7rem 0.9rem',
          fontSize: '0.84rem',
          color: 'var(--success)'
        }}>
          {actionMessage}
        </div>
      )}

      {products.length === 0 ? (
        <div style={{
          border: '1px dashed var(--gold-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 1rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          {isLoading
            ? 'Inapakia bidhaa…'
            : error
              ? 'Imeshindikana kupata bidhaa.'
              : 'Hakuna bidhaa bado. Bonyeza "Ongeza Bidhaa" kuanza.'}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--gold-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          {products.map((product, index) => (
            <div
              key={product.id}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.8rem 1rem',
                padding: '0.85rem 1rem',
                borderTop: index === 0 ? 'none' : '1px solid var(--border-subtle)',
                opacity: deletingId === product.id ? 0.5 : 1
              }}
            >
              <img
                src={product.image}
                alt=""
                loading="lazy"
                style={{
                  width: '56px',
                  height: '68px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface-elevated)',
                  flexShrink: 0
                }}
              />

              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {product.categoryLabel}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                  <span style={flagStyle(product.inStock ? 'success' : 'danger')}>
                    {product.inStock ? 'Ipo stoo' : 'Imeisha'}
                  </span>
                  {product.featured && <span style={flagStyle('gold')}>Inaonyeshwa juu</span>}
                  {product.badge && <span style={flagStyle('gold')}>{product.badge}</span>}
                </div>
              </div>

              <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {formatTZS(product.price)}
                </div>
                {product.originalPrice !== undefined && product.originalPrice > product.price && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                    {formatTZS(product.originalPrice)}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flex: '0 0 auto' }}>
                <button
                  type="button"
                  onClick={() => openForm(product)}
                  disabled={deletingId !== null}
                  className="btn btn-outline-gold"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)' }}
                >
                  Hariri
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product)}
                  disabled={deletingId !== null}
                  className="btn"
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger-border)',
                    cursor: deletingId !== null ? 'not-allowed' : 'pointer'
                  }}
                >
                  {deletingId === product.id ? 'Inafuta…' : 'Futa'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formTarget !== undefined && (
        <ProductForm
          key={formTarget ? formTarget.id : 'new'}
          product={formTarget}
          cloudinaryEnabled={cloudinaryEnabled}
          onClose={() => setFormTarget(undefined)}
          onSaved={handleSaved}
          onAuthError={onAuthError}
        />
      )}
    </div>
  );
};
