import { useState } from "react";

function TaskForm({ addTask, users, assignedTo, setAssignedTo }) {
  const [taskName, setTaskName] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [eta, setEta] = useState("");
  const [updateUrl, setUpdateUrl] = useState("");
  const [errors, setErrors] = useState({});

  const validateURL = (url) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

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

  const handleEtaChange = (e) => {
    const val = e.target.value;
    setEta(val);
    if (val) {
      const err = validateEtaValue(val);
      setErrors((prev) => ({ ...prev, eta: err }));
    } else {
      if (e.target.validity && e.target.validity.badInput) {
        setErrors((prev) => ({ ...prev, eta: "Please enter a valid ETA date." }));
      } else {
        setErrors((prev) => ({ ...prev, eta: "" }));
      }
    }
  };

  const handleEtaBlur = (e) => {
    const val = e.target.value;
    const err = validateEtaValue(val);
    if (err) {
      setErrors((prev) => ({ ...prev, eta: err }));
    } else if (e.target.validity && e.target.validity.badInput) {
      setErrors((prev) => ({ ...prev, eta: "Please enter a valid ETA date." }));
    } else {
      setErrors((prev) => ({ ...prev, eta: "" }));
    }
  };

  const handleTaskNameChange = (e) => {
    const val = e.target.value;
    setTaskName(val);
    if (val.trim()) {
      setErrors((prev) => ({ ...prev, taskName: "" }));
    } else {
      setErrors((prev) => ({ ...prev, taskName: "Task Title is required." }));
    }
  };

  const handleTaskNameBlur = (e) => {
    const val = e.target.value;
    if (!val.trim()) {
      setErrors((prev) => ({ ...prev, taskName: "Task Title is required." }));
    }
  };

  const handleAssignedToChange = (e) => {
    const val = e.target.value;
    setAssignedTo(val);
    if (val) {
      setErrors((prev) => ({ ...prev, assignedTo: "" }));
    } else {
      setErrors((prev) => ({ ...prev, assignedTo: "Assignee must be selected." }));
    }
  };

  const handleAssignedToBlur = (e) => {
    const val = e.target.value;
    if (!val) {
      setErrors((prev) => ({ ...prev, assignedTo: "Assignee must be selected." }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const newErrors = {};

    if (!taskName.trim()) {
      newErrors.taskName = "Task Title is required.";
    }

    if (!assignedTo) {
      newErrors.assignedTo = "Assignee must be selected.";
    }

    const etaError = validateEtaValue(eta);
    if (etaError) {
      newErrors.eta = etaError;
    }
    const titleRegex= /[a-zA-Z]/;
    if(!titleRegex.test(taskName)){
      alert("task tiltle must contain letters");
      return;
    }

    if (updateUrl && !validateURL(updateUrl)) {
      newErrors.updateUrl = "Please enter a valid URL (starting with http:// or https://) for the Task Update URL.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addTask(taskName, priority, eta || null, updateUrl || null);

    setTaskName("");
    setPriority("Medium");
    setEta("");
    setUpdateUrl("");
    setAssignedTo("");
    setErrors({});
  };

  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 5;

  const pad = (num) => String(num).padStart(2, "0");
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const minDateTime = `${todayDate.getFullYear()}-${pad(todayDate.getMonth() + 1)}-${pad(todayDate.getDate())}T00:00`;
  const maxDateTime = `${maxYear}-12-31T23:59`;

  return (
    <div className="task-form">
      <div className="form-required-note">* Required Fields</div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
          Assign Trainee <span className="required-asterisk">*</span>
        </label>
        <select
          className={errors.assignedTo ? "input-error" : ""}
          value={assignedTo}
          onChange={handleAssignedToChange}
          onBlur={handleAssignedToBlur}
          required
          aria-required="true"
        >
          <option value="">Select Target Trainee</option>
          {users && users.filter((u) => u.role === "trainee").map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        {errors.assignedTo && <span className="error-message">{errors.assignedTo}</span>}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
          Task Title <span className="required-asterisk">*</span>
        </label>
        <input
          type="text"
          className={errors.taskName ? "input-error" : ""}
          placeholder="Task Name or Title"
          value={taskName}
          onChange={handleTaskNameChange}
          onBlur={handleTaskNameBlur}
          required
          aria-required="true"
        />
        {errors.taskName && <span className="error-message">{errors.taskName}</span>}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Priority</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="High">🔥 High Priority</option>
          <option value="Medium">⚡ Medium Priority</option>
          <option value="Low">🌱 Low Priority</option>
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
          ETA (Target completion date/time) (Optional)
        </label>
        <input
          type="datetime-local"
          className={errors.eta ? "input-error" : ""}
          value={eta}
          min={minDateTime}
          max={maxDateTime}
          onChange={handleEtaChange}
          onBlur={handleEtaBlur}
        />
        {errors.eta && <span className="error-message">{errors.eta}</span>}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
          Task Update URL (Optional)
        </label>
        <input
          type="url"
          className={errors.updateUrl ? "input-error" : ""}
          placeholder="https://example.com/submit"
          value={updateUrl}
          onChange={(e) => {
            setUpdateUrl(e.target.value);
            if (errors.updateUrl) {
              setErrors(prev => ({ ...prev, updateUrl: "" }));
            }
          }}
          onBlur={(e) => {
            const val = e.target.value;
            if (val && !validateURL(val)) {
              setErrors(prev => ({ ...prev, updateUrl: "Please enter a valid URL (starting with http:// or https://) for the Task Update URL." }));
            } else {
              setErrors(prev => ({ ...prev, updateUrl: "" }));
            }
          }}
        />
        {errors.updateUrl && <span className="error-message">{errors.updateUrl}</span>}
      </div>

      <button onClick={handleSubmit} style={{ marginTop: "10px" }}>
        Assign Task
      </button>
    </div>
  );
}

export default TaskForm;