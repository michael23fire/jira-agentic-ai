import { createContext, useContext, useState } from 'react';

export interface AppUser {
  id: string;
  name: string;
  avatarColor: string;
}

export const USERS: AppUser[] = [
  { id: 'michael', name: 'Michael', avatarColor: 'linear-gradient(135deg, #6366f1, #7c3aed)' },
  { id: 'john',    name: 'John',    avatarColor: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  { id: 'charles', name: 'Charles', avatarColor: 'linear-gradient(135deg, #10b981, #06b6d4)' },
];

interface UserContextValue {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser>(USERS[0]);
  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useCurrentUser must be used inside UserProvider');
  return ctx;
}
