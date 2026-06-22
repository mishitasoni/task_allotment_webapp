import { useState } from "react";
import API from "../services/api";

function StatusRequestForm() {
  const [taskId, setTaskId] = useState("");
  const [status, setStatus] = useState("In Progress");

  const handleRequest = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        alert("Please login again");
        return;
      }

      await API.post("/request-status", {
        task_id: Number(taskId),
        requested_by: user.user_id,
        requested_status: status,
      });

      alert("Status Change Request Sent!");
      setTaskId("");
      setStatus("In Progress");
    } catch (error) {
      console.error(error);
      alert("Failed to send request");
    }
  };

  return (
    <div className="dashboard-section" style={{ marginTop: "32px" }}>
      <h2>Request Status Change</h2>
      <div className="task-form">
        <input
          type="number"
          placeholder="Enter Task ID"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button onClick={handleRequest}>
          Submit Request
        </button>
      </div>
    </div>
  );
}

export default StatusRequestForm;