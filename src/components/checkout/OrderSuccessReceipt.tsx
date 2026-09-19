import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCheckout } from '../../context/CheckoutContext';
import { getProviderInfo } from '../../data/paymentProviders';

export const OrderSuccessReceipt: React.FC = () => {
  const { currentTransaction, closeCheckout } = useCheckout();

  useEffect(() => {
    // Launch gold celebration confetti
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F3C64F', '#10B981', '#8A6914', '#A7841F']
      });
    } catch {
      // ignore
    }
  }, []);

  if (!currentTransaction) return null;

  const provider = getProviderInfo(currentTransaction.provider);
  const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem 0' }}>
      
      {/* Success Hero Header */}
      <div style={{
        textAlign: 'center',
        padding: '1.4rem 1rem',
        background: 'var(--success-bg)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--success-border)',
        position: 'relative'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669, #047857)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 0.8rem',
          boxShadow: '0 0 25px rgba(4, 120, 87, 0.25)'
        }}>
          <CheckCircle size={36} color="#FFF" />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          color: 'var(--success)',
          fontSize: '0.78rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '4px'
        }}>
          <span>Malipo Yamethibitishwa Kikamilifu</span>
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Hongera, Malipo Yamefanikiwa!
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0.4rem auto 0' }}>
          Mzigo wako unaandaliwa sasa kwa ajili ya kufikishwa {currentTransaction.customer.district}.
        </p>
      </div>

      {/* Official Printable Digital Receipt */}
      <div
        id="printable-receipt"
        style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative'
        }}
      >
        {/* Receipt Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.9rem'
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold-text)' }}>
              HILALY OUTFIT
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Risiti Rasmi ya Mauzo &bull; E-Commerce
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Namba ya Risiti:</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {currentTransaction.id}
            </div>
          </div>
        </div>

        {/* Customer & Transaction Meta */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.8rem',
          fontSize: '0.82rem'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Mteja:</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentTransaction.customer.fullName}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{currentTransaction.customer.phone}</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Mahali pa Mzigo:</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{currentTransaction.customer.district}</div>
            {currentTransaction.customer.region && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{currentTransaction.customer.region}</div>
            )}
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Njia ya Malipo:</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{provider.name} ({currentTransaction.paymentPhone})</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontFamily: 'monospace' }}>
              Ref: {currentTransaction.gatewayRef}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Tarehe na Muda:</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {new Date(currentTransaction.createdAt).toLocaleDateString('sw-TZ', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Purchased Items List */}
        <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.8rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--gold-text)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Mavazi Yaliyolipwa:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {currentTransaction.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  padding: '4px 0'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.product.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '0.75rem' }}>
                    (Saizi: {item.selectedSize}, Rangi: {item.selectedColor}, Qty: {item.quantity})
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatTZS(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Row */}
        <div style={{
          borderTop: '1px solid var(--gold-border)',
          paddingTop: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Jumla Iliyolipwa:</span>
          <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--gold-text)', fontFamily: 'var(--font-sans)' }}>
            {formatTZS(currentTransaction.amount)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        <button
          onClick={handlePrint}
          className="btn btn-secondary"
          style={{ padding: '0.85rem' }}
        >
          <span>Chapisha / PDF</span>
        </button>

        <button
          onClick={closeCheckout}
          className="btn btn-gold"
          style={{ padding: '0.85rem' }}
        >
          <span>Fungua Duka Lote</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
        <span>Ujumbe wa uthibitisho (SMS) umetumwa pia kwenye simu yako.</span>
      </div>

    </div>
  );
};
