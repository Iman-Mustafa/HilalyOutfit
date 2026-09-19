import React, { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminLogin } from '../components/admin/AdminLogin';

/**
 * Route element for `/admin`.
 * The real protection lives on the server (admin endpoints answer 401/403);
 * this gate only decides which screen the visitor sees.
 */
export const AdminPage: React.FC = () => {
  const { user, isAdmin, isRestoring, logout } = useAuth();

  // Message carried over to the login screen when the server rejects an admin request
  const [notice, setNotice] = useState('');

  const handleAuthError = useCallback((message: string) => {
    setNotice(message || 'Muda wa kuingia umeisha. Tafadhali ingia tena.');
    logout();
  }, [logout]);

  if (isRestoring) {
    return (
      <div style={{ padding: '4rem 1.2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
        Inapakia…
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard onAuthError={handleAuthError} />;
  }

  return (
    <AdminLogin
      notice={notice}
      signedInCustomerName={user ? user.name : ''}
      onSuccess={() => setNotice('')}
    />
  );
};
