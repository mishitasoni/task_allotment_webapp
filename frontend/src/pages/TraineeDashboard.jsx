import { useEffect, useState } from "react";
import "../Dashboard.css";
import Navbar from "../components/Navbar";
import TaskCard from "../components/TaskCard";
import API from "../services/api";

function TraineeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterEtaStart, setFilterEtaStart] = useState("");
  const [filterEtaEnd, setFilterEtaEnd] = useState("");

  const fetchUserRequests = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      
      const res = await API.get("/pending-requests");
      // filter requests made by this specific trainee
      const filtered = res.data.filter(r => Number(r.requested_by) === Number(user.user_id));
      setPendingRequests(filtered);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadTraineeData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;
        if (isMounted) setCurrentUser(user);

        const [tasksRes, requestsRes] = await Promise.all([
          API.get(`/tasks/user/${user.user_id}`),
          API.get("/pending-requests")
        ]);

        if (isMounted) {
          setTasks(tasksRes.data);
          const userRequests = requestsRes.data.filter(
            r => Number(r.requested_by) === Number(user.user_id)
          );
          setPendingRequests(userRequests);
        }
      } catch (error) {
        console.error("Error loading trainee data:", error);
      }
    };
    loadTraineeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStatusChangeRequest = async (taskId, targetStatus) => {
    try {
      if (!currentUser) {
        alert("Session expired. Please login again.");
        return;
      }

      await API.post("/request-status", {
        task_id: Number(taskId),
        requested_by: currentUser.user_id,
        requested_status: targetStatus,
      });

      alert(`Status change request to "${targetStatus}" submitted for approval!`);
      fetchUserRequests();
    } catch (error) {
      console.error(error);
      alert("Failed to send status request");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
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
  
  const overdueTasksCount = tasks.filter(t => {
    if (!t.eta) return false;
    const isCompleted = t.status && (t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'done');
    if (isCompleted) return false;
    const now = new Date();
    const etaDate = new Date(t.eta);
    return etaDate < now;
  }).length;

  // Filter pipeline
  const filteredTasks = tasks.filter(task => {
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

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div className="dashboard">
        <h1>Workspace {currentUser && ` - ${currentUser.name}`}</h1>
        
        {/* KPI Metrics Dashboard Cards */}
        <div className="metrics-grid">
          <div className="metric-card total">
            <div className="metric-card-header">
              <span className="metric-label">Assigned Tasks</span>
              <span className="metric-icon">📋</span>
            </div>
            <p className="metric-value">{totalTasksCount}</p>
          </div>
          <div className="metric-card pending">
            <div className="metric-card-header">
              <span className="metric-label">To Do</span>
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
              <span className="metric-label">Overdue Tasks</span>
              <span className="metric-icon">⚠️</span>
            </div>
            <p className="metric-value">{overdueTasksCount}</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filters-section">
          <h3>🔍 Filter My Tasks</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search Text</label>
              <input 
                type="text" 
                placeholder="Search my tasks..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
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
                onChange={(e) => setFilterEtaStart(e.target.value)} 
              />
            </div>
            <div className="filter-group">
              <label>ETA End Date</label>
              <input 
                type="date" 
                value={filterEtaEnd} 
                onChange={(e) => setFilterEtaEnd(e.target.value)} 
              />
            </div>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        <h2>My Task Board</h2>
        <div className="kanban-board">
          {/* TO DO COLUMN */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <div className="header-title-area">
                <span className="dot dot-todo"></span>
                <h3>To Do</h3>
                <span className="task-count">{notStartedTasks.length}</span>
              </div>
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
                  showStatusSelector={true}
                  onStatusRequest={handleStatusChangeRequest}
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
                  showStatusSelector={true}
                  onStatusRequest={handleStatusChangeRequest}
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
                  showStatusSelector={true}
                  onStatusRequest={handleStatusChangeRequest}
                />
              ))
            )}
          </div>
        </div>

        {/* Pending Requests Log Panel */}
        <div className="dashboard-section" style={{ marginTop: "40px" }}>
          <h2>My Pending Status Requests</h2>
          <div className="cards-list">
            {pendingRequests.length === 0 ? (
              <p className="no-data" style={{ padding: "20px" }}>No active status change requests pending approval.</p>
            ) : (
              pendingRequests.map((request) => (
                <TaskCard 
                  key={request.id} 
                  title={`Task ID Reference: #${request.task_id}`} 
                  status={`Requested: ${request.requested_status}`}
                  priority="Medium"
                >
                  <p><strong>Request ID:</strong> {request.id}</p>
                  <p><strong>Approval Status:</strong> <span style={{ color: "var(--warning)", fontWeight: 700 }}>⏳ {request.approval_status}</span></p>
                </TaskCard>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TraineeDashboard;