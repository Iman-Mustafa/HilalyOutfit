import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useCart } from '../../context/CartContext';
import { PAYMENT_PROVIDERS } from '../../data/paymentProviders';
import { detectProvider, normalizePhone } from '../../lib/phone';
import type { PaymentProvider } from '../../types';

export const PaymentMethodStep: React.FC = () => {
  const { user } = useAuth();
  const {
    initiatePayment,
    paymentPhone,
    deliveryLocation,
    paymentError,
    paymentFieldErrors,
    directBuyItem
  } = useCheckout();

  const { totalAmount } = useCart();
  const activeTotal = directBuyItem
    ? directBuyItem.product.price * directBuyItem.quantity
    : totalAmount;

  const [phoneNumber, setPhoneNumber] = useState(paymentPhone || user?.phone || '');
  const [location, setLocation] = useState(deliveryLocation);
  const [manualProvider, setManualProvider] = useState<PaymentProvider | null>(null);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

  // The network is worked out from the number; the customer only picks one when we cannot tell
  const isPhoneValid = normalizePhone(phoneNumber) !== null;
  const detectedProvider = detectProvider(phoneNumber);
  const activeProvider = detectedProvider ?? manualProvider;
  const activeProviderInfo = PAYMENT_PROVIDERS.find(p => p.id === activeProvider);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhoneValid) {
      setFormError('Ingiza namba sahihi ya simu, mfano 0754123456.');
      return;
    }
    if (!activeProvider) {
      setFormError('Chagua mtandao wa namba hii.');
      return;
    }
    if (location.trim().length < 3) {
      setFormError('Andika mahali utakapopokelea mzigo wako.');
      return;
    }

    setFormError('');
    setIsLoading(true);
    await initiatePayment({
      paymentPhone: phoneNumber,
      provider: activeProvider,
      deliveryLocation: location.trim()
    });
    setIsLoading(false);
  };

  const errorMessage = formError || paymentError;

  return (
    <form onSubmit={handlePayNow} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

      {/* Amount */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--gold-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.2rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-text)', fontWeight: 600 }}>
            Kiasi Kinacholipwa
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Mteja: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.name}</span>
          </div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
          {formatTZS(activeTotal)}
        </div>
      </div>

      {/* Phone Number */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="payment-phone">
          <span>Namba ya Simu ya Kulipia</span>
          {isPhoneValid && activeProviderInfo && (
            <span style={{ fontSize: '0.78rem', color: 'var(--gold-text)', fontWeight: 600 }}>
              {activeProviderInfo.name}
            </span>
          )}
        </label>
        <input
          id="payment-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Mfano: 0754123456"
          className="form-input"
          style={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.04em' }}
        />
        {paymentFieldErrors.paymentPhone && (
          <div style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{paymentFieldErrors.paymentPhone}</div>
        )}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Utapokea ombi la malipo kwenye simu hii, kisha utaingiza PIN yako kuthibitisha.
        </div>
      </div>

      {/* Network picker — only when the number's prefix is one we do not recognise */}
      {isPhoneValid && !detectedProvider && (
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem' }}>
            <span>Hatujatambua mtandao wa namba hii. Chagua mtandao:</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {PAYMENT_PROVIDERS.map(provider => {
              const isSelected = manualProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setManualProvider(provider.id)}
                  aria-pressed={isSelected}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? '1px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--gold-tint)' : 'var(--bg-surface)',
                    color: isSelected ? 'var(--gold-text)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {provider.logoText}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivery Location */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label" htmlFor="delivery-location">
          <span>Mahali pa Kupokelea Mzigo</span>
        </label>
        <input
          id="delivery-location"
          type="text"
          required
          maxLength={120}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Mfano: Sinza Mori, Dar es Salaam"
          className="form-input"
        />
        {paymentFieldErrors.deliveryLocation && (
          <div style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{paymentFieldErrors.deliveryLocation}</div>
        )}
      </div>

      {errorMessage && (
        <div role="alert" style={{
          padding: '0.7rem 0.9rem',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--danger)',
          fontSize: '0.84rem'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Pay Now Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-gold"
        style={{
          width: '100%',
          padding: '0.95rem',
          fontSize: '1.05rem',
          fontWeight: 800,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? 'Inatuma Ombi la Malipo...' : `Lipa Sasa (${formatTZS(activeTotal)})`}
      </button>

      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.45 }}>
        Tovuti yetu haitawahi kukuomba wala kuhifadhi PIN yako. PIN inaingizwa kwenye simu yako tu.
      </div>

    </form>
  );
};
