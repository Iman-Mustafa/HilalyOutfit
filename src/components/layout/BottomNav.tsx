import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

interface BottomNavProps {
  onNavigateToProducts: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onNavigateToProducts }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, openAuth } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const tabClass = (isActive: boolean) => (isActive ? 'footer-tab active' : 'footer-tab');

  return (
    <nav className="footer-tabs" aria-label="Urambazaji wa Chini">
      {/* 1. Nyumbani */}
      <button
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={tabClass(pathname === '/')}
      >
        Nyumbani
      </button>

      {/* 2. Duka / Mavazi */}
      <button onClick={onNavigateToProducts} className={tabClass(pathname.startsWith('/bidhaa'))}>
        Mavazi
      </button>

      {/* 3. Kikapu */}
      <button onClick={() => setIsCartOpen(true)} className="footer-tab">
        Kikapu{totalItems > 0 && ` (${totalItems})`}
      </button>

      {/* 4. Akaunti */}
      <button
        onClick={() => (user ? navigate('/akaunti') : openAuth('login'))}
        className={tabClass(pathname.startsWith('/akaunti'))}
      >
        {user ? 'Akaunti' : 'Ingia'}
      </button>

      {/* 5. Msimamizi / Admin */}
      <button onClick={() => navigate('/admin')} className={tabClass(pathname.startsWith('/admin'))}>
        Admin
      </button>
    </nav>
  );
};
