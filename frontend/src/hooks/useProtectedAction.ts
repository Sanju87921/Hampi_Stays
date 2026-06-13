import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();

  const protect = (action: () => void, options: ProtectOptions = {}) => {
    if (isAuthenticated) {
      action();
    } else {
      navigate("/register");
    }
  };

  return { protect };
}
