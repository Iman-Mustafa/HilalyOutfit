import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, CartItem } from '../types';
import { useAuth } from './AuthContext';

// v2: product ids now come from the database, so carts saved by the old demo are dropped
const CART_STORAGE_KEY = 'hilaly_cart_v2';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size?: string, color?: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, delta: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, requireAuth } = useAuth();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Could not save cart', e);
    }
  }, [cart]);

  // The cart belongs to the signed-in customer: empty it when they sign out
  const hadUser = useRef(false);
  useEffect(() => {
    if (hadUser.current && !user) setCart([]);
    hadUser.current = user !== null;
  }, [user]);

  // Visitors must register before they can put anything in the cart
  const addToCart = (product: Product, size?: string, color?: string, quantity = 1) => {
    requireAuth(
      () => addItem(product, size, color, quantity),
      'Fungua akaunti kwanza ili uweke bidhaa kwenye kikapu chako.'
    );
  };

  const addItem = (product: Product, size: string | undefined, color: string | undefined, quantity: number) => {
    const chosenSize = size || product.sizes[0] || 'Standard';
    const chosenColor = color || product.colors[0]?.name || 'Standard';

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        item => item.product.id === product.id &&
                item.selectedSize === chosenSize &&
                item.selectedColor === chosenColor
      );

      if (existingIndex > -1) {
        return prevCart.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [...prevCart, {
          product,
          quantity,
          selectedSize: chosenSize,
          selectedColor: chosenColor
        }];
      }
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart(prev => prev.filter(
      item => !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
    ));
  };

  const updateQuantity = (productId: string, size: string, color: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.selectedSize === size && item.selectedColor === color) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
