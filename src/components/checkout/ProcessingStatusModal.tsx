import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCheckout } from '../../context/CheckoutContext';
import { getProviderInfo } from '../../data/paymentProviders';

export const ProcessingStatusModal: React.FC = () => {
  const { currentTransaction, paymentProvider, paymentPhone, statusMessage, isSimulated } = useCheckout();
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentTransaction) return null;

  const provider = getProviderInfo(paymentProvider);
  const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

  return (
    <div style={{
      textAlign: 'center',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.2rem'
    }}>
      {/* Animated Glowing Ring */}
      <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(212, 175, 55, 0.2)',
          borderTopColor: 'var(--gold-primary)',
          animation: 'spin 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite'
        }} />
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'var(--gold-tint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} />
      </div>

      <div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--pending-bg)',
          color: 'var(--pending)',
          padding: '0.3rem 0.8rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.78rem',
          fontWeight: 700,
          marginBottom: '0.6rem'
        }}>
          <span>INASUBIRI PIN YA MTEJA (PENDING)</span>
        </div>

        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Ombi la Malipo Limetumwa!
        </h3>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '360px', margin: '0.5rem auto 0' }}>
          Tafadhali angalia simu yako yenye namba <strong style={{ color: 'var(--text-primary)' }}>{paymentPhone}</strong>. Ombi la malipo kutoka <strong style={{ color: 'var(--gold-text)' }}>{provider.name}</strong> linajitokeza kwenye simu hiyo.
        </p>
      </div>

      {/* Transaction Summary Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-glass)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Kumbukumbu ya Muamala:</span>
          <span style={{ color: 'var(--gold-text)', fontWeight: 700, fontFamily: 'monospace' }}>{currentTransaction.id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Kiasi Kinachoidhinishwa:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatTZS(currentTransaction.amount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Mtandao:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{provider.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Muda uliosalia:</span>
          <span style={{ color: secondsRemaining < 15 ? 'var(--danger)' : 'var(--pending)', fontWeight: 700 }}>
            {secondsRemaining} sekunde
          </span>
        </div>
      </div>

      {/* Dynamic Status message */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        background: 'var(--bg-surface-elevated)',
        padding: '0.6rem 1rem',
        borderRadius: 'var(--radius-full)'
      }}>
        <Loader2 size={15} className="spin" color="var(--gold-primary)" />
        <span>{statusMessage}</span>
      </div>

      {/* Demo helper */}
      {isSimulated && <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '0.8rem',
        width: '100%'
      }}>
        <em>Kidokezo cha Demo: Angalia kisanduku kidogo cha <strong>Simu ya Mteja (DEMO)</strong> kilichopo chini kulia kuidhinisha au kufelisha malipo.</em>
      </div>}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};
