import { useEffect, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { useStore } from './store';

/** Initializes the local and remote database records. */
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

function ErrorFallback() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-background"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-foreground">Application Error</h1>
        <p className="text-sm text-muted-foreground max-w-md">Something went wrong. Please refresh the page or contact support.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Refresh Page
        </button>
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
