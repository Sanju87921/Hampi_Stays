import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { apiClient } from "../utils/apiClient";

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
  loginWithGoogle: (credential: string, role?: UserRole) => Promise<any>;
  loginWithApple: (response: any, role?: UserRole) => Promise<any>;
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
    if (user) setIsLoading(false);
  }, [user]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    };

    window.addEventListener('hampi-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('hampi-unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("hampi-user");
    const token = localStorage.getItem("hampi-token");
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        
        apiClient.get<{ user: User }>('/auth/me')
          .then(data => {
            if (data && data.user) {
              setUser(data.user);
              localStorage.setItem("hampi-user", JSON.stringify(data.user));
            }
          })
          .catch((err) => {
            console.warn("Session verification failed:", err.message);
            if (err.status === 401) logout();
          })
          .finally(() => setIsLoading(false));
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const setShowAuthModal = (show: boolean, view: "login" | "register" = "login") => {
    setAuthModalView(view);
    _setShowAuthModal(show);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient.post<any>('/auth/login', { email, password });
      
      // Atomic storage update
      localStorage.setItem("hampi-token", data.token);
      localStorage.setItem("hampi-user", JSON.stringify(data.user));
      
      // Immediate state update
      setUser(data.user);
      setIsLoading(false); // Set loading to false immediately on success
      _setShowAuthModal(false);
      
      return data;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async (credential: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      const data = await apiClient.post<any>('/auth/google', { credential, role });
      localStorage.setItem("hampi-token", data.token);
      localStorage.setItem("hampi-user", JSON.stringify(data.user));
      setUser(data.user);
      setIsLoading(false);
      _setShowAuthModal(false);
      return data;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const loginWithApple = async (appleResponse: any, role?: UserRole) => {
    setIsLoading(true);
    try {
      const data = await apiClient.post<any>('/auth/apple', {
        id_token: appleResponse.authorization.id_token,
        user: appleResponse.user,
        role
      });
      localStorage.setItem("hampi-token", data.token);
      localStorage.setItem("hampi-user", JSON.stringify(data.user));
      setUser(data.user);
      setIsLoading(false);
      _setShowAuthModal(false);
      return data;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const data = await apiClient.post<any>('/auth/register', { name, email, phone, password, role });
      localStorage.setItem("hampi-token", data.token);
      localStorage.setItem("hampi-user", JSON.stringify(data.user));
      setUser(data.user);
      setIsLoading(false);
      _setShowAuthModal(false);
      return data;
    } catch (err) {
      setIsLoading(false);
      throw err;
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
    window.location.href = "/";
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
