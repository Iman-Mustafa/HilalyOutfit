import React, { useState } from 'react';
import { useCheckout } from '../../context/CheckoutContext';
import { PAYMENT_PROVIDERS } from '../../data/paymentProviders';

export const PhonePushSimulator: React.FC = () => {
  const {
    isUssdPromptActive,
    paymentProvider,
    paymentPhone,
    currentTransaction,
    simulateTelcoPinApproval
  } = useCheckout();

  const [pinInput, setPinInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isUssdPromptActive || !currentTransaction) return null;

  const providerInfo = PAYMENT_PROVIDERS.find(p => p.id === paymentProvider) || PAYMENT_PROVIDERS[0];
  const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

  const handleApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      simulateTelcoPinApproval('approve');
      setIsSubmitting(false);
    }, 600);
  };

  const handleWrongPin = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      simulateTelcoPinApproval('wrong_pin');
      setIsSubmitting(false);
    }, 500);
  };

  const handleCancel = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      simulateTelcoPinApproval('cancel');
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1100,
      width: '320px',
      background: 'var(--bg-surface)',
      borderRadius: '24px',
      border: '2px solid var(--gold-border)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden',
      fontFamily: 'monospace',
      animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Demo caption bar (outside the handset, light theme) */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--gold-text)' }}>
          <span>SIMU YA MTEJA (DEMO)</span>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{paymentPhone}</div>
      </div>

      {/* Phone handset (stays dark: depicts a physical device screen) */}
      <div style={{ margin: '10px', padding: '1rem', background: '#0B0D13', borderRadius: '16px', color: '#E2E8F0', fontSize: '0.82rem', lineHeight: 1.5 }}>
        
        <div style={{
          background: providerInfo.badgeBg,
          color: '#FFF',
          padding: '6px 10px',
          borderRadius: '8px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px'
        }}>
          <span>{providerInfo.name} USSD Push</span>
        </div>

        <div style={{ background: '#020305', padding: '10px', borderRadius: '8px', border: '1px solid #222736', marginBottom: '12px' }}>
          <div><strong>Ombi la Malipo:</strong></div>
          <div style={{ color: 'var(--gold-primary)', margin: '4px 0', fontWeight: 'bold' }}>
            {formatTZS(currentTransaction.amount)} kwenda HILALY OUTFIT
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
            Kumbukumbu: {currentTransaction.id}
          </div>
          <div style={{ marginTop: '8px', borderTop: '1px dashed #334155', paddingTop: '6px', color: '#CBD5E1' }}>
            Ingiza namba yako ya siri (PIN):
          </div>

          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              autoFocus
              style={{
                background: '#111520',
                border: '1px solid #3B4256',
                color: '#FFF',
                padding: '6px 10px',
                borderRadius: '6px',
                width: '100%',
                fontSize: '1rem',
                letterSpacing: '0.3em',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Action buttons simulating client PIN entry on their phone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleApprove}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#FFF',
              border: 'none',
              padding: '8px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.8rem'
            }}
          >
            <span>Idhinisha (Ingiza PIN Sahihi)</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleWrongPin}
              style={{
                background: '#334155',
                color: '#F87171',
                border: '1px solid #475569',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>PIN Makosa</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancel}
              style={{
                background: '#1E293B',
                color: '#94A3B8',
                border: '1px solid #334155',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span>Ghairi</span>
            </button>
          </div>
        </div>

      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0 14px 12px' }}>
        Simulizi hii inaonyesha menyu itakayojitokeza kwenye simu halisi ya mteja.
      </div>

    </div>
  );
};
