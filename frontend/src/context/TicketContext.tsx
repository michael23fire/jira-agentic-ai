import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { Ticket, TicketStatus, TicketPriority, TicketLabel, IssueType } from '../types/ticket';
import type { Sprint, SprintStatus } from '../types/sprint';
import { useSpaces } from './SpaceContext';
import { useCurrentUser } from './UserContext';
import { issueApi, sprintApi, commentApi } from '../api';
import type { IssueDto, SprintDto } from '../api';

function toIsoDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function issueDtoToTicket(dto: IssueDto): Ticket {
  return {
    id: dto.issueKey,
    dbId: dto.id,
    title: dto.title,
    issueType: (dto.issueType as IssueType) ?? 'task',
    description: dto.description ?? undefined,
    status: (dto.status as TicketStatus) ?? 'planned',
    assignee: dto.assigneeName ?? undefined,
    reporter: dto.reporterName ?? undefined,
    dueDate: dto.dueDate ?? undefined,
    startDate: dto.startDate ?? undefined,
    storyPoints: dto.storyPoints ?? undefined,
    priority: (dto.priority as TicketPriority) ?? undefined,
    labels: (dto.labels as TicketLabel[]) ?? undefined,
    parentId: dto.parentKey ?? undefined,
    subtaskIds: dto.childKeys ?? undefined,
    sprintId: dto.sprintId != null ? String(dto.sprintId) : undefined,
    sprint: dto.sprintName ?? undefined,
    comments: dto.comments?.map((c) => ({
      id: String(c.id),
      authorId: c.authorId,
      author: c.authorName,
      content: c.content,
      createdAt: new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    })) ?? [],
  };
}

function sprintDtoToSprint(dto: SprintDto): Sprint {
  return {
    id: String(dto.id),
    name: dto.name,
    goal: dto.goal ?? undefined,
    startDate: dto.startDate ?? '',
    endDate: dto.endDate ?? '',
    status: (dto.status as SprintStatus) ?? 'future',
  };
}

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
  updateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  createSubtask: (parentId: string, title: string) => void;
  createSprint: () => void;
  startSprint: (sprintId: string, updates: Pick<Sprint, 'startDate' | 'endDate' | 'goal'>) => void;
  completeSprint: (sprintId: string) => void;
  createIssueInSprint: (sprintId: string | null, title: string) => void;
  addComment: (issueDbId: number, authorId: number, content: string) => void;
  editComment: (issueDbId: number, commentId: number, content: string) => void;
  deleteComment: (issueDbId: number, commentId: number) => void;
  nextId: string;
  refreshData: () => void;
}

