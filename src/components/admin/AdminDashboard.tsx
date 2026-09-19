import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import type { PaymentProvider, PaymentStatus, Transaction } from '../../types';
import { WebhookSimulator } from './WebhookSimulator';
import { ProductManager } from './ProductManager';

interface AdminDashboardProps {
  /** Called when an admin request is rejected with 401/403, so the page can return to the login screen */
  onAuthError?: (message: string) => void;
}

type AdminTab = 'transactions' | 'webhook' | 'products';
type StatusFilter = 'all' | 'successful' | 'pending' | 'failed';
type StatusTone = 'success' | 'pending' | 'danger';

const REFRESH_INTERVAL_MS = 15000;

const PROVIDER_NAMES: Record<PaymentProvider, string> = {
  tigopesa: 'Tigo Pesa (Mix)',
  mpesa: 'M-Pesa (Vodacom)',
  airtel: 'Airtel Money',
  halopesa: 'HaloPesa',
  other: 'Mobile Money'
};

const STATUS_BADGES: Record<PaymentStatus, { label: string; tone: StatusTone }> = {
  successful: { label: 'Imefanikiwa', tone: 'success' },
  processing: { label: 'Inasubiri PIN', tone: 'pending' },
  pending: { label: 'Inasubiri PIN', tone: 'pending' },
  failed: { label: 'Imefeli', tone: 'danger' },
  cancelled: { label: 'Imeghairiwa', tone: 'danger' }
};

const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

const isPendingStatus = (status: PaymentStatus) => status === 'pending' || status === 'processing';
const isFailedStatus = (status: PaymentStatus) => status === 'failed' || status === 'cancelled';

const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const badge = STATUS_BADGES[status];
  if (!badge) return null;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: `var(--${badge.tone}-bg)`,
      color: `var(--${badge.tone})`,
      border: `1px solid var(--${badge.tone}-border)`,
      padding: '0.25rem 0.65rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.74rem',
      fontWeight: 700,
      whiteSpace: 'nowrap'
    }}>
      {badge.label}
    </span>
  );
};

