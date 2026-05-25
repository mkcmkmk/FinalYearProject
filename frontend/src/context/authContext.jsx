import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const normalizeUser = (userData) => {
  if (!userData) return null;

  return {
    ...userData,
    id: userData.id || userData._id,
  };
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });

  const login = useCallback((userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
    if (!token) return null;

    try {
      const res = await fetch(`${apiBase}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.user) {
        login(data.user);
        return data.user;
      }
    } catch {
      // Caller may fall back to cached user
    }
    return null;
  }, [login]);

  const logout = useCallback(() => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, refreshUser }),
    [user, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
