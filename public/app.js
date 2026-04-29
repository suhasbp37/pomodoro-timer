const MODE_TIME = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

let currentMode = "pomodoro";
let timeLeft = MODE_TIME[currentMode];
let timerId = null;
let running = false;
let completedPomodoros = 0;

const TASKS_KEY = "pomodoro_tasks_v1";
let tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];

const timeDisplay = document.getElementById("timeDisplay");
const statusText = document.getElementById("statusText");
const modeButtons = document.querySelectorAll(".mode-btn");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateTimerUI() {
  timeDisplay.textContent = formatTime(timeLeft);
}

function setStatusByMode() {
  if (currentMode === "pomodoro") statusText.textContent = "Focus time";
  if (currentMode === "shortBreak") statusText.textContent = "Short break";
  if (currentMode === "longBreak") statusText.textContent = "Long break";
}

function switchMode(mode, stopTimer = true) {
  currentMode = mode;
  timeLeft = MODE_TIME[mode];

  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  if (stopTimer) stopTimerFn();
  setStatusByMode();
  updateTimerUI();
}

function playAlertSound() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const now = context.currentTime;

  [0, 0.18, 0.36].forEach((offset) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.12);
  });
}

function getNextMode() {
  if (currentMode === "pomodoro") {
    completedPomodoros += 1;
    return completedPomodoros % 4 === 0 ? "longBreak" : "shortBreak";
  }
  return "pomodoro";
}

function tick() {
  if (timeLeft > 0) {
    timeLeft -= 1;
    updateTimerUI();
    return;
  }

  playAlertSound();
  const nextMode = getNextMode();
  switchMode(nextMode, false);
}

function startTimer() {
  if (running) return;
  running = true;
  timerId = setInterval(tick, 1000);
}

function stopTimerFn() {
  running = false;
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function resetTimer() {
  stopTimerFn();
  timeLeft = MODE_TIME[currentMode];
  updateTimerUI();
  setStatusByMode();
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    if (task.completed) li.classList.add("completed");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(delBtn);

    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({
    id: Date.now().toString(),
    text,
    completed: false
  });

  taskInput.value = "";
  saveTasks();
  renderTasks();
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchMode(btn.dataset.mode));
});

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", stopTimerFn);
resetBtn.addEventListener("click", resetTimer);

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

setStatusByMode();
updateTimerUI();
renderTasks();