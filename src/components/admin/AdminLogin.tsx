import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { normalizePhone } from '../../lib/phone';

interface AdminLoginProps {
  /** Message from the page, e.g. when the server rejected an admin request */
  notice?: string;
  /** Name of the customer who is signed in right now (empty when nobody is) */
  signedInCustomerName?: string;
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ notice = '', signedInCustomerName = '', onSuccess }) => {
  const { login, logout } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!phone.trim() || !password) {
      setError('Weka namba ya simu na password.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      // Send the normalized number when we can; otherwise let the server judge what was typed
      const signedIn = await login({ phone: normalizePhone(phone) ?? phone.trim(), password });
      if (signedIn.role !== 'admin') {
        logout();
        setPassword('');
        setError('Akaunti hii si ya msimamizi.');
        return;
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Hitilafu imetokea. Tafadhali jaribu tena.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', padding: '2.5rem 1.2rem', boxSizing: 'border-box', display: 'flex', justifyContent: 'center' }}>
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--gold-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '1.6rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.3rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '0.35rem'
        }}>
          Ingia kama Msimamizi
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
          Sehemu hii ni ya msimamizi wa duka pekee.
        </p>

        {signedInCustomerName && (
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--gold-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem 0.8rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem'
          }}>
            Umeingia kama mteja ({signedInCustomerName}). Eneo hili ni la msimamizi pekee — ingia kwa akaunti ya msimamizi ili kuendelea.
          </div>
        )}

        {(error || notice) && (
          <div
            role="alert"
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.8rem',
              fontSize: '0.82rem',
              color: 'var(--danger)',
              marginBottom: '1rem'
            }}
          >
            {error || notice}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="admin-login-phone">Namba ya simu</label>
          <input
            id="admin-login-phone"
            type="tel"
            autoComplete="username"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <div className="form-label">
            <label htmlFor="admin-login-password">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-pressed={showPassword}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--gold-text)'
              }}
            >
              {showPassword ? 'Ficha' : 'Onyesha'}
            </button>
          </div>
          <input
            id="admin-login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-gold"
          style={{ width: '100%', marginTop: '0.4rem', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Inaingia…' : 'Ingia'}
        </button>
      </form>
    </div>
  );
};
