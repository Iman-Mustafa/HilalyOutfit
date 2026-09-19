import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaymentProvider, Transaction, CartItem } from '../types';
import { api, ApiError } from '../lib/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

export type CheckoutStep =
  | 'idle'
  | 'payment_method'
  | 'initiating'
  | 'processing'
  | 'success'
  | 'failed';

export interface PaymentRequest {
  paymentPhone: string;
  provider?: PaymentProvider;
  deliveryLocation: string;
}

interface CheckoutContextType {
  step: CheckoutStep;
  paymentProvider: PaymentProvider;
  paymentPhone: string;
  deliveryLocation: string;
  currentTransaction: Transaction | null;
  isCheckoutOpen: boolean;
  /** true when the server runs the demo payment driver, so the on-screen phone is shown */
  isSimulated: boolean;
  isUssdPromptActive: boolean;
  statusMessage: string;
  /** Message from the server when the payment request could not be started */
  paymentError: string;
  paymentFieldErrors: Record<string, string>;
  startCheckout: (directItem?: CartItem) => void;
  initiatePayment: (request: PaymentRequest) => Promise<void>;
  simulateTelcoPinApproval: (decision: 'approve' | 'wrong_pin' | 'cancel') => Promise<void>;
  retryPayment: () => void;
  closeCheckout: () => void;
  directBuyItem: CartItem | null;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

const STATUS_POLL_MS = 3000;

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { requireAuth } = useAuth();
  const { cart, clearCart, setIsCartOpen } = useCart();

  const [step, setStep] = useState<CheckoutStep>('idle');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isUssdPromptActive, setIsUssdPromptActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentFieldErrors, setPaymentFieldErrors] = useState<Record<string, string>>({});
  const [directBuyItem, setDirectBuyItem] = useState<CartItem | null>(null);

  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('mpesa');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  // Visitors must register before they can pay
  const startCheckout = (directItem?: CartItem) => {
    requireAuth(
      () => {
        setDirectBuyItem(directItem ?? null);
        setPaymentError('');
        setPaymentFieldErrors({});
        setIsCartOpen(false);
        setStep('payment_method');
        setIsCheckoutOpen(true);
      },
      'Fungua akaunti kwanza ili ukamilishe malipo yako.'
    );
  };

  // Moves the checkout to the screen that matches the order's status on the server
  const applyOrderStatus = (order: Transaction) => {
    setCurrentTransaction(order);

    if (order.status === 'successful') {
      setIsUssdPromptActive(false);
      setStep('success');
      if (!directBuyItem) clearCart();
    } else if (order.status === 'failed' || order.status === 'cancelled') {
      setIsUssdPromptActive(false);
      setStep('failed');
    }
  };

  const initiatePayment = async ({ paymentPhone: phone, provider, deliveryLocation: location }: PaymentRequest) => {
    const activeItems = directBuyItem ? [directBuyItem] : cart;

    setPaymentPhone(phone);
    setDeliveryLocation(location);
    setPaymentError('');
    setPaymentFieldErrors({});
    setStep('initiating');
    setStatusMessage('Inatuma ombi la malipo kwenye mtandao wa simu...');

    try {
      // Prices are never sent: the server works out the amount from its own catalogue
      const { order, simulated } = await api.createOrder({
        items: activeItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor
        })),
        paymentPhone: phone,
        provider,
        deliveryLocation: location
      });

      setCurrentTransaction(order);
      setPaymentProvider(order.provider);
      setPaymentPhone(order.paymentPhone);
      setIsSimulated(simulated);
      setStep('processing');
      setStatusMessage('Ombi limetumwa kwa mafanikio! Kagua kioo cha simu yako...');
      setIsUssdPromptActive(simulated);
    } catch (e) {
      setPaymentError(e instanceof ApiError ? e.message : 'Imeshindikana kuanzisha malipo. Tafadhali jaribu tena.');
      setPaymentFieldErrors(e instanceof ApiError ? e.fieldErrors : {});
      setStep('payment_method');
    }
  };

  // While we wait for the customer's PIN, ask the server for the outcome.
  // This is what picks up a real gateway callback (or the admin's webhook tester).
  const pendingOrderId = step === 'processing' ? currentTransaction?.id : undefined;
  useEffect(() => {
    if (!pendingOrderId) return;

    const timer = setInterval(async () => {
      try {
        const { order } = await api.getOrder(pendingOrderId);
        if (order.status !== 'processing' && order.status !== 'pending') applyOrderStatus(order);
      } catch {
        // A dropped poll is fine; the next one will try again
      }
    }, STATUS_POLL_MS);

    return () => clearInterval(timer);
    // applyOrderStatus only reads state that cannot change while an order is processing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOrderId]);

  // Demo only: stands in for the customer typing their PIN on their real phone
  const simulateTelcoPinApproval = async (decision: 'approve' | 'wrong_pin' | 'cancel') => {
    if (!currentTransaction) return;

    setIsUssdPromptActive(false);
    setStatusMessage(
      decision === 'approve'
        ? 'Malipo yamethibitishwa! Inazalisha risiti...'
        : 'Mtandao wa simu umekataa au umekatisha ombi la malipo.'
    );

    try {
      const { order } = await api.simulatePayment(currentTransaction.id, decision);
      applyOrderStatus(order);
    } catch (e) {
      // 409: the order was already settled elsewhere (e.g. by the admin) — the status poll will show it
      if (e instanceof ApiError && e.status === 409) return;
      setStatusMessage(e instanceof ApiError ? e.message : 'Imeshindikana kuthibitisha malipo.');
      setIsUssdPromptActive(true);
    }
  };

  const retryPayment = () => {
    setPaymentError('');
    setPaymentFieldErrors({});
    setStep('payment_method');
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setIsUssdPromptActive(false);
    setStep('idle');
  };

  return (
    <CheckoutContext.Provider
      value={{
        step,
        paymentProvider,
        paymentPhone,
        deliveryLocation,
        currentTransaction,
        isCheckoutOpen,
        isSimulated,
        isUssdPromptActive,
        statusMessage,
        paymentError,
        paymentFieldErrors,
        startCheckout,
        initiatePayment,
        simulateTelcoPinApproval,
        retryPayment,
        closeCheckout,
        directBuyItem
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};
