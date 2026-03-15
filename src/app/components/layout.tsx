import { Outlet, Navigate } from 'react-router';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BottomNav } from './bottom-nav';
import { Toaster } from 'sonner';
import { useStore } from '../store';

export function Layout() {
  const user = useStore((s) => s.user);

  // Redirect admin users away from storefront
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50/50">
      <Toaster position="top-right" richColors closeButton />
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <Outlet />
        </div>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
