'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User, LoginCredentials } from '@/lib/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    token: string | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Check for existing authentication on app load
        const initializeAuth = async () => {
            try {
                const token = AuthService.getStoredToken();
                const storedUser = AuthService.getStoredUser();

                if (token && storedUser) {
                    // Verify token is still valid by fetching current user
                    const currentUser = await AuthService.getCurrentUser(token);
                    setUser(currentUser);
                    setToken(token);
                }
            } catch (error) {
                // Token is invalid, clear storage
                AuthService.logout();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await AuthService.login(credentials);

            // Store token and user info
            localStorage.setItem('accessToken', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('userRole', response.user.role);

            setUser(response.user);
            setToken(response.access_token);
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await AuthService.logout();
        setUser(null);
        setToken(null);
    };

    const value = {
        user,
        loading,
        token,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 