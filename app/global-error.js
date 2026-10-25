'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        // Log exception to error reporting service (e.g. Sentry)
        console.error('Global Error caught:', error);
    }, [error]);

    return (
        <html>
            <body className="antialiased min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 text-center">
                <div className="max-w-md space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                        Something went wrong!
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        We apologize for the inconvenience. Our team has been notified.
                        Please try refreshing the page.
                    </p>
                    <div className="pt-4 flex justify-center gap-4">
                        <Button
                            onClick={() => reset()}
                            variant="default"
                        >
                            Try again
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                        >
                            Refresh Page
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    );
}
