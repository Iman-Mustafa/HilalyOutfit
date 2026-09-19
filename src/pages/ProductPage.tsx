import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Minus, Plus, Star } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../context/CheckoutContext';
import { ProductCard } from '../components/storefront/ProductCard';
import type { Product } from '../types';

const MAX_QUANTITY = 20;

const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

const DELIVERY_POINTS = [
  'Ufikishaji Dar es Salaam na mikoa yote ya Tanzania',
  'Malipo salama kwa M-Pesa, Tigo Pesa, Airtel Money na HaloPesa',
  'Hakuna PIN inayoombwa wala kuhifadhiwa kwenye tovuti'
];

export const ProductPage: React.FC = () => {
  const { productId = '' } = useParams();
  const { addToCart } = useCart();
  const { startCheckout } = useCheckout();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError('');

    api.getProduct(productId)
      .then(({ product, related }) => {
        if (!isCurrent) return;
        setProduct(product);
        setRelated(related);
        setActiveImage(product.image);
        setSelectedSize(product.sizes[0] || 'Standard');
        setSelectedColor(product.colors[0]?.name || 'Standard');
        setQuantity(1);
      })
      .catch(e => {
        if (!isCurrent) return;
        setProduct(null);
        setError(e instanceof ApiError ? e.message : 'Imeshindikana kupata bidhaa hii.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    // Ignore a slow response for a product the customer has already navigated away from
    return () => {
      isCurrent = false;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="product-detail" aria-busy="true" aria-label="Inapakia bidhaa">
        <div className="skeleton-card" style={{ height: '420px' }} />
        <div className="skeleton-card" style={{ height: '420px' }} />
      </div>
    );
  }

  if (!product) {
    return (
      <section style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Bidhaa haijapatikana
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</p>
        <Link to="/" className="btn btn-outline-gold" style={{ marginTop: '1.2rem' }}>
          Rudi Dukani
        </Link>
      </section>
    );
  }

  const gallery = [product.image, ...(product.images ?? [])].filter((url, i, all) => url && all.indexOf(url) === i);
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    startCheckout({ product, quantity, selectedSize, selectedColor });
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Ulipo" style={{ padding: '1rem 1.25rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--gold-text)', textDecoration: 'none', fontWeight: 600 }}>Nyumbani</Link>
        <span style={{ margin: '0 0.4rem' }}>/</span>
        <span>{product.categoryLabel}</span>
        <span style={{ margin: '0 0.4rem' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{product.name}</span>
      </nav>

      <article className="product-detail">
        {/* Gallery */}
        <div>
          <div className="product-detail-image">
            <img src={activeImage} alt={product.name} />
            {product.badge && <div className="hero-showcase-badge" style={{ animation: 'none' }}>{product.badge}</div>}
          </div>

          {gallery.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', overflowX: 'auto' }}>
              {gallery.map(url => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  aria-label="Onyesha picha hii"
                  aria-pressed={activeImage === url}
                  className={activeImage === url ? 'product-thumb active' : 'product-thumb'}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-text)', fontWeight: 600 }}>
              {product.categoryLabel}
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem, 2.4vw, 1.9rem)', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)', marginTop: '4px' }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <Star size={15} fill="var(--gold-primary)" color="var(--gold-primary)" />
              <strong style={{ color: 'var(--text-primary)' }}>{product.rating}</strong>
              <span>({product.reviewsCount} maoni)</span>
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.7rem' }}>
            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatTZS(product.price)}
            </span>
            {discountPercent > 0 && product.originalPrice && (
              <>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {formatTZS(product.originalPrice)}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                  Punguzo {discountPercent}%
                </span>
              </>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65 }}>
            {product.description}
          </p>

          {/* Size */}
          {product.sizes.length > 0 && (
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Saizi: <strong style={{ color: 'var(--text-primary)' }}>{selectedSize}</strong>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {product.sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    aria-pressed={selectedSize === size}
                    className={selectedSize === size ? 'option-chip active' : 'option-chip'}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          {product.colors.length > 0 && (
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Rangi: <strong style={{ color: 'var(--text-primary)' }}>{selectedColor}</strong>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {product.colors.map(col => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => setSelectedColor(col.name)}
                    title={col.name}
                    aria-label={col.name}
                    aria-pressed={selectedColor === col.name}
                    className={selectedColor === col.name ? 'color-swatch active' : 'color-swatch'}
                    style={{ backgroundColor: col.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Idadi</div>
            <div className="quantity-stepper">
              <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Punguza idadi">
                <Minus size={15} />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" onClick={() => setQuantity(q => Math.min(MAX_QUANTITY, q + 1))} disabled={quantity >= MAX_QUANTITY} aria-label="Ongeza idadi">
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Actions */}
          {product.inStock ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={handleAddToCart}
                className="btn btn-secondary"
                style={{ padding: '0.85rem 0.5rem' }}
              >
                Weka Kikapuni
              </button>
              <button type="button" onClick={handleBuyNow} className="btn btn-gold" style={{ padding: '0.85rem 0.5rem' }}>
                Nunua Sasa
              </button>
            </div>
          ) : (
            <div style={{ padding: '0.8rem 1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 600 }}>
              Bidhaa hii imeisha stoo kwa sasa.
            </div>
          )}

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            {DELIVERY_POINTS.map(point => (
              <li key={point} style={{ borderLeft: '2px solid var(--gold-primary)', paddingLeft: '0.7rem' }}>{point}</li>
            ))}
          </ul>
        </div>
      </article>

      {/* Related Products */}
      {related.length > 0 && (
        <section style={{ padding: '0.5rem 1.25rem 2.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.15rem, 2vw, 1.5rem)', fontWeight: 800, color: 'var(--text-primary)', margin: '1.5rem 0 1.1rem' }}>
            Bidhaa Zinazofanana
          </h2>
          <div className="product-grid">
            {related.map(item => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
};
