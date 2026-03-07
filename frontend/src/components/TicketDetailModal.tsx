import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Ticket, TicketStatus, TicketLabel, TicketPriority, IssueType, Comment } from '../types/ticket';
import { ALL_LABELS, LABEL_COLORS, ALL_PRIORITIES, PRIORITY_META, ISSUE_TYPE_META } from '../types/ticket';
import type { Sprint } from '../types/sprint';
import { USERS } from '../context/UserContext';

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'planned',     label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked',     label: 'Blocked' },
  { value: 'in_review',   label: 'In Review' },
  { value: 'done',        label: 'Done' },
];

const STATUS_COLORS: Record<TicketStatus, string> = {
  planned:     '#8b5cf6',
  in_progress: '#3b82f6',
  blocked:     '#ef4444',
  in_review:   '#f59e0b',
  done:        '#10b981',
};

function IssueTypeIcon({ type }: { type?: IssueType }) {
  const meta = ISSUE_TYPE_META[type ?? 'task'];
  return (
    <span className="breadcrumb__type-icon" style={{ background: meta.color }}>
      {meta.icon}
    </span>
  );
}

function buildAncestorChain(ticket: Ticket, allTickets: Ticket[]): Ticket[] {
  const chain: Ticket[] = [];
  let current: Ticket | undefined = ticket;
  while (current) {
    chain.unshift(current);
    current = current.parentId ? allTickets.find((t) => t.id === current!.parentId) : undefined;
  }
  return chain;
}

interface TicketDetailModalProps {
  ticket: Ticket;
  allTickets: Ticket[];
  sprints?: Sprint[];
  spaceName: string;
  spaceColor: string;
  onUpdate: (updated: Ticket) => void;
  onCreateSubtask: (parentId: string, title: string) => void;
  onOpenTicket: (id: string) => void;
  onClose: () => void;
}

function toInputDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ticket-detail__row">
      <span className="ticket-detail__row-label">{label}</span>
      <div className="ticket-detail__row-value">{children}</div>
    </div>
  );
}

