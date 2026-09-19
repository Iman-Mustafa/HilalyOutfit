import React from 'react';

const PAYMENT_NETWORKS = ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'HaloPesa'];

const headingStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
};

export const Footer: React.FC = () => {
  return (
    <footer style={{
      background: 'var(--bg-surface-elevated)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '2.2rem 1.5rem 1.4rem',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.8rem' }}>

        {/* Brand Info */}
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
            <span className="gold-gradient-text">HILALY</span> OUTFIT
          </div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
            Chapa inayoongoza Tanzania kwa mavazi rasmi ya kiume na kike, suti za Kiitaliano, gauni za usiku, na viatu vya ngozi halisi.
          </p>
        </div>

        {/* Mawasiliano & Mahali */}
        <div>
          <h4 style={headingStyle}>Wasiliana Nasi</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
            <span>Kariakoo & Masaki, Dar es Salaam, Tanzania</span>
            <span>+255 754 000 111 / +255 655 000 222</span>
            <span>support@hilalyoutfit.co.tz</span>
          </div>
        </div>

        {/* Njia za Malipo */}
        <div>
          <h4 style={headingStyle}>Malipo Salama ya Simu</h4>
          <p style={{ fontSize: '0.82rem', marginBottom: '0.7rem' }}>
            Mfumo wetu unatumia uthibitisho wa STK Push kupitia mitandao yote ya Tanzania:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PAYMENT_NETWORKS.map(network => (
              <span key={network} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--gold-border)',
                color: 'var(--text-primary)',
                padding: '3px 9px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 600
              }}>
                {network}
              </span>
            ))}
          </div>
        </div>

      </div>

      <div style={{
        marginTop: '1.8rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem 1rem',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          &copy; 2026 <strong>Hilaly Outfit</strong>. Haki zote zimehifadhiwa.
        </div>
        <div>
          Imetengenezwa kwa umakini na <strong style={{ color: 'var(--gold-text)' }}>Iman Coder</strong>
        </div>
      </div>
    </footer>
  );
};
