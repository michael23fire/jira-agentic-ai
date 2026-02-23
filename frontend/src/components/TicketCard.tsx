import type { Ticket } from '../types/ticket';

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
    <path d="M11 2h1.5c.3 0 .5.2.5.5v9c0 .3-.2.5-.5.5h-11c-.3 0-.5-.2-.5-.5v-9c0-.3.2-.5.5-.5H3V1h1v1h6V1h1v1zM3 6v5h8V6H3z" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
    <path d="M8 1H2.5c-.3 0-.5.2-.5.5v11c0 .3.2.5.5.5h9c.3 0 .5-.2.5-.5V5L8 1zm.5 4.5V2.2l2.3 2.3H8.5zM2.5 12.5V2H7v4h4v6.5h-8.5z" />
  </svg>
);

interface TicketCardProps {
  ticket: Ticket;
}

function AssigneeAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="ticket-card__avatar" title={name}>
      {initial}
    </div>
  );
}

export function TicketCard({ ticket }: TicketCardProps) {
  const assignees = ticket.assignees ?? (ticket.assignee ? [ticket.assignee] : []);

  return (
    <article className="ticket-card">
      <h3 className="ticket-card__title">{ticket.title}</h3>
      <div className="ticket-card__meta">
        {ticket.dueDate && (
          <span className="ticket-card__meta-item">
            <CalendarIcon />
            {ticket.dueDate}
          </span>
        )}
        <span className="ticket-card__meta-item ticket-card__meta-item--id">
          <DocumentIcon />
          {ticket.id}
        </span>
      </div>
      {assignees.length > 0 && (
        <div className="ticket-card__assignees">
          {assignees.map((a) => (
            <AssigneeAvatar key={a} name={a} />
          ))}
        </div>
      )}
    </article>
  );
}
