import { useState, useMemo, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { BoardColumn } from '../components/BoardColumn';
import { mockTickets } from '../data/mockTickets';
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
    planned: [],
    in_progress: [],
    blocked: [],
    in_review: [],
    done: [],
  };
  for (const ticket of tickets) {
    map[ticket.status].push(ticket);
  }
  return map;
}

export function Board() {
  const [tickets, setTickets] = useState<Ticket[]>(() => mockTickets);
  const ticketsByStatus = useMemo(() => groupByStatus(tickets), [tickets]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as TicketStatus;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === draggableId ? { ...t, status: newStatus } : t
      )
    );
  }, []);

  return (
    <>
      <div className="board-toolbar">
        <input
          type="search"
          placeholder="Search board"
          className="board-toolbar__search"
          aria-label="Search board"
        />
        <button type="button" className="board-toolbar__filter">
          Filter
        </button>
        <div className="board-toolbar__right">
          <button type="button" className="board-toolbar__complete">
            Complete sprint
          </button>
          <button type="button" className="board-toolbar__group">
            Group
          </button>
          <button type="button" className="board-toolbar__icon" aria-label="Share">
            ⎘
          </button>
          <button type="button" className="board-toolbar__icon" aria-label="Maximize">
            ⛶
          </button>
          <button type="button" className="board-toolbar__icon" aria-label="Options">
            ⋯
          </button>
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
            />
          ))}
          <button type="button" className="board__add-column" aria-label="Add column">
            +
          </button>
        </div>
      </DragDropContext>
    </>
  );
}
