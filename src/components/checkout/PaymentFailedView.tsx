import React from 'react';
import { XCircle } from 'lucide-react';
import { useCheckout } from '../../context/CheckoutContext';

export const PaymentFailedView: React.FC = () => {
  const { currentTransaction, retryPayment, closeCheckout } = useCheckout();

  if (!currentTransaction) return null;

  return (
    <div style={{
      textAlign: 'center',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.2rem'
    }}>
      {/* Failed Icon */}
      <div style={{
        width: '68px',
        height: '68px',
        borderRadius: '50%',
        background: 'var(--danger-bg)',
        border: '1px solid var(--danger-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 25px rgba(220, 38, 38, 0.12)'
      }}>
        <XCircle size={38} color="var(--danger)" />
      </div>

      <div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          color: 'var(--danger)',
          background: 'var(--danger-bg)',
          padding: '0.28rem 0.8rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.76rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: '0.5rem'
        }}>
          <span>Malipo Hayajakamilika</span>
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Samahani, Malipo Yamefeli
        </h3>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0.5rem auto 0' }}>
          {currentTransaction.failureReason || 'Muamala haukuweza kuthibitishwa na mtandao wa simu au ulighairiwa na mtumiaji.'}
        </p>
      </div>

      {/* Security Access Block Note */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--danger-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.45,
        textAlign: 'left'
      }}>
        <strong style={{ color: 'var(--danger)' }}>USALAMA:</strong> Mfumo umezuiwa kutoa huduma au risiti ya manunuzi hadi pale malipo yatakapothibitishwa rasmi na mfumo wa benki/mtandao wa simu.
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', width: '100%', maxWidth: '380px' }}>
        <button
          onClick={retryPayment}
          className="btn btn-gold"
          style={{ padding: '0.9rem', fontSize: '0.98rem' }}
        >
          <span>Jaribu Kulipa Tena (Retry Payment)</span>
        </button>

        <button
          onClick={closeCheckout}
          className="btn btn-secondary"
          style={{ padding: '0.8rem', fontSize: '0.9rem' }}
        >
          <span>Rudi kwenye Kikapu / Duka</span>
        </button>
      </div>

    </div>
  );
};
