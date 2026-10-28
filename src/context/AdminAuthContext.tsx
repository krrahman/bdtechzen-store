import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/staticApiFallback';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthContextType {
  adminToken: string | null;
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  loginAdmin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logoutAdmin: () => void;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const TOKEN_KEY = 'bdtechzen_admin_token';
const USER_KEY = 'bdtechzen_admin_user';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const logoutAdmin = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('solestyle_admin_token');
    localStorage.removeItem('solestyle_admin_user');
  };

  // Validate saved token on mount so stale sessions never cause blank admin pages
  useEffect(() => {
    localStorage.removeItem('solestyle_admin_token');
    localStorage.removeItem('solestyle_admin_user');

    if (!adminToken) return;
    apiFetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then((res) => {
        if (!res.ok) {
          logoutAdmin();
          return null;
        }
        return res.json();
      })
      .then((user) => {
        if (user) {
          setAdminUser(user);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
      })
      .catch(() => {});
  }, []);

  const loginAdmin = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      setIsLoading(false);

      if (!res.ok) {
        return { success: false, message: data.error || 'Authentication failed' };
      }

      setAdminToken(data.token);
      setAdminUser(data.admin);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.admin));

      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, message: 'Unable to reach server. Please try again.' };
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        adminUser,
        isAuthenticated: !!adminToken,
        loginAdmin,
        logoutAdmin,
        isLoading
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