// Quoted for commas; text that a spreadsheet would run as a formula is neutralised with a leading apostrophe
const csvCell = (value: string | number) => {
  const text = typeof value === 'string' && /^[=+\-@]/.test(value) ? "'" + value : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onAuthError }) => {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('transactions');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const isMounted = useRef(true);
  const isFetching = useRef(false);
  const onAuthErrorRef = useRef(onAuthError);

  useEffect(() => {
    onAuthErrorRef.current = onAuthError;
  }, [onAuthError]);

  const loadOrders = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const { orders: fetched } = await api.adminOrders();
      if (!isMounted.current) return;
      setOrders(fetched);
      setError('');
      setLastUpdated(new Date());
    } catch (e) {
      if (!isMounted.current) return;
      const message = e instanceof ApiError ? e.message : 'Imeshindikana kupata oda. Tafadhali jaribu tena.';
      setError(message);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403) && onAuthErrorRef.current) {
        onAuthErrorRef.current(message);
      }
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // First load, then a quiet refresh every 15s while the tab is visible
  useEffect(() => {
    isMounted.current = true;
    loadOrders();

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadOrders();
    }, REFRESH_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadOrders();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted.current = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadOrders]);

  // "Onyesha upya": same request, but the button shows that it is working
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  const handleOrderUpdated = useCallback((updated: Transaction) => {
    setOrders(prev => (
      prev.some(o => o.id === updated.id)
        ? prev.map(o => (o.id === updated.id ? updated : o))
        : [updated, ...prev]
    ));
  }, []);

  // Stats Calculations
  const successfulTx = orders.filter(t => t.status === 'successful');
  const pendingTx = orders.filter(t => isPendingStatus(t.status));
  const failedTx = orders.filter(t => isFailedStatus(t.status));
  const totalRevenue = successfulTx.reduce((acc, t) => acc + t.amount, 0);

  // Filtered List
  const query = searchQuery.trim().toLowerCase();
  const filteredTransactions = orders.filter(t => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && isPendingStatus(t.status)) ||
      (statusFilter === 'failed' && isFailedStatus(t.status)) ||
      (statusFilter === 'successful' && t.status === 'successful');

    const matchesSearch = query === '' ||
      t.id.toLowerCase().includes(query) ||
      t.customer.fullName.toLowerCase().includes(query) ||
      t.customer.phone.includes(query) ||
      t.paymentPhone.includes(query);

    return matchesStatus && matchesSearch;
  });

  const selectedTx = selectedTxId ? orders.find(o => o.id === selectedTxId) ?? null : null;

  const exportCSV = () => {
    const headers = ['Namba ya Oda', 'Jina la Mteja', 'Simu ya Mteja', 'Simu ya Malipo', 'Mahali pa Kupokelea', 'Kiasi (TZS)', 'Mtandao', 'Hali', 'Tarehe'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.customer.fullName,
      t.customer.phone,
      t.paymentPhone,
      t.customer.district,
      t.amount,
      PROVIDER_NAMES[t.provider] ?? t.provider,
      t.status,
      new Date(t.createdAt).toLocaleString('en-GB')
    ]);

    const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    // BOM so Excel opens the file as UTF-8
    const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hilaly_Miamala_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'transactions', label: `Miamala Yote (${orders.length})` },
    { id: 'webhook', label: 'Webhook Simulator' },
    { id: 'products', label: 'Bidhaa' }
  ];

  const filterPills: { id: StatusFilter; label: string; tone: StatusTone | 'gold' }[] = [
    { id: 'all', label: `Miamala Yote (${orders.length})`, tone: 'gold' },
    { id: 'successful', label: `Imefanikiwa (${successfulTx.length})`, tone: 'success' },
    { id: 'pending', label: `Inasubiri (${pendingTx.length})`, tone: 'pending' },
    { id: 'failed', label: `Iliyofeli (${failedTx.length})`, tone: 'danger' }
  ];

  const textButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--gold-text)',
    textDecoration: 'underline',
    textUnderlineOffset: '3px'
  };

  const statCardStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '1.2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    minWidth: 0
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontWeight: 600
  };

  return (
    <div style={{ width: '100%', margin: '1.8rem 0', padding: '0 1.2rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>

      {/* Top Admin Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        borderBottom: '1px solid var(--gold-border)',
        paddingBottom: '1.2rem'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            minWidth: 0
          }}>
            Dashibodi ya Mauzo na Miamala
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Msimamizi: <strong style={{ color: 'var(--text-primary)' }}>{user?.name ?? ''}</strong>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn btn-outline-gold"
              style={{ padding: '0.4rem 0.95rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
            >
              Toka
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            alignSelf: 'flex-start',
            maxWidth: '100%',
            background: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'btn btn-gold' : 'btn btn-secondary'}
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: 'var(--radius-full)' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'products' ? (
        <ProductManager onAuthError={onAuthError} />
      ) : (
        <>
          {/* Refresh row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '-0.8rem' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {lastUpdated
                ? `Imesasishwa saa ${lastUpdated.toLocaleTimeString('en-GB')} • inajisasisha kila sekunde 15`
                : 'Inajisasisha kila sekunde 15'}
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              style={{ ...textButtonStyle, opacity: isRefreshing || isLoading ? 0.6 : 1 }}
            >
              {isRefreshing ? 'Inasasisha…' : 'Onyesha upya'}
            </button>
          </div>

          {error && (
            <div role="alert" style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.7rem 0.9rem',
              fontSize: '0.84rem',
              color: 'var(--danger)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem'
            }}>
              <span>{error}</span>
              <button type="button" onClick={handleManualRefresh} style={{ ...textButtonStyle, color: 'var(--danger)' }}>
                Jaribu tena
              </button>
            </div>
          )}

          {/* 4 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>

            {/* Total Revenue */}
            <div style={{ ...statCardStyle, background: 'var(--bg-surface-elevated)', border: '1px solid var(--gold-border)', boxShadow: 'var(--shadow-sm)' }}>
              <span style={{ ...statLabelStyle, color: 'var(--gold-text)' }}>Jumla ya Mapato (Iliyolipwa)</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>
                {formatTZS(totalRevenue)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Kutokana na miamala {successfulTx.length} iliyothibitishwa
              </div>
            </div>

            {/* Total Transactions */}
            <div style={statCardStyle}>
              <span style={{ ...statLabelStyle, color: 'var(--text-secondary)' }}>Miamala Yote</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {orders.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Maombi ya malipo yaliyowasilishwa
              </div>
            </div>

            {/* Successful */}
            <div style={{ ...statCardStyle, border: '1px solid var(--success-border)' }}>
              <span style={{ ...statLabelStyle, color: 'var(--success)' }}>Iliyofanikiwa</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--success)' }}>
                {successfulTx.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {orders.length > 0 ? Math.round((successfulTx.length / orders.length) * 100) : 0}% kiwango cha mafanikio
              </div>
            </div>

            {/* Pending & Failed */}
            <div style={statCardStyle}>
              <span style={{ ...statLabelStyle, color: 'var(--pending)' }}>Inasubiri / Iliyofeli</span>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {pendingTx.length} <span style={{ fontSize: '1rem', color: 'var(--danger)', fontWeight: 600 }}>/ {failedTx.length}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {pendingTx.length} inasubiri &bull; {failedTx.length} zimefeli
              </div>
            </div>

          </div>

          {/* Main Tab Content */}
          {activeTab === 'webhook' ? (
            <WebhookSimulator orders={orders} onOrderUpdated={handleOrderUpdated} onAuthError={onAuthError} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Controls: Search, Filters & Export */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.9rem'
              }}>
                {/* Search Input */}
                <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px', minWidth: 0 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tafuta jina, simu, au namba ya oda..."
                    aria-label="Tafuta muamala"
                    className="form-input"
                    style={{ paddingLeft: '36px', height: '38px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {filterPills.map(pill => {
                    const isActive = statusFilter === pill.id;
                    const activeBorder = pill.tone === 'gold' ? 'var(--gold-primary)' : `var(--${pill.tone})`;
                    const activeBg = pill.tone === 'gold' ? 'var(--gold-tint)' : `var(--${pill.tone}-bg)`;
                    const activeColor = pill.tone === 'gold' ? 'var(--gold-text)' : `var(--${pill.tone})`;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setStatusFilter(pill.id)}
                        aria-pressed={isActive}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: 'var(--radius-full)',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: `1px solid ${isActive ? activeBorder : 'var(--border-subtle)'}`,
                          background: isActive ? activeBg : 'transparent',
                          color: isActive ? activeColor : 'var(--text-secondary)'
                        }}
                      >
                        {pill.label}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={exportCSV}
                    disabled={filteredTransactions.length === 0}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      borderRadius: 'var(--radius-full)',
                      opacity: filteredTransactions.length === 0 ? 0.55 : 1,
                      cursor: filteredTransactions.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Pakua CSV
                  </button>
                </div>
              </div>

              {/* Transactions Table Card */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--gold-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--gold-text)' }}>
                        <th style={{ padding: '0.9rem 1.1rem' }}>Namba ya Oda</th>
                        <th style={{ padding: '0.9rem 1.1rem' }}>Mteja</th>
                        <th style={{ padding: '0.9rem 1.1rem' }}>Simu / Mtandao</th>
                        <th style={{ padding: '0.9rem 1.1rem' }}>Kiasi (TZS)</th>
                        <th style={{ padding: '0.9rem 1.1rem' }}>Tarehe na Muda</th>
                        <th style={{ padding: '0.9rem 1.1rem' }}>Hali ya Malipo</th>
                        <th style={{ padding: '0.9rem 1.1rem', textAlign: 'right' }}>Kitendo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Inapakia miamala…
                          </td>
                        </tr>
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {error ? 'Imeshindikana kupata miamala.' : 'Hakuna oda bado. Oda za wateja zitaonekana hapa.'}
                          </td>
                        </tr>
                      ) : filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Hakuna muamala uliopatikana kwa vigezo hivi.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}
                            className="table-row-hover"
                          >
                            {/* Reference */}
                            <td style={{ padding: '0.85rem 1.1rem' }}>
                              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold-text)' }}>
                                {tx.id}
                              </div>
                              {tx.gatewayRef && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {tx.gatewayRef}
                                </div>
                              )}
                            </td>

                            {/* Customer */}
                            <td style={{ padding: '0.85rem 1.1rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {tx.customer.fullName}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                {[tx.customer.district, tx.customer.region].filter(Boolean).join(', ')}
                              </div>
                            </td>

                            {/* Phone & Provider */}
                            <td style={{ padding: '0.85rem 1.1rem' }}>
                              <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                                {tx.paymentPhone}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {PROVIDER_NAMES[tx.provider] ?? tx.provider}
                              </div>
                            </td>

                            {/* Amount */}
                            <td style={{ padding: '0.85rem 1.1rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                              {formatTZS(tx.amount)}
                            </td>

                            {/* Date */}
                            <td style={{ padding: '0.85rem 1.1rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                              {new Date(tx.createdAt).toLocaleDateString('sw-TZ', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '0.85rem 1.1rem' }}>
                              <StatusBadge status={tx.status} />
                            </td>

                            {/* View detail button */}
                            <td style={{ padding: '0.85rem 1.1rem', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedTxId(tx.id)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                              >
                                Tazama
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="modal-backdrop" onClick={() => setSelectedTxId(null)}>
          <div
            className="animate-slide-up"
            role="dialog"
            aria-modal="true"
            aria-label="Maelezo kamili ya muamala"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 'var(--radius-lg)',
              padding: '1.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.2rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--gold-border)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Maelezo Kamili ya Muamala
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-text)', fontFamily: 'monospace' }}>
                  {selectedTx.id}
                </div>
              </div>
              <StatusBadge status={selectedTx.status} />
            </div>

            {/* Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', fontSize: '0.82rem' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-muted)' }}>Mteja:</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTx.customer.fullName}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{selectedTx.customer.phone}</div>
                {selectedTx.customer.email && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', overflowWrap: 'anywhere' }}>{selectedTx.customer.email}</div>
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-muted)' }}>Mahali pa kupokelea:</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{selectedTx.customer.district}</div>
                {selectedTx.customer.region && (
                  <div style={{ color: 'var(--text-secondary)' }}>{selectedTx.customer.region}</div>
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-muted)' }}>Malipo:</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTx.paymentPhone}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{PROVIDER_NAMES[selectedTx.provider] ?? selectedTx.provider}</div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-muted)' }}>Tarehe:</div>
                <div style={{ color: 'var(--text-secondary)' }}>{new Date(selectedTx.createdAt).toLocaleString('en-GB')}</div>
              </div>
            </div>

            {selectedTx.customer.deliveryNotes && (
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Maelekezo ya mteja:</strong> {selectedTx.customer.deliveryNotes}
              </div>
            )}

            {/* Items */}
            <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.8rem' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--gold-text)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Bidhaa Alizoagiza:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {selectedTx.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.82rem' }}>
                    <img
                      src={item.product.image}
                      alt=""
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.product.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                        {[item.product.categoryLabel, item.selectedSize, item.selectedColor].filter(Boolean).join(' • ')} • Idadi {item.quantity}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--gold-text)', whiteSpace: 'nowrap' }}>
                      {formatTZS(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.4rem', borderTop: '1px solid var(--gold-border)', paddingTop: '0.8rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Kiasi cha Malipo:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-text)' }}>
                {formatTZS(selectedTx.amount)}
              </span>
            </div>

            {selectedTx.failureReason && (
              <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--danger)' }}>
                <strong>Sababu ya Kufeli:</strong> {selectedTx.failureReason}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedTxId(null)}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              Funga Maelezo
            </button>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover {
          background: var(--bg-surface-elevated);
        }
      `}</style>
    </div>
  );
};
