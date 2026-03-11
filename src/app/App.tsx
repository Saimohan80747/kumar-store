import { useEffect, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useStore } from './store';

function DBInit() {
  const initDB = useStore((s) => s.initDB);
  useEffect(() => {
    initDB();
  }, []);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
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
