import React, { useState, useEffect } from 'react';
import { StoreProvider } from './context/StoreContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { WhatsAppButton } from './components/WhatsAppButton';

// Storefront Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AccountPage } from './pages/AccountPage';
import { StaticPages } from './pages/StaticPages';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminReviews } from './pages/admin/AdminReviews';

import { Product, Order } from './types';

function MainAppContent() {
  const { isAuthenticated } = useAdminAuth();

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<Record<string, string>>({});
  const [activeAdminTab, setActiveAdminTab] = useState<string>('dashboard');
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.replace(/^\/+/, '');
      if (path.startsWith('admin')) {
        setCurrentPage('admin');
      } else if (path.startsWith('product/')) {
        const slug = path.split('/')[1];
        setCurrentPage('product');
        setPageParams({ slug });
      } else if (path === 'shop') {
        setCurrentPage('shop');
      } else if (path === 'cart') {
        setCurrentPage('cart');
      } else if (path === 'checkout') {
        setCurrentPage('checkout');
      } else if (path === 'track') {
        setCurrentPage('track');
      } else if (path === 'account') {
        setCurrentPage('account');
      } else if (
        ['about', 'contact', 'faq', 'size-guide', 'shipping-policy', 'return-policy', 'privacy', 'terms'].includes(path)
      ) {
        setCurrentPage(path);
      } else {
        setCurrentPage('home');
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const navigateTo = (page: string, params: Record<string, string> = {}) => {
    setCurrentPage(page);
    setPageParams(params);

    let newPath = `/${page === 'home' ? '' : page}`;
    if (page === 'product' && params.slug) {
      newPath = `/product/${params.slug}`;
    }
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    navigateTo('product', { slug: product.slug });
  };

  const handleOrderSuccess = (order: Order) => {
    setLatestOrder(order);
    navigateTo('order-success');
  };

  // ADMIN COMMAND CONSOLE
  if (currentPage === 'admin') {
    if (!isAuthenticated) {
      return (
        <AdminLogin
          onSuccess={() => setActiveAdminTab('dashboard')}
          onBackToStore={() => navigateTo('home')}
        />
      );
    }

    return (
      <AdminLayout
        currentTab={activeAdminTab}
        onTabChange={setActiveAdminTab}
        onGoToStore={() => navigateTo('home')}
      >
        {activeAdminTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveAdminTab} />}
        {activeAdminTab === 'products' && <AdminProducts />}
        {activeAdminTab === 'orders' && <AdminOrders />}
        {activeAdminTab === 'customers' && <AdminCustomers />}
        {activeAdminTab === 'categories' && <AdminCategories />}
        {activeAdminTab === 'coupons' && <AdminCoupons />}
        {activeAdminTab === 'reviews' && <AdminReviews />}
        {activeAdminTab === 'settings' && <AdminSettings />}
      </AdminLayout>
    );
  }

  // PUBLIC STOREFRONT
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2] text-zinc-900 font-sans antialiased">
      <Header onNavigate={navigateTo} currentPage={currentPage} />

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage onNavigate={navigateTo} onSelectProduct={handleSelectProduct} />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            initialCategory={pageParams.category}
            initialSearch={pageParams.search}
            initialOnSale={pageParams.onSale === 'true'}
            initialFeatured={pageParams.featured === 'true'}
            initialBestSeller={pageParams.bestSeller === 'true'}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'product' && (
          <ProductDetailPage
            slugOrId={pageParams.slug || ''}
            onNavigate={navigateTo}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'cart' && <CartPage onNavigate={navigateTo} />}

        {currentPage === 'checkout' && (
          <CheckoutPage onOrderSuccess={handleOrderSuccess} onNavigate={navigateTo} />
        )}

        {currentPage === 'order-success' && latestOrder && (
          <OrderSuccessPage order={latestOrder} onNavigate={navigateTo} />
        )}

        {currentPage === 'track' && (
          <OrderTrackingPage initialOrderNumber={pageParams.orderNumber} onNavigate={navigateTo} />
        )}

        {currentPage === 'account' && (
          <AccountPage
            initialTab={pageParams.tab}
            onNavigate={navigateTo}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {['about', 'contact', 'faq', 'size-guide', 'shipping-policy', 'return-policy', 'privacy', 'terms'].includes(
          currentPage
        ) && <StaticPages type={currentPage as any} onNavigate={navigateTo} />}
      </main>

      <Footer onNavigate={navigateTo} />

      <CartDrawer onNavigate={navigateTo} />
      <QuickViewModal onNavigate={navigateTo} />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <StoreProvider>
        <MainAppContent />
      </StoreProvider>
    </AdminAuthProvider>
  );
}
