const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FriendFlow API is running",
  });
});

app.post("/api/organize", async (req, res) => {
  try {
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note is required",
      });
    }

    const prompt = `
You are the AI engine for FriendFlow.

Your job is to convert messy notes into clear actionable tasks.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations.
Do not include code fences.

Use this exact format:

[
  {
    "title": "Task title",
    "dueDate": "Today | Tomorrow | This week | No date",
    "priority": "High | Medium | Low"
  }
]

Rules:
- Extract only real actionable tasks.
- Keep task titles short and clear.
- Detect dates from the user's note when possible.
- If no deadline exists, use "No date".
- Use High priority only for urgent or time-sensitive tasks.
- Use Medium for normal tasks.
- Use Low for non-urgent tasks.

User note:

${note}
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
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama request failed: ${ollamaResponse.status}`);
    }

    const ollamaData = await ollamaResponse.json();

    const content = ollamaData.message?.content;

    if (!content) {
      throw new Error("No response received from Gemma");
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      console.error("Invalid AI JSON:", content);

      return res.status(500).json({
        success: false,
        message: "AI returned invalid JSON",
        raw: content,
      });
    }

    // Sometimes the model may return:
    // { "tasks": [...] }
    // instead of directly returning [...]
    const tasks = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.tasks)
        ? parsed.tasks
        : [];

    const normalizedTasks = tasks.map((task, index) => ({
      id: Date.now() + index,
      title: task.title || "Untitled task",
      dueDate: task.dueDate || "No date",
      priority: ["High", "Medium", "Low"].includes(task.priority)
        ? task.priority
        : "Medium",
      completed: false,
    }));

    return res.json({
      success: true,
      tasks: normalizedTasks,
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FriendFlow API running on port ${PORT}`);
});
