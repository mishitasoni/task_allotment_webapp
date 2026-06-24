import { useState, useEffect } from "react";
import "../Dashboard.css";
import Navbar from "../components/Navbar";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import API from "../services/api";

function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalErrors, setModalErrors] = useState({});

  const validateEtaValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "Please enter a valid ETA date.";
    }

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (date < startOfToday) {
      return "ETA date cannot be in the past.";
    }

    const currentYear = now.getFullYear();
    const maxYear = currentYear + 5;
    const year = date.getFullYear();

    if (year < currentYear || year > maxYear) {
      return `ETA year must be between ${currentYear} and ${maxYear}.`;
    }
    return "";
  };

  // Form states matching inline triggers
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [modalEta, setModalEta] = useState("");
  const [modalUpdateUrl, setModalUpdateUrl] = useState("");

  // Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTrainee, setFilterTrainee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterEtaStart, setFilterEtaStart] = useState("");
  const [filterEtaEnd, setFilterEtaEnd] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await API.get("/tasks");
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await API.get("/pending-requests");
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const [tasksRes, requestsRes, usersRes] = await Promise.all([
          API.get("/tasks"),
          API.get("/pending-requests"),
          API.get("/users")
        ]);
        if (isMounted) {
          setTasks(tasksRes.data);
          setRequests(requestsRes.data);
          setUsers(usersRes.data);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };
    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const createUser = async () => {
    try {
      await API.post("/create-user", {
        name,
        email,
        password,
        role: "trainee",
      });
      alert("Trainee Created Successfully!");
      setName("");
      setEmail("");
      setPassword("");
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Failed to create user");
    }
  };

  const validateURL = (url) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const addTask = async (taskName, selectedPriority, selectedEta, selectedUrl) => {
    try {
      if (!assignedTo) {
        alert("Please select a trainee");
        return;
      }
      await API.post("/tasks", {
        title: taskName,
        description: "Task assigned by Admin",
        assigned_to: Number(assignedTo),
        priority: selectedPriority,
        eta: selectedEta || null,
        update_url: selectedUrl || null
      });
      fetchTasks();
      alert("Task Assigned Successfully!");
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to assign task");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!taskTitle.trim()) {
      newErrors.title = "Title is required.";
    }
    if (!assignedTo) {
      newErrors.assignedTo = "Assignee must be selected.";
    }
    
    const etaError = validateEtaValue(modalEta);
    if (etaError) {
      newErrors.eta = etaError;
    }
    
    if (modalUpdateUrl && !validateURL(modalUpdateUrl)) {
      newErrors.updateUrl = "Please enter a valid URL (starting with http:// or https://) for the Task Update URL.";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setModalErrors(newErrors);
      return;
    }
    
    try {
      await API.post("/tasks", {
        title: taskTitle,
        description: taskDescription || "Task assigned by Admin",
        assigned_to: Number(assignedTo),
        priority: priority,
        eta: modalEta || null,
        update_url: modalUpdateUrl || null
      });
      setTaskTitle("");
      setTaskDescription("");
      setPriority("Medium");
      setModalEta("");
      setModalUpdateUrl("");
      setModalErrors({});
      setIsModalOpen(false);
      fetchTasks();
      alert("Task Created and Assigned Successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to create task");
    }
  };

  const approveRequest = async (id) => {
    try {
      await API.post(`/approve/${id}`);
      alert("Request Approved");
      fetchRequests();
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const rejectRequest = async (id) => {
    try {
      await API.post(`/reject/${id}`);
      alert("Request Rejected");
      fetchRequests();
    } catch (error) {
      console.error(error);
    }
  };

  const getUserNameById = (id) => {
    const found = users.find(u => Number(u.id) === Number(id));
    return found ? found.name : `ID: ${id}`;
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleFilterEtaStartChange = (e) => {
    const val = e.target.value;
    if (val) {
      const yearPart = val.split("-")[0];
      if (yearPart) {
        if (yearPart.length > 4) {
          setFilterEtaStart("");
          return;
        }
        if (yearPart.length === 4) {
          const year = parseInt(yearPart, 10);
          const isIntermediateYear = (yearStr) => {
            if (/^000[2-9]$/.test(yearStr)) return true;
            if (/^00[2-9][0-9]$/.test(yearStr)) return true;
            if (/^0[2-9][0-9]{2}$/.test(yearStr)) return true;
            return false;
          };
          const date = new Date(val);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (!isNaN(year)) {
            if ((year < 2026 || date < today) && !isIntermediateYear(yearPart)) {
              setFilterEtaStart("");
              return;
            }
            if (year > 2031) {
              setFilterEtaStart("");
              return;
            }
          }
        }
      }
      if (filterEtaEnd && new Date(filterEtaEnd) < new Date(val)) {
        setFilterEtaEnd("");
      }
    }
    setFilterEtaStart(val);
  };

  const handleFilterEtaStartBlur = (e) => {
    const val = e.target.value;
    if (val) {
      const yearPart = val.split("-")[0];
      const year = parseInt(yearPart, 10);
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(year) || year < 2026 || year > 2031 || isNaN(date.getTime()) || date < today) {
        setFilterEtaStart("");
        return;
      }
      if (filterEtaEnd && new Date(filterEtaEnd) < new Date(val)) {
        setFilterEtaEnd("");
      }
    }
  };

  const handleFilterEtaEndChange = (e) => {
    const val = e.target.value;
    if (val) {
      const yearPart = val.split("-")[0];
      if (yearPart) {
        if (yearPart.length > 4) {
          setFilterEtaEnd("");
          return;
        }
        if (yearPart.length === 4) {
          const year = parseInt(yearPart, 10);
          const isIntermediateYear = (yearStr) => {
            if (/^000[2-9]$/.test(yearStr)) return true;
            if (/^00[2-9][0-9]$/.test(yearStr)) return true;
            if (/^0[2-9][0-9]{2}$/.test(yearStr)) return true;
            return false;
          };
          const date = new Date(val);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const minDate = filterEtaStart ? new Date(filterEtaStart) : today;
          if (!isNaN(year)) {
            if ((year < 2026 || date < minDate) && !isIntermediateYear(yearPart)) {
              setFilterEtaEnd("");
              return;
            }
            if (year > 2031) {
              setFilterEtaEnd("");
              return;
            }
          }
        }
      }
    }
    setFilterEtaEnd(val);
  };

  const handleFilterEtaEndBlur = (e) => {
    const val = e.target.value;
    if (val) {
      const yearPart = val.split("-")[0];
      const year = parseInt(yearPart, 10);
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minDate = filterEtaStart ? new Date(filterEtaStart) : today;
      if (isNaN(year) || year < 2026 || year > 2031 || isNaN(date.getTime()) || date < minDate) {
        setFilterEtaEnd("");
      }
    }
  };

  const handleModalEtaChange = (e) => {
    const val = e.target.value;
    if (val) {
      const yearPart = val.split("-")[0];
      if (yearPart) {
        if (yearPart.length > 4) {
          setModalEta("");
          setModalErrors(prev => ({ ...prev, eta: "ETA year must be between 2026 and 2031." }));
          return;
        }
        if (yearPart.length === 4) {
          const year = parseInt(yearPart, 10);
          const isIntermediateYear = (yearStr) => {
            if (/^000[2-9]$/.test(yearStr)) return true;
            if (/^00[2-9][0-9]$/.test(yearStr)) return true;
            if (/^0[2-9][0-9]{2}$/.test(yearStr)) return true;
            return false;
          };
          if (!isNaN(year)) {
            if (year < 2026 && !isIntermediateYear(yearPart)) {
              setModalEta("");
              setModalErrors(prev => ({ ...prev, eta: "ETA year must be between 2026 and 2031." }));
              return;
            }
            if (year > 2031) {
              setModalEta("");
              setModalErrors(prev => ({ ...prev, eta: "ETA year must be between 2026 and 2031." }));
              return;
            }
          }
        }
      }
    }
    setModalEta(val);
    if (val) {
      const error = validateEtaValue(val);
      setModalErrors(prev => ({ ...prev, eta: error }));
    } else {
      if (e.target.validity && e.target.validity.badInput) {
        setModalErrors(prev => ({ ...prev, eta: "Please enter a valid ETA date." }));
      } else {
        setModalErrors(prev => ({ ...prev, eta: "" }));
      }
    }
  };

  const handleModalEtaBlur = (e) => {
    const val = e.target.value;
    if (val) {
      const yearPart = val.split("-")[0];
      const year = parseInt(yearPart, 10);
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(year) || year < 2026 || year > 2031 || isNaN(date.getTime()) || date < today) {
        setModalEta("");
        setModalErrors(prev => ({ ...prev, eta: "ETA date/year must be between 2026 and 2031 and cannot be in the past." }));
        return;
      }
    }
    const error = validateEtaValue(val);
    if (error) {
      setModalErrors(prev => ({ ...prev, eta: error }));
    } else if (e.target.validity && e.target.validity.badInput) {
      setModalErrors(prev => ({ ...prev, eta: "Please enter a valid ETA date." }));
    } else {
      setModalErrors(prev => ({ ...prev, eta: "" }));
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterTrainee("");
    setFilterPriority("");
    setFilterEtaStart("");
    setFilterEtaEnd("");
  };

  // Metrics Calculations
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter(t => !t.status || t.status.toLowerCase() === 'not started' || t.status.toLowerCase() === 'to do').length;
  const inProgressTasksCount = tasks.filter(t => t.status && (t.status.toLowerCase() === 'in progress' || t.status.toLowerCase() === 'on progress')).length;
  const completedTasksCount = tasks.filter(t => t.status && (t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'done')).length;
  const highPriorityTasksCount = tasks.filter(t => (t.priority || 'Medium').toLowerCase() === 'high').length;
  const upcomingTasksCount = tasks.filter(t => {
    if (!t.eta) return false;
    const isCompleted = t.status && (t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'done');
    if (isCompleted) return false;
    const now = new Date();
    const etaDate = new Date(t.eta);
    return etaDate > now;
  }).length;

  // Filter Pipeline (instantly matches and works together)
  const filteredTasks = tasks.filter(task => {
    if (filterTrainee && Number(task.assigned_to) !== Number(filterTrainee)) {
      return false;
    }
    if (filterPriority && (task.priority || 'Medium').toLowerCase() !== filterPriority.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const titleMatch = task.title && task.title.toLowerCase().includes(term);
      const descMatch = task.description && task.description.toLowerCase().includes(term);
      if (!titleMatch && !descMatch) return false;
    }
    if (filterEtaStart || filterEtaEnd) {
      if (!task.eta) return false;
      const taskDate = new Date(task.eta);
      if (filterEtaStart) {
        const start = new Date(filterEtaStart);
        if (taskDate < start) return false;
      }
      if (filterEtaEnd) {
        const end = new Date(filterEtaEnd);
        end.setHours(23, 59, 59, 999);
        if (taskDate > end) return false;
      }
    }
    return true;
  });

  // Kanban Columns Split
  const notStartedTasks = filteredTasks.filter(t => !t.status || t.status.toLowerCase() === 'not started' || t.status.toLowerCase() === 'to do');
  const inProgressTasks = filteredTasks.filter(t => t.status && (t.status.toLowerCase() === 'in progress' || t.status.toLowerCase() === 'on progress'));
  const completedTasks = filteredTasks.filter(t => t.status && (t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'done'));

  const pad = (num) => String(num).padStart(2, "0");
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const currentYearVal = todayDate.getFullYear();
  const minDateTime = `${currentYearVal}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}T00:00`;
  const maxDateTime = `${currentYearVal + 5}-12-31T23:59`;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="dashboard">
        <h1>Admin Control Panel</h1>

        {/* Dashboard Metrics Section */}
        <div className="metrics-grid">
          <div className="metric-card total">
            <div className="metric-card-header">
              <span className="metric-label">Total Tasks</span>
              <span className="metric-icon">📋</span>
            </div>
            <p className="metric-value">{totalTasksCount}</p>
          </div>
          <div className="metric-card pending">
            <div className="metric-card-header">
              <span className="metric-label">Pending</span>
              <span className="metric-icon">⏳</span>
            </div>
            <p className="metric-value">{pendingTasksCount}</p>
          </div>
          <div className="metric-card progress">
            <div className="metric-card-header">
              <span className="metric-label">In Progress</span>
              <span className="metric-icon">⚙️</span>
            </div>
            <p className="metric-value">{inProgressTasksCount}</p>
          </div>
          <div className="metric-card done">
            <div className="metric-card-header">
              <span className="metric-label">Completed</span>
              <span className="metric-icon">✅</span>
            </div>
            <p className="metric-value">{completedTasksCount}</p>
          </div>
          <div className="metric-card high">
            <div className="metric-card-header">
              <span className="metric-label">High Priority</span>
              <span className="metric-icon">🔥</span>
            </div>
            <p className="metric-value">{highPriorityTasksCount}</p>
          </div>
          <div className="metric-card upcoming">
            <div className="metric-card-header">
              <span className="metric-label">Upcoming ETA</span>
              <span className="metric-icon">📅</span>
            </div>
            <p className="metric-value">{upcomingTasksCount}</p>
          </div>
        </div>

        {/* Advanced Filters Section */}
        <div className="filters-section">
          <h3>🔍 Advanced Filters</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search Text</label>
              <input 
                type="text" 
                placeholder="Search title/desc..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="filter-group">
              <label>Trainee Name</label>
              <select value={filterTrainee} onChange={(e) => setFilterTrainee(e.target.value)}>
                <option value="">All Trainees</option>
                {users.filter(u => u.role === "trainee").map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Priority</label>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="filter-group">
              <label>ETA Start Date</label>
              <input 
                type="date" 
                value={filterEtaStart} 
                min={getTodayDateString()}
                onChange={handleFilterEtaStartChange} 
                onBlur={handleFilterEtaStartBlur}
              />
            </div>
            <div className="filter-group">
              <label>ETA End Date</label>
              <input 
                type="date" 
                value={filterEtaEnd} 
                min={filterEtaStart || getTodayDateString()}
                onChange={handleFilterEtaEndChange} 
                onBlur={handleFilterEtaEndBlur}
              />
            </div>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2>Create Trainee Account</h2>
            <div className="task-form">
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Account Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={createUser}>Create User Profile</button>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Quick Assign Task</h2>
            <TaskForm 
              addTask={addTask} 
              users={users} 
              assignedTo={assignedTo} 
              setAssignedTo={setAssignedTo} 
            />
          </div>
        </div>

        <h2>Assigned Tasks Board</h2>
        <div className="kanban-board">
          {/* TO DO COLUMN */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <div className="header-title-area">
                <span className="dot dot-todo"></span>
                <h3>To Do</h3>
                <span className="task-count">{notStartedTasks.length}</span>
              </div>
              <button className="add-task-inline-btn" onClick={() => setIsModalOpen(true)}>+</button>
            </div>
            {notStartedTasks.length === 0 ? (
              <p className="no-data">No tasks in To Do.</p>
            ) : (
              notStartedTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  taskId={task.id} 
                  title={task.title} 
                  description={task.description} 
                  status={task.status || "Not Started"} 
                  priority={task.priority} 
                  eta={task.eta}
                  update_url={task.update_url}
                  candidateName={getUserNameById(task.assigned_to)} 
                />
              ))
            )}
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <div className="header-title-area">
                <span className="dot dot-progress"></span>
                <h3>In Progress</h3>
                <span className="task-count">{inProgressTasks.length}</span>
              </div>
            </div>
            {inProgressTasks.length === 0 ? (
              <p className="no-data">No tasks in Progress.</p>
            ) : (
              inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  taskId={task.id} 
                  title={task.title} 
                  description={task.description} 
                  status={task.status} 
                  priority={task.priority} 
                  eta={task.eta}
                  update_url={task.update_url}
                  candidateName={getUserNameById(task.assigned_to)} 
                />
              ))
            )}
          </div>

          {/* COMPLETED COLUMN */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <div className="header-title-area">
                <span className="dot dot-done"></span>
                <h3>Done</h3>
                <span className="task-count">{completedTasks.length}</span>
              </div>
            </div>
            {completedTasks.length === 0 ? (
              <p className="no-data">No completed tasks.</p>
            ) : (
              completedTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  taskId={task.id} 
                  title={task.title} 
                  description={task.description} 
                  status={task.status} 
                  priority={task.priority} 
                  eta={task.eta}
                  update_url={task.update_url}
                  candidateName={getUserNameById(task.assigned_to)} 
                />
              ))
            )}
          </div>
        </div>

        <h2>Pending Trainee Status Requests</h2>
        <div className="cards-list">
          {requests.length === 0 ? (
            <p className="no-data">All requests are clear.</p>
          ) : (
            requests.map((request) => (
              <TaskCard 
                key={request.id} 
                title={`Task ID Reference: #${request.task_id}`} 
                status={`Requested: ${request.requested_status}`}
                priority="Medium"
                candidateName={getUserNameById(request.requested_by)}
              >
                <p><strong>Request ID:</strong> {request.id}</p>
                <p><strong>Approval Status:</strong> {request.approval_status}</p>
                <div className="action-group">
                  <button className="approve-btn" onClick={() => approveRequest(request.id)}>Approve</button>
                  <button className="reject-btn" onClick={() => rejectRequest(request.id)}>Reject</button>
                </div>
              </TaskCard>
            ))
          )}
        </div>

        {/* MODAL WINDOW */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-card">
              <button className="close-modal-btn" onClick={() => { setIsModalOpen(false); setModalErrors({}); }}>✕</button>
              <h2>Add New Task</h2>
              <form onSubmit={handleModalSubmit} noValidate>
                <div className="form-required-note">* Required Fields</div>
                
                <div className="form-group">
                  <label>Title <span className="required-asterisk">*</span></label>
                  <input 
                    type="text" 
                    className={modalErrors.title ? "input-error" : ""}
                    placeholder="Task Title" 
                    value={taskTitle} 
                    onChange={(e) => {
                      setTaskTitle(e.target.value);
                      if (e.target.value.trim()) {
                        setModalErrors(prev => ({ ...prev, title: "" }));
                      } else {
                        setModalErrors(prev => ({ ...prev, title: "Title is required." }));
                      }
                    }} 
                    onBlur={(e) => {
                      if (!e.target.value.trim()) {
                        setModalErrors(prev => ({ ...prev, title: "Title is required." }));
                      }
                    }}
                    required
                    aria-required="true"
                  />
                  {modalErrors.title && <span className="error-message">{modalErrors.title}</span>}
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea placeholder="Add details..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Assign Trainee <span className="required-asterisk">*</span></label>
                    <select 
                      className={modalErrors.assignedTo ? "input-error" : ""}
                      value={assignedTo} 
                      onChange={(e) => {
                        setAssignedTo(e.target.value);
                        if (e.target.value) {
                          setModalErrors(prev => ({ ...prev, assignedTo: "" }));
                        } else {
                          setModalErrors(prev => ({ ...prev, assignedTo: "Assignee must be selected." }));
                        }
                      }}
                      onBlur={(e) => {
                        if (!e.target.value) {
                          setModalErrors(prev => ({ ...prev, assignedTo: "Assignee must be selected." }));
                        }
                      }}
                      required
                      aria-required="true"
                    >
                      <option value="">Select Candidate</option>
                      {users.filter(u => u.role === 'trainee').map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                    {modalErrors.assignedTo && <span className="error-message">{modalErrors.assignedTo}</span>}
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>ETA (Completion Date & Time) (Optional)</label>
                  <input 
                    type="datetime-local" 
                    className={modalErrors.eta ? "input-error" : ""}
                    value={modalEta} 
                    min={minDateTime}
                    max={maxDateTime}
                    onChange={handleModalEtaChange} 
                    onBlur={handleModalEtaBlur}
                  />
                  {modalErrors.eta && <span className="error-message">{modalErrors.eta}</span>}
                </div>
                <div className="form-group">
                  <label>Task Update URL (Optional)</label>
                  <input 
                    type="url" 
                    className={modalErrors.updateUrl ? "input-error" : ""}
                    placeholder="https://example.com/submit-work" 
                    value={modalUpdateUrl} 
                    onChange={(e) => {
                      setModalUpdateUrl(e.target.value);
                      if (modalErrors.updateUrl) {
                        setModalErrors(prev => ({ ...prev, updateUrl: "" }));
                      }
                    }} 
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val && !validateURL(val)) {
                        setModalErrors(prev => ({ ...prev, updateUrl: "Please enter a valid URL (starting with http:// or https://) for the Task Update URL." }));
                      } else {
                        setModalErrors(prev => ({ ...prev, updateUrl: "" }));
                      }
                    }}
                  />
                  {modalErrors.updateUrl && <span className="error-message">{modalErrors.updateUrl}</span>}
                </div>
                <button type="submit" className="submit-project-btn">Create Project Task</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;