# Task Allotment Web Application

A centralized, internal task management platform designed for organizations and internship programs to streamline task assignments, eliminate untracked communications (WhatsApp/Spreadsheets), and introduce a transparent admin-approval workflow.

## 🚀 Tech Stack

- **Frontend:** React.js (Vite), JavaScript (JSX), Tailwind CSS
- **Backend:** Python (FastAPI / Flask)
- **Database:** SQLite / PostgreSQL

---

## 🔄 Core Status Lifecycle

Tasks transition strictly through the following states:
1. **Not Started:** Automatically set when an Admin creates and assigns a task.
2. **In Progress:** Updated by the Trainee when they actively begin working.
3. **Pending Approval:** Triggered when a Trainee requests a status update to "Completed".
4. **Completed:** Successfully verified and closed out by the Admin.
*Note: If an Admin rejects a "Pending Approval" request, the task returns directly to **In Progress** with specific review comments.*

---

## 🗄️ Database Design

### 1. Users Table
Stores credentials and access levels for both Admins and Trainees.
- `id` (INT, Primary Key)
- `name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `password` (VARCHAR)
- `role` (VARCHAR) -> 'Admin' | 'Trainee'

### 2. Tasks Table
Tracks all created work assignments.
- `id` (INT, Primary Key)
- `title` (VARCHAR)
- `description` (TEXT)
- `status` (VARCHAR) -> 'Not Started' | 'In Progress' | 'Pending Approval' | 'Completed'
- `assigned_to` (INT, Foreign Key -> Users.id)
- `created_by` (INT, Foreign Key -> Users.id)

### 3. Approval Requests Table
Handles the verification queue between Trainees and Admins.
- `id` (INT, Primary Key)
- `task_id` (INT, Foreign Key -> Tasks.id)
- `requested_by` (INT, Foreign Key -> Users.id)
- `requested_status` (VARCHAR)
- `approval_status` (VARCHAR) -> 'Pending' | 'Approved' | 'Rejected'

---

## 🔌 API Documentation

### Authentication
- `POST /login` - Validates user credentials and returns a session/token along with user role.
- `POST /create-user` - *(Admin Only)* Generates new trainee accounts.

### Task Management
- `POST /task` - *(Admin Only)* Creates and distributes a new task.
- `GET /task` - Fetches tasks (Admins see all; Trainees see only their assigned work).
- `PUT /task` - Modifies existing task attributes or details.
- `DELETE /task` - *(Admin Only)* Removes a task from the system.

### Approval Workflow
- `POST /request-status` - *(Trainee Only)* Submits a task state-change request for approval.
- `POST /approve` - *(Admin Only)* Confirms the task completion and updates its final status.
- `POST /reject` - *(Admin Only)* Rejects the request, moving the task back to 'In Progress' with feedback notes.