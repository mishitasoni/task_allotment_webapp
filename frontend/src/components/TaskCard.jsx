function TaskCard({ 
  title, 
  description, 
  taskId, 
  status, 
  priority, 
  eta, 
  update_url, 
  candidateName, 
  showStatusSelector = false, 
  onStatusRequest = null, 
  children 
}) {

  const getStatusColor = (statusStr) => {
    if (!statusStr) return {};
    const norm = statusStr.toLowerCase();
    if (norm.includes("completed") || norm.includes("done")) return { backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" };
    if (norm.includes("in progress") || norm.includes("on progress")) return { backgroundColor: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" };
    return { backgroundColor: "rgba(148, 163, 184, 0.15)", color: "#94a3b8" };
  };

  const getPriorityTagStyle = (priorityStr) => {
    const norm = (priorityStr || 'Medium').toLowerCase();
    if (norm === 'high') return { backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' };
    if (norm === 'medium') return { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' };
    return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
  };

  const formatETA = (etaStr) => {
    if (!etaStr) return "";
    try {
      const date = new Date(etaStr);
      if (isNaN(date.getTime())) return etaStr;
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return etaStr;
    }
  };

  const isOverdue = (etaStr, statusStr) => {
    if (!etaStr) return false;
    const isCompleted = statusStr && (statusStr.toLowerCase() === 'completed' || statusStr.toLowerCase() === 'done');
    if (isCompleted) return false;
    try {
      const now = new Date();
      const etaDate = new Date(etaStr);
      return etaDate < now;
    } catch {
      return false;
    }
  };

  const cleanPriority = priority || 'Medium';
  const priorityClass = `priority-${cleanPriority.toLowerCase()}`;
  const overdue = isOverdue(eta, status);

  return (
    <div className={`task-card ${priorityClass}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span className="priority-tag" style={getPriorityTagStyle(cleanPriority)}>
          {cleanPriority.toUpperCase()} PRIORITY
        </span>
        <span className="status-badge" style={getStatusColor(status)}>
          {status || "Not Started"}
        </span>
      </div>
      
      <h3>{title}</h3>
      {description && <p className="desc">{description}</p>}
      
      <div className="task-meta-row">
        {taskId && <span style={{ color: 'var(--text-muted)' }}><strong>ID:</strong> #{taskId}</span>}
        {candidateName && (
          <span className="candidate-badge">
            👤 {candidateName}
          </span>
        )}
      </div>

      {eta && (
        <span className={`eta-tag ${overdue ? 'overdue' : ''}`}>
          ⏰ {overdue ? 'Overdue: ' : 'ETA: '} {formatETA(eta)}
        </span>
      )}

      {update_url && (
        <a 
          href={update_url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="link-btn"
        >
          <span>🔗 Submit Work / Updates</span>
        </a>
      )}

      {showStatusSelector && onStatusRequest && (
        <div className="status-select-wrapper">
          <label>Request Status Change</label>
          <select 
            value={status || "Not Started"} 
            onChange={(e) => onStatusRequest(taskId, e.target.value)}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      )}
      
      {children}
    </div>
  );
}

export default TaskCard;