// ── Storage helpers ──────────────────────────────────────────────
const get = key => JSON.parse(localStorage.getItem(key) || 'null');
const set = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── Navigation ───────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.section).classList.add('active');
  });
});

// ── Date display ─────────────────────────────────────────────────
function updateDate() {
  const now = new Date();
  const opts = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('sidebarDate').innerHTML =
    now.toLocaleDateString('en-US', opts).replace(', ', '<br>');
}
updateDate();
setInterval(updateDate, 60000);

// ════════════════════════════════════════════════════════════════
// TASKS
// ════════════════════════════════════════════════════════════════
let taskFilter = 'all';

function getTasks() { return get('tasks') || []; }
function saveTasks(t) { set('tasks', t); }

function addTask() {
  const input = document.getElementById('taskInput');
  const priority = document.getElementById('taskPriority').value;
  const text = input.value.trim();
  if (!text) return;
  const tasks = getTasks();
  tasks.unshift({ id: Date.now(), text, priority, done: false });
  saveTasks(tasks);
  input.value = '';
  renderTasks();
}

function toggleTask(id) {
  const tasks = getTasks().map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(id) {
  saveTasks(getTasks().filter(t => t.id !== id));
  renderTasks();
}

function filterTasks(filter, btn) {
  taskFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const tasks = getTasks();
  const filtered = tasks.filter(t => {
    if (taskFilter === 'active') return !t.done;
    if (taskFilter === 'done') return t.done;
    return true;
  });
  const list = document.getElementById('taskList');
  const active = tasks.filter(t => !t.done).length;
  document.getElementById('taskCount').textContent =
    `${active} remaining · ${tasks.length} total`;

  list.innerHTML = filtered.map(t => `
    <li class="task-item">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id})" />
      <span class="priority-dot priority-${t.priority}"></span>
      <span class="task-text ${t.done ? 'done' : ''}">${escape(t.text)}</span>
      <button class="task-delete" onclick="deleteTask(${t.id})">&#10005;</button>
    </li>
  `).join('');
}

document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

// ════════════════════════════════════════════════════════════════
// GOALS
// ════════════════════════════════════════════════════════════════
function getGoals() { return get('goals') || []; }
function saveGoals(g) { set('goals', g); }

function addGoal() {
  const input = document.getElementById('goalInput');
  const text = input.value.trim();
  if (!text) return;
  const goals = getGoals();
  goals.unshift({ id: Date.now(), text, progress: 0 });
  saveGoals(goals);
  input.value = '';
  renderGoals();
}

function updateProgress(id, delta) {
  const goals = getGoals().map(g => g.id === id
    ? { ...g, progress: Math.min(100, Math.max(0, g.progress + delta)) }
    : g);
  saveGoals(goals);
  renderGoals();
}

function deleteGoal(id) {
  saveGoals(getGoals().filter(g => g.id !== id));
  renderGoals();
}

function renderGoals() {
  const list = document.getElementById('goalsList');
  const goals = getGoals();
  if (!goals.length) {
    list.innerHTML = '<p style="color:var(--muted);font-size:0.9rem">No goals yet. Add one above.</p>';
    return;
  }
  list.innerHTML = goals.map(g => `
    <div class="goal-item">
      <div class="goal-top">
        <span class="goal-text">${escape(g.text)}</span>
        <div class="goal-actions">
          <button onclick="updateProgress(${g.id}, -10)">−10%</button>
          <button onclick="updateProgress(${g.id}, 10)">+10%</button>
          <button class="goal-delete" onclick="deleteGoal(${g.id})">&#10005;</button>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${g.progress}%"></div>
      </div>
      <div class="progress-label">${g.progress}% complete</div>
    </div>
  `).join('');
}

document.getElementById('goalInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addGoal();
});

// ════════════════════════════════════════════════════════════════
// JOURNAL
// ════════════════════════════════════════════════════════════════
let journalDate = new Date();
journalDate.setHours(0, 0, 0, 0);

