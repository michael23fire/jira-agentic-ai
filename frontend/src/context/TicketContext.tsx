import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Ticket } from '../types/ticket';
import type { Sprint } from '../types/sprint';
import { mockTickets } from '../data/mockTickets';
import { mockSprints } from '../data/mockSprints';
import { useSpaces } from './SpaceContext';

interface SpaceData {
  tickets: Ticket[];
  sprints: Sprint[];
}

interface TicketContextValue {
  tickets: Ticket[];
  sprints: Sprint[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (updated: Ticket) => void;
  nextId: string;
}

const TicketContext = createContext<TicketContextValue | null>(null);

const DEFAULT_SPACE_ID = 'space-1';

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const { currentSpace } = useSpaces();

  const [dataBySpace, setDataBySpace] = useState<Record<string, SpaceData>>({
    [DEFAULT_SPACE_ID]: { tickets: mockTickets, sprints: mockSprints },
  });

  const spaceId = currentSpace.id;

  const currentData = useMemo(
    () => dataBySpace[spaceId] ?? { tickets: [], sprints: [] },
    [dataBySpace, spaceId],
  );

  const setTickets: React.Dispatch<React.SetStateAction<Ticket[]>> = useCallback(
    (action) => {
      setDataBySpace((prev) => {
        const old = prev[spaceId] ?? { tickets: [], sprints: [] };
        const newTickets = typeof action === 'function' ? action(old.tickets) : action;
        return { ...prev, [spaceId]: { ...old, tickets: newTickets } };
      });
    },
    [spaceId],
  );

  const setSprints: React.Dispatch<React.SetStateAction<Sprint[]>> = useCallback(
    (action) => {
      setDataBySpace((prev) => {
        const old = prev[spaceId] ?? { tickets: [], sprints: [] };
        const newSprints = typeof action === 'function' ? action(old.sprints) : action;
        return { ...prev, [spaceId]: { ...old, sprints: newSprints } };
      });
    },
    [spaceId],
  );

  const addTicket = useCallback(
    (ticket: Ticket) => setTickets((prev) => [...prev, ticket]),
    [setTickets],
  );

  const updateTicket = useCallback(
    (updated: Ticket) =>
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...updated, subtaskIds: t.subtaskIds } : t)),
      ),
    [setTickets],
  );

  const nextId = useMemo(() => {
    const key = currentSpace.key;
    const nums = currentData.tickets
      .map((t) => parseInt(t.id.replace(/\D/g, ''), 10))
      .filter(Boolean);
    return `${key}-${nums.length > 0 ? Math.max(...nums) + 1 : 1}`;
  }, [currentData.tickets, currentSpace.key]);

  return (
    <TicketContext.Provider
      value={{
        tickets: currentData.tickets,
        sprints: currentData.sprints,
        setTickets,
        setSprints,
        addTicket,
        updateTicket,
        nextId,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets(): TicketContextValue {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTickets must be used inside TicketProvider');
  return ctx;
}
