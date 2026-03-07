import { createContext, useContext, useState, useCallback } from 'react';
import type { Space } from '../types/space';
import { SPACE_COLORS } from '../types/space';

const DEFAULT_SPACES: Space[] = [
  {
    id: 'space-1',
    name: 'Agentic AI Sprint',
    key: 'SCRUM',
    color: SPACE_COLORS[0],
    members: ['michael', 'john', 'charles'],
  },
];

interface SpaceContextValue {
  spaces: Space[];
  currentSpace: Space;
  setCurrentSpace: (space: Space) => void;
  createSpace: (name: string, key: string) => Space;
  addMember: (spaceId: string, userId: string) => void;
  removeMember: (spaceId: string, userId: string) => void;
}

const SpaceContext = createContext<SpaceContextValue | null>(null);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const [spaces, setSpaces] = useState<Space[]>(DEFAULT_SPACES);
  const [currentSpace, setCurrentSpace] = useState<Space>(DEFAULT_SPACES[0]);

  const createSpace = useCallback((name: string, key: string): Space => {
    const colorIndex = spaces.length % SPACE_COLORS.length;
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name,
      key: key.toUpperCase(),
      color: SPACE_COLORS[colorIndex],
      members: [],
    };
    setSpaces((prev) => [...prev, newSpace]);
    return newSpace;
  }, [spaces.length]);

  const addMember = useCallback((spaceId: string, userId: string) => {
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === spaceId && !s.members.includes(userId)
          ? { ...s, members: [...s.members, userId] }
          : s,
      ),
    );
    setCurrentSpace((prev) =>
      prev.id === spaceId && !prev.members.includes(userId)
        ? { ...prev, members: [...prev.members, userId] }
        : prev,
    );
  }, []);

  const removeMember = useCallback((spaceId: string, userId: string) => {
    setSpaces((prev) =>
      prev.map((s) =>
        s.id === spaceId
          ? { ...s, members: s.members.filter((m) => m !== userId) }
          : s,
      ),
    );
    setCurrentSpace((prev) =>
      prev.id === spaceId
        ? { ...prev, members: prev.members.filter((m) => m !== userId) }
        : prev,
    );
  }, []);

  return (
    <SpaceContext.Provider
      value={{ spaces, currentSpace, setCurrentSpace, createSpace, addMember, removeMember }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpaces(): SpaceContextValue {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error('useSpaces must be used inside SpaceProvider');
  return ctx;
}
