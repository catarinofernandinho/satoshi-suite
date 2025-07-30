import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';

interface AuthInterceptContextType {
  requireAuth: (callback: () => void) => void;
}

const AuthInterceptContext = createContext<AuthInterceptContextType | undefined>(undefined);

export function AuthInterceptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const requireAuth = (callback: () => void) => {
    if (user) {
      // User is logged in, execute callback immediately
      callback();
    } else {
      // User is not logged in, show auth modal and store callback
      setPendingCallback(() => callback);
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    // Execute the pending callback after successful auth
    if (pendingCallback) {
      pendingCallback();
      setPendingCallback(null);
    }
    setIsAuthModalOpen(false);
  };

  const handleAuthClose = () => {
    setPendingCallback(null);
    setIsAuthModalOpen(false);
  };

  return (
    <AuthInterceptContext.Provider value={{ requireAuth }}>
      {children}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />
    </AuthInterceptContext.Provider>
  );
}

export function useAuthIntercept() {
  const context = useContext(AuthInterceptContext);
  if (context === undefined) {
    throw new Error('useAuthIntercept must be used within an AuthInterceptProvider');
  }
  return context;
}