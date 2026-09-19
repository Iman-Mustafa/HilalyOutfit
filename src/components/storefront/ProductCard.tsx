import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { startCheckout } = useCheckout();

  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || 'Standard');
  const [isAddedAnimation, setIsAddedAnimation] = useState(false);

  const formatTZS = (val: number) => {
    return 'TSh ' + val.toLocaleString('en-US');
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    // A visitor is sent to register first, so nothing has been added yet
    if (!user) return;
    setIsAddedAnimation(true);
    setTimeout(() => setIsAddedAnimation(false), 1200);
  };

  const handleBuyNow = () => {
    startCheckout({
      product,
      quantity: 1,
      selectedSize,
      selectedColor
    });
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative'
      }}
      className="product-card"
    >
      {/* Product Image Area */}
      <Link
        to={`/bidhaa/${product.id}`}
        aria-label={`Angalia ${product.name}`}
        style={{ position: 'relative', display: 'block', width: '100%', height: '240px', overflow: 'hidden', background: 'var(--bg-surface-elevated)' }}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
          className="product-img"
        />

        {/* Badge Tag */}
        {product.badge && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'linear-gradient(135deg, #F9DF7B 0%, #D4AF37 100%)',
              color: 'var(--text-on-gold)',
              fontWeight: 700,
              fontSize: '0.72rem',
              padding: '0.28rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'var(--shadow-sm)',
              letterSpacing: '0.04em'
            }}
          >
            {product.badge}
          </div>
        )}

        {/* Rating pill */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'var(--bg-surface-glass)',
            backdropFilter: 'blur(6px)',
            border: '1px solid var(--border-subtle)',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            color: 'var(--text-primary)'
          }}
        >
          <Star size={13} fill="var(--gold-primary)" color="var(--gold-primary)" />
          <span style={{ fontWeight: 700 }}>{product.rating}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({product.reviewsCount})</span>
        </div>
      </Link>

      {/* Product Content Details */}
      <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
        
        <div>
          <span style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--gold-text)',
            fontWeight: 600
          }}>
            {product.categoryLabel}
          </span>

          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            marginTop: '3px'
          }}>
            <Link to={`/bidhaa/${product.id}`} className="product-card-title">
              {product.name}
            </Link>
          </h3>
        </div>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <span style={{
            fontSize: '1.22rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)'
          }}>
            {formatTZS(product.price)}
          </span>

          {product.originalPrice && (
            <span style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              textDecoration: 'line-through'
            }}>
              {formatTZS(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Size Selector */}
        {product.sizes.length > 1 && (
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Chagua Saizi: <strong style={{ color: 'var(--text-primary)' }}>{selectedSize}</strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {product.sizes.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.72rem',
                    borderRadius: '6px',
                    border: selectedSize === size ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    background: selectedSize === size ? 'var(--gold-tint)' : 'var(--bg-surface)',
                    color: selectedSize === size ? 'var(--gold-text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Palette Dots */}
        {product.colors.length > 1 && (
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Rangi: <strong style={{ color: 'var(--text-primary)' }}>{selectedColor}</strong>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {product.colors.map(col => (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => setSelectedColor(col.name)}
                  title={col.name}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: col.hex,
                    border: selectedColor === col.name ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    boxShadow: selectedColor === col.name ? '0 0 0 2px var(--bg-surface), 0 0 0 4px var(--gold-primary)' : 'none',
                    position: 'relative'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
          
          <button
            type="button"
            onClick={handleAddToCart}
            className="btn btn-secondary"
            style={{
              padding: '0.6rem 0.5rem',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-md)',
              border: isAddedAnimation ? '1px solid var(--success)' : '1px solid var(--border-subtle)'
            }}
          >
            {isAddedAnimation ? (
              <span style={{ color: 'var(--success)' }}>Imewekwa!</span>
            ) : (
              <span>Kikapuni</span>
            )}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="btn btn-gold"
            style={{
              padding: '0.6rem 0.5rem',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <span>Nunua Sasa</span>
          </button>

        </div>

      </div>

      <style>{`
        .product-card:hover {
          transform: translateY(-4px);
          border-color: var(--gold-border-bright);
          box-shadow: var(--shadow-gold);
        }
        .product-card:hover .product-img {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};
