'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { 
  signIn, 
  signUp, 
  signOutUser, 
  signInWithGoogle, 
  onAuthStateChange,
  getUserProfile,
  subscribeToUserProfile
} from '@/lib/firebase';
import { UserProfile, LoginForm, RegisterForm } from '@/types';

interface AuthContextType {
  // Auth state
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  
  // Auth methods
  login: (credentials: LoginForm) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterForm) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  
  // Profile methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  
  // Utility methods
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Get user profile from Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setError('Failed to load user profile');
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUserProfile(user.uid, (profile) => {
      setUserProfile(profile);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const login = async (credentials: LoginForm) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signIn(credentials.email, credentials.password);
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        const errorMessage = 'Passwords do not match';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      const userData = {
        displayName: data.displayName,
        companyName: data.companyName,
      };
      
      const result = await signUp(data.email, data.password, userData);
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await signOutUser();
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Logout failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithGoogle();
      
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Google login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.uid) {
      const errorMessage = 'No user logged in';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      setLoading(true);
      setError(null);
      
      // Update profile in Firestore
      const { updateUserProfile } = await import('@/lib/firebase');
      const result = await updateUserProfile(user.uid, updates);
      
      if (!result.success) {
        setError(result.error || 'Failed to update profile');
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
