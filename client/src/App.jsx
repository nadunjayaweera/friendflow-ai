import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [note, setNote] = useState("");
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [error, setError] = useState("");

  /* ============================================================
     LOAD SAVED TASKS
  ============================================================ */

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoadingTasks(true);
      setError("");

      const response = await fetch(`${API_URL}/api/tasks`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load tasks");
      }

      setTasks(data.active || []);
      setCompletedTasks(data.completed || []);
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to load saved tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  /* ============================================================
     ORGANIZE WITH AI
  ============================================================ */

  const handleOrganize = async () => {
    if (!note.trim()) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/organize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: note.trim(),
        }),
      });

      const data = await response.json();

      console.log("Organize response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to organize tasks");
      }

      /*
      Backend now returns the entire current
      active task list.

      This prevents frontend/backend state
      from becoming different.
    */

      if (Array.isArray(data.active)) {
        setTasks(data.active);
      } else if (Array.isArray(data.tasks)) {
        setTasks((currentTasks) => [...data.tasks, ...currentTasks]);
      }

      if (Array.isArray(data.completed)) {
        setCompletedTasks(data.completed);
      }

      setNote("");
    } catch (err) {
      console.error("Organize task error:", err);

      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     COMPLETE TASK
  ============================================================ */

  const completeTask = async (id) => {
    try {
      setCompletingId(id);
      setError("");

      const response = await fetch(`${API_URL}/api/tasks/${id}/complete`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to complete task");
      }

      setTasks(data.active || []);
      setCompletedTasks(data.completed || []);
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to mark task as completed");
    } finally {
      setCompletingId(null);
    }
  };

  /* ============================================================
     DELETE COMPLETED TASK
  ============================================================ */

  const deleteCompletedTask = async (id) => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/tasks/completed/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete completed task");
      }

      setCompletedTasks(data.completed || []);
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to delete completed task");
    }
  };

  /* ============================================================
     CLEAR HISTORY
  ============================================================ */

  const clearHistory = async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/tasks/completed`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to clear history");
      }

      setCompletedTasks([]);
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to clear history");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleString();
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div>
            <h1>FriendFlow</h1>
            <p>Turn messy thoughts into clear actions.</p>
          </div>

          <div className="local-ai-badge">
            <span className="status-dot"></span>
            Local AI
          </div>
        </header>

        <section className="hero-card">
          <div className="privacy-note">
            Your notes stay private and are processed locally.
          </div>

          <label htmlFor="note">What's on your mind?</label>

          <textarea
            id="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Example: Tomorrow I need to call Kasun, send the supplier invoice, buy printer paper, and remind Nimal about the meeting."
            rows={7}
          />

          <button
            className="organize-button"
            onClick={handleOrganize}
            disabled={!note.trim() || loading}
          >
            {loading ? "Organizing..." : "Organize with AI"}
          </button>

          {error && <div className="error-message">{error}</div>}
        </section>

        {/* ======================================================
            ACTIVE TASKS
        ====================================================== */}

        <section className="tasks-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR ACTIONS</span>

              <h2>Organized tasks</h2>
            </div>

            {tasks.length > 0 && (
              <span className="task-count">{tasks.length} tasks</span>
            )}
          </div>

          {loadingTasks ? (
            <div className="empty-state">
              <p>Loading your tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>

              <h3>You're all caught up</h3>

              <p>
                Paste a messy note above and let FriendFlow organize it into
                clear actions.
              </p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div className="task-card" key={task.id}>
                  <button
                    className="check-button"
                    onClick={() => completeTask(task.id)}
                    disabled={completingId === task.id}
                    aria-label="Complete task"
                    title="Mark as completed"
                  >
                    {completingId === task.id ? "..." : "✓"}
                  </button>

                  <div className="task-content">
                    <h3>{task.title}</h3>

                    <div className="task-meta">
                      <span>{task.dueDate}</span>

                      <span
                        className={`priority priority-${(
                          task.priority || "Medium"
                        ).toLowerCase()}`}
                      >
                        {task.priority || "Medium"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ======================================================
            COMPLETED TASK HISTORY
        ====================================================== */}

        <section className="tasks-section history-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PREVIOUS TASKS</span>

              <h2>Completed history</h2>
            </div>

            <div className="history-actions">
              {completedTasks.length > 0 && (
                <>
                  <span className="task-count">
                    {completedTasks.length} completed
                  </span>

                  <button
                    className="clear-history-button"
                    onClick={clearHistory}
                  >
                    Clear history
                  </button>
                </>
              )}
            </div>
          </div>

          {completedTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>

              <h3>No completed tasks yet</h3>

              <p>
                Tasks you finish will appear here so you can see what you've
                accomplished.
              </p>
            </div>
          ) : (
            <div className="task-list">
              {completedTasks.map((task) => (
                <div className="task-card completed history-card" key={task.id}>
                  <div className="completed-icon">✓</div>

                  <div className="task-content">
                    <h3>{task.title}</h3>

                    <div className="task-meta">
                      <span>{task.dueDate}</span>

                      <span
                        className={`priority priority-${(
                          task.priority || "Medium"
                        ).toLowerCase()}`}
                      >
                        {task.priority || "Medium"}
                      </span>

                      {task.completedAt && (
                        <span className="completed-date">
                          Completed {formatDate(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="delete-history-button"
                    onClick={() => deleteCompletedTask(task.id)}
                    aria-label="Delete completed task"
                    title="Delete from history"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
