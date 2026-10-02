# FriendFlow AI

FriendFlow is a privacy-first AI task organizer built for the **Hacktoberfest 2026 Weekend Challenge: Build for a Friend**.

It turns messy notes into clear, actionable tasks using an open-weight AI model running locally on the user's computer.

## The Problem

I built FriendFlow for a friend who often writes several tasks, reminders, and ideas inside one unstructured note.

For example:

> Tomorrow I need to call Kasun, send the report today, buy milk, and remind Nimal about the project.

Reading through these notes later and separating everything into individual tasks can be inconvenient.

## The Solution

FriendFlow lets the user paste a messy note and uses AI to automatically identify individual tasks.

The AI extracts:

- Task title
- Due date
- Priority

The user can then mark tasks as completed.

Completed tasks are removed from the active task list and stored in a local task history.

## Example

Input:

```text
Tomorrow I need to call Kasun, send the report today,
buy milk and remind Nimal about the project.
```

FriendFlow can organize it into:

```text
Call Kasun
Tomorrow
High Priority

Send the report
Today
High Priority

Buy milk
No date
Medium Priority

Remind Nimal
No date
Low Priority
```

## Features

- Convert unstructured notes into actionable tasks
- AI-powered task extraction
- Automatic priority detection
- Automatic deadline detection
- Mark tasks as completed
- Completed task history
- Persistent local task storage
- Local AI inference
- No cloud AI API required

## Tech Stack

### Frontend

- React
- Vite
- CSS

### Backend

- Node.js
- Express

### AI

- Ollama
- Gemma 3 1B

### Storage

- Local JSON storage

## How It Works

FriendFlow follows this flow:

```text
User Note
    ↓
React Frontend
    ↓
Node.js / Express API
    ↓
Ollama
    ↓
Gemma 3 1B
    ↓
Structured JSON Tasks
    ↓
React Task List
    ↓
Local JSON Storage
```

The React frontend sends the user's note to the Express backend.

The backend sends the note to **Gemma 3 1B** through Ollama.

Gemma analyzes the note and returns structured task information.

The backend validates the result, stores the tasks locally, and returns them to the frontend.

## Why Local AI?

FriendFlow was intentionally designed around local AI.

Personal notes can contain:

- Names
- Work information
- Personal reminders
- Private plans
- Sensitive information

Instead of sending those notes to an external AI provider, FriendFlow runs the AI model locally using Ollama.

This means the user's notes can remain on their own computer.

## Why Open Innovation Matters

Using an open-weight model gives FriendFlow several advantages.

### Privacy

The user's notes do not need to be sent to a third-party AI service.

### Local Inference

Gemma can run directly on the user's machine through Ollama.

### No Per-Request AI Cost

FriendFlow does not depend on a paid AI API for every task extraction request.

### Model Flexibility

The AI model can be replaced or upgraded without redesigning the entire application.

For example, another Ollama-supported model could be used instead of Gemma.

### User Control

The user controls where the AI runs and where their task data is stored.

## Project Structure

```text
friendflow-ai/
├── client/
│   ├── src/
│   |    ├── App.jsx
│   |    ├── App.css
│   ├── package.json
│   └── ...
│
├── server/
│   ├── data/
│   │   └── tasks.json
│   ├── index.js
│   ├── package.json
│   └── ...
│
└── README.md
```

## Requirements

Before running FriendFlow, install:

- Node.js
- npm
- Ollama

## Install Ollama

Download and install Ollama from:

```text
https://ollama.com
```

Verify the installation:

```bash
ollama --version
```

## Download Gemma

FriendFlow currently uses **Gemma 3 1B**.

Run:

```bash
ollama pull gemma3:1b
```

You can test the model with:

```bash
ollama run gemma3:1b
```

## Run the Backend

Open a terminal:

```bash
cd server
npm install
npm run dev
```

The API should start on:

```text
http://localhost:5000
```

You can test it using:

```text
GET http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "FriendFlow API is running"
}
```

## Run the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Then open the URL shown by Vite in your browser.

Usually:

```text
http://localhost:5173
```

## Main API

### Organize Tasks

```text
POST /api/organize
```

Example request:

```json
{
  "note": "Tomorrow call Kasun and send the report today."
}
```

### Get Tasks

```text
GET /api/tasks
```

### Complete Task

```text
PATCH /api/tasks/:id/complete
```

### Delete Completed Task

```text
DELETE /api/tasks/completed/:id
```

### Clear Completed History

```text
DELETE /api/tasks/completed
```

## Data Storage

FriendFlow stores task information locally in:

```text
server/data/tasks.json
```

The file contains:

```json
{
  "active": [],
  "completed": []
}
```

This keeps the project lightweight and avoids requiring an external database.

## Privacy

FriendFlow is designed so that:

- AI inference runs locally
- Task data is stored locally
- No paid AI API is required
- Notes do not need to leave the user's machine

## Built for Hacktoberfest 2026

This project was created for the:

**Hacktoberfest 2026 Weekend Challenge: Build for a Friend**

Challenge theme:

> Build something that solves a real problem for a friend or someone you love.

FriendFlow was built to help turn unstructured personal notes into simple, manageable tasks.

## Prize Category

This project uses **Gemma 3** as its core AI model and is being submitted for:

**Best Use of Gemma**

## Status

The current version supports:

- AI task extraction
- Active tasks
- Task completion
- Completed task history
- Local persistence
- Local Gemma inference

## License

MIT
