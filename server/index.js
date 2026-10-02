const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

/* ============================================================
   JSON STORAGE
============================================================ */

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          active: [],
          completed: [],
        },
        null,
        2,
      ),
    );
  }
};

const readTasks = () => {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");

    if (!raw.trim()) {
      return {
        active: [],
        completed: [],
      };
    }

    const parsed = JSON.parse(raw);

    return {
      active: Array.isArray(parsed.active) ? parsed.active : [],
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch (error) {
    console.error("Failed to read tasks.json:", error);

    return {
      active: [],
      completed: [],
    };
  }
};

const writeTasks = (data) => {
  ensureDataFile();

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

/* ============================================================
   HEALTH
============================================================ */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FriendFlow API is running",
  });
});

/* ============================================================
   GET ALL TASKS
============================================================ */

app.get("/api/tasks", (req, res) => {
  try {
    const data = readTasks();

    return res.json({
      success: true,
      active: data.active,
      completed: data.completed,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load tasks",
    });
  }
});

/* ============================================================
   ORGANIZE NOTE WITH AI
============================================================ */

app.post("/api/organize", async (req, res) => {
  try {
    const { note } = req.body;

    if (!note || typeof note !== "string" || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note is required",
      });
    }

    const prompt = `
You are the AI engine for FriendFlow.

Convert the user's messy note into clear actionable tasks.

IMPORTANT:
Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not explain anything.

Always return this structure:

{
  "tasks": [
    {
      "title": "Task title",
      "dueDate": "Today",
      "priority": "High"
    }
  ]
}

Rules:
- Always include the "tasks" array.
- Extract only actionable tasks.
- Never return a single task object outside the tasks array.
- Keep task titles short and clear.
- Preserve important names such as people or companies.
- Detect deadlines when explicitly mentioned.
- Allowed dueDate values:
  "Today"
  "Tomorrow"
  "This week"
  "No date"
- Allowed priority values:
  "High"
  "Medium"
  "Low"
- High = urgent or explicitly time-sensitive.
- Medium = normal actionable work.
- Low = non-urgent task.
- If no deadline is mentioned use "No date".

User note:
${note.trim()}
`;

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:1b",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();

      console.error("Ollama error:", errorText);

      throw new Error(
        `Ollama request failed with status ${ollamaResponse.status}`,
      );
    }

    const ollamaData = await ollamaResponse.json();

    const content = ollamaData?.message?.content;

    if (!content) {
      throw new Error("No response received from Gemma");
    }

    console.log("Gemma raw response:");
    console.log(content);

    let parsed;

    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch (error) {
      console.error("Invalid AI JSON:", content);

      return res.status(500).json({
        success: false,
        message: "AI returned invalid JSON",
        raw: content,
      });
    }

    /*
      Handle possible AI response formats:

      [
        { ... }
      ]

      {
        "tasks": [
          { ... }
        ]
      }

      {
        "task": {
          ...
        }
      }

      {
        "title": "...",
        ...
      }
    */

    let extractedTasks = [];

    if (Array.isArray(parsed)) {
      extractedTasks = parsed;
    } else if (Array.isArray(parsed?.tasks)) {
      extractedTasks = parsed.tasks;
    } else if (parsed?.task && typeof parsed.task === "object") {
      extractedTasks = [parsed.task];
    } else if (parsed && typeof parsed === "object" && parsed.title) {
      extractedTasks = [parsed];
    }

    if (extractedTasks.length === 0) {
      console.error("Gemma response contained no usable tasks:", parsed);

      return res.status(422).json({
        success: false,
        message: "AI did not find any actionable tasks in the note.",
        raw: parsed,
      });
    }

    const allowedPriorities = ["High", "Medium", "Low"];

    const allowedDueDates = ["Today", "Tomorrow", "This week", "No date"];

    const now = Date.now();
    const createdAt = new Date().toISOString();

    const normalizedTasks = extractedTasks
      .filter(
        (task) =>
          task &&
          typeof task === "object" &&
          typeof task.title === "string" &&
          task.title.trim(),
      )
      .map((task, index) => {
        const priority = allowedPriorities.includes(task.priority)
          ? task.priority
          : "Medium";

        const dueDate = allowedDueDates.includes(task.dueDate)
          ? task.dueDate
          : "No date";

        return {
          id: `${now}-${index}`,
          title: task.title.trim(),
          dueDate,
          priority,
          createdAt,
          completedAt: null,
        };
      });

    if (normalizedTasks.length === 0) {
      return res.status(422).json({
        success: false,
        message: "AI response did not contain valid tasks.",
      });
    }

    const data = readTasks();

    data.active = [...normalizedTasks, ...data.active];

    writeTasks(data);

    return res.json({
      success: true,
      message: `${normalizedTasks.length} task(s) created`,
      tasks: normalizedTasks,

      // Important
      active: data.active,
      completed: data.completed,
    });
  } catch (error) {
    console.error("FriendFlow AI Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to organize tasks",
      error: error.message,
    });
  }
});

/* ============================================================
   COMPLETE TASK
============================================================ */

app.patch("/api/tasks/:id/complete", (req, res) => {
  try {
    const { id } = req.params;

    const data = readTasks();

    const taskIndex = data.active.findIndex(
      (task) => String(task.id) === String(id),
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const [task] = data.active.splice(taskIndex, 1);

    const completedTask = {
      ...task,
      completedAt: new Date().toISOString(),
    };

    data.completed.unshift(completedTask);

    writeTasks(data);

    return res.json({
      success: true,
      message: "Task completed",
      task: completedTask,
      active: data.active,
      completed: data.completed,
    });
  } catch (error) {
    console.error("Complete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete task",
    });
  }
});

/* ============================================================
   DELETE COMPLETED TASK
============================================================ */

app.delete("/api/tasks/completed/:id", (req, res) => {
  try {
    const { id } = req.params;

    const data = readTasks();

    const exists = data.completed.some(
      (task) => String(task.id) === String(id),
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Completed task not found",
      });
    }

    data.completed = data.completed.filter(
      (task) => String(task.id) !== String(id),
    );

    writeTasks(data);

    return res.json({
      success: true,
      message: "Completed task deleted",
      completed: data.completed,
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete task",
    });
  }
});

/* ============================================================
   CLEAR COMPLETED HISTORY
============================================================ */

app.delete("/api/tasks/completed", (req, res) => {
  try {
    const data = readTasks();

    data.completed = [];

    writeTasks(data);

    return res.json({
      success: true,
      message: "Completed task history cleared",
    });
  } catch (error) {
    console.error("Clear history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to clear history",
    });
  }
});

/* ============================================================
   SERVER
============================================================ */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  ensureDataFile();

  console.log(`FriendFlow API running on port ${PORT}`);
});
