import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const headerButtonStyle: React.CSSProperties = {
  height: '40px',
  padding: '0 0.95rem',
  fontSize: '0.82rem',
  borderRadius: 'var(--radius-full)'
};

export const Header: React.FC<HeaderProps> = ({ searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, openAuth } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const isOnAdmin = pathname.startsWith('/admin');

  return (
    <header className="site-header glass-panel">
      <div className="site-header-row">

        {/* Logo */}
        <button type="button" className="site-logo" onClick={() => navigate('/')}>
          <span className="gold-gradient-text">HILALY</span>
          <span className="site-logo-rest" style={{ marginLeft: '6px', fontWeight: 600 }}>OUTFIT</span>
        </button>

        {/* Search Engine */}
        <div className="site-header-search">
          <Search
            size={17}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tafuta suti, viatu, gauni..."
            className="form-input"
            style={{
              paddingLeft: '38px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem'
            }}
          />
        </div>

        {/* Admin + Account + Cart */}
        <div className="site-header-actions">
          {/* On a narrow header the Admin entry lives in the footer tabs instead */}
          <button
            onClick={() => navigate(isOnAdmin ? '/' : '/admin')}
            className={isOnAdmin ? 'btn btn-gold site-header-admin' : 'btn btn-secondary site-header-admin'}
            style={headerButtonStyle}
            title="Dashibodi ya Msimamizi (inahitaji password)"
          >
            {isOnAdmin ? 'Duka' : 'Admin'}
          </button>

          <button
            onClick={() => (user ? navigate('/akaunti') : openAuth('login'))}
            className="btn btn-secondary"
            style={{ ...headerButtonStyle, maxWidth: '120px' }}
            title={user ? 'Akaunti yako' : 'Ingia au fungua akaunti'}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user ? user.name.split(' ')[0] : 'Ingia'}
            </span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="btn btn-outline-gold"
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              padding: 0,
              borderRadius: 'var(--radius-full)'
            }}
            aria-label="Kikapu cha Manunuzi"
          >
            <ShoppingBag size={19} />
            {totalItems > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger)',
                color: '#FFF',
                fontSize: '0.7rem',
                fontWeight: 700,
                minWidth: '19px',
                height: '19px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-primary)'
              }}>
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
