import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import { useCheckout } from '../../context/CheckoutContext';

interface HeroShowcaseProps {
  products: Product[];
}

const SLIDE_DURATION_MS = 4500;

const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

export const HeroShowcase: React.FC<HeroShowcaseProps> = ({ products }) => {
  const { startCheckout } = useCheckout();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance; hovering or focusing the showcase holds the current product
  useEffect(() => {
    if (isPaused || products.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = setTimeout(() => {
      setActiveIndex(i => (i + 1) % products.length);
    }, SLIDE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, isPaused, products.length]);

  // Hold the space while the catalogue loads so the hero does not jump
  if (products.length === 0) return <div className="hero-showcase skeleton-card" aria-hidden="true" />;

  const active = products[activeIndex % products.length];

  const handleBuyNow = () => {
    startCheckout({
      product: active,
      quantity: 1,
      selectedSize: active.sizes[0] || 'Standard',
      selectedColor: active.colors[0]?.name || 'Standard'
    });
  };

  return (
    <div
      className={isPaused ? 'hero-showcase paused' : 'hero-showcase'}
      style={{ '--slide-duration': `${SLIDE_DURATION_MS}ms` } as React.CSSProperties}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Bidhaa Maalum za Hilaly"
    >
      {/* Slides: stacked, the active one fades in with a slow zoom */}
      {products.map((product, i) => (
        <img
          key={product.id}
          src={product.image}
          alt={i === activeIndex ? product.name : ''}
          aria-hidden={i !== activeIndex}
          className={i === activeIndex ? 'hero-slide active' : 'hero-slide'}
        />
      ))}

      {/* Badge */}
      {active.badge && (
        <div key={`badge-${active.id}`} className="hero-showcase-badge">
          {active.badge}
        </div>
      )}

      {/* Slide Picker: the active dot fills up while its product is on show */}
      <div className="hero-dots">
        {products.map((product, i) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={i === activeIndex ? 'hero-dot active' : 'hero-dot'}
            aria-label={`Onyesha ${product.name}`}
            aria-current={i === activeIndex}
          >
            {i === activeIndex && <span className="hero-dot-fill" />}
          </button>
        ))}
      </div>

      {/* Caption */}
      <div className="hero-caption">
        <div key={active.id} className="hero-caption-text" aria-live="polite">
          <div style={{ fontSize: '0.68rem', color: 'var(--gold-text)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            {active.categoryLabel}
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {active.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '2px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {formatTZS(active.price)}
            </span>
            {active.originalPrice && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                {formatTZS(active.originalPrice)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleBuyNow}
          className="btn btn-gold"
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Nunua Sasa
        </button>
      </div>
    </div>
  );
};
