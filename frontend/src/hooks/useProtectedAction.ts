import { useAuth } from "../context/AuthContext";

interface ProtectOptions {
  message?: string;
  view?: "login" | "register";
}

/**
 * Hook to wrap any action that requires authentication.
 * If authenticated, the action is executed immediately.
 * If not, it opens the premium auth modal.
 */
export function useProtectedAction() {
  const { isAuthenticated, setShowAuthModal } = useAuth();

  const protect = (action: () => void, options: ProtectOptions = {}) => {
    if (isAuthenticated) {
      action();
    } else {
      setShowAuthModal(true, { 
        view: options.view || "register", 
        message: options.message 
      });
    }
  };

  return { protect };
}
