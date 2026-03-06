import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { mockTickets } from '../data/mockTickets';
import { mockSprints } from '../data/mockSprints';
import type { Ticket, TicketStatus, TicketLabel } from '../types/ticket';
import { LABEL_COLORS } from '../types/ticket';
import type { Sprint, SprintStatus } from '../types/sprint';
import { useCurrentUser } from '../context/UserContext';
import './Backlog.css';

/* ─── Constants ─── */

const STATUS_COLORS: Record<TicketStatus, string> = {
  planned:     '#8b5cf6',
  in_progress: '#3b82f6',
  blocked:     '#ef4444',
  in_review:   '#f59e0b',
  done:        '#10b981',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  planned:     'Planned',
  in_progress: 'In Progress',
  blocked:     'Blocked',
  in_review:   'In Review',
  done:        'Done',
};

/* ─── Small sub-components ─── */

function IssueTypeIcon({ labels }: { labels?: TicketLabel[] }) {
  const first = labels?.[0];
  const MAP: Partial<Record<TicketLabel, { char: string; bg: string }>> = {
    Bug:         { char: 'B', bg: '#ef4444' },
    Story:       { char: 'S', bg: '#10b981' },
    Epic:        { char: 'E', bg: '#6366f1' },
    Feature:     { char: 'F', bg: '#3b82f6' },
    Improvement: { char: 'I', bg: '#06b6d4' },
  };
  const icon = (first && MAP[first]) ?? { char: 'T', bg: '#64748b' };
  return (
    <span className="bl-row__type" style={{ background: icon.bg }} title={first ?? 'Task'}>
      {icon.char}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return <span className="bl-row__avatar" title={name}>{name.charAt(0).toUpperCase()}</span>;
}

/* ─── Ticket row ─── */

interface TicketRowProps {
  ticket: Ticket;
  onClick: () => void;
}

function TicketRow({ ticket, onClick }: TicketRowProps) {
  const statusColor = STATUS_COLORS[ticket.status];
  const assignees = ticket.assignees ?? (ticket.assignee ? [ticket.assignee] : []);
  return (
    <div className="bl-row" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <span className="bl-row__drag" aria-hidden>⠿</span>
      <IssueTypeIcon labels={ticket.labels} />
      <span className="bl-row__id">{ticket.id}</span>
      <span className="bl-row__title">{ticket.title}</span>
      <span className="bl-row__labels">
        {(ticket.labels ?? []).slice(0, 2).map((l) => (
          <span key={l} className="bl-row__label" style={{ background: LABEL_COLORS[l].bg, color: LABEL_COLORS[l].text }}>{l}</span>
        ))}
      </span>
      <span
        className="bl-row__status"
        style={{ background: statusColor + '18', color: statusColor, borderColor: statusColor + '55' }}
      >
        {STATUS_LABELS[ticket.status]}
      </span>
      <span className="bl-row__assignees">
        {assignees.length > 0 ? assignees.map((a) => <Avatar key={a} name={a} />) : <span className="bl-row__unassigned">—</span>}
      </span>
      <span className="bl-row__points">{ticket.storyPoints ?? <span style={{ opacity: 0.3 }}>—</span>}</span>
    </div>
  );
}

/* ─── Inline create row ─── */

interface InlineCreateProps {
  onSave: (title: string) => void;
  onCancel: () => void;
}

function InlineCreate({ onSave, onCancel }: InlineCreateProps) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  function handleSave() {
    if (value.trim()) onSave(value.trim());
  }

  return (
    <div className="bl-inline-create">
      <input
        ref={ref}
        className="bl-inline-create__input"
        placeholder="What needs to be done?"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button type="button" className="bl-btn bl-btn--primary" onClick={handleSave} disabled={!value.trim()}>Create</button>
      <button type="button" className="bl-btn bl-btn--ghost" onClick={onCancel}>Cancel</button>
    </div>
  );
}

/* ─── Start Sprint Modal ─── */

interface StartSprintModalProps {
  sprint: Sprint;
  onConfirm: (updates: Pick<Sprint, 'startDate' | 'endDate' | 'goal'>) => void;
  onClose: () => void;
}

