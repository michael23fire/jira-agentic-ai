export type TicketStatus = 'planned' | 'in_progress' | 'blocked' | 'in_review' | 'done';

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  assignee?: string;
  assignees?: string[];
  dueDate?: string;
}
