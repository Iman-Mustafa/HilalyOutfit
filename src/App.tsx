import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import { CartProvider } from './context/CartContext';
import { CheckoutProvider } from './context/CheckoutContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { PhonePushSimulator } from './components/checkout/PhonePushSimulator';
import { AuthModal } from './components/auth/AuthModal';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import type { ProductCategory } from './types';

const scrollToProducts = () => {
  document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
};

export const MainContent: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('vyote');

  // A new page starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // Searching from any page takes the customer to the catalogue
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (pathname !== '/') navigate('/');
  };

  const goToProducts = () => {
    if (pathname === '/') {
      scrollToProducts();
    } else {
      navigate('/');
      // Wait for the home page to render before scrolling to its catalogue
      setTimeout(scrollToProducts, 80);
    }
  };

  const handleSelectCategory = (category: ProductCategory) => {
    setSelectedCategory(category);
    // Tabs stay pinned while browsing; bring the user back to the top of the new list
    const el = document.getElementById('products-section');
    if (el && el.getBoundingClientRect().top < 0) scrollToProducts();
  };

  return (
    <div className="app-layout">
      {/* 1. Header: logo | search | admin | account | cart */}
      <Header searchQuery={searchQuery} setSearchQuery={handleSearch} />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* 2–4. Hero, category tabs, products */}
          <Route
            path="/"
            element={
              <HomePage
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                onExploreClick={scrollToProducts}
              />
            }
          />
          <Route path="/bidhaa/:productId" element={<ProductPage />} />
          <Route path="/akaunti" element={<AccountPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 5. Footer */}
      <Footer />

      {/* 6. Footer tabs */}
      <BottomNav onNavigateToProducts={goToProducts} />

      {/* Drawers & Modals */}
      <CartDrawer />
      <CheckoutModal />
      <PhonePushSimulator />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <CheckoutProvider>
              <MainContent />
            </CheckoutProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
