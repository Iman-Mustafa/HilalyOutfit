import React, { useState } from 'react';
import type { PaymentStatus, Transaction } from '../../types';
import { api, ApiError } from '../../lib/api';

interface WebhookSimulatorProps {
  orders: Transaction[];
  /** Called with the order exactly as the server returned it, so the table can update */
  onOrderUpdated: (order: Transaction) => void;
  /** Called when the server answers 401/403: the session is no longer an admin session */
  onAuthError?: (message: string) => void;
}

const STATUS_OPTIONS: { status: PaymentStatus; label: string; tone: 'success' | 'danger' | 'pending' }[] = [
  { status: 'successful', label: 'Imefanikiwa', tone: 'success' },
  { status: 'failed', label: 'Imefeli', tone: 'danger' },
  { status: 'cancelled', label: 'Imeghairiwa', tone: 'danger' },
  { status: 'pending', label: 'Inasubiri', tone: 'pending' }
];

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({ orders, onOrderUpdated, onAuthError }) => {
  const [selectedTxId, setSelectedTxId] = useState('');
  const [targetStatus, setTargetStatus] = useState<PaymentStatus>('successful');
  const [failureReason, setFailureReason] = useState('Salio halitoshi kwenye simu ya mteja');
  const [isFiring, setIsFiring] = useState(false);
  const [lastPayload, setLastPayload] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Orders arrive (and refresh) after mount, so fall back to the first one until the admin picks
  const activeTxId = orders.some(o => o.id === selectedTxId) ? selectedTxId : (orders[0]?.id ?? '');
  const needsReason = targetStatus === 'failed' || targetStatus === 'cancelled';

  const handleSimulateWebhook = async () => {
    if (!activeTxId || isFiring) return;

    const note = needsReason ? failureReason.trim() : '';
    const requestBody = { status: targetStatus, note: note || undefined };
    const requestLine = `POST /api/admin/orders/${activeTxId}/status`;

    setIsFiring(true);
    setError('');
    setSuccessMessage('');
    setLastPayload(`${requestLine}\n${JSON.stringify(requestBody, null, 2)}\n\n// Inasubiri jibu la server…`);

    try {
      const { order } = await api.adminSetOrderStatus(activeTxId, targetStatus, note || undefined);
      onOrderUpdated(order);

      const responseBody = {
        order: {
          id: order.id,
          status: order.status,
          amount: order.amount,
          currency: order.currency,
          provider: order.provider,
          paymentPhone: order.paymentPhone,
          gatewayRef: order.gatewayRef ?? null,
          failureReason: order.failureReason ?? null,
          updatedAt: order.updatedAt
        }
      };
      setLastPayload(`${requestLine}\n${JSON.stringify(requestBody, null, 2)}\n\n// 200 OK\n${JSON.stringify(responseBody, null, 2)}`);
      setSuccessMessage(`Hali ya oda ${order.id} imebadilishwa.`);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Hitilafu imetokea. Tafadhali jaribu tena.';
      const status = e instanceof ApiError ? e.status : 0;
      setLastPayload(`${requestLine}\n${JSON.stringify(requestBody, null, 2)}\n\n// ${status || 'HAKUNA MTANDAO'} — ${message}`);
      setError(message);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403) && onAuthError) onAuthError(message);
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--gold-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.4rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.1rem',
      width: '100%',
      boxSizing: 'border-box',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem' }}>
        <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Webhook Simulator
        </h4>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          Badilisha hali ya malipo ya oda moja kwa moja kwenye server, kana kwamba callback ya mtandao wa simu imefika.
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
          Hakuna oda bado. Oda ya kwanza ikifika, utaweza kubadilisha hali yake hapa.
        </div>
      ) : (
        <>
          {/* Control Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

            {/* Select Transaction */}
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <label className="form-label" htmlFor="webhook-order">Chagua oda</label>
              <select
                id="webhook-order"
                value={activeTxId}
                onChange={(e) => setSelectedTxId(e.target.value)}
                className="form-select"
              >
                {orders.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id} • {t.customer.fullName} (TSh {t.amount.toLocaleString('en-US')})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Status */}
            <div className="form-group" style={{ margin: 0, minWidth: 0 }}>
              <span className="form-label">Hali mpya ya malipo</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(option => {
                  const isActive = targetStatus === option.status;
                  return (
                    <button
                      key={option.status}
                      type="button"
                      onClick={() => setTargetStatus(option.status)}
                      aria-pressed={isActive}
                      style={{
                        flex: '1 1 96px',
                        padding: '0.65rem 0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: isActive ? `1px solid var(--${option.tone})` : '1px solid var(--border-subtle)',
                        background: isActive ? `var(--${option.tone}-bg)` : 'transparent',
                        color: isActive ? `var(--${option.tone})` : 'var(--text-secondary)'
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Reason, sent to the server as `note` */}
          {needsReason && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="webhook-reason">Sababu (itaonekana kwenye oda)</label>
              <input
                id="webhook-reason"
                type="text"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          )}

          {error && (
            <div role="alert" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div role="status" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem', fontSize: '0.8rem', color: 'var(--success)' }}>
              {successMessage}
            </div>
          )}

          {/* Fire Webhook Button */}
          <button
            type="button"
            onClick={handleSimulateWebhook}
            disabled={isFiring}
            className="btn btn-gold"
            style={{
              padding: '0.75rem 1.4rem',
              fontSize: '0.9rem',
              alignSelf: 'flex-start',
              opacity: isFiring ? 0.7 : 1,
              cursor: isFiring ? 'not-allowed' : 'pointer'
            }}
          >
            {isFiring ? 'Inatuma…' : 'Tuma Sasa'}
          </button>
        </>
      )}

      {/* Request / response log — the dark console is an approved exception to the white theme */}
      {lastPayload && (
        <div style={{
          background: '#07090E',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #1E2333',
          padding: '0.8rem',
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          color: '#A5B4FC',
          overflow: 'auto',
          maxHeight: '260px'
        }}>
          <div style={{ color: '#94A3B8', marginBottom: '4px' }}>// Ombi lililotumwa kwa server na jibu lake:</div>
          <pre style={{ margin: 0 }}>{lastPayload}</pre>
        </div>
      )}

    </div>
  );
};
