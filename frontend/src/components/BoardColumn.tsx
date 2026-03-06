import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Ticket } from '../types/ticket';
import { TicketCard } from './TicketCard';

interface BoardColumnProps {
  droppableId: string;
  title: string;
  tickets: Ticket[];
  isDone?: boolean;
  onCreateClick: () => void;
  onTicketClick: (ticketId: string) => void;
}

export function BoardColumn({ droppableId, title, tickets, isDone, onCreateClick, onTicketClick }: BoardColumnProps) {
  return (
    <section className="board-column" data-status={droppableId}>
      <h2 className="board-column__title">
        {title}
        {isDone && <span className="board-column__done-mark" aria-hidden>✓</span>}
      </h2>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`board-column__cards ${snapshot.isDraggingOver ? 'board-column__cards--dragging' : ''}`}
          >
            {tickets.map((ticket, index) => (
              <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? 'board-column__card-wrapper board-column__card-wrapper--dragging' : 'board-column__card-wrapper'}
                  >
                    <TicketCard ticket={ticket} onClick={() => onTicketClick(ticket.id)} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            <button type="button" className="board-column__create" onClick={onCreateClick}>
              + Create
            </button>
          </div>
        )}
      </Droppable>
    </section>
  );
}
