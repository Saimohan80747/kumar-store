import { lazy, createElement } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/layout';
import { HomePage } from './components/home-page';
import { GlobalErrorBoundary } from './components/error-boundary';

// Lazy-loaded storefront pages (only loaded when the user navigates to them)
const ProductsPage = lazy(() => import('./components/products-page').then(m => ({ default: m.ProductsPage })));
const ProductDetail = lazy(() => import('./components/product-detail').then(m => ({ default: m.ProductDetail })));
const CartPage = lazy(() => import('./components/cart-page').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./components/checkout-page').then(m => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('./components/login-page').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./components/register-page').then(m => ({ default: m.RegisterPage })));
const OrdersPage = lazy(() => import('./components/orders-page').then(m => ({ default: m.OrdersPage })));
const OrderTrackingPage = lazy(() => import('./components/order-tracking').then(m => ({ default: m.OrderTrackingPage })));
const ShopDashboard = lazy(() => import('./components/shop-dashboard').then(m => ({ default: m.ShopDashboard })));
const WishlistPage = lazy(() => import('./components/wishlist-page').then(m => ({ default: m.WishlistPage })));
const MySavings = lazy(() => import('./components/my-savings').then(m => ({ default: m.MySavings })));
const AccountPage = lazy(() => import('./components/account-page').then(m => ({ default: m.AccountPage })));

// Lazy-loaded admin pages (heavy: recharts, complex UI — only loaded when admin visits)
const AdminLayout = lazy(() => import('./components/admin-layout').then(m => ({ default: m.AdminLayout })));
const AdminOverview = lazy(() => import('./components/admin/overview').then(m => ({ default: m.AdminOverview })));
const AdminOrders = lazy(() => import('./components/admin/orders').then(m => ({ default: m.AdminOrders })));
const AdminProducts = lazy(() => import('./components/admin/products-manage').then(m => ({ default: m.AdminProducts })));
const AdminShopApprovals = lazy(() => import('./components/admin/shop-approvals').then(m => ({ default: m.AdminShopApprovals })));
const AdminCustomers = lazy(() => import('./components/admin/customers').then(m => ({ default: m.AdminCustomers })));
const AdminCoupons = lazy(() => import('./components/admin/coupons').then(m => ({ default: m.AdminCoupons })));
const AdminAnalytics = lazy(() => import('./components/admin/analytics').then(m => ({ default: m.AdminAnalytics })));
const AdminSettings = lazy(() => import('./components/admin/settings').then(m => ({ default: m.AdminSettings })));
const AdminProductRequests = lazy(() => import('./components/admin/product-requests').then(m => ({ default: m.AdminProductRequests })));

export const router = createBrowserRouter([
  // Main storefront
  {
    path: '/',
    Component: Layout,
    errorElement: createElement(GlobalErrorBoundary),
    children: [
      { index: true, Component: HomePage },
      { path: 'products', Component: ProductsPage },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'cart', Component: CartPage },
      { path: 'checkout', Component: CheckoutPage },
      { path: 'login', Component: LoginPage },
      { path: 'register', Component: RegisterPage },
      { path: 'orders', Component: OrdersPage },
      { path: 'orders/:id', Component: OrderTrackingPage },
      { path: 'shop-dashboard', Component: ShopDashboard },
      { path: 'wishlist', Component: WishlistPage },
      { path: 'savings', Component: MySavings },
      { path: 'account', Component: AccountPage },
    ],
  },
  // Admin panel (separate layout, auto-authenticated)
  {
    path: '/admin',
    Component: AdminLayout,
    errorElement: createElement(GlobalErrorBoundary),
    children: [
      { index: true, Component: AdminOverview },
      { path: 'orders', Component: AdminOrders },
      { path: 'products', Component: AdminProducts },
      { path: 'shop-approvals', Component: AdminShopApprovals },
      { path: 'customers', Component: AdminCustomers },
      { path: 'coupons', Component: AdminCoupons },
      { path: 'analytics', Component: AdminAnalytics },
      { path: 'product-requests', Component: AdminProductRequests },
      { path: 'settings', Component: AdminSettings },
    ],
  },
]);
// Code styling update 1

// Route definitions for main navigation

// Route definitions block

// Route definitions block