const TicketContext = createContext<TicketContextValue | null>(null);

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const { currentSpace } = useSpaces();
  const { currentUser, apiReady } = useCurrentUser();

  const [dataBySpace, setDataBySpace] = useState<Record<string, SpaceData>>({});

  const spaceId = currentSpace.id;
  const numericSpaceId = Number(spaceId);
  const canApi = apiReady && !isNaN(numericSpaceId);

  const currentData = useMemo(
    () => dataBySpace[spaceId] ?? { tickets: [], sprints: [] },
    [dataBySpace, spaceId],
  );

  const fetchFromApi = useCallback(() => {
    if (!canApi) return;
    Promise.all([
      issueApi.getBySpace(numericSpaceId),
      sprintApi.getBySpace(numericSpaceId),
    ]).then(([issueDtos, sprintDtos]) => {
      const tickets = issueDtos.map(issueDtoToTicket);
      const sprints = sprintDtos.map(sprintDtoToSprint);
      setDataBySpace((prev) => ({
        ...prev,
        [spaceId]: { tickets, sprints },
      }));
    }).catch(() => {});
  }, [canApi, numericSpaceId, spaceId]);

  useEffect(() => {
    if (apiReady) fetchFromApi();
  }, [apiReady, spaceId, fetchFromApi]);

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

  // ── Add ticket (from CreateTaskModal's addTicket path) ──
  const addTicket = useCallback(
    (ticket: Ticket) => {
      setTickets((prev) => [...prev, ticket]);
      if (canApi) {
        issueApi.create(numericSpaceId, {
          title: ticket.title,
          description: ticket.description,
          issueType: ticket.issueType,
          status: ticket.status,
          priority: ticket.priority,
          storyPoints: ticket.storyPoints,
          labels: ticket.labels,
          sprintId: ticket.sprintId ? Number(ticket.sprintId) : undefined,
          startDate: toIsoDate(ticket.startDate),
          dueDate: toIsoDate(ticket.dueDate),
        }).then(() => fetchFromApi()).catch(() => {});
      }
    },
    [setTickets, canApi, numericSpaceId, fetchFromApi],
  );

  // ── Update ticket (from TicketDetailModal) ──
  const updateTicket = useCallback(
    (updated: Ticket) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...updated, subtaskIds: t.subtaskIds } : t)),
      );
      if (canApi) {
        issueApi.update(numericSpaceId, updated.id, {
          title: updated.title,
          description: updated.description,
          issueType: updated.issueType,
          status: updated.status,
          priority: updated.priority,
          storyPoints: updated.storyPoints,
          labels: updated.labels,
          sprintId: updated.sprintId ? Number(updated.sprintId) : undefined,
          clearSprint: !updated.sprintId,
          startDate: toIsoDate(updated.startDate),
          dueDate: toIsoDate(updated.dueDate),
        })
          .then(() => fetchFromApi())
          .catch((e) => {
            fetchFromApi();
            alert(e instanceof Error ? e.message : 'Failed to update issue');
          });
      }
    },
    [setTickets, canApi, numericSpaceId, fetchFromApi],
  );

  // ── Update single ticket status (drag & drop) ──
  const updateTicketStatus = useCallback(
    (ticketId: string, newStatus: TicketStatus) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
      );
      if (canApi) {
        issueApi.update(numericSpaceId, ticketId, { status: newStatus }).catch(() => {});
      }
    },
    [setTickets, canApi, numericSpaceId],
  );

  // ── Create subtask ──
  const createSubtask = useCallback(
    (parentId: string, title: string) => {
      if (canApi) {
        const parentTicket = currentData.tickets.find((t) => t.id === parentId);
        issueApi.create(numericSpaceId, {
          title,
          issueType: 'subtask',
          status: 'planned',
          parentId: parentTicket?.dbId,
          sprintId: parentTicket?.sprintId ? Number(parentTicket.sprintId) : undefined,
        }).then(() => fetchFromApi()).catch(() => {});
      } else {
        setTickets((prev) => {
          const key = currentSpace.key;
          const nums = prev.map((t) => parseInt(t.id.replace(/\D/g, ''), 10)).filter(Boolean);
          const newId = `${key}-${nums.length > 0 ? Math.max(...nums) + 1 : 1}`;
          const parent = prev.find((t) => t.id === parentId);
          const subtask: Ticket = { id: newId, title, status: 'planned', issueType: 'subtask', parentId, sprintId: parent?.sprintId };
          return [
            ...prev.map((t) => t.id === parentId ? { ...t, subtaskIds: [...(t.subtaskIds ?? []), newId] } : t),
            subtask,
          ];
        });
      }
    },
    [canApi, numericSpaceId, fetchFromApi, setTickets, currentSpace.key, currentData.tickets],
  );

  // ── Create issue inline (Backlog/Board "Create issue" button) ──
  const createIssueInSprint = useCallback(
    (sprintId: string | null, title: string) => {
      if (canApi) {
        issueApi.create(numericSpaceId, {
          title,
          issueType: 'task',
          status: 'planned',
          sprintId: sprintId ? Number(sprintId) : undefined,
        }).then(() => fetchFromApi()).catch(() => {});
      } else {
        const key = currentSpace.key;
        setTickets((prev) => {
          const nums = prev.map((t) => parseInt(t.id.replace(/\D/g, ''), 10)).filter(Boolean);
          const newId = `${key}-${nums.length > 0 ? Math.max(...nums) + 1 : 1}`;
          const newTicket: Ticket = {
            id: newId,
            title,
            status: 'planned',
            issueType: 'task',
            reporter: currentUser.name,
            sprintId: sprintId ?? undefined,
          };
          return [...prev, newTicket];
        });
      }
    },
    [canApi, numericSpaceId, fetchFromApi, setTickets, currentSpace.key, currentUser.name],
  );

  // ── Create sprint ──
  const createSprint = useCallback(() => {
    if (canApi) {
      sprintApi.create(numericSpaceId, {
        name: `Sprint ${currentData.sprints.length + 1}`,
        status: 'future',
      }).then(() => fetchFromApi()).catch(() => {});
    } else {
      const newSprint: Sprint = {
        id: `sprint-${Date.now()}`,
        name: `Sprint ${currentData.sprints.length + 1}`,
        startDate: '',
        endDate: '',
        status: 'future',
      };
      setSprints((prev) => [...prev, newSprint]);
    }
  }, [canApi, numericSpaceId, currentData.sprints.length, fetchFromApi, setSprints]);

  // ── Start sprint ──
  const startSprint = useCallback(
    (sprintId: string, updates: Pick<Sprint, 'startDate' | 'endDate' | 'goal'>) => {
      setSprints((prev) => prev.map((s) => s.id === sprintId ? { ...s, ...updates, status: 'active' as SprintStatus } : s));
      if (canApi) {
        sprintApi.update(numericSpaceId, Number(sprintId), {
          startDate: updates.startDate,
          endDate: updates.endDate,
          goal: updates.goal,
          status: 'active',
        }).catch(() => {});
      }
    },
    [setSprints, canApi, numericSpaceId],
  );

  // ── Complete sprint ──
  const completeSprint = useCallback(
    (sprintId: string) => {
      setSprints((prev) => prev.map((s) => s.id === sprintId ? { ...s, status: 'completed' as SprintStatus } : s));
      setTickets((prev) => prev.map((t) =>
        t.sprintId === sprintId && t.status !== 'done' ? { ...t, sprintId: undefined } : t
      ));
      if (canApi) {
        sprintApi.update(numericSpaceId, Number(sprintId), { status: 'completed' })
          .then(() => fetchFromApi())
          .catch(() => {});
      }
    },
    [setSprints, setTickets, canApi, numericSpaceId, fetchFromApi],
  );

  // ── Add comment ──
  const addComment = useCallback(
    (issueDbId: number, authorId: number, content: string) => {
      if (canApi) {
        commentApi.create(issueDbId, { authorId, content })
          .then(() => fetchFromApi())
          .catch(() => {});
      }
    },
    [canApi, fetchFromApi],
  );

  // ── Edit comment ──
  const editComment = useCallback(
    (issueDbId: number, commentId: number, content: string) => {
      if (canApi) {
        commentApi.update(issueDbId, commentId, content)
          .then(() => fetchFromApi())
          .catch(() => {});
      }
    },
    [canApi, fetchFromApi],
  );

  // ── Delete comment ──
  const deleteComment = useCallback(
    (issueDbId: number, commentId: number) => {
      if (canApi) {
        commentApi.delete(issueDbId, commentId)
          .then(() => fetchFromApi())
          .catch(() => {});
      }
    },
    [canApi, fetchFromApi],
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
        updateTicketStatus,
        createSubtask,
        createSprint,
        startSprint,
        completeSprint,
        createIssueInSprint,
        addComment,
        editComment,
        deleteComment,
        nextId,
        refreshData: fetchFromApi,
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
