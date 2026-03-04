import { Outlet } from 'react-router';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BottomNav } from './bottom-nav';
import { Toaster } from 'sonner';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Toaster position="top-right" richColors />
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
