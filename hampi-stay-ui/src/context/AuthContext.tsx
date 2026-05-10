import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [showAuthModal, _setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "register">("login");

  useEffect(() => {
    const savedUser = sessionStorage.getItem("hampi-user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const setShowAuthModal = (show: boolean, view: "login" | "register" = "login") => {
    setAuthModalView(view);
    _setShowAuthModal(show);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      setUser(data.user);
      sessionStorage.setItem("hampi-user", JSON.stringify(data.user));
      sessionStorage.setItem("hampi-token", data.token);
      _setShowAuthModal(false); // Close modal on success
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Google login failed');

      setUser(data.user);
      sessionStorage.setItem("hampi-user", JSON.stringify(data.user));
      sessionStorage.setItem("hampi-token", data.token);
      _setShowAuthModal(false); // Close modal on success
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loginWithApple = async (appleResponse: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/apple', {
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
      sessionStorage.setItem("hampi-user", JSON.stringify(data.user));
      sessionStorage.setItem("hampi-token", data.token);
      _setShowAuthModal(false); // Close modal on success
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string, role: UserRole) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setUser(data.user);
      sessionStorage.setItem("hampi-user", JSON.stringify(data.user));
      sessionStorage.setItem("hampi-token", data.token);
      _setShowAuthModal(false); // Close modal on success
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    sessionStorage.setItem("hampi-user", JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("hampi-user");
    sessionStorage.removeItem("hampi-token");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
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
