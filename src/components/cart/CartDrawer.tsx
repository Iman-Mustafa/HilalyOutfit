import React from 'react';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCheckout } from '../../context/CheckoutContext';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    totalAmount,
    totalItems
  } = useCart();

  const { startCheckout } = useCheckout();

  if (!isCartOpen) return null;

  const formatTZS = (val: number) => {
    return 'TSh ' + val.toLocaleString('en-US');
  };

  const handleCheckoutClick = () => {
    startCheckout();
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsCartOpen(false)}>
      <div
        className="glass-panel animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          boxShadow: 'var(--shadow-lg)',
          borderLeft: '1px solid var(--border-glass)'
        }}
      >
        {/* Cart Header */}
        <div style={{
          padding: '1.2rem 1.4rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Kikapu cha Manunuzi</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vitu {totalItems} vimechaguliwa</div>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.2rem 1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Kikapu Chako Kipo Wazi</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                Bado hujaweka mavazi yoyote kwenye kikapu chako. Chagua vazi unalolipenda kisha bonyeza Weka Kikapuni.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="btn btn-gold"
                style={{ marginTop: '0.5rem', fontSize: '0.88rem' }}
              >
                Anza Kufanya Manunuzi
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                style={{
                  display: 'flex',
                  gap: '0.9rem',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  style={{
                    width: '75px',
                    height: '85px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '2px',
                          opacity: 0.8
                        }}
                        title="Ondoa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Saizi: <span style={{ color: 'var(--gold-text)', fontWeight: 600 }}>{item.selectedSize}</span> &bull;
                      Rangi: <span style={{ color: 'var(--text-primary)' }}>{item.selectedColor}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--gold-text)', fontSize: '0.92rem' }}>
                      {formatTZS(item.product.price * item.quantity)}
                    </div>

                    {/* Quantity Stepper */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-surface)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      padding: '2px'
                    }}>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, -1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          padding: '3px 7px',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={12} />
                      </button>

                      <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '22px', textAlign: 'center', color: 'var(--text-primary)' }}>
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, 1)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          padding: '3px 7px',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '1.2rem 1.4rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Gharama ya Usafirishaji:</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>BURE (Ofa ya Hilaly)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>Jumla ya Kulipa:</span>
              <span style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--gold-text)',
                fontFamily: 'var(--font-sans)'
              }}>
                {formatTZS(totalAmount)}
              </span>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="btn btn-gold"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <span>Endelea na Malipo</span>
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)'
            }}>
              <span>Malipo salama ya Vodacom M-Pesa, Tigo Pesa, Airtel & HaloPesa</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
