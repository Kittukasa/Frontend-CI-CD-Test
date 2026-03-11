/**
 * Session Timeout Monitor
 * Displays warning when session is about to expire
 */

import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatTimeRemaining } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle } from 'lucide-react';

const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // Show warning 5 minutes before expiry

export function SessionMonitor() {
    const { timeUntilExpiry, isExpiringSoon, isAuthenticated } = useAuth();
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        // Only show warning if authenticated and expiring soon
        if (isAuthenticated && isExpiringSoon && timeUntilExpiry > 0) {
            setShowWarning(true);
        } else {
            setShowWarning(false);
        }
    }, [isAuthenticated, isExpiringSoon, timeUntilExpiry]);

    if (!showWarning || !isAuthenticated) {
        return null;
    }

    const handleDismiss = () => {
        setShowWarning(false);
    };

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md">
            <Alert variant="warning" className="border-amber-500 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="ml-2">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="font-semibold text-amber-900">Session Expiring Soon</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Your session will expire in {formatTimeRemaining(timeUntilExpiry)}.
                                You'll be logged out automatically.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDismiss}
                            className="shrink-0"
                        >
                            Dismiss
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
}
