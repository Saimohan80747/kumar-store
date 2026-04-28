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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-card rounded-3xl p-8 border border-border shadow-lg">
                <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-destructive">
                    {isNetworkError ? <RefreshCw className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
                <h1 className="text-xl text-foreground mb-2 font-bold">
                    {isNetworkError ? 'Connection Lost' : 'Oops! Something went wrong'}
                </h1>
                <p className="text-sm text-muted-foreground mb-8 text-balance">
                    {errorMessage}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                    <Link
                        to="/"
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors border border-border/50 flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                        <Home className="w-4 h-4 opacity-70" /> Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Code styling update 5
