import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import type { PaymentStatus, Transaction } from '../types';

const formatTZS = (val: number) => 'TSh ' + val.toLocaleString('en-US');

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('sw-TZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const STATUS_LABELS: Record<PaymentStatus, { label: string; tone: 'success' | 'pending' | 'danger' }> = {
  successful: { label: 'Imelipwa', tone: 'success' },
  processing: { label: 'Inasubiri malipo', tone: 'pending' },
  pending: { label: 'Inasubiri malipo', tone: 'pending' },
  failed: { label: 'Imeshindikana', tone: 'danger' },
  cancelled: { label: 'Imeghairiwa', tone: 'danger' }
};

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isRestoring, openAuth, logout } = useAuth();

  const [orders, setOrders] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;

    let isCurrent = true;
    setIsLoading(true);
    api.myOrders()
      .then(({ orders }) => {
        if (isCurrent) {
          setOrders(orders);
          setError('');
        }
      })
      .catch(e => {
        if (isCurrent) setError(e instanceof ApiError ? e.message : 'Imeshindikana kupata oda zako.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  if (isRestoring) {
    return <p style={{ padding: '4rem 1.25rem', textAlign: 'center', color: 'var(--text-muted)' }}>Inapakia...</p>;
  }

  if (!user) {
    return (
      <section style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          Akaunti Yako
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '380px', margin: '0 auto' }}>
          Ingia au fungua akaunti ili uone oda zako na ununue kwa urahisi.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem', marginTop: '1.3rem' }}>
          <button onClick={() => openAuth('register')} className="btn btn-gold">Fungua Akaunti</button>
          <button onClick={() => openAuth('login')} className="btn btn-outline-gold">Ingia</button>
        </div>
      </section>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <section style={{ padding: '1.6rem 1.25rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Profile */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.1rem 1.2rem',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {user.name}
          </h1>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.phone}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {user.role === 'admin' && (
            <Link to="/admin" className="btn btn-outline-gold" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
              Dashibodi ya Admin
            </Link>
          )}
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
            Toka
          </button>
        </div>
      </div>

      {/* Orders */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.9rem' }}>
          Oda Zangu
        </h2>

        {isLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Inapakia oda zako...</p>
        ) : error ? (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', border: '1px dashed var(--gold-border)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface-elevated)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Bado hujaweka oda yoyote.</p>
            <Link to="/" className="btn btn-outline-gold" style={{ marginTop: '1rem' }}>Anza Kununua</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {orders.map(order => {
              const status = STATUS_LABELS[order.status];
              return (
                <div key={order.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.7rem' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{order.id}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(order.createdAt)}</div>
                    </div>
                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      color: `var(--${status.tone})`,
                      background: `var(--${status.tone}-bg)`,
                      border: `1px solid var(--${status.tone}-border)`
                    }}>
                      {status.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <img src={item.product.image} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.product.name}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {item.selectedSize} &bull; {item.selectedColor} &bull; x{item.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.8rem', paddingTop: '0.7rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kupokelea: {order.customer.district}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatTZS(order.amount)}</strong>
                  </div>

                  {order.failureReason && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--danger)' }}>{order.failureReason}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