function StartSprintModal({ sprint, onConfirm, onClose }: StartSprintModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(twoWeeks);
  const [goal, setGoal] = useState(sprint.goal ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="bl-overlay" onMouseDown={onClose}>
      <div className="bl-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="bl-modal__header">
          <h2 className="bl-modal__title">Start {sprint.name}</h2>
          <button type="button" className="bl-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="bl-modal__body">
          <div className="bl-modal__field">
            <label className="bl-modal__label">Sprint goal</label>
            <input className="bl-modal__input" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What's the goal of this sprint?" />
          </div>
          <div className="bl-modal__row">
            <div className="bl-modal__field">
              <label className="bl-modal__label">Start date</label>
              <input className="bl-modal__input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="bl-modal__field">
              <label className="bl-modal__label">End date</label>
              <input className="bl-modal__input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="bl-modal__footer">
          <button type="button" className="bl-btn bl-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="bl-btn bl-btn--primary"
            onClick={() => onConfirm({ startDate: fmt(startDate), endDate: fmt(endDate), goal: goal || undefined })}
          >
            Start Sprint
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sprint section ─── */

interface SprintSectionProps {
  sprint: Sprint;
  tickets: Ticket[];
  isCollapsed: boolean;
  onToggle: () => void;
  onStartSprint: () => void;
  onCompleteSprint: () => void;
  onCreateIssue: () => void;
  onTicketClick: (id: string) => void;
  isCreating: boolean;
  onSaveIssue: (title: string) => void;
  onCancelCreate: () => void;
}

const SPRINT_STATUS_META: Record<SprintStatus, { label: string; cls: string }> = {
  active:    { label: 'ACTIVE',    cls: 'bl-sprint__badge--active' },
  future:    { label: 'UPCOMING',  cls: 'bl-sprint__badge--future' },
  completed: { label: 'COMPLETED', cls: 'bl-sprint__badge--completed' },
};

function SprintSection({
  sprint, tickets, isCollapsed, onToggle,
  onStartSprint, onCompleteSprint, onCreateIssue, onTicketClick,
  isCreating, onSaveIssue, onCancelCreate,
}: SprintSectionProps) {
  const totalPts = tickets.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  const donePts  = tickets.filter((t) => t.status === 'done').reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  const progress = totalPts > 0 ? Math.round((donePts / totalPts) * 100) : 0;
  const meta = SPRINT_STATUS_META[sprint.status];

  return (
    <section className="bl-sprint">
      <div className="bl-sprint__header" onClick={onToggle}>
        <span className={`bl-sprint__chevron ${isCollapsed ? '' : 'bl-sprint__chevron--open'}`}>▶</span>
        <span className="bl-sprint__name">{sprint.name}</span>
        <span className={`bl-sprint__badge ${meta.cls}`}>{meta.label}</span>
        <span className="bl-sprint__dates">{sprint.startDate} – {sprint.endDate}</span>
        <span className="bl-sprint__count">{tickets.length} issue{tickets.length !== 1 ? 's' : ''}</span>
        <span className="bl-sprint__pts">{totalPts} pts</span>
        {totalPts > 0 && (
          <span className="bl-sprint__progress-wrap" onClick={(e) => e.stopPropagation()}>
            <span className="bl-sprint__progress-bar">
              <span className="bl-sprint__progress-fill" style={{ width: `${progress}%` }} />
            </span>
            <span className="bl-sprint__progress-label">{progress}%</span>
          </span>
        )}
        <div className="bl-sprint__actions" onClick={(e) => e.stopPropagation()}>
          {sprint.status === 'future' && (
            <button type="button" className="bl-btn bl-btn--primary bl-btn--sm" onClick={onStartSprint}>Start Sprint</button>
          )}
          {sprint.status === 'active' && (
            <button type="button" className="bl-btn bl-btn--outline bl-btn--sm" onClick={onCompleteSprint}>Complete Sprint</button>
          )}
        </div>
      </div>

      {sprint.goal && !isCollapsed && (
        <p className="bl-sprint__goal">Sprint Goal: {sprint.goal}</p>
      )}

      {!isCollapsed && (
        <div className="bl-sprint__body">
          {tickets.length === 0 && !isCreating && (
            <p className="bl-sprint__empty">Plan your sprint. Drag issues here or create new ones.</p>
          )}
          {tickets.map((t) => <TicketRow key={t.id} ticket={t} onClick={() => onTicketClick(t.id)} />)}
          {isCreating
            ? <InlineCreate onSave={onSaveIssue} onCancel={onCancelCreate} />
            : <button type="button" className="bl-create-btn" onClick={onCreateIssue}>+ Create issue</button>
          }
        </div>
      )}
    </section>
  );
}

/* ─── Backlog section ─── */

interface BacklogSectionProps {
  tickets: Ticket[];
  isCollapsed: boolean;
  onToggle: () => void;
  onTicketClick: (id: string) => void;
  isCreating: boolean;
  onCreateIssue: () => void;
  onSaveIssue: (title: string) => void;
  onCancelCreate: () => void;
}

function BacklogSection({ tickets, isCollapsed, onToggle, onTicketClick, isCreating, onCreateIssue, onSaveIssue, onCancelCreate }: BacklogSectionProps) {
  const totalPts = tickets.reduce((s, t) => s + (t.storyPoints ?? 0), 0);
  return (
    <section className="bl-sprint bl-sprint--backlog">
      <div className="bl-sprint__header" onClick={onToggle}>
        <span className={`bl-sprint__chevron ${isCollapsed ? '' : 'bl-sprint__chevron--open'}`}>▶</span>
        <span className="bl-sprint__name">Backlog</span>
        <span className="bl-sprint__count">{tickets.length} issue{tickets.length !== 1 ? 's' : ''}</span>
        <span className="bl-sprint__pts">{totalPts} pts</span>
      </div>
      {!isCollapsed && (
        <div className="bl-sprint__body">
          {tickets.length === 0 && !isCreating && (
            <p className="bl-sprint__empty">Your backlog is empty.</p>
          )}
          {tickets.map((t) => <TicketRow key={t.id} ticket={t} onClick={() => onTicketClick(t.id)} />)}
          {isCreating
            ? <InlineCreate onSave={onSaveIssue} onCancel={onCancelCreate} />
            : <button type="button" className="bl-create-btn" onClick={onCreateIssue}>+ Create issue</button>
          }
        </div>
      )}
    </section>
  );
}

/* ─── Main Backlog page ─── */

export function Backlog() {
  const { currentUser } = useCurrentUser();
  const [tickets, setTickets] = useState<Ticket[]>(() => mockTickets);
  const [sprints, setSprints] = useState<Sprint[]>(() => mockSprints);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['completed']));
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [startingSprintId, setStartingSprintId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedTicketId = searchParams.get('ticket');
  const selectedTicket = useMemo(() => tickets.find((t) => t.id === selectedTicketId) ?? null, [tickets, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const q = search.toLowerCase();
    return q ? tickets.filter((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) : tickets;
  }, [tickets, search]);

  const ticketsBySprintId = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    for (const t of filteredTickets) {
      const key = t.sprintId ?? 'backlog';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [filteredTickets]);

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openTicket(id: string) { setSearchParams({ ticket: id }); }
  function closeTicket() { setSearchParams({}); }

  const handleTicketUpdate = useCallback((updated: Ticket) => {
    setTickets((prev) => prev.map((t) =>
      t.id === updated.id ? { ...updated, subtaskIds: t.subtaskIds } : t
    ));
  }, []);

  const handleCreateSubtask = useCallback((parentId: string, title: string) => {
    setTickets((prev) => {
      const nums = prev.map((t) => parseInt(t.id.replace(/\D/g, ''), 10)).filter(Boolean);
      const newId = `SCRUM-${nums.length > 0 ? Math.max(...nums) + 1 : 1}`;
      const parent = prev.find((t) => t.id === parentId);
      const subtask: Ticket = { id: newId, title, status: 'planned', parentId, sprintId: parent?.sprintId };
      return [
        ...prev.map((t) => t.id === parentId ? { ...t, subtaskIds: [...(t.subtaskIds ?? []), newId] } : t),
        subtask,
      ];
    });
  }, []);

  function handleCreateIssue(sprintId: string | null, title: string) {
    const nums = tickets.map((t) => parseInt(t.id.replace(/\D/g, ''), 10)).filter(Boolean);
    const newId = `SCRUM-${nums.length > 0 ? Math.max(...nums) + 1 : 1}`;
    const newTicket: Ticket = {
      id: newId,
      title,
      status: 'planned',
      reporter: currentUser.name,
      sprintId: sprintId ?? undefined,
    };
    setTickets((prev) => [...prev, newTicket]);
    setCreatingIn(null);
  }

  function handleStartSprint(sprintId: string, updates: Pick<Sprint, 'startDate' | 'endDate' | 'goal'>) {
    setSprints((prev) => prev.map((s) => s.id === sprintId ? { ...s, ...updates, status: 'active' } : s));
    setStartingSprintId(null);
  }

  function handleCompleteSprint(sprintId: string) {
    if (!confirm('Complete this sprint? Incomplete issues will move to the backlog.')) return;
    setSprints((prev) => prev.map((s) => s.id === sprintId ? { ...s, status: 'completed' } : s));
    setTickets((prev) => prev.map((t) =>
      t.sprintId === sprintId && t.status !== 'done' ? { ...t, sprintId: undefined } : t
    ));
  }

  function handleCreateSprint() {
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: `Sprint ${sprints.length + 1}`,
      startDate: '',
      endDate: '',
      status: 'future',
    };
    setSprints((prev) => [...prev, newSprint]);
  }

  const sortedSprints = useMemo(() => [
    ...sprints.filter((s) => s.status === 'active'),
    ...sprints.filter((s) => s.status === 'future'),
    ...sprints.filter((s) => s.status === 'completed'),
  ], [sprints]);

  const startingSprint = startingSprintId ? sprints.find((s) => s.id === startingSprintId) ?? null : null;

  return (
    <div className="backlog-page">
      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          allTickets={tickets}
          sprints={sprints}
          onUpdate={handleTicketUpdate}
          onCreateSubtask={handleCreateSubtask}
          onOpenTicket={(id) => window.open(`/backlog?ticket=${id}`, '_blank')}
          onClose={closeTicket}
        />
      )}

      {/* Start Sprint Modal */}
      {startingSprint && (
        <StartSprintModal
          sprint={startingSprint}
          onConfirm={(updates) => handleStartSprint(startingSprint.id, updates)}
          onClose={() => setStartingSprintId(null)}
        />
      )}

      {/* Toolbar */}
      <div className="bl-toolbar">
        <input
          type="search"
          className="bl-toolbar__search"
          placeholder="Search backlog"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="bl-btn bl-btn--outline">Filter</button>
        <button type="button" className="bl-btn bl-btn--outline">Epic</button>
        <div style={{ marginLeft: 'auto' }}>
          <button type="button" className="bl-btn bl-btn--primary" onClick={handleCreateSprint}>
            + Create Sprint
          </button>
        </div>
      </div>

      {/* Sprint sections */}
      {sortedSprints.map((sprint) => (
        <SprintSection
          key={sprint.id}
          sprint={sprint}
          tickets={ticketsBySprintId[sprint.id] ?? []}
          isCollapsed={collapsed.has(sprint.id)}
          onToggle={() => toggleCollapse(sprint.id)}
          onStartSprint={() => setStartingSprintId(sprint.id)}
          onCompleteSprint={() => handleCompleteSprint(sprint.id)}
          onCreateIssue={() => setCreatingIn(sprint.id)}
          onTicketClick={(id) => openTicket(id)}
          isCreating={creatingIn === sprint.id}
          onSaveIssue={(title) => handleCreateIssue(sprint.id, title)}
          onCancelCreate={() => setCreatingIn(null)}
        />
      ))}

      {/* Backlog section */}
      <BacklogSection
        tickets={ticketsBySprintId['backlog'] ?? []}
        isCollapsed={collapsed.has('backlog')}
        onToggle={() => toggleCollapse('backlog')}
        onTicketClick={(id) => openTicket(id)}
        isCreating={creatingIn === 'backlog'}
        onCreateIssue={() => setCreatingIn('backlog')}
        onSaveIssue={(title) => handleCreateIssue(null, title)}
        onCancelCreate={() => setCreatingIn(null)}
      />
    </div>
  );
}
