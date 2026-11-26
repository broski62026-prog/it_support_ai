import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Ticket,
  UserCircle,
  Users,
  UserPlus,
  AlertCircle,
  AlertTriangle,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import {
  assignAdminTicket,
  createAdminUser,
  getAdminUsers,
  getAdminTicket,
  getAdminTicketSummary,
  getAdminTickets,
  getConversation,
  getConversations,
  getCurrentUser,
  getMyTicket,
  getMyTickets,
  getRoleAccess,
  loginUser,
  logoutUser,
  registerUser,
  sendChatMessage,
  submitChatFeedback,
  updateAdminTicket,
  updateAdminUserStatus,
} from "./api";

import "./App.css";

function LoginPage({ onLogin }) {
  const [registering, setRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin({ username, email, password, registering });
      if (registering) {
        setRegistering(false);
        setUsername("");
        setEmail("");
        setPassword("");
        setSuccess("Account created successfully. Please log in with your credentials.");
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="brand-icon"><Bot size={25} /></div>
        <span>IT Support AI</span>
      </div>
      <div className="login-card">
        <div className="login-icon"><LockKeyhole size={24} /></div>
        <h1>{registering ? "Create your account" : "Welcome back"}</h1>
        <p className="login-subtitle">
          {registering ? "Register for your IT Support workspace" : "Sign in to your IT Support account"}
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            minLength={registering ? 3 : undefined}
            required
          />
          {registering && (
            <>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </>
          )}
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder={registering ? "At least 8 characters" : "Enter your password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={registering ? "new-password" : "current-password"}
            minLength={registering ? 8 : undefined}
            required
          />
          {success && <div className="login-success" role="status">{success}</div>}
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? <><LoaderCircle size={18} className="spin" /> Please wait...</> : <>
              {registering ? "Create account" : "Sign in"} <ArrowRight size={18} />
            </>}
          </button>
        </form>
        <button className="text-button auth-switch" onClick={() => {
          setRegistering((value) => !value);
          setError("");
          setSuccess("");
        }}>
          {registering ? "Already registered? Sign in" : "New here? Create an employee account"}
        </button>
        <div className="login-footer"><ShieldCheck size={16} /> Secure access to your support workspace</div>
      </div>
      <div className="login-bottom">IT Support AI Agent</div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({ status }) {
  const label = (status || "unknown").replace(/_/g, " ");
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

function PriorityBadge({ priority }) {
  return <span className={`priority-badge priority-${priority}`}><span className="priority-dot" />{priority || "Unknown"}</span>;
}

function RequestError({ error, onRetry }) {
  if (!error) return null;
  return <div className="dashboard-error"><AlertTriangle size={18} /><span>{error}</span>{onRetry && <button onClick={onRetry}>Retry</button>}</div>;
}

function AdminDashboard({ onOpenTickets, onOpenUsers }) {
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(refresh = false) {
    if (refresh) setRefreshing(true);
    try {
      const [summaryData, ticketData, userData] = await Promise.all([
        getAdminTicketSummary(),
        getAdminTickets({ limit: 5 }),
        getAdminUsers(),
      ]);
      setSummary(summaryData);
      setTickets(ticketData);
      setUsers(userData);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([getAdminTicketSummary(), getAdminTickets({ limit: 5 }), getAdminUsers()])
      .then(([summaryData, ticketData, userData]) => {
        if (!active) return;
        setSummary(summaryData);
        setTickets(ticketData);
        setUsers(userData);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Failed to load dashboard data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const stats = summary ? [
    { label: "Total Tickets", value: summary.total_tickets, icon: Ticket, color: "blue" },
    { label: "Open Tickets", value: summary.open_tickets, icon: Clock, color: "orange" },
    { label: "In Progress", value: summary.in_progress_tickets, icon: AlertCircle, color: "purple" },
    { label: "Resolved", value: summary.resolved_tickets, icon: CheckCircle2, color: "green" },
    { label: "Closed", value: summary.closed_tickets, icon: CheckCircle2, color: "green" },
    { label: "Employees", value: users.filter((item) => item.role === "employee").length, icon: Users, color: "blue" },
  ] : [];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-heading-row">
        <div><h1>Dashboard Overview</h1><p>Monitor IT support activity and ticket status.</p></div>
        <button className="refresh-button" onClick={() => loadDashboard(true)} disabled={loading || refreshing}>
          <RefreshCw size={16} className={refreshing ? "spin" : ""} />{refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <RequestError error={error} onRetry={() => loadDashboard(true)} />
      {loading ? <div className="dashboard-loading"><LoaderCircle size={26} className="spin" /><p>Loading dashboard data...</p></div> : summary && <>
        <div className="stats-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return <div className="stat-card" key={stat.label}>
              <div className={`stat-icon stat-${stat.color}`}><Icon size={21} /></div>
              <div className="stat-info"><span>{stat.label}</span><strong>{Number(stat.value || 0).toLocaleString()}</strong></div>
            </div>;
          })}
        </div>
        <div className="dashboard-content-grid">
          <section className="dashboard-panel recent-tickets-panel">
            <div className="panel-heading panel-heading-action">
              <div><h2>Recent Tickets</h2><p>Latest support requests</p></div>
              <button className="text-button" onClick={onOpenTickets}>View all</button>
            </div>
            {tickets.length === 0 ? <div className="empty-tickets"><Ticket size={30} /><h3>No tickets found</h3><p>Tickets will appear here when employees submit them.</p></div> :
              <div className="tickets-table-wrapper"><table className="tickets-table">
                <thead><tr><th>Ticket</th><th>Employee</th><th>Issue</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>{tickets.map((ticket) => <tr key={ticket.id} onClick={onOpenTickets} className="clickable-row">
                  <td className="ticket-id">#{ticket.id}</td>
                  <td>{ticket.employee_name}</td>
                  <td className="ticket-issue"><strong>{ticket.issue_description}</strong>{ticket.category && <span>{ticket.category}</span>}</td>
                  <td><PriorityBadge priority={ticket.priority} /></td><td><StatusBadge status={ticket.status} /></td>
                  <td className="ticket-date">{formatDate(ticket.created_at)}</td>
                </tr>)}</tbody>
              </table></div>}
          </section>
          <section className="dashboard-panel employee-overview-panel">
            <div className="panel-heading panel-heading-action">
              <div><h2>Employees</h2><p>{users.filter((item) => item.role === "employee").length} employee accounts</p></div>
              <button className="text-button" onClick={onOpenUsers}>Manage users</button>
            </div>
            {users.filter((item) => item.role === "employee").length === 0 ?
              <div className="empty-tickets"><Users size={28} /><h3>No employees yet</h3><p>Employee accounts will appear here after registration.</p></div> :
              <ul className="employee-name-list">{users.filter((item) => item.role === "employee").slice(0, 6).map((employee) =>
                <li key={employee.id}><span className="employee-list-avatar">{employee.username.charAt(0).toUpperCase()}</span><strong>{employee.username}</strong></li>
              )}</ul>}
          </section>
          <section className="dashboard-panel priority-panel">
            <div className="panel-heading"><div><h2>Priority Overview</h2><p>Tickets by priority level</p></div></div>
            <div className="priority-overview">{[
              { label: "High Priority", value: summary.high_priority, color: "high" },
              { label: "Medium Priority", value: summary.medium_priority, color: "medium" },
              { label: "Low Priority", value: summary.low_priority, color: "low" },
            ].map((item) => <div className="priority-overview-item" key={item.color}>
              <div className="priority-overview-top"><span className={`priority-label priority-${item.color}`}>{item.label}</span><strong>{item.value || 0}</strong></div>
              <div className="priority-progress-track"><div className={`priority-progress-fill fill-${item.color}`} style={{ width: summary.total_tickets ? `${(item.value / summary.total_tickets) * 100}%` : "0%" }} /></div>
            </div>)}</div>
            <div className="priority-total"><span>Total tickets</span><strong>{summary.total_tickets}</strong></div>
          </section>
        </div>
        <div className="dashboard-footer-note"><ShieldCheck size={16} />Dashboard statistics are loaded from your live support database.</div>
      </>}
    </div>
  );
}

function ChatWorkspace() {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadConversations() {
    try {
      setConversations(await getConversations());
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load conversation history");
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    let active = true;
    getConversations()
      .then((data) => { if (active) setConversations(data); })
      .catch((requestError) => { if (active) setError(requestError.message || "Could not load conversation history"); })
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, []);

  async function openConversation(id) {
    setError("");
    setNotice("");
    try {
      const conversation = await getConversation(id);
      setConversationId(conversation.id);
      setMessages(conversation.messages);
    } catch (requestError) {
      setError(requestError.message || "Could not load conversation");
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    const message = draft.trim();
    if (message.length < 2 || sending) return;
    setSending(true);
    setError("");
    setNotice("");
    setMessages((items) => [...items, { sender: "user", content: message, created_at: new Date().toISOString() }]);
    setDraft("");
    try {
      const result = await sendChatMessage(message, conversationId);
      setConversationId(result.conversation_id);
      setMessages((items) => [...items, {
        sender: "assistant",
        content: result.reply,
        created_at: new Date().toISOString(),
        source: result.source,
      }]);
      await loadConversations();
    } catch (requestError) {
      setError(requestError.message || "Could not send your message");
    } finally {
      setSending(false);
    }
  }

  async function handleFeedback(resolved) {
    if (!conversationId || feedbackPending) return;
    setFeedbackPending(true);
    setError("");
    try {
      const result = await submitChatFeedback(conversationId, resolved);
      setNotice(result.message);
      await loadConversations();
    } catch (requestError) {
      setError(requestError.message || "Could not submit feedback");
    } finally {
      setFeedbackPending(false);
    }
  }

  const lastMessage = messages[messages.length - 1];
  const canGiveFeedback = lastMessage?.sender === "assistant" && Boolean(conversationId) && !notice;

  return <section className="workspace-card chat-workspace">
    <div className="workspace-heading"><div><h1>AI Support</h1><p>Describe your IT issue and get troubleshooting help.</p></div>
      <button className="refresh-button" onClick={() => { setConversationId(null); setMessages([]); setNotice(""); setError(""); }}>New chat</button>
    </div>
    <div className="chat-layout">
      <aside className="conversation-sidebar">
        <div className="conversation-list-heading"><strong>Conversation history</strong><button className="icon-text-button" onClick={loadConversations} aria-label="Refresh conversations"><RefreshCw size={15} /></button></div>
        {loadingHistory ? <p className="muted-message">Loading history...</p> : conversations.length === 0 ?
          <p className="muted-message">No conversations yet.</p> :
          conversations.map((item) => <button key={item.id} className={`conversation-item ${conversationId === item.id ? "selected" : ""}`} onClick={() => openConversation(item.id)}>
            <strong>{item.title}</strong><span>{item.message_count} messages · {formatDate(item.created_at)}</span>
          </button>)}
      </aside>
      <div className="chat-panel">
        <div className="chat-messages">
          {messages.length === 0 ? <div className="chat-empty"><div className="welcome-icon"><Bot size={26} /></div><h2>How can we help?</h2><p>Ask a question about your computer, accounts, network, or workplace technology.</p></div> :
            messages.map((message, index) => <article className={`chat-message message-${message.sender}`} key={`${message.id || message.created_at}-${index}`}>
              <span className="message-author">{message.sender === "assistant" ? "IT Support AI" : "You"}</span>
              <p>{message.content}</p>
              {message.source && <small>Source: {message.source.replace(/_/g, " ")}</small>}
            </article>)}
          {sending && <div className="chat-loading"><LoaderCircle size={17} className="spin" />Finding a solution...</div>}
        </div>
        <RequestError error={error} />
        {notice && <div className="feedback-notice"><CheckCircle2 size={17} />{notice}</div>}
        {canGiveFeedback && <div className="feedback-row"><span>Did this solve your issue?</span>
          <button className="secondary-button" disabled={feedbackPending} onClick={() => handleFeedback(true)}><ThumbsUp size={15} />Yes, resolved</button>
          <button className="secondary-button" disabled={feedbackPending} onClick={() => handleFeedback(false)}><ThumbsDown size={15} />No, create a ticket</button>
        </div>}
        <form className="chat-compose" onSubmit={handleSend}>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Describe your IT issue..." maxLength={5000} rows={2} disabled={sending} />
          <button className="primary-button" type="submit" disabled={sending || draft.trim().length < 2}><Send size={17} />Send</button>
        </form>
        <p className="chat-note">AI responses can be inaccurate. Avoid sharing passwords or sensitive information.</p>
      </div>
    </div>
  </section>;
}

function TicketDetails({ ticket, admin, onClose, onUpdated }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [notes, setNotes] = useState(ticket.resolution_notes || "");
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveChanges() {
    setSaving(true);
    setError("");
    try {
      const updated = await updateAdminTicket(ticket.id, {
        status,
        priority,
        resolution_notes: notes || null,
      });
      onUpdated(updated);
    } catch (requestError) {
      setError(requestError.message || "Could not update ticket");
    } finally {
      setSaving(false);
    }
  }

  async function saveAssignment() {
    setSaving(true);
    setError("");
    try {
      const updated = await assignAdminTicket(ticket.id, assignedTo === "" ? null : Number(assignedTo));
      onUpdated(updated);
    } catch (requestError) {
      setError(requestError.message || "Could not update assignment");
    } finally {
      setSaving(false);
    }
  }

  return <div className="detail-backdrop" role="presentation" onClick={onClose}>
    <section className="ticket-detail" role="dialog" aria-modal="true" aria-labelledby="ticket-detail-title" onClick={(event) => event.stopPropagation()}>
      <div className="detail-heading"><div><span className="ticket-id">Ticket #{ticket.id}</span><h2 id="ticket-detail-title">Ticket details</h2></div><button className="icon-text-button" onClick={onClose} aria-label="Close ticket details">×</button></div>
      <RequestError error={error} />
      <div className="ticket-detail-body">
        {admin && <div className="detail-field"><span>Employee</span><strong>{ticket.employee_name}</strong></div>}
        <div className="detail-field"><span>Issue</span><p>{ticket.issue_description}</p></div>
        <div className="detail-columns">
          <div className="detail-field"><span>Operating system</span><strong>{ticket.operating_system || "Not specified"}</strong></div>
          <div className="detail-field"><span>Category</span><strong>{ticket.category || "Not categorized"}</strong></div>
          <div className="detail-field"><span>Created</span><strong>{formatDate(ticket.created_at)}</strong></div>
          <div className="detail-field"><span>Updated</span><strong>{formatDate(ticket.updated_at)}</strong></div>
        </div>
        {!admin ? <>
          <div className="detail-field"><span>Status / Priority</span><div className="detail-badges"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div></div>
          <div className="detail-field"><span>Resolution notes</span><p>{ticket.resolution_notes || "No resolution notes yet."}</p></div>
        </> : <>
          <label className="detail-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
          </select></label>
          <label className="detail-field"><span>Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select></label>
          <label className="detail-field"><span>Resolution notes</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <button className="primary-button" onClick={saveChanges} disabled={saving}>{saving ? "Saving..." : "Save ticket updates"}</button>
          <div className="assignment-row"><label className="detail-field"><span>Assigned staff user ID</span><input type="number" min="1" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Leave blank to unassign" /></label>
            <button className="secondary-button" onClick={saveAssignment} disabled={saving}>{saving ? "Saving..." : assignedTo === "" ? "Unassign" : "Assign"}</button>
          </div>
        </>}
      </div>
    </section>
  </div>;
}

function TicketList({ admin }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "", priority: "", search: "" });
  const { status, priority, search } = filters;

  async function loadTickets(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const data = admin ? await getAdminTickets({ limit: 100, ...filters }) : await getMyTickets();
      setTickets(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const request = admin
      ? getAdminTickets({ limit: 100, status, priority, search })
      : getMyTickets();
    request
      .then((data) => { if (active) setTickets(data); })
      .catch((requestError) => { if (active) setError(requestError.message || "Could not load tickets"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [admin, status, priority, search]);

  async function openTicket(ticketId) {
    setError("");
    try {
      setSelectedTicket(admin ? await getAdminTicket(ticketId) : await getMyTicket(ticketId));
    } catch (requestError) {
      setError(requestError.message || "Could not load ticket details");
    }
  }

  function updateTicket(updated) {
    setSelectedTicket(updated);
    setTickets((items) => items.map((item) => item.id === updated.id ? updated : item));
  }

  return <section className="workspace-card">
    <div className="workspace-heading"><div><h1>{admin ? "All Tickets" : "My Tickets"}</h1><p>{admin ? "Search, filter, assign, and update employee support requests." : "Review the support tickets you have submitted."}</p></div>
      <button className="refresh-button" onClick={() => loadTickets(true)} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} />Refresh</button>
    </div>
    {admin && <div className="ticket-filters">
      <input aria-label="Search tickets" placeholder="Search issues..." value={filters.search} onChange={(event) => setFilters((state) => ({ ...state, search: event.target.value }))} />
      <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters((state) => ({ ...state, status: event.target.value }))}>
        <option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
      </select>
      <select aria-label="Filter by priority" value={filters.priority} onChange={(event) => setFilters((state) => ({ ...state, priority: event.target.value }))}>
        <option value="">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
      </select>
    </div>}
    <RequestError error={error} onRetry={() => loadTickets(true)} />
    {loading ? <div className="dashboard-loading"><LoaderCircle size={25} className="spin" /><p>Loading tickets...</p></div> :
      tickets.length === 0 ? <div className="empty-tickets"><Ticket size={30} /><h3>No tickets found</h3><p>{admin ? "Try changing the filters or search term." : "When you submit an unresolved AI support issue, its ticket will appear here."}</p></div> :
        <div className="tickets-table-wrapper"><table className="tickets-table">
          <thead><tr><th>Ticket</th>{admin && <th>Employee</th>}<th>Issue</th><th>Priority</th><th>Status</th>{admin && <th>Assigned To</th>}<th>Created</th></tr></thead>
          <tbody>{tickets.map((ticket) => <tr key={ticket.id} className="clickable-row" onClick={() => openTicket(ticket.id)}>
            <td className="ticket-id">#{ticket.id}</td>{admin && <td>{ticket.employee_name}</td>}<td className="ticket-issue"><strong>{ticket.issue_description}</strong>{ticket.category && <span>{ticket.category}</span>}</td>
            <td><PriorityBadge priority={ticket.priority} /></td><td><StatusBadge status={ticket.status} /></td>
            {admin && <td>{ticket.assigned_to ? `Staff #${ticket.assigned_to}` : "Unassigned"}</td>}<td className="ticket-date">{formatDate(ticket.created_at)}</td>
          </tr>)}</tbody>
        </table></div>}
    {selectedTicket && <TicketDetails ticket={selectedTicket} admin={admin} onClose={() => setSelectedTicket(null)} onUpdated={updateTicket} />}
  </section>;
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      setUsers(await getAdminUsers());
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getAdminUsers()
      .then((userData) => {
        if (active) {
          setUsers(userData);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Could not load users");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function handleCreateUser(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await createAdminUser({ username: username.trim(), email: email.trim(), password, role });
      setUsername("");
      setEmail("");
      setPassword("");
      setNotice(`${role === "admin" ? "Admin" : "Employee"} account created.`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message || "Could not create account");
    } finally {
      setSaving(false);
    }
  }

  async function toggleUserStatus(user) {
    setError("");
    setNotice("");
    try {
      await updateAdminUserStatus(user.id, !user.is_active);
      setUsers((currentUsers) => currentUsers.map((item) =>
        item.id === user.id ? { ...item, is_active: !user.is_active } : item
      ));
      setNotice(`${user.username}'s account ${user.is_active ? "disabled" : "enabled"}.`);
    } catch (requestError) {
      setError(requestError.message || "Could not update account");
    }
  }

  const employees = users.filter((item) => item.role === "employee");

  return <section className="workspace-card">
    <div className="workspace-heading">
      <div><h1>User Management</h1><p>Create employee or admin accounts and manage access for all users.</p></div>
      <button className="refresh-button" onClick={loadUsers} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} />Refresh</button>
    </div>
    <div className="user-summary-grid">
      <div className="user-summary-card"><Users size={21} /><div><span>Total employees</span><strong>{employees.length}</strong></div></div>
      <div className="user-summary-card"><UserCircle size={21} /><div><span>Total users</span><strong>{users.length}</strong></div></div>
    </div>
    <RequestError error={error} onRetry={loadUsers} />
    {notice && <div className="user-success" role="status">{notice}</div>}
    <div className="user-management-grid">
      <form className="user-create-form" onSubmit={handleCreateUser}>
        <h2><UserPlus size={19} /> Create account</h2>
        <label htmlFor="new-user-role">Account role</label>
        <select id="new-user-role" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </select>
        <label htmlFor="new-user-username">Username</label>
        <input id="new-user-username" value={username} onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={100} required />
        <label htmlFor="new-user-email">Email</label>
        <input id="new-user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={255} required />
        <label htmlFor="new-user-password">Temporary password</label>
        <input id="new-user-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required />
        <button className="primary-button" type="submit" disabled={saving}>{saving ? "Creating..." : "Create account"}</button>
      </form>
      <div className="user-list-panel">
        <div className="user-list-heading"><div><h2>All users</h2><p>Employee and administrator accounts</p></div></div>
        {loading ? <div className="dashboard-loading"><LoaderCircle size={24} className="spin" /><p>Loading users...</p></div> :
          users.length === 0 ? <div className="empty-tickets"><Users size={28} /><h3>No users found</h3><p>Create an account or let employees register themselves.</p></div> :
            <div className="user-table-wrapper"><table className="user-table">
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{users.map((item) => <tr key={item.id}>
                <td><strong>{item.username}</strong></td><td>{item.email}</td>
                <td><span className={`role-badge role-${item.role}`}>{item.role === "admin" ? "Admin" : "Employee"}</span></td>
                <td><span className={`account-status ${item.is_active ? "account-active" : "account-disabled"}`}>{item.is_active ? "Active" : "Disabled"}</span></td>
                <td><button className="secondary-button user-status-button" onClick={() => toggleUserStatus(item)}>{item.is_active ? "Disable" : "Enable"}</button></td>
              </tr>)}</tbody>
            </table></div>}
      </div>
    </div>
  </section>;
}

function Dashboard({ user, onLogout }) {
  const isAdmin = user.role === "admin";
  const menuItems = isAdmin
    ? [{ label: "Dashboard", icon: LayoutDashboard }, { label: "User Management", icon: Users }, { label: "All Tickets", icon: Ticket }, { label: "AI Support", icon: MessageCircle }]
    : [{ label: "AI Support", icon: MessageCircle }, { label: "My Tickets", icon: Ticket }];
  const [activePage, setActivePage] = useState(isAdmin ? "Dashboard" : "AI Support");

  return <div className="app-layout">
    <aside className="sidebar">
      <div className="sidebar-brand"><div className="brand-icon"><Bot size={23} /></div><div><strong>IT Support AI</strong><small>Support Workspace</small></div></div>
      <div className="nav-section-title">WORKSPACE</div>
      <nav className="sidebar-nav">{menuItems.map((item) => {
        const Icon = item.icon;
        return <button key={item.label} className={`nav-item ${activePage === item.label ? "active" : ""}`} onClick={() => setActivePage(item.label)}><Icon size={19} /><span>{item.label}</span></button>;
      })}</nav>
      <div className="sidebar-bottom">
        <div className="user-profile"><div className="avatar">{user.username?.charAt(0).toUpperCase()}</div><div className="user-info"><strong>{user.username}</strong><span>{isAdmin ? "IT Administrator" : "Employee"}</span></div></div>
        <button className="logout-button" onClick={onLogout}><LogOut size={18} /><span>Logout</span></button>
      </div>
    </aside>
    <main className="dashboard-main">
      <header className="topbar"><div><span className="breadcrumb">Workspace / {activePage}</span><h2>{activePage}</h2></div>
        <div className="topbar-user"><div className="topbar-avatar">{user.username?.charAt(0).toUpperCase()}</div><div><strong>{user.username}</strong><span>{isAdmin ? "Administrator" : "Employee"}</span></div></div>
      </header>
      <div className="page-content">
        {isAdmin && activePage === "Dashboard" ? <AdminDashboard onOpenTickets={() => setActivePage("All Tickets")} onOpenUsers={() => setActivePage("User Management")} /> :
          isAdmin && activePage === "User Management" ? <UserManagement /> :
          activePage === "AI Support" ? <ChatWorkspace /> : <TicketList admin={isAdmin} />}
        <div className="account-card"><div className="account-card-icon"><UserCircle size={22} /></div><div><strong>Account information</strong><p>Username: {user.username}</p><p>Email: {user.email}</p><p>Role: {user.role}</p></div></div>
      </div>
    </main>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkSession() {
      if (!sessionStorage.getItem("access_token")) {
        setCheckingAuth(false);
        return;
      }
      try {
        const currentUser = await getCurrentUser();
        if (currentUser.role !== "admin" && currentUser.role !== "employee") {
          throw new Error("Unsupported user role.");
        }
        await getRoleAccess(currentUser.role);
        setUser(currentUser);
      } catch {
        logoutUser();
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    function expireSession() {
      setUser(null);
    }
    window.addEventListener("auth-expired", expireSession);
    return () => window.removeEventListener("auth-expired", expireSession);
  }, []);

  async function handleLogin({ username, email, password, registering }) {
    if (registering) {
      await registerUser(username, email, password);
      return;
    }
    await loginUser(username, password);
    const currentUser = await getCurrentUser();
    if (currentUser.role !== "admin" && currentUser.role !== "employee") {
      logoutUser();
      throw new Error("Unsupported user role.");
    }
    await getRoleAccess(currentUser.role);
    setUser(currentUser);
  }

  function handleLogout() {
    logoutUser();
    setUser(null);
  }

  if (checkingAuth) return <div className="loading-screen"><LoaderCircle size={28} className="spin" /><p>Checking your session...</p></div>;
  if (!user) return <LoginPage onLogin={handleLogin} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}
