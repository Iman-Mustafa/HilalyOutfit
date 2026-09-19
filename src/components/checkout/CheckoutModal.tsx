import React from 'react';
import { X, Check } from 'lucide-react';
import { useCheckout } from '../../context/CheckoutContext';
import { PaymentMethodStep } from './PaymentMethodStep';
import { ProcessingStatusModal } from './ProcessingStatusModal';
import { OrderSuccessReceipt } from './OrderSuccessReceipt';
import { PaymentFailedView } from './PaymentFailedView';

const STEP_LABELS = ['Malipo', 'Uthibitisho', 'Risiti'];

export const CheckoutModal: React.FC = () => {
  const { isCheckoutOpen, closeCheckout, step } = useCheckout();

  if (!isCheckoutOpen) return null;

  const activeStepIndex = step === 'payment_method' ? 0 : (step === 'initiating' || step === 'processing') ? 1 : 2;

  return (
    <div className="modal-backdrop" onClick={step === 'processing' || step === 'initiating' ? undefined : closeCheckout}>
      <div
        className="glass-panel animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          borderRadius: 'var(--radius-lg)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: '1px solid var(--gold-border-bright)',
          boxShadow: 'var(--shadow-lg)',
          background: 'var(--bg-surface)'
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <span className="gold-gradient-text">HILALY</span> CHECKOUT
              </h3>
            </div>
          </div>

          {step !== 'processing' && step !== 'initiating' && (
            <button
              onClick={closeCheckout}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Step Progress Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.8rem 1.4rem',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.74rem'
        }}>
          {STEP_LABELS.map((label, i) => {
            const isDone = i < activeStepIndex || step === 'success';
            const isActive = i === activeStepIndex && !isDone;
            const tone = isDone
              ? 'var(--success)'
              : isActive
                ? (step === 'failed' ? 'var(--danger)' : step === 'payment_method' ? 'var(--gold-text)' : 'var(--pending)')
                : 'var(--text-muted)';

            return (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ height: '1px', flex: 1, background: 'var(--border-subtle)', margin: '0 8px' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: tone, fontWeight: isActive ? 700 : 500 }}>
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isDone || isActive ? tone : 'var(--border-subtle)',
                    color: isDone || isActive ? '#FFF' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 800
                  }}>
                    {isDone ? <Check size={11} color="#FFF" /> : i + 1}
                  </span>
                  <span>{i + 1}. {label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Modal Dynamic Body */}
        <div style={{ padding: '1.4rem' }}>
          {step === 'payment_method' && <PaymentMethodStep />}
          {(step === 'initiating' || step === 'processing') && <ProcessingStatusModal />}
          {step === 'success' && <OrderSuccessReceipt />}
          {step === 'failed' && <PaymentFailedView />}
        </div>

      </div>
    </div>
  );
};
