import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCheckout } from '../../context/CheckoutContext';
import { useCart } from '../../context/CartContext';
import { getProviderInfo } from '../../data/paymentProviders';
import { detectProvider, normalizePhone } from '../../lib/phone';

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
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

  // The customer only gives a number. The network name is a courtesy label shown when the
  // prefix tells us; the payment request reaches the phone either way.
  const isPhoneValid = normalizePhone(phoneNumber) !== null;
  const detectedProvider = detectProvider(phoneNumber);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPhoneValid) {
      setFormError('Ingiza namba sahihi ya simu, mfano 0754123456.');
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
      provider: detectedProvider ?? undefined,
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
          {isPhoneValid && detectedProvider && (
            <span style={{ fontSize: '0.78rem', color: 'var(--gold-text)', fontWeight: 600 }}>
              {getProviderInfo(detectedProvider).name}
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
