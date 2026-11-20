import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkAdmin } from '../supabaseClient';

const AuthContext = createContext({
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const verifyUserRole = async (currentUser) => {
    if (!currentUser) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const adminStatus = await checkAdmin(currentUser);
      setUser(currentUser);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.error('Role check error:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        verifyUserRole(session.user);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen to auth state changes (e.g. multi-tab signout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      } else if (session?.user) {
        await verifyUserRole(session.user);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    const adminStatus = await checkAdmin(data.user);
    if (!adminStatus) {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return { success: false, error: 'Access denied. Only admin accounts are permitted to log in.' };
    }

    setUser(data.user);
    setIsAdmin(true);
    setLoading(false);
    return { success: true, user: data.user };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
