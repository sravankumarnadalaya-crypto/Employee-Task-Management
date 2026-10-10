import React from 'react';
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check,
  CheckCircle2, ChevronDown, CircleHelp, ClipboardList, Clock3, Filter,
  LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, Trash2, Users,
  X, Pencil, RefreshCw
} from "lucide-react";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });
API.interceptors.request.use(config => {
  const token = localStorage.getItem("etm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const emptyTask = { title: "", description: "", assignedTo: "", priority: "Medium", status: "Pending", deadline: "" };
const emptyEmployee = { name: "", email: "", password: "", department: "" };
const dateText = value => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No deadline";
const errorText = e => e?.response?.data?.message || "Something went wrong. Check that the backend and database are running.";

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("etm_user") || "null"); } catch { return null; }
  });
  const [page, setPage] = useState("Overview");
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [taskModal, setTaskModal] = useState(null);
  const [employeeModal, setEmployeeModal] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const admin = user?.role === "admin";

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError("");
    try {
      const taskRequest = API.get("/tasks");
      const employeeRequest = admin ? API.get("/employees") : Promise.resolve({ data: [] });
      const [taskRes, employeeRes] = await Promise.all([taskRequest, employeeRequest]);
      setTasks(taskRes.data); setEmployees(employeeRes.data);
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }, [user, admin]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  const logout = () => {
    localStorage.removeItem("etm_token"); localStorage.removeItem("etm_user");
    setUser(null); setTasks([]); setEmployees([]); setPage("Overview");
  };

  const filteredTasks = useMemo(() => tasks.filter(task => {
    const term = search.toLowerCase();
    const matchTerm = !term || task.title.toLowerCase().includes(term) ||
      (task.assignedTo?.name || "").toLowerCase().includes(term) ||
      (task.description || "").toLowerCase().includes(term);
    return matchTerm && (statusFilter === "All" || task.status === statusFilter);
  }), [tasks, search, statusFilter]);

  async function saveTask(payload) {
    try {
      if (taskModal?.id) await API.put(`/tasks/${taskModal.id}`, payload);
      else await API.post("/tasks", payload);
      setTaskModal(null); setNotice(taskModal?.id ? "Task updated successfully." : "Task assigned successfully.");
      await loadData();
    } catch (e) { throw new Error(errorText(e)); }
  }

  async function updateStatus(task, status) {
    try {
      await API.put(`/tasks/${task._id}`, { status });
      setNotice("Task status updated."); await loadData();
    } catch (e) { setError(errorText(e)); }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    try { await API.delete(`/tasks/${task._id}`); setNotice("Task deleted."); await loadData(); }
    catch (e) { setError(errorText(e)); }
  }

  async function saveEmployee(payload) {
    try {
      if (employeeModal?.id) await API.put(`/employees/${employeeModal.id}`, payload);
      else await API.post("/employees", payload);
      setEmployeeModal(null); setNotice(employeeModal?.id ? "Employee updated." : "Employee added.");
      await loadData();
    } catch (e) { throw new Error(errorText(e)); }
  }

  async function deleteEmployee(employee) {
    if (!window.confirm(`Delete employee ${employee.name}?`)) return;
    try { await API.delete(`/employees/${employee._id}`); setNotice("Employee deleted."); await loadData(); }
    catch (e) { setError(errorText(e)); }
  }

  if (!user) return <Login onLogin={data => {
    localStorage.setItem("etm_token", data.token);
    localStorage.setItem("etm_user", JSON.stringify(data.user));
    setUser(data.user); setPage("Overview"); setError("");
  }} />;

  const completed = tasks.filter(t => t.status === "Completed").length;
  const inProgress = tasks.filter(t => t.status === "In Progress").length;
  const pending = tasks.filter(t => t.status === "Pending").length;
  const overdue = tasks.filter(t => t.status !== "Completed" && new Date(t.deadline) < new Date()).length;
  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Tasks", icon: ClipboardList },
    ...(admin ? [{ label: "Employees", icon: Users }] : [])
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><CheckCircle2 size={23}/></div><div><b>TaskFlow</b><small>WORKSPACE</small></div><button className="icon-btn close-menu" onClick={() => setMobileMenu(false)}><X/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{navItems.map(item => <button key={item.label} className={`nav-link ${page === item.label ? "active" : ""}`} onClick={() => { setPage(item.label); setMobileMenu(false); }}><item.icon size={18}/><span>{item.label}</span>{item.label === "Tasks" && <span className="nav-count">{tasks.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><b>Need a hand?</b><p>Manage your work, one task at a time.</p><span>TaskFlow workspace</span></div><div className="profile-row"><div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div><div className="profile-info"><b>{user.name}</b><span>{admin ? "Administrator" : "Employee"}</span></div><button title="Log out" className="icon-btn" onClick={logout}><LogOut size={17}/></button></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu-btn" onClick={() => setMobileMenu(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{page}</b></div></div><div className="top-actions"><div className="today"><CalendarDays size={16}/>{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div><button className="icon-btn notification" title="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">{user.name?.slice(0,1).toUpperCase()}</div></div></header>

      <div className="content">
        {error && <div className="alert error-alert"><span>{error}</span><button className="icon-btn" onClick={() => setError("")}><X size={16}/></button></div>}
        {notice && <div className="alert success-alert"><Check size={16}/>{notice}</div>}
        {page === "Overview" && <>
          <div className="page-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user.name.split(" ")[0]} <span className="wave">✦</span></h1><p>Here’s what’s happening with your tasks today.</p></div>{admin && <button className="primary-btn" onClick={() => setTaskModal({ ...emptyTask, id: null })}><Plus size={18}/> Assign a task</button>}</div>
          <div className="stats-grid">
            <StatCard label="Total tasks" value={tasks.length} note="Across your workspace" icon={ClipboardList} tint="purple" trend="Overview"/>
            <StatCard label="In progress" value={inProgress} note="Work currently underway" icon={Activity} tint="blue" trend="Active"/>
            <StatCard label="Completed" value={completed} note={tasks.length ? `${Math.round(completed / tasks.length * 100)}% of all tasks` : "No tasks completed yet"} icon={CheckCircle2} tint="green" trend="Done"/>
            <StatCard label="Overdue" value={overdue} note="Past deadline, not complete" icon={Clock3} tint="orange" trend={overdue ? "Needs attention" : "On track"}/>
          </div>
          <div className="section-heading"><div><h2>Recent tasks</h2><p>Keep an eye on what needs your attention.</p></div><button className="text-btn" onClick={() => setPage("Tasks")}>View all tasks <ArrowUpRight size={15}/></button></div>
          <TaskTable tasks={filteredTasks.slice(0, 5)} admin={admin} onEdit={t => setTaskModal({ ...t, id: t._id })} onDelete={deleteTask} onStatus={updateStatus} loading={loading}/>
          <div className="overview-bottom"><div className="panel progress-panel"><div className="panel-title"><div><h3>Task progress</h3><p>Current completion snapshot</p></div><div className="round-icon"><Activity size={18}/></div></div><div className="progress-number"><strong>{tasks.length ? Math.round(completed / tasks.length * 100) : 0}%</strong><span>completed</span></div><div className="progress-track"><div style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }}/></div><div className="progress-legend"><span><i className="dot green-dot"/>Completed <b>{completed}</b></span><span><i className="dot blue-dot"/>In progress <b>{inProgress}</b></span><span><i className="dot gray-dot"/>Pending <b>{pending}</b></span></div></div>
            <div className="panel priority-panel"><div className="panel-title"><div><h3>Priority breakdown</h3><p>Tasks by importance</p></div><div className="round-icon orange-round"><Activity size={18}/></div></div>{["High", "Medium", "Low"].map(level => { const count = tasks.filter(t => t.priority === level).length; return <div className="priority-line" key={level}><span className={`priority-dot ${level.toLowerCase()}`}/><span>{level} priority</span><div className="mini-track"><div className={level.toLowerCase()} style={{ width: `${tasks.length ? count / tasks.length * 100 : 0}%` }}/></div><b>{count}</b></div>; })}</div></div>
        </>}

        {page === "Tasks" && <><div className="page-heading"><div><div className="eyebrow">TASK MANAGEMENT</div><h1>{admin ? "All tasks" : "My tasks"}</h1><p>{admin ? "Assign, organize, and track your team's work." : "Review your assignments and update their status."}</p></div>{admin && <button className="primary-btn" onClick={() => setTaskModal({ ...emptyTask, id: null })}><Plus size={18}/> Assign a task</button>}</div>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search tasks or employees..." value={search} onChange={e => setSearch(e.target.value)}/>{search && <button className="icon-btn" onClick={() => setSearch("")}><X size={14}/></button>}</div><div className="filter-box"><Filter size={16}/><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option></select><ChevronDown size={14}/></div><button className="secondary-btn" onClick={loadData}><RefreshCw size={15}/> Refresh</button></div>
          <TaskTable tasks={filteredTasks} admin={admin} onEdit={t => setTaskModal({ ...t, id: t._id })} onDelete={deleteTask} onStatus={updateStatus} loading={loading} showAssignee={admin}/>
        </>}

        {page === "Employees" && admin && <><div className="page-heading"><div><div className="eyebrow">TEAM DIRECTORY</div><h1>Employees</h1><p>Manage employee records and keep your team organized.</p></div><button className="primary-btn" onClick={() => setEmployeeModal({ ...emptyEmployee, id: null })}><Plus size={18}/> Add employee</button></div><div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}/></div><div className="employee-count"><Users size={16}/>{employees.length} team members</div></div><div className="employee-grid">{employees.filter(e => `${e.name} ${e.email} ${e.department}`.toLowerCase().includes(search.toLowerCase())).map(employee => <div className="employee-card" key={employee._id}><div className="employee-card-top"><div className="employee-avatar">{employee.name.slice(0,1).toUpperCase()}</div><button className="icon-btn" title="Delete employee" onClick={() => deleteEmployee(employee)}><Trash2 size={16}/></button></div><h3>{employee.name}</h3><p>{employee.email}</p><div className="employee-card-footer"><span>{employee.department || "No department"}</span><span className="role-pill">Employee</span></div><button className="employee-edit" onClick={() => setEmployeeModal({ ...employee, id: employee._id })}><Pencil size={14}/> Edit details</button></div>)}{!employees.length && <EmptyState title="No employees yet" message="Add an employee to start assigning tasks."/>}</div></>}
      </div>
      <footer className="footer"><span>© {new Date().getFullYear()} TaskFlow</span><span><ShieldCheck size={14}/> Employee Task Management</span></footer>
    </main>

    {taskModal && <TaskModal task={taskModal} employees={employees} admin={admin} onClose={() => setTaskModal(null)} onSave={saveTask}/>}
    {employeeModal && <EmployeeModal employee={employeeModal} onClose={() => setEmployeeModal(null)} onSave={saveEmployee}/>}
  </div>;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try { const { data } = await API.post("/auth/login", { email, password }); onLogin(data); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  return <div className="login-page"><div className="login-decoration decoration-one"/><div className="login-decoration decoration-two"/><div className="login-wrap"><div className="login-brand"><div className="brand-mark"><CheckCircle2 size={24}/></div><div><b>TaskFlow</b><small>WORKSPACE</small></div></div><div className="login-card"><div className="login-symbol"><ClipboardList size={26}/></div><div className="eyebrow">WELCOME BACK</div><h1>Sign in to your workspace</h1><p className="login-subtitle">Stay focused. Keep your team's work moving.</p>{error && <div className="alert error-alert">{error}</div>}<form onSubmit={submit}><label>Email address</label><input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"/><label>Password</label><input className="form-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/><button className="primary-btn login-submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"} <ArrowUpRight size={17}/></button></form><div className="login-note"><ShieldCheck size={15}/> Secure role-based access</div></div><p className="login-footer">Employee Task Management · MERN Stack Project</p></div></div>;
}

function StatCard({ label, value, note, icon: Icon, tint, trend }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className={`stat-icon ${tint}`}><Icon size={19}/></div></div><div className="stat-value">{value}</div><div className="stat-foot"><span>{note}</span><span className={`stat-trend ${tint}`}>{trend}</span></div></div>;
}

function TaskTable({ tasks, admin, onEdit, onDelete, onStatus, loading, showAssignee = false }) {
  if (loading && !tasks.length) return <div className="table-empty"><RefreshCw className="spin" size={22}/> Loading tasks...</div>;
  if (!tasks.length) return <div className="table-empty"><div className="empty-icon"><ClipboardList size={24}/></div><b>No tasks found</b><span>Try changing your filters or create a new task.</span></div>;
  return <div className="table-wrap"><table><thead><tr><th>TASK</th>{(showAssignee || admin) && <th>ASSIGNED TO</th>}<th>PRIORITY</th><th>DEADLINE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{tasks.map(task => <tr key={task._id}><td><div className="task-title-cell"><div className="task-mini-icon"><ClipboardList size={16}/></div><div><b>{task.title}</b><span>{task.description || "No description added"}</span></div></div></td>{(showAssignee || admin) && <td><div className="assignee-cell"><div className="tiny-avatar">{task.assignedTo?.name?.slice(0,1) || "?"}</div>{task.assignedTo?.name || "Unknown"}</div></td>}<td><span className={`priority-pill ${task.priority?.toLowerCase()}`}>{task.priority}</span></td><td><span className={`deadline ${task.status !== "Completed" && new Date(task.deadline) < new Date() ? "overdue-text" : ""}`}><CalendarDays size={14}/>{dateText(task.deadline)}</span></td><td>{admin ? <select className={`status-select ${task.status.toLowerCase().replace(" ", "-")}`} value={task.status} onChange={e => onStatus(task, e.target.value)}><option>Pending</option><option>In Progress</option><option>Completed</option></select> : <select className={`status-select ${task.status.toLowerCase().replace(" ", "-")}`} value={task.status} onChange={e => onStatus(task, e.target.value)}><option>Pending</option><option>In Progress</option><option>Completed</option></select>}</td><td><div className="action-buttons">{admin && <button className="icon-btn edit-action" title="Edit task" onClick={() => onEdit(task)}><Pencil size={15}/></button>}{admin && <button className="icon-btn delete-action" title="Delete task" onClick={() => onDelete(task)}><Trash2 size={15}/></button>}{!admin && <span className="self-task-label">Assigned to you</span>}</div></td></tr>)}</tbody></table></div>;
}

function EmptyState({ title, message }) {
  return <div className="table-empty full-empty"><div className="empty-icon"><Users size={24}/></div><b>{title}</b><span>{message}</span></div>;
}

function TaskModal({ task, employees, admin, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    title: task.title || "", description: task.description || "",
    assignedTo: typeof task.assignedTo === "object" ? task.assignedTo?._id : task.assignedTo || "",
    priority: task.priority || "Medium", status: task.status || "Pending",
    deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0,10) : ""
  }));
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const isEdit = Boolean(task.id);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const payload = admin ? form : { status: form.status };
      await onSave(payload);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-header"><div><div className="eyebrow">{isEdit ? "TASK DETAILS" : "NEW ASSIGNMENT"}</div><h2>{isEdit ? "Edit task" : "Assign a task"}</h2><p>{isEdit ? "Update task details and progress." : "Give your team a clear next step."}</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>{error && <div className="alert error-alert">{error}</div>}<form onSubmit={submit} className="modal-form">{admin && <><label>Task title *</label><input className="form-input" required maxLength="160" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Prepare monthly report"/><label>Description</label><textarea className="form-input textarea" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add task details..."/><div className="form-two"><div><label>Assign to *</label><select className="form-input" required value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}><option value="">Choose employee</option>{employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} · {emp.department || "Team"}</option>)}</select></div><div><label>Priority</label><select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></div></div><div className="form-two"><div><label>Deadline *</label><input className="form-input" type="date" required value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}/></div><div><label>Status</label><select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Pending</option><option>In Progress</option><option>Completed</option></select></div></div></>}{!admin && <><label>Task</label><div className="readonly-task"><b>{form.title}</b><span>{form.description || "No description"}</span></div><label>Update status</label><select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Pending</option><option>In Progress</option><option>Completed</option></select></>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Saving..." : isEdit ? "Save changes" : "Assign task"}</button></div></form></div></div>;
}

function EmployeeModal({ employee, onClose, onSave }) {
  const [form, setForm] = useState({ name: employee.name || "", email: employee.email || "", password: "", department: employee.department || "" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const isEdit = Boolean(employee.id);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { name: form.name, email: form.email, department: form.department };
      if (!isEdit) payload.password = form.password;
      await onSave(payload);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal"><div className="modal-header"><div><div className="eyebrow">TEAM DIRECTORY</div><h2>{isEdit ? "Edit employee" : "Add employee"}</h2><p>{isEdit ? "Keep employee information up to date." : "Create an employee login and profile."}</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>{error && <div className="alert error-alert">{error}</div>}<form className="modal-form" onSubmit={submit}><label>Full name *</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Employee full name"/><label>Email address *</label><input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="employee@company.com"/>{!isEdit && <><label>Temporary password * (minimum 8 characters)</label><input className="form-input" type="password" minLength="8" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Create a temporary password"/></>}<label>Department</label><input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering"/><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Saving..." : isEdit ? "Save changes" : "Create employee"}</button></div></form></div></div>;
}

export default App;
