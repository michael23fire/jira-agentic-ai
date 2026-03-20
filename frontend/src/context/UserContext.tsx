import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi, authApi } from '../api';
import type { UserDto } from '../api';
import { setAuthToken, clearAuthToken, getStoredAuthToken } from '../api/client';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
}

const EMPTY_USER: AppUser = {
  id: '',
  username: '',
  name: '',
  avatarColor: 'linear-gradient(135deg, #94a3b8, #64748b)',
};

const AUTH_STORAGE_KEY = 'jira_auth_user';

function dtoToAppUser(dto: UserDto): AppUser {
  return {
    id: String(dto.id),
    username: dto.username,
    name: dto.name,
    avatarColor: dto.avatarColor ?? 'linear-gradient(135deg, #6366f1, #7c3aed)',
  };
}

interface UserContextValue {
  users: AppUser[];
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  apiReady: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export let USERS: AppUser[] = [];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser>(EMPTY_USER);
  const [apiReady, setApiReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_STORAGE_KEY) !== null && getStoredAuthToken() != null;
  });

  const syncUsersFromApi = useCallback(async (): Promise<AppUser[] | null> => {
    try {
      let dtos = await userApi.getAll();
      const mapped = dtos.map(dtoToAppUser);
      if (mapped.length > 0) {
        setUsers(mapped);
        USERS = mapped;
        return mapped;
      }
      return mapped;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const SEED_USERS = [
      { username: 'michael', name: 'Michael', email: 'michael@example.com', avatarColor: 'linear-gradient(135deg, #6366f1, #7c3aed)' },
      { username: 'john',    name: 'John',    email: 'john@example.com',    avatarColor: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
      { username: 'charles', name: 'Charles', email: 'charles@example.com', avatarColor: 'linear-gradient(135deg, #10b981, #06b6d4)' },
    ];

    userApi.getAll()
      .then(async (dtos) => {
        if (dtos.length === 0) {
          for (const seed of SEED_USERS) {
            await userApi.create(seed);
          }
          dtos = await userApi.getAll();
        }
        const mapped = dtos.map(dtoToAppUser);
        setUsers(mapped);
        USERS = mapped;

        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        const token = getStoredAuthToken();
        if (saved && token) {
          try {
            const parsed = JSON.parse(saved) as AppUser;
            const found = mapped.find((u) => u.id === parsed.id);
            if (found) {
              setAuthToken(token);
              setCurrentUser(found);
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem(AUTH_STORAGE_KEY);
              clearAuthToken();
              setIsAuthenticated(false);
            }
          } catch {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            clearAuthToken();
            setIsAuthenticated(false);
          }
        } else {
          clearAuthToken();
          setIsAuthenticated(false);
        }

        setApiReady(true);
      })
      .catch(() => {
        console.warn('Backend not available');
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        const token = getStoredAuthToken();
        if (saved && token) {
          try {
            const parsed = JSON.parse(saved) as AppUser;
            setAuthToken(token);
            setCurrentUser(parsed);
            setIsAuthenticated(true);
          } catch {
            clearAuthToken();
            setIsAuthenticated(false);
          }
        } else {
          clearAuthToken();
          setUsers([]);
          USERS = [];
          setCurrentUser(EMPTY_USER);
          setIsAuthenticated(false);
        }
        setApiReady(false);
      });
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const resp = await authApi.login({ username, password });
      const user = dtoToAppUser(resp.user);
      setAuthToken(resp.accessToken);
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      setApiReady(true);

      // Ensure contexts switch to real API mode after login.
      const mapped = await syncUsersFromApi();
      if (mapped && mapped.length > 0) {
        const found = mapped.find((u) => u.id === user.id);
        if (found) setCurrentUser(found);
      }
      return null;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      return msg;
    }
  }, [syncUsersFromApi]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    clearAuthToken();
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <UserContext.Provider value={{ users, currentUser, setCurrentUser, apiReady, isAuthenticated, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useCurrentUser must be used inside UserProvider');
  return ctx;
}
