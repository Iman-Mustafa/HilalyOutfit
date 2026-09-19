import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api';
import { normalizePhone } from '../../lib/phone';

const fieldErrorStyle: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--danger)' };

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authMode, authReason, setAuthMode, closeAuth, register, login } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start clean every time the modal opens or switches between register and login
  useEffect(() => {
    setErrors({});
    setFormError('');
    setPassword('');
    setShowPassword(false);
  }, [isAuthModalOpen, authMode]);

  if (!isAuthModalOpen) return null;

  const isRegister = authMode === 'register';

  const validate = () => {
    const found: Record<string, string> = {};

    if (isRegister && name.trim().length < 2) {
      found.name = 'Andika jina lako kamili.';
    }
    if (!normalizePhone(phone)) {
      found.phone = 'Ingiza namba halali ya simu ya Tanzania, mfano 0754123456.';
    }
    if (isRegister && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))) {
      found.password = 'Password iwe na angalau herufi 8, ikiwemo herufi na namba.';
    } else if (!password) {
      found.password = 'Ingiza password yako.';
    }

    return found;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register({ name: name.trim(), phone, password });
      } else {
        await login({ phone, password });
      }
      setName('');
      setPhone('');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError('Hitilafu imetokea. Tafadhali jaribu tena.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={closeAuth}>
      <div
        className="animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gold-border)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.4rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 id="auth-modal-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isRegister ? 'Fungua Akaunti' : 'Ingia'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {authReason || (isRegister ? 'Jisajili mara moja tu, kisha nunua kwa urahisi.' : 'Karibu tena Hilaly Outfit.')}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuth}
            aria-label="Funga"
            style={{
              background: 'var(--bg-surface-elevated)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Jina Kamili</label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mfano: Amina Khatibu"
                className="form-input"
              />
              {errors.name && <div style={fieldErrorStyle}>{errors.name}</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-phone">Namba ya Simu</label>
            <input
              id="auth-phone"
              type="tel"
              inputMode="tel"
              autoComplete="username"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Mfano: 0754123456"
              className="form-input"
            />
            {errors.phone && <div style={fieldErrorStyle}>{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              <span>Password</span>
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ background: 'none', border: 'none', color: 'var(--gold-text)', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {showPassword ? 'Ficha' : 'Onyesha'}
              </button>
            </label>
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'Angalau herufi 8, zikiwemo namba' : 'Password yako'}
              className="form-input"
            />
            {errors.password && <div style={fieldErrorStyle}>{errors.password}</div>}
          </div>

          {formError && (
            <div role="alert" style={{
              padding: '0.7rem 0.9rem',
              marginBottom: '1rem',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              fontSize: '0.84rem'
            }}>
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-gold"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? 'Subiri...' : (isRegister ? 'Jisajili' : 'Ingia')}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          {isRegister ? 'Tayari una akaunti?' : 'Huna akaunti bado?'}{' '}
          <button
            type="button"
            onClick={() => setAuthMode(isRegister ? 'login' : 'register')}
            style={{ background: 'none', border: 'none', color: 'var(--gold-text)', fontFamily: 'var(--font-sans)', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }}
          >
            {isRegister ? 'Ingia' : 'Jisajili'}
          </button>
        </div>
      </div>
    </div>
  );
};
