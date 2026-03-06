import { useState, useEffect, useRef } from 'react';
import type { Ticket, TicketStatus } from '../types/ticket';
import { useCurrentUser, USERS } from '../context/UserContext';

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

interface CreateTaskModalProps {
  initialStatus?: TicketStatus;
  nextId: string;
  onConfirm: (ticket: Ticket) => void;
  onClose: () => void;
}

export function CreateTaskModal({ initialStatus = 'planned', nextId, onConfirm, onClose }: CreateTaskModalProps) {
  const { currentUser } = useCurrentUser();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TicketStatus>(initialStatus);
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const ticket: Ticket = {
      id: nextId,
      title: title.trim(),
      status,
      assignee: assignee || undefined,
      reporter: currentUser.name,
      dueDate: dueDate
        ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : undefined,
    };
    onConfirm(ticket);
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">建立任務</h2>
          <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="modal__field">
            <label className="modal__label" htmlFor="task-title">標題 <span className="modal__required">*</span></label>
            <input
              ref={titleRef}
              id="task-title"
              className="modal__input"
              type="text"
              placeholder="輸入任務標題…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="modal__field">
            <label className="modal__label" htmlFor="task-status">狀態</label>
            <select
              id="task-status"
              className="modal__select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
            >
              {STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label" htmlFor="task-assignee">負責人</label>
              <select
                id="task-assignee"
                className="modal__select"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Unassigned</option>
                {USERS.map((u) => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="modal__field">
              <label className="modal__label" htmlFor="task-due">截止日期</label>
              <input
                id="task-due"
                className="modal__input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="modal__reporter">
            <span className="modal__reporter-label">Reporter：</span>
            <span className="modal__reporter-value">{currentUser.name}</span>
          </div>
          <div className="modal__footer">
            <button type="button" className="modal__btn modal__btn--cancel" onClick={onClose}>取消</button>
            <button type="submit" className="modal__btn modal__btn--confirm" disabled={!title.trim()}>建立</button>
          </div>
        </form>
      </div>
    </div>
  );
}