function journalKey(d) {
  return `journal_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function loadJournal() {
  const key = journalKey(journalDate);
  const entry = get(key) || { text: '', mood: '' };
  document.getElementById('journalEntry').value = entry.text;
  document.getElementById('journalLabel').textContent =
    journalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  document.querySelectorAll('.mood-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.mood === entry.mood);
  });
  document.getElementById('journalSaved').textContent = '';
}

function saveJournal() {
  const key = journalKey(journalDate);
  const mood = document.querySelector('.mood-btn.selected')?.dataset.mood || '';
  set(key, { text: document.getElementById('journalEntry').value, mood });
  const msg = document.getElementById('journalSaved');
  msg.textContent = 'Saved.';
  setTimeout(() => msg.textContent = '', 2000);
}

function setMood(mood) {
  document.querySelectorAll('.mood-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.mood === mood);
  });
}

function journalPrev() {
  journalDate.setDate(journalDate.getDate() - 1);
  loadJournal();
}

function journalNext() {
  const tomorrow = new Date(); tomorrow.setHours(0,0,0,0); tomorrow.setDate(tomorrow.getDate() + 1);
  if (journalDate < tomorrow) { journalDate.setDate(journalDate.getDate() + 1); loadJournal(); }
}

loadJournal();

// ════════════════════════════════════════════════════════════════
// NOTES
// ════════════════════════════════════════════════════════════════
let activeNoteId = null;
let noteTimer = null;

function getNotes() { return get('notes') || []; }
function saveNotes(n) { set('notes', n); }

function newNote() {
  const title = document.getElementById('noteTitleInput').value.trim() || 'Untitled';
  const notes = getNotes();
  const note = { id: Date.now(), title, content: '' };
  notes.unshift(note);
  saveNotes(notes);
  document.getElementById('noteTitleInput').value = '';
  renderNotesList();
  openNote(note.id);
}

function openNote(id) {
  activeNoteId = id;
  const note = getNotes().find(n => n.id === id);
  if (!note) return;
  document.getElementById('noteContent').value = note.content;
  document.getElementById('noteTitleDisplay').textContent = note.title;
  document.querySelectorAll('.note-list-item').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.id) === id);
  });
}

function autoSaveNote() {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    if (!activeNoteId) return;
    const notes = getNotes().map(n =>
      n.id === activeNoteId ? { ...n, content: document.getElementById('noteContent').value } : n
    );
    saveNotes(notes);
  }, 500);
}

function deleteNote(id) {
  saveNotes(getNotes().filter(n => n.id !== id));
  if (activeNoteId === id) {
    activeNoteId = null;
    document.getElementById('noteContent').value = '';
    document.getElementById('noteTitleDisplay').textContent = 'Select a note';
  }
  renderNotesList();
}

function renderNotesList() {
  const list = document.getElementById('notesList');
  const notes = getNotes();
  list.innerHTML = notes.map(n => `
    <li class="note-list-item ${n.id === activeNoteId ? 'active' : ''}" data-id="${n.id}" onclick="openNote(${n.id})">
      <span>${escape(n.title)}</span>
      <button class="note-del" onclick="event.stopPropagation();deleteNote(${n.id})">&#10005;</button>
    </li>
  `).join('');
}

renderNotesList();

// ════════════════════════════════════════════════════════════════
// IDEAS
// ════════════════════════════════════════════════════════════════
function getIdeas() { return get('ideas') || []; }
function saveIdeas(i) { set('ideas', i); }

function addIdea() {
  const input = document.getElementById('ideaInput');
  const text = input.value.trim();
  if (!text) return;
  const ideas = getIdeas();
  ideas.unshift({ id: Date.now(), text, date: new Date().toLocaleDateString() });
  saveIdeas(ideas);
  input.value = '';
  renderIdeas();
}

function deleteIdea(id) {
  saveIdeas(getIdeas().filter(i => i.id !== id));
  renderIdeas();
}

function renderIdeas() {
  const grid = document.getElementById('ideasGrid');
  const ideas = getIdeas();
  if (!ideas.length) {
    grid.innerHTML = '<p style="color:var(--muted);font-size:0.9rem">No ideas yet. Capture one above.</p>';
    return;
  }
  grid.innerHTML = ideas.map(i => `
    <div class="idea-card">
      <button class="idea-del" onclick="deleteIdea(${i.id})">&#10005;</button>
      <p class="idea-text">${escape(i.text)}</p>
      <p class="idea-meta">${i.date}</p>
    </div>
  `).join('');
}

document.getElementById('ideaInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addIdea();
});

// ════════════════════════════════════════════════════════════════
// CALENDAR
// ════════════════════════════════════════════════════════════════
let calDate = new Date();
let selectedCalDay = null;

function getEvents() { return get('cal_events') || {}; }
function saveEvents(e) { set('cal_events', e); }

function calKey(y, m, d) { return `${y}_${m}_${d}`; }

function renderCal() {
  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const today = new Date();
  const events = getEvents();

  document.getElementById('calLabel').textContent =
    calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = days.map(d => `<div class="cal-day-label">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const key = calKey(year, month, d);
    const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
    const isSelected = selectedCalDay === key;
    const hasEvents = events[key] && events[key].length > 0;
    html += `<div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}"
      onclick="selectDay(${year},${month},${d})">${d}</div>`;
  }

  document.getElementById('calGrid').innerHTML = html;
}

function selectDay(y, m, d) {
  selectedCalDay = calKey(y, m, d);
  renderCal();
  const panel = document.getElementById('calEventPanel');
  const label = new Date(y, m, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  document.getElementById('calEventDate').textContent = label;
  panel.style.display = 'block';
  renderCalEvents();
}

function addCalEvent() {
  const input = document.getElementById('calEventInput');
  const text = input.value.trim();
  if (!text || !selectedCalDay) return;
  const events = getEvents();
  if (!events[selectedCalDay]) events[selectedCalDay] = [];
  events[selectedCalDay].push({ id: Date.now(), text });
  saveEvents(events);
  input.value = '';
  renderCalEvents();
  renderCal();
}

function deleteCalEvent(eventId) {
  const events = getEvents();
  if (events[selectedCalDay]) {
    events[selectedCalDay] = events[selectedCalDay].filter(e => e.id !== eventId);
  }
  saveEvents(events);
  renderCalEvents();
  renderCal();
}

function renderCalEvents() {
  const events = getEvents();
  const list = document.getElementById('calEventsList');
  const dayEvents = (events[selectedCalDay] || []);
  list.innerHTML = dayEvents.map(e => `
    <li class="cal-event-item">
      <span>${escape(e.text)}</span>
      <button class="cal-event-del" onclick="deleteCalEvent(${e.id})">&#10005;</button>
    </li>
  `).join('');
}

document.getElementById('calEventInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addCalEvent();
});

function calPrev() { calDate.setMonth(calDate.getMonth() - 1); selectedCalDay = null; document.getElementById('calEventPanel').style.display = 'none'; renderCal(); }
function calNext() { calDate.setMonth(calDate.getMonth() + 1); selectedCalDay = null; document.getElementById('calEventPanel').style.display = 'none'; renderCal(); }

renderCal();

// ── Init all renders ─────────────────────────────────────────────
renderTasks();
renderGoals();
renderIdeas();

// ── Escape helper ────────────────────────────────────────────────
function escape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
