/**
 * Authentication Context
 * Provides centralized auth state management across the application
 */

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getToken,
    setToken as saveToken,
    removeToken,
    clearAuthData,
    isValidToken,
    isTokenExpired,
    isTokenExpiringSoon,
    getTimeUntilExpiry,
    decodeToken
} from '@/lib/auth';

interface AuthUser {
    storeId: string;
    franchiseId?: string;
    token: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData: Record<string, unknown>) => void;
    logout: (reason?: string) => void;
    checkAuth: () => boolean;
    timeUntilExpiry: number;
    isExpiringSoon: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeUntilExpiry, setTimeUntilExpiry] = useState(0);
    const navigate = useNavigate();

    /**
     * Initialize auth state from localStorage on mount
     */
    const initializeAuth = useCallback(() => {
        try {
            const token = getToken();

            if (!token || !isValidToken(token)) {
                setUser(null);
                setTimeUntilExpiry(0);
                return;
            }

            const decoded = decodeToken(token);
            if (!decoded) {
                setUser(null);
                return;
            }

            setUser({
                storeId: decoded.store_id,
                franchiseId: decoded.franchise_id,
                token
            });

            setTimeUntilExpiry(getTimeUntilExpiry(token));
        } catch (error) {
            console.error('Failed to initialize auth:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Check authentication status
     */
    const checkAuth = useCallback((): boolean => {
        const token = getToken();
        return isValidToken(token);
    }, []);

    /**
     * Login user and save auth data
     */
    const login = useCallback((token: string, userData: Record<string, unknown>) => {
        try {
            // Validate token before saving
            if (!isValidToken(token)) {
                console.error('Invalid token provided to login');
                return;
            }

            // Save token
            saveToken(token);

            // Save additional user data to localStorage
            if (userData.store_id) {
                localStorage.setItem('bb_store_id', String(userData.store_id));
            }
            if (userData.franchise_id) {
                localStorage.setItem('bb_franchise_id', String(userData.franchise_id));
            }
            if (userData.whatsapp_api_url) {
                localStorage.setItem('bb_whatsapp_api_url', String(userData.whatsapp_api_url));
            }
            if (userData.access_token) {
                localStorage.setItem('bb_access_token', String(userData.access_token));
            }
            if (userData.waba_id) {
                localStorage.setItem('bb_waba_id', String(userData.waba_id));
            }
            if (userData.phone_number_id) {
                localStorage.setItem('bb_phone_number_id', String(userData.phone_number_id));
            }
            if (userData.waba_mobile_number) {
                localStorage.setItem('bb_waba_mobile_number', String(userData.waba_mobile_number));
            }
            if (userData.template_name) {
                localStorage.setItem('bb_template_name', String(userData.template_name));
            }
            if (userData.template_language) {
                localStorage.setItem('bb_template_language', String(userData.template_language));
            }
            if (userData.vendor_name) {
                localStorage.setItem('bb_vendor_name', String(userData.vendor_name));
            }
            if (userData.verified_name) {
                localStorage.setItem('bb_verified_name', String(userData.verified_name));
            }
            if (userData.store_name) {
                localStorage.setItem('bb_store_name', String(userData.store_name));
            }
            if (userData.trial_started) {
                localStorage.setItem('bb_trial_started', String(userData.trial_started));
            }
            if (userData.trial_period) {
                localStorage.setItem('bb_trial_period', String(userData.trial_period));
            }
            if (userData.webhook_config) {
                localStorage.setItem('bb_webhook_config', JSON.stringify(userData.webhook_config));
            }

            // Update user state
            const decoded = decodeToken(token);
            if (decoded) {
                setUser({
                    storeId: decoded.store_id,
                    franchiseId: decoded.franchise_id,
                    token
                });
                setTimeUntilExpiry(getTimeUntilExpiry(token));
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    }, []);

    /**
     * Logout user and clear all data
     */
    const logout = useCallback((reason?: string) => {
        // Clear all auth data
        removeToken();
        clearAuthData();

        // Clear user state
        setUser(null);
        setTimeUntilExpiry(0);

        // Save logout reason for display on login page
        if (reason) {
            sessionStorage.setItem('bb_logout_reason', reason);
        }

        // Navigate to login
        navigate('/login', { replace: true });
    }, [navigate]);

    /**
     * Monitor token expiry
     */
    useEffect(() => {
        if (!user || !user.token) return;

        const checkExpiry = () => {
            if (isTokenExpired(user.token)) {
                logout('Your session has expired. Please log in again.');
                return;
            }

            setTimeUntilExpiry(getTimeUntilExpiry(user.token));
        };

        // Check immediately
        checkExpiry();

        // Check every 10 seconds
        const interval = setInterval(checkExpiry, 10000);

        return () => clearInterval(interval);
    }, [user, logout]);

    /**
     * Initialize on mount
     */
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    /**
     * Sync logout across tabs
     */
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // If token was removed in another tab, logout here
            if (e.key === 'bb_token' && !e.newValue && user) {
                setUser(null);
                setTimeUntilExpiry(0);
                navigate('/login', { replace: true });
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [navigate, user]);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user && checkAuth(),
        isLoading,
        login,
        logout,
        checkAuth,
        timeUntilExpiry,
        isExpiringSoon: user?.token ? isTokenExpiringSoon(user.token) : false
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
