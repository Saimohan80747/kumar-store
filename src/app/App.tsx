import { useEffect, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useStore } from './store';

function DBInit() {
  const initDB = useStore((s) => s.initDB);
  useEffect(() => {
    void initDB();
  }, [initDB]);
  return null;
}

function PageLoader() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-background transition-opacity duration-300"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading application content"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin text-primary" />
        <p className="text-base font-medium text-muted-foreground animate-pulse">Loading application...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DBInit />
      <RouterProvider router={router} />
    </Suspense>
  );
}
