import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";

type UserRole = "TRAVELLER" | "RESORT_OWNER" | "GUIDE" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  idType?: string;
  idNumber?: string;
  idImage?: string;
  kycStatus?: "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "REJECTED";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: (credential: string) => Promise<any>;
  loginWithApple: (response: any) => Promise<any>;
  register: (name: string, email: string, phone: string, password: string, role: UserRole) => Promise<any>;
  updateUser: (updatedUser: User) => void;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean, view?: "login" | "register") => void;
  authModalView: "login" | "register";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, _setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "register">("login");

  useEffect(() => {
    const savedUser = localStorage.getItem("hampi-user");
    const token = localStorage.getItem("hampi-token");
    
    if (savedUser && token) {
      // Set local state immediately for fast load
      setUser(JSON.parse(savedUser));
      
      // Verify with backend in background to ensure session is still valid
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) {
          // Token expired or invalid
          logout();
        } else {
          return res.json();
        }
      })
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem("hampi-user", JSON.stringify(data.user));
        }
      })
      .catch(() => {
        // Network error, keep local user for offline/temporary access
        console.warn("Session verification failed. Operating in offline mode.");
      })
      .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setShowAuthModal = (show: boolean, view: "login" | "register" = "login") => {
    setAuthModalView(view);
    _setShowAuthModal(show);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      setUser(data.user);
      localStorage.setItem("hampi-user", JSON.stringify(data.user));
      localStorage.setItem("hampi-token", data.token);
      _setShowAuthModal(false); // Close modal on success
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Google login failed');

      setUser(data.user);
      localStorage.setItem("hampi-user", JSON.stringify(data.user));
      localStorage.setItem("hampi-token", data.token);
      _setShowAuthModal(false); // Close modal on success
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loginWithApple = async (appleResponse: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: appleResponse.authorization.id_token,
          user: appleResponse.user
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Apple login failed');

      setUser(data.user);
      localStorage.setItem("hampi-user", JSON.stringify(data.user));
      localStorage.setItem("hampi-token", data.token);
      _setShowAuthModal(false); // Close modal on success
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string, role: UserRole) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setUser(data.user);
      localStorage.setItem("hampi-user", JSON.stringify(data.user));
      localStorage.setItem("hampi-token", data.token);
      _setShowAuthModal(false); // Close modal on success
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("hampi-user", JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hampi-user");
    localStorage.removeItem("hampi-token");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      isAuthenticated: !!user, 
      login, 
      loginWithGoogle, 
      loginWithApple, 
      logout, 
      register, 
      updateUser,
      showAuthModal,
      setShowAuthModal,
      authModalView
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
