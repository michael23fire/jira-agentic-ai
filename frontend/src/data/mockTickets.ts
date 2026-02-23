import type { Ticket } from '../types/ticket';

export const mockTickets: Ticket[] = [
  { id: 'SCRUM-1', title: 'Task 1', status: 'planned', assignee: '小明', dueDate: 'Feb 27, 2026' },
  { id: 'SCRUM-2', title: 'Task 2', status: 'in_progress', assignees: ['小明', '小華'], dueDate: 'Mar 4, 2026' },
  { id: 'SCRUM-3', title: '設定專案 CI/CD', status: 'planned', assignee: '小華', dueDate: 'Feb 28, 2026' },
  { id: 'SCRUM-4', title: '設計 API 規格', status: 'in_progress', assignee: '小明', dueDate: 'Mar 1, 2026' },
  { id: 'SCRUM-5', title: '實作登入頁面', status: 'in_review', assignee: '小華', dueDate: 'Mar 5, 2026' },
  { id: 'SCRUM-6', title: '首頁版面切版', status: 'done', assignee: '小明', dueDate: 'Feb 25, 2026' },
  { id: 'SCRUM-7', title: 'README 文件更新', status: 'done', assignee: '小華', dueDate: 'Feb 26, 2026' },
];
