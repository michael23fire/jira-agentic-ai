import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { BoardColumn } from '../components/BoardColumn';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { useTickets } from '../context/TicketContext';
import { useSpaces } from '../context/SpaceContext';
import type { Ticket, TicketStatus } from '../types/ticket';
import './Board.css';

const COLUMNS: { status: TicketStatus; title: string; isDone?: boolean }[] = [
  { status: 'planned', title: 'PLANNED' },
  { status: 'in_progress', title: 'IN PROGRESS' },
  { status: 'blocked', title: 'BLOCKED' },
  { status: 'in_review', title: 'IN REVIEW' },
  { status: 'done', title: 'DONE', isDone: true },
];

function groupByStatus(tickets: Ticket[]): Record<TicketStatus, Ticket[]> {
  const map: Record<TicketStatus, Ticket[]> = {
    planned: [], in_progress: [], blocked: [], in_review: [], done: [],
  };
  for (const ticket of tickets) {
    map[ticket.status].push(ticket);
  }
  return map;
}

export function Board() {
  const { tickets, setTickets, sprints, nextId } = useTickets();
  const { currentSpace } = useSpaces();
  const ticketsByStatus = useMemo(() => groupByStatus(tickets), [tickets]);
  const [modalStatus, setModalStatus] = useState<TicketStatus | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTicketId = searchParams.get('ticket');
  const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedTicketId) ?? null, [tickets, selectedTicketId]);

  function openTicketModal(id: string) {
    setSearchParams({ ticket: id }, { replace: false });
  }

  function closeTicketModal() {
    setSearchParams({}, { replace: false });
  }

  useEffect(() => {
    const param = searchParams.get('ticket');
    if (param && !tickets.find((t) => t.id === param)) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId as TicketStatus;
    setTickets((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t)),
    );
  }, [setTickets]);

  const handleCreateConfirm = useCallback((ticket: Ticket) => {
    setTickets((prev) => [...prev, ticket]);
    setModalStatus(null);
  }, [setTickets]);

  const handleTicketUpdate = useCallback((updated: Ticket) => {
    setTickets((prev) => prev.map((t) =>
      t.id === updated.id ? { ...updated, subtaskIds: t.subtaskIds } : t,
    ));
  }, [setTickets]);

  const handleCreateSubtask = useCallback((parentId: string, title: string) => {
    setTickets((prev) => {
      const key = currentSpace.key;
      const nums = prev.map((t) => parseInt(t.id.replace(/\D/g, ''), 10)).filter(Boolean);
      const newId = `${key}-${nums.length > 0 ? Math.max(...nums) + 1 : 1}`;
      const subtask: Ticket = { id: newId, title, status: 'planned', issueType: 'subtask', parentId };
      return [
        ...prev.map((t) => t.id === parentId ? { ...t, subtaskIds: [...(t.subtaskIds ?? []), newId] } : t),
        subtask,
      ];
    });
  }, [setTickets, currentSpace.key]);

  return (
    <>
      {modalStatus !== null && (
        <CreateTaskModal
          initialStatus={modalStatus}
          nextId={nextId}
          onConfirm={handleCreateConfirm}
          onClose={() => setModalStatus(null)}
        />
      )}
      {selectedTicket !== null && (
        <TicketDetailModal
          ticket={selectedTicket}
          allTickets={tickets}
          sprints={sprints}
          spaceName={currentSpace.name}
          spaceColor={currentSpace.color}
          onUpdate={handleTicketUpdate}
          onCreateSubtask={handleCreateSubtask}
          onOpenTicket={(id) => openTicketModal(id)}
          onClose={closeTicketModal}
        />
      )}
      <div className="board-toolbar">
        <input type="search" placeholder="Search board" className="board-toolbar__search" aria-label="Search board" />
        <button type="button" className="board-toolbar__filter">Filter</button>
        <div className="board-toolbar__right">
          <button type="button" className="board-toolbar__complete">Complete sprint</button>
          <button type="button" className="board-toolbar__group">Group</button>
          <button type="button" className="board-toolbar__icon" aria-label="Share">⎘</button>
          <button type="button" className="board-toolbar__icon" aria-label="Maximize">⛶</button>
          <button type="button" className="board-toolbar__icon" aria-label="Options">⋯</button>
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {COLUMNS.map(({ status, title, isDone }) => (
            <BoardColumn
              key={status}
              droppableId={status}
              title={title}
              tickets={ticketsByStatus[status]}
              isDone={isDone}
              onCreateClick={() => setModalStatus(status)}
              onTicketClick={(id) => openTicketModal(id)}
            />
          ))}
          <button type="button" className="board__add-column" aria-label="Add column">+</button>
        </div>
      </DragDropContext>
    </>
  );
}
