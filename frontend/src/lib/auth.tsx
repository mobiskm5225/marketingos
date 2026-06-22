import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface GroupMembership {
  group: string;
  role: 'member' | 'manager';
}

export interface AuthUser {
  username: string;
  userId: string;
  permissions: string[];
  groupMemberships: GroupMembership[];
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  isManagerInGroup: (groupName: string) => boolean;
  myGroups: string[];
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

const TOKEN_KEY = 'mi_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [token, setToken]         = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(!!getToken());

  useEffect(() => {
    const stored = getToken();
    if (!stored) { setIsLoading(false); return; }

    fetch('/auth/me', { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setUser(data.user); setToken(stored); })
      .catch(() => { clearToken(); setToken(null); })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(username: string, password: string): Promise<void> {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error ?? 'Login failed');
    }
    const { token: tok, user: u } = await res.json();
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    setUser(u);
  }

  function logout(): void {
    clearToken();
    setToken(null);
    setUser(null);
  }

  function hasPermission(perm: string): boolean {
    const perms = user?.permissions ?? [];
    return perms.includes('*') || perms.includes(perm);
  }

  function isManagerInGroup(groupName: string): boolean {
    if (hasPermission('*')) return true;
    return (user?.groupMemberships ?? []).some(m => m.group === groupName && m.role === 'manager');
  }

  const myGroups = (user?.groupMemberships ?? []).map(m => m.group);

  return (
    <Ctx.Provider value={{ user, token, isLoading, login, logout, hasPermission, isManagerInGroup, myGroups }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  return useContext(Ctx);
}
