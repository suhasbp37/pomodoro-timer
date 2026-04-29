const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, "tasks.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, "[]", "utf-8");
  }
  const data = fs.readFileSync(TASKS_FILE, "utf-8");
  return JSON.parse(data);
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf-8");
}

// GET /tasks
app.get("/tasks", (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// POST /tasks
app.post("/tasks", (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Task text is required" });
  }

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    text: text.trim(),
    completed: false
  };

  tasks.push(newTask);
  writeTasks(tasks);

  res.status(201).json(newTask);
});

// DELETE /tasks/:id
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();

  const updatedTasks = tasks.filter((task) => task.id !== id);

  if (updatedTasks.length === tasks.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  writeTasks(updatedTasks);
  res.json({ message: "Task deleted" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});