/* ---- Labels multi-select ---- */
function LabelSelect({ selected, onChange }: { selected: TicketLabel[]; onChange: (v: TicketLabel[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function toggle(label: TicketLabel) {
    onChange(selected.includes(label) ? selected.filter((l) => l !== label) : [...selected, label]);
  }

  return (
    <div className="label-select" ref={ref}>
      <button type="button" className="label-select__trigger" onClick={() => setOpen((o) => !o)}>
        {selected.length === 0 && <span>None</span>}
        {selected.map((l) => (
          <span
            key={l}
            className="label-chip label-chip--removable"
            style={{ background: LABEL_COLORS[l].bg, color: LABEL_COLORS[l].text }}
          >
            {l}
            <button
              type="button"
              className="label-chip__remove"
              style={{ color: LABEL_COLORS[l].text }}
              onMouseDown={(e) => { e.stopPropagation(); toggle(l); }}
              aria-label={`Remove ${l}`}
            >✕</button>
          </span>
        ))}
      </button>
      {open && (
        <div className="label-select__dropdown">
          {ALL_LABELS.map((label) => {
            const isSelected = selected.includes(label);
            return (
              <button
                key={label}
                type="button"
                className={`label-select__option ${isSelected ? 'label-select__option--selected' : ''}`}
                onClick={() => toggle(label)}
              >
                <span className="label-select__check">{isSelected ? '✓' : ''}</span>
                <span
                  className="label-chip"
                  style={{ background: LABEL_COLORS[label].bg, color: LABEL_COLORS[label].text }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Main component ---- */
export function TicketDetailModal({
  ticket,
  allTickets,
  sprints,
  spaceName,
  spaceColor,
  onUpdate,
  onCreateSubtask,
  onOpenTicket,
  onClose,
}: TicketDetailModalProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Ticket>({ ...ticket });
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (addingSubtask) subtaskInputRef.current?.focus();
  }, [addingSubtask]);

  function handleClose() {
    onUpdate(draft);
    onClose();
  }

  function patch<K extends keyof Ticket>(key: K, value: Ticket[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddComment() {
    if (!commentText.trim()) return;
    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: 'You',
      content: commentText.trim(),
      createdAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    patch('comments', [...(draft.comments ?? []), comment]);
    setCommentText('');
  }

  function handleCreateSubtask() {
    if (!subtaskTitle.trim()) return;
    onCreateSubtask(draft.id, subtaskTitle.trim());
    setSubtaskTitle('');
    setAddingSubtask(false);
  }

  const statusColor = STATUS_COLORS[draft.status];
  const subtasks = allTickets.filter((t) => t.parentId === draft.id);
  const parentTicket = draft.parentId ? allTickets.find((t) => t.id === draft.parentId) : null;
  const breadcrumb = buildAncestorChain(ticket, allTickets);

  return (
    <div
      className="ticket-detail-overlay"
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div className="ticket-detail-modal">
        {/* Breadcrumb */}
        <nav className="td-breadcrumb td-breadcrumb--modal" aria-label="Breadcrumb">
          <button
            type="button"
            className="td-breadcrumb__item td-breadcrumb__item--link"
            onClick={() => { handleClose(); navigate('/spaces'); }}
          >Spaces</button>
          <span className="td-breadcrumb__sep">/</span>
          <button
            type="button"
            className="td-breadcrumb__item td-breadcrumb__item--link"
            onClick={() => { handleClose(); navigate('/board'); }}
          >
            <span className="td-breadcrumb__space-dot" style={{ background: spaceColor }} />
            {spaceName}
          </button>
          {breadcrumb.map((item, i) => {
            const isLast = i === breadcrumb.length - 1;
            return (
              <span key={item.id} className="td-breadcrumb__segment">
                <span className="td-breadcrumb__sep">/</span>
                {isLast ? (
                  <span className="td-breadcrumb__item td-breadcrumb__item--current">
                    <IssueTypeIcon type={item.issueType} />
                    {item.id}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="td-breadcrumb__item td-breadcrumb__item--link"
                    onClick={() => { handleClose(); onOpenTicket(item.id); }}
                  >
                    <IssueTypeIcon type={item.issueType} />
                    {item.id}
                  </button>
                )}
              </span>
            );
          })}
        </nav>

        {/* Header */}
        <div className="ticket-detail__header">
          <div className="ticket-detail__header-left">
            <span className="ticket-detail__id">{draft.id}</span>
            <span
              className="ticket-detail__status-badge"
              style={{ background: statusColor + '22', color: statusColor, borderColor: statusColor + '55' }}
            >
              {STATUS_OPTIONS.find((s) => s.value === draft.status)?.label}
            </span>
          </div>
          <button type="button" className="ticket-detail__close" aria-label="Close" onClick={handleClose}>✕</button>
        </div>

        {/* Body */}
        <div className="ticket-detail__body">
          {/* Left panel */}
          <div className="ticket-detail__left">
            {/* Title */}
            <div className="ticket-detail__title-wrap">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  className="ticket-detail__title-input"
                  value={draft.title}
                  onChange={(e) => patch('title', e.target.value)}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(false); }}
                />
              ) : (
                <h1 className="ticket-detail__title" onClick={() => setEditingTitle(true)} title="Click to edit">
                  {draft.title || <span className="ticket-detail__placeholder">Add title…</span>}
                </h1>
              )}
            </div>

            {/* Description */}
            <div className="ticket-detail__section">
              <h3 className="ticket-detail__section-title">Description</h3>
              {editingDesc ? (
                <div className="ticket-detail__desc-editor">
                  <textarea
                    className="ticket-detail__desc-textarea"
                    value={draft.description ?? ''}
                    onChange={(e) => patch('description', e.target.value)}
                    placeholder="Add a description…"
                    rows={6}
                    autoFocus
                  />
                  <div className="ticket-detail__desc-actions">
                    <button type="button" className="ticket-detail__btn ticket-detail__btn--primary" onClick={() => setEditingDesc(false)}>Save</button>
                    <button type="button" className="ticket-detail__btn ticket-detail__btn--ghost" onClick={() => setEditingDesc(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  className={`ticket-detail__desc-view ${!draft.description ? 'ticket-detail__desc-view--empty' : ''}`}
                  onClick={() => setEditingDesc(true)}
                >
                  {draft.description || 'Add a description…'}
                </div>
              )}
            </div>

            {/* Subtasks / Child Issues */}
            <div className="ticket-detail__section">
              <h3 className="ticket-detail__section-title">Child Issues</h3>
              <div className="ticket-detail__subtasks">
                {subtasks.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className="ticket-detail__subtask-item"
                    onClick={() => { handleClose(); onOpenTicket(sub.id); }}
                  >
                    <span
                      className="ticket-detail__subtask-status"
                      style={{ background: STATUS_COLORS[sub.status] }}
                      title={sub.status}
                    />
                    <span className="ticket-detail__subtask-id">{sub.id}</span>
                    <span className="ticket-detail__subtask-title">{sub.title}</span>
                  </button>
                ))}

                {addingSubtask ? (
                  <div className="ticket-detail__subtask-create">
                    <input
                      ref={subtaskInputRef}
                      className="ticket-detail__subtask-input"
                      placeholder="Subtask title…"
                      value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSubtask();
                        if (e.key === 'Escape') { setAddingSubtask(false); setSubtaskTitle(''); }
                      }}
                    />
                    <div className="ticket-detail__subtask-actions">
                      <button type="button" className="ticket-detail__btn ticket-detail__btn--primary" onClick={handleCreateSubtask} disabled={!subtaskTitle.trim()}>Create</button>
                      <button type="button" className="ticket-detail__btn ticket-detail__btn--ghost" onClick={() => { setAddingSubtask(false); setSubtaskTitle(''); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="ticket-detail__add-subtask" onClick={() => setAddingSubtask(true)}>
                    + Create child issue
                  </button>
                )}
              </div>
            </div>

            {/* Activity / Comments */}
            <div className="ticket-detail__section">
              <h3 className="ticket-detail__section-title">Activity</h3>
              <div className="ticket-detail__comment-input-wrap">
                <div className="ticket-detail__avatar ticket-detail__avatar--you">Y</div>
                <textarea
                  className="ticket-detail__comment-input"
                  placeholder="Add a comment…"
                  value={commentText}
                  rows={commentText ? 3 : 1}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment(); }}
                />
              </div>
              {commentText.trim() && (
                <div className="ticket-detail__comment-submit">
                  <button type="button" className="ticket-detail__btn ticket-detail__btn--primary" onClick={handleAddComment}>Save</button>
                  <button type="button" className="ticket-detail__btn ticket-detail__btn--ghost" onClick={() => setCommentText('')}>Cancel</button>
                </div>
              )}
              <div className="ticket-detail__comments">
                {(draft.comments ?? []).length === 0 && (
                  <p className="ticket-detail__no-comments">No comments yet.</p>
                )}
                {(draft.comments ?? []).map((c) => (
                  <div key={c.id} className="ticket-detail__comment">
                    <div className="ticket-detail__avatar">{c.author.charAt(0).toUpperCase()}</div>
                    <div className="ticket-detail__comment-body">
                      <div className="ticket-detail__comment-meta">
                        <span className="ticket-detail__comment-author">{c.author}</span>
                        <span className="ticket-detail__comment-time">{c.createdAt}</span>
                      </div>
                      <p className="ticket-detail__comment-text">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <aside className="ticket-detail__right">
            <h3 className="ticket-detail__section-title">Details</h3>

            <DetailRow label="Priority">
              <select
                className="ticket-detail__select ticket-detail__priority-select"
                value={draft.priority ?? ''}
                onChange={(e) => patch('priority', (e.target.value as TicketPriority) || undefined)}
                style={draft.priority ? { color: PRIORITY_META[draft.priority].color, fontWeight: 600 } : {}}
              >
                <option value="">No priority</option>
                {ALL_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].icon} {PRIORITY_META[p].label}
                  </option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Status">
              <select
                className="ticket-detail__select"
                value={draft.status}
                onChange={(e) => patch('status', e.target.value as TicketStatus)}
                style={{ color: statusColor, fontWeight: 600 }}
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Assignee">
              <select
                className="ticket-detail__select"
                value={draft.assignee ?? ''}
                onChange={(e) => patch('assignee', e.target.value || undefined)}
              >
                <option value="">Unassigned</option>
                {USERS.map((u) => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Reporter">
              <select
                className="ticket-detail__select"
                value={draft.reporter ?? ''}
                onChange={(e) => patch('reporter', e.target.value || undefined)}
              >
                <option value="">None</option>
                {USERS.map((u) => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </DetailRow>

            {parentTicket && (
              <DetailRow label="Parent">
                <button
                  type="button"
                  className="ticket-detail__parent-link"
                  onClick={() => { handleClose(); onOpenTicket(parentTicket.id); }}
                  title={parentTicket.title}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{parentTicket.id}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{parentTicket.title}</span>
                </button>
              </DetailRow>
            )}

            <DetailRow label="Labels">
              <LabelSelect
                selected={draft.labels ?? []}
                onChange={(v) => patch('labels', v.length ? v : undefined)}
              />
            </DetailRow>

            <DetailRow label="Sprint">
              {sprints ? (
                <select
                  className="ticket-detail__select"
                  value={draft.sprintId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value || undefined;
                    const name = sprints.find((s) => s.id === id)?.name;
                    setDraft((prev) => ({ ...prev, sprintId: id, sprint: name }));
                  }}
                >
                  <option value="">No sprint</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="ticket-detail__input"
                  type="text"
                  placeholder="No sprint"
                  value={draft.sprint ?? ''}
                  onChange={(e) => patch('sprint', e.target.value || undefined)}
                />
              )}
            </DetailRow>

            <DetailRow label="Story Points">
              <input
                className="ticket-detail__input"
                type="number"
                placeholder="—"
                min={0}
                value={draft.storyPoints ?? ''}
                onChange={(e) => patch('storyPoints', e.target.value ? Number(e.target.value) : undefined)}
              />
            </DetailRow>

            <DetailRow label="Start Date">
              <input
                className="ticket-detail__input"
                type="date"
                value={toInputDate(draft.startDate)}
                onChange={(e) => patch('startDate', e.target.value ? formatDisplayDate(e.target.value) : undefined)}
              />
            </DetailRow>

            <DetailRow label="Due Date">
              <input
                className="ticket-detail__input"
                type="date"
                value={toInputDate(draft.dueDate)}
                onChange={(e) => patch('dueDate', e.target.value ? formatDisplayDate(e.target.value) : undefined)}
              />
            </DetailRow>
          </aside>
        </div>
      </div>
    </div>
  );
}
