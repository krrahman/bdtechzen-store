import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CountryCode, CurrencyCode, CartItem, Product, CustomerUser, StoreSettings } from '../types';
import { apiFetch } from '../lib/staticApiFallback';

interface StoreContextType {
  country: CountryCode;
  setCountry: (country: CountryCode) => void;
  currency: CurrencyCode;
  formatPrice: (amountBDT: number) => string;
  formatSinglePrice: (amount: number, curr?: CurrencyCode) => string;
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  appliedCoupon: { code: string; discount: number; discountType: 'percentage' | 'fixed'; discountValue: number } | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCouponCode: () => void;
  customerUser: CustomerUser | null;
  customerToken: string | null;
  loginCustomer: (token: string, user: CustomerUser) => void;
  logoutCustomer: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  settings: StoreSettings | null;
  refreshSettings: () => Promise<void>;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SETTINGS_FALLBACK: StoreSettings = {
  storeName: 'BDTechZen',
  logoUrl: '',
  storeTagline: 'Full-grain calfskin loafers, Blake-stitched Oxfords, and everyday court sneakers—made for walking Bangladesh.',
  supportEmail: 'support@bdtechzen.com',
  supportPhone: '+880 1623-604635',
  whatsappNumber: '+8801623604635',
  announcementText: 'Complimentary delivery across Bangladesh on orders above ৳3,000 · Cash on Delivery & 7-day doorstep size exchange',
  announcementEnabled: true,
  shippingBD: { insideDhaka: 70, outsideDhaka: 130, freeShippingThreshold: 3000 },
  paymentGateways: {
    bkashEnabled: true,
    bkashSandbox: true,
    nagadEnabled: true,
    nagadSandbox: true,
    rocketEnabled: true,
    rocketSandbox: true,
    sslcommerzEnabled: true,
    sslcommerzSandbox: true,
    codEnabledBD: true
  },
  heroBanner: {
    title: 'Shoes built to walk, cut from full-grain calfskin.',
    subtitle: 'We pair Italian-tanned calfskin and water-resistant suede with cushioned anatomical footbeds—so your morning commute in Motijheel feels as effortless as dinner in Gulshan.',
    ctaText: 'Shop the Collection',
    ctaLink: '/shop',
    imageUrl: '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg'
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: true,
    senderName: 'BDTechZen Studio',
    adminAlertEmail: 'khalil5172@gmail.com',
    adminAlertPhone: '+8801623604635',
    notifyAdminOnNewOrder: true,
    notifyAdminOnNewUser: true,
    ntfyTopic: 'bdtechzen-khalil-8801623604635'
  },
  maintenanceMode: false
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [country] = useState<CountryCode>('BD');
  const currency: CurrencyCode = 'BDT';

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bdtechzen_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bdtechzen_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('bdtechzen_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('bdtechzen_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    return localStorage.getItem('bdtechzen_customer_token');
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(DEFAULT_SETTINGS_FALLBACK);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    localStorage.setItem('bdtechzen_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('bdtechzen_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('bdtechzen_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('bdtechzen_coupon');
    }
  }, [appliedCoupon]);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await apiFetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data) setSettings(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const setCountry = (_newCountry: CountryCode) => {};

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  const formatPrice = (amountBDT: number): string => {
    return `৳${(amountBDT || 0).toLocaleString('en-BD')}`;
  };

  const formatSinglePrice = (amount: number): string => {
    return `৳${(amount || 0).toLocaleString('en-BD')}`;
  };

  const addToCart = (product: Product, size: string, color: string, quantity = 1): { success: boolean; message: string } => {
    if (!size) {
      showToast('Please select a shoe size first', 'error');
      return { success: false, message: 'Select size' };
    }
    if (!color) {
      showToast('Please select a color variant', 'error');
      return { success: false, message: 'Select color' };
    }

    const variant = product.variants.find((v) => v.size === size && v.color === color);
    if (!variant || variant.stock < 1) {
      showToast('Selected variant is currently out of stock', 'error');
      return { success: false, message: 'Out of stock' };
    }

    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.size === size && item.color === color
    );

    const priceBDT = variant.priceOverrideBDT || product.salePriceBDT || product.regularPriceBDT;

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + quantity > variant.stock) {
        showToast(`Only ${variant.stock} pair(s) available in stock`, 'error');
        return { success: false, message: 'Stock limit reached' };
      }
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      if (quantity > variant.stock) {
        showToast(`Only ${variant.stock} pair(s) available in stock`, 'error');
        return { success: false, message: 'Stock limit reached' };
      }
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          sku: variant.skuVariant || product.sku,
          image: product.images[0] || '',
          size,
          color,
          quantity,
          priceBDT,
          maxStock: variant.stock
        }
      ]);
    }

    showToast(`Added ${product.name} (${size}) to your bag`, 'success');
    setIsCartDrawerOpen(true);
    return { success: true, message: 'Added to cart' };
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart(cart.filter((item) => !(item.productId === productId && item.size === size && item.color === color)));
    showToast('Item removed from bag', 'info');
  };

  const updateCartQuantity = (productId: string, size: string, color: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.size === size && item.color === color) {
          const clamped = Math.min(qty, item.maxStock);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = cart.reduce((acc, item) => {
    return acc + item.priceBDT * item.quantity;
  }, 0);

  const toggleWishlist = (productId: string) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter((id) => id !== productId));
      showToast('Removed from wishlist', 'info');
    } else {
      setWishlist([...wishlist, productId]);
      showToast('Saved to your wishlist', 'success');
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const applyCouponCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!code.trim()) {
      return { success: false, message: 'Please enter a coupon code' };
    }
    try {
      const res = await apiFetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal: cartSubtotal, country })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Invalid coupon' };
      }
      setAppliedCoupon({
        code: data.code,
        discount: data.discount,
        discountType: data.discountType,
        discountValue: data.discountValue
      });
      showToast(`Coupon "${data.code}" applied: ৳${data.discount.toLocaleString()} off!`, 'success');
      return { success: true, message: 'Coupon applied successfully' };
    } catch {
      return { success: false, message: 'Failed to verify coupon code' };
    }
  };

  const removeCouponCode = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const loginCustomer = (token: string, user: CustomerUser) => {
    setCustomerToken(token);
    setCustomerUser(user);
    localStorage.setItem('bdtechzen_customer_token', token);
    localStorage.setItem('bdtechzen_customer_user', JSON.stringify(user));
    showToast(`Welcome back, ${user.name}!`, 'success');
  };

  const logoutCustomer = () => {
    setCustomerToken(null);
    setCustomerUser(null);
    localStorage.removeItem('bdtechzen_customer_token');
    localStorage.removeItem('bdtechzen_customer_user');
    showToast('You have signed out', 'info');
  };

  return (
    <StoreContext.Provider
      value={{
        country,
        setCountry,
        currency,
        formatPrice,
        formatSinglePrice,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlist,
        toggleWishlist,
        isInWishlist,
        appliedCoupon,
        applyCouponCode,
        removeCouponCode,
        customerUser,
        customerToken,
        loginCustomer,
        logoutCustomer,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        quickViewProduct,
        setQuickViewProduct,
        settings,
        refreshSettings,
        toast,
        showToast
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-950 text-white rounded-xl shadow-2xl border border-zinc-800 text-sm animate-fade-in">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toast.type === 'error'
                ? 'bg-red-500'
                : toast.type === 'info'
                ? 'bg-amber-400'
                : 'bg-violet-500'
            }`}
          />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
