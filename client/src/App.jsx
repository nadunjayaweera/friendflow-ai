import { useState } from "react";
import "./App.css";

function App() {
  const [note, setNote] = useState("");
  const [tasks, setTasks] = useState([]);

  const handleOrganize = () => {
    if (!note.trim()) return;

    // Temporary fake AI response
    setTasks([
      {
        id: 1,
        title: "Call Kasun about the meeting",
        dueDate: "Tomorrow",
        priority: "High",
        completed: false,
      },
      {
        id: 2,
        title: "Send the supplier invoice",
        dueDate: "Today",
        priority: "Medium",
        completed: false,
      },
      {
        id: 3,
        title: "Buy printer paper",
        dueDate: "This week",
        priority: "Low",
        completed: false,
      },
    ]);
  };

  const toggleTask = (id) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
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
            🔒 Your notes stay private and are processed locally.
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
            disabled={!note.trim()}
          >
            ✨ Organize with AI
          </button>
        </section>

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

          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>No tasks yet</h3>
              <p>
                Paste a messy note above and let FriendFlow organize it into
                clear actions.
              </p>
            </div>
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <div
                  className={`task-card ${task.completed ? "completed" : ""}`}
                  key={task.id}
                >
                  <button
                    className="check-button"
                    onClick={() => toggleTask(task.id)}
                    aria-label="Toggle task"
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  <div className="task-content">
                    <h3>{task.title}</h3>

                    <div className="task-meta">
                      <span>{task.dueDate}</span>

                      <span
                        className={`priority priority-${task.priority.toLowerCase()}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
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
