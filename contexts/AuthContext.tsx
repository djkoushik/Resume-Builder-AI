import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';

export interface User {
    name: string;
    email: string;
    picture: string;
    googleId: string;
    image?: string;
}

interface AuthContextType {
    user: User | null;
    isGoogleLoaded: boolean;
    login: () => void;
    logout: () => void;
    handleGoogleSignIn: (response: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session-level flag to track explicit logout (survives HMR but not tab close)
const LOGOUT_FLAG_KEY = '__explicit_logout__';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const didLogoutRef = useRef(sessionStorage.getItem(LOGOUT_FLAG_KEY) === 'true');

    // Make checkUserLimit available globally
    useEffect(() => {
        (window as any).checkUserLimit = () => {
            return true;
        };
    }, []);

    const handleGoogleSignIn = useCallback((response: any) => {
        // Block auto re-login if user explicitly logged out this session
        if (didLogoutRef.current) {
            console.log("AuthContext: Blocking auto sign-in — user explicitly logged out");
            return;
        }
        try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            const newUser: User = {
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                googleId: payload.sub,
                image: payload.picture
            };
            localStorage.setItem('loggedInUser', JSON.stringify(newUser));
            setUser(newUser);
        } catch (error) {
            console.error("Failed to parse Google sign-in response", error);
        }
    }, []);

    // Expose handleGoogleSignIn globally because the legacy google button might expect it
    useEffect(() => {
        (window as any).handleGoogleSignIn = handleGoogleSignIn;
    }, [handleGoogleSignIn]);

    const initializeGSI = useCallback((autoSelect: boolean) => {
        if (!(window as any).google) return false;

        // CRITICAL DEPLOYMENT FIX: using import.meta.env instead of process.env
        const client_id = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
        if (!client_id) {
            console.error("AuthContext: Google Client ID is missing (VITE_GOOGLE_CLIENT_ID)");
            return false;
        }

        try {
            (window as any).google.accounts.id.initialize({
                client_id,
                callback: handleGoogleSignIn,
                auto_select: autoSelect,
                cancel_on_tap_outside: false,
                use_fedcm_for_prompt: true
            });
            return true;
        } catch (err) {
            console.error("AuthContext: Error during GSI initialize", err);
            return false;
        }
    }, [handleGoogleSignIn]);

    useEffect(() => {
        // Restore user from localStorage
        const storedUser = localStorage.getItem('loggedInUser');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("AuthContext: Failed to parse stored user", e);
            }
        }

        const initGoogleAuth = () => {
            if (!(window as any).google) {
                console.log("AuthContext: Google GSI SDK not yet available");
                return;
            }

            console.log("AuthContext: Initializing Google Identity Services...");

            // If user explicitly logged out, init WITHOUT auto_select
            const wasLoggedOut = didLogoutRef.current;

            // Only auto-select if they haven't just logged out
            const success = initializeGSI(!wasLoggedOut);
            if (!success) return;

            setIsGoogleLoaded(true);
            console.log("AuthContext: GSI initialized (auto_select=" + !wasLoggedOut + ")");

            // Auto-trigger One Tap only on fresh page load when not logged out
            const hasStoredUser = localStorage.getItem('loggedInUser');
            if (!hasStoredUser && !wasLoggedOut) {
                console.log("AuthContext: Auto-triggering One Tap prompt...");
                try {
                    // Slight delay to allow UI to settle before FedCM slides in
                    setTimeout(() => {
                        // Double check we haven't logged out in the last 100ms
                        if (didLogoutRef.current) return;

                        (window as any).google.accounts.id.prompt((notification: any) => {
                            if (notification.isNotDisplayed()) {
                                console.warn("AuthContext: Auto-prompt not displayed:", notification.getNotDisplayedReason());
                            } else if (notification.isSkippedMoment()) {
                                console.warn("AuthContext: Auto-prompt skipped:", notification.getSkippedReason());
                            } else if (notification.isDismissedMoment()) {
                                console.log("AuthContext: Auto-prompt dismissed:", notification.getDismissedReason());
                            }
                        });
                    }, 500);
                } catch (e) {
                    console.error("Failed to prompt:", e);
                }
            }
        };

        if ((window as any).google) {
            initGoogleAuth();
        } else {
            window.addEventListener('load', initGoogleAuth);
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'loggedInUser') {
                try {
                    setUser(e.newValue ? JSON.parse(e.newValue) : null);
                } catch (err) {
                    console.error("AuthContext: Failed to parse user from storage event", err);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('load', initGoogleAuth);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [handleGoogleSignIn, initializeGSI]);

    const login = () => {
        console.log("AuthContext: Manual login requested — clearing logout flag");
        // Clear the logout flag so sign-in works
        didLogoutRef.current = false;
        sessionStorage.removeItem(LOGOUT_FLAG_KEY);

        // Re-initialize GSI with auto_select enabled for the manual prompt
        initializeGSI(true);

        if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
            try {
                // Cancel any existing prompt before showing a new one
                (window as any).google.accounts.id.cancel();
                (window as any).google.accounts.id.prompt((notification: any) => {
                    if (notification.isNotDisplayed()) {
                        console.warn("AuthContext: Prompt not displayed:", notification.getNotDisplayedReason());
                    } else if (notification.isSkippedMoment()) {
                        console.warn("AuthContext: Prompt skipped:", notification.getSkippedReason());
                    }
                });
            } catch (err) {
                console.error("AuthContext: Error calling prompt", err);
            }
        } else {
            alert("Google Sign-In is still loading. Please try again in a moment.");
        }
    };

    const logout = () => {
        console.log("AuthContext: Logout initiated");
        try {
            // Set logout flag FIRST
            didLogoutRef.current = true;
            sessionStorage.setItem(LOGOUT_FLAG_KEY, 'true');

            // Clear stored user data
            localStorage.removeItem('loggedInUser');
            setUser(null);

            if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
                // Cancel any pending prompts completely
                (window as any).google.accounts.id.cancel();
                // Tell Google explicitly not to auto-select this user anymore
                (window as any).google.accounts.id.disableAutoSelect();

                // CRITICAL: Re-initialize without auto_select so FedCM doesn't pop back up
                initializeGSI(false);
            }
        } catch (error) {
            console.error("AuthContext: Error during logout", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isGoogleLoaded, login, logout, handleGoogleSignIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
