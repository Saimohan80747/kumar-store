import { Link, useRouteError, isRouteErrorResponse } from 'react-router';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export function GlobalErrorBoundary() {
    const error = useRouteError();
    console.error("Global boundary caught error:", error);

    let errorMessage = 'An unexpected error occurred.';
    let isNetworkError = false;

    if (isRouteErrorResponse(error)) {
        errorMessage = `${error.status} ${error.statusText} - ${error.data}`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes('Failed to fetch dynamically imported module')) {
            isNetworkError = true;
            errorMessage = 'Unable to load the page. This typically happens if the web server was restarted or a connection was lost.';
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                    {isNetworkError ? <RefreshCw className="w-8 h-8 opacity-80" /> : <AlertTriangle className="w-8 h-8 opacity-80" />}
                </div>
                <h1 className="text-[20px] text-gray-900 mb-2" style={{ fontWeight: 700 }}>
                    {isNetworkError ? 'Connection Lost' : 'Oops! Something went wrong'}
                </h1>
                <p className="text-[14px] text-muted-foreground mb-8">
                    {errorMessage}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-[14px]"
                        style={{ fontWeight: 600 }}
                    >
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                    <Link
                        to="/"
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors border border-border/60 flex items-center justify-center gap-2 text-[14px]"
                        style={{ fontWeight: 600 }}
                    >
                        <Home className="w-4 h-4 opacity-70" /> Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
