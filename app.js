import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabase = createClient(
  'https://vvmnpnnwxehsdhirwboz.supabase.co',
  'sb_publishable_JfVCIJdAlfIgGmlCiG8F4g_WmqfGzdy'
)

// ── Status indicator ─────────────────────────────────────────────
function setStatus(ok) {
  const el = document.getElementById('dbStatus')
  el.textContent = ok ? '● connected' : '● offline'
  el.style.color = ok ? 'var(--success)' : 'var(--danger)'
}

// ── Navigation ───────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(btn.dataset.section).classList.add('active')
  })
})

// ── Date display ─────────────────────────────────────────────────
function updateDate() {
  const now = new Date()
  document.getElementById('sidebarDate').innerHTML =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).replace(', ', '<br>')
}
updateDate()
setInterval(updateDate, 60000)

// ── Escape helper ────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ════════════════════════════════════════════════════════════════
// TASKS
// ════════════════════════════════════════════════════════════════
let taskFilter = 'all'
let allTasks = []

async function loadTasks() {
  const { data, error } = await supabase
    .from('tasks').select('*').order('created_at', { ascending: false })
  setStatus(!error)
  if (!error) { allTasks = data; renderTasks() }
}

window.addTask = async function () {
  const input = document.getElementById('taskInput')
  const priority = document.getElementById('taskPriority').value
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  const { error } = await supabase.from('tasks').insert({ text, priority, done: false })
  if (!error) await loadTasks()
}

window.toggleTask = async function (id, done) {
  await supabase.from('tasks').update({ done }).eq('id', id)
  await loadTasks()
}

window.deleteTask = async function (id) {
  await supabase.from('tasks').delete().eq('id', id)
  await loadTasks()
}

window.filterTasks = function (filter, btn) {
  taskFilter = filter
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  renderTasks()
}

function renderTasks() {
  const filtered = allTasks.filter(t => {
    if (taskFilter === 'active') return !t.done
    if (taskFilter === 'done') return t.done
    return true
  })
  const active = allTasks.filter(t => !t.done).length
  document.getElementById('taskCount').textContent = `${active} remaining · ${allTasks.length} total`
  document.getElementById('taskList').innerHTML = filtered.map(t => `
    <li class="task-item">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id}, ${!t.done})" />
      <span class="priority-dot priority-${t.priority}"></span>
      <span class="task-text ${t.done ? 'done' : ''}">${esc(t.text)}</span>
      <button class="task-delete" onclick="deleteTask(${t.id})">&#10005;</button>
    </li>
  `).join('')
}

document.getElementById('taskInput').addEventListener('keydown', e => { if (e.key === 'Enter') window.addTask() })

// ════════════════════════════════════════════════════════════════
// GOALS
// ════════════════════════════════════════════════════════════════
async function loadGoals() {
  const { data, error } = await supabase
    .from('goals').select('*').order('created_at', { ascending: false })
  if (!error) renderGoals(data)
}

window.addGoal = async function () {
  const input = document.getElementById('goalInput')
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  await supabase.from('goals').insert({ text, progress: 0 })
  await loadGoals()
}

window.updateProgress = async function (id, delta, current) {
  const progress = Math.min(100, Math.max(0, current + delta))
  await supabase.from('goals').update({ progress }).eq('id', id)
  await loadGoals()
}

window.deleteGoal = async function (id) {
  await supabase.from('goals').delete().eq('id', id)
  await loadGoals()
}

function renderGoals(goals) {
  const list = document.getElementById('goalsList')
  if (!goals.length) {
    list.innerHTML = '<p style="color:var(--muted);font-size:0.9rem">No goals yet. Add one above.</p>'
    return
  }
  list.innerHTML = goals.map(g => `
    <div class="goal-item">
      <div class="goal-top">
        <span class="goal-text">${esc(g.text)}</span>
        <div class="goal-actions">
          <button onclick="updateProgress(${g.id}, -10, ${g.progress})">−10%</button>
          <button onclick="updateProgress(${g.id}, 10, ${g.progress})">+10%</button>
          <button class="goal-delete" onclick="deleteGoal(${g.id})">&#10005;</button>
        </div>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${g.progress}%"></div></div>
      <div class="progress-label">${g.progress}% complete</div>
    </div>
  `).join('')
}

document.getElementById('goalInput').addEventListener('keydown', e => { if (e.key === 'Enter') window.addGoal() })

// ════════════════════════════════════════════════════════════════
// JOURNAL
// ════════════════════════════════════════════════════════════════
let journalDate = new Date()
journalDate.setHours(0, 0, 0, 0)

function journalKey(d) { return `${d.getFullYear()}_${d.getMonth()}_${d.getDate()}` }

async function loadJournal() {
  const key = journalKey(journalDate)
  const { data } = await supabase.from('journal_entries').select('*').eq('date_key', key).maybeSingle()
  document.getElementById('journalEntry').value = data?.text || ''
  document.getElementById('journalLabel').textContent =
    journalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  document.querySelectorAll('.mood-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.mood === (data?.mood || ''))
  })
  document.getElementById('journalSaved').textContent = ''
}

window.saveJournal = async function () {
  const key = journalKey(journalDate)
  const text = document.getElementById('journalEntry').value
  const mood = document.querySelector('.mood-btn.selected')?.dataset.mood || ''
  await supabase.from('journal_entries')
    .upsert({ date_key: key, text, mood, updated_at: new Date().toISOString() }, { onConflict: 'date_key' })
  const msg = document.getElementById('journalSaved')
  msg.textContent = 'Saved.'
  setTimeout(() => msg.textContent = '', 2000)
}

window.setMood = function (mood) {
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('selected', b.dataset.mood === mood))
}

window.journalPrev = function () { journalDate.setDate(journalDate.getDate() - 1); loadJournal() }
window.journalNext = function () {
  const tomorrow = new Date(); tomorrow.setHours(0,0,0,0); tomorrow.setDate(tomorrow.getDate() + 1)
  if (journalDate < tomorrow) { journalDate.setDate(journalDate.getDate() + 1); loadJournal() }
}

// ════════════════════════════════════════════════════════════════
// NOTES
// ════════════════════════════════════════════════════════════════
let activeNoteId = null
let noteTimer = null
let allNotes = []

async function loadNotes() {
  const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
  allNotes = data || []
  renderNotesList()
}

window.newNote = async function () {
  const title = document.getElementById('noteTitleInput').value.trim() || 'Untitled'
  document.getElementById('noteTitleInput').value = ''
  const { data } = await supabase.from('notes').insert({ title, content: '' }).select().single()
  await loadNotes()
  if (data) openNote(data.id)
}

window.openNote = function (id) {
  activeNoteId = id
  const note = allNotes.find(n => n.id === id)
  if (!note) return
  document.getElementById('noteContent').value = note.content
  document.getElementById('noteTitleDisplay').textContent = note.title
  document.querySelectorAll('.note-list-item').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.id) === id)
  })
}

window.autoSaveNote = function () {
  clearTimeout(noteTimer)
  noteTimer = setTimeout(async () => {
    if (!activeNoteId) return
    const content = document.getElementById('noteContent').value
    await supabase.from('notes').update({ content, updated_at: new Date().toISOString() }).eq('id', activeNoteId)
    allNotes = allNotes.map(n => n.id === activeNoteId ? { ...n, content } : n)
  }, 600)
}

window.deleteNote = async function (id) {
  await supabase.from('notes').delete().eq('id', id)
  if (activeNoteId === id) {
    activeNoteId = null
    document.getElementById('noteContent').value = ''
    document.getElementById('noteTitleDisplay').textContent = 'Select a note'
  }
  await loadNotes()
}

function renderNotesList() {
  document.getElementById('notesList').innerHTML = allNotes.map(n => `
    <li class="note-list-item ${n.id === activeNoteId ? 'active' : ''}" data-id="${n.id}" onclick="openNote(${n.id})">
      <span>${esc(n.title)}</span>
      <button class="note-del" onclick="event.stopPropagation();deleteNote(${n.id})">&#10005;</button>
    </li>
  `).join('')
}

// ════════════════════════════════════════════════════════════════
// IDEAS
// ════════════════════════════════════════════════════════════════
async function loadIdeas() {
  const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false })
  renderIdeas(data || [])
}

window.addIdea = async function () {
  const input = document.getElementById('ideaInput')
  const text = input.value.trim()
  if (!text) return
  input.value = ''
  const date = new Date().toLocaleDateString()
  await supabase.from('ideas').insert({ text, date })
  await loadIdeas()
}

window.deleteIdea = async function (id) {
  await supabase.from('ideas').delete().eq('id', id)
  await loadIdeas()
}

function renderIdeas(ideas) {
  const grid = document.getElementById('ideasGrid')
  if (!ideas.length) {
    grid.innerHTML = '<p style="color:var(--muted);font-size:0.9rem">No ideas yet. Capture one above.</p>'
    return
  }
  grid.innerHTML = ideas.map(i => `
    <div class="idea-card">
      <button class="idea-del" onclick="deleteIdea(${i.id})">&#10005;</button>
      <p class="idea-text">${esc(i.text)}</p>
      <p class="idea-meta">${i.date || ''}</p>
    </div>
  `).join('')
}

document.getElementById('ideaInput').addEventListener('keydown', e => { if (e.key === 'Enter') window.addIdea() })

// ════════════════════════════════════════════════════════════════
// CALENDAR
// ════════════════════════════════════════════════════════════════
let calDate = new Date()
let selectedCalDay = null
let calEvents = {}

async function loadCalEvents() {
  const { data } = await supabase.from('calendar_events').select('*')
  calEvents = {}
  ;(data || []).forEach(e => {
    if (!calEvents[e.date_key]) calEvents[e.date_key] = []
    calEvents[e.date_key].push(e)
  })
  renderCal()
}

function renderCal() {
  const year = calDate.getFullYear(), month = calDate.getMonth()
  const today = new Date()
  document.getElementById('calLabel').textContent =
    calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let html = days.map(d => `<div class="cal-day-label">${d}</div>`).join('')
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>'
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}_${month}_${d}`
    const isToday = today.getDate()===d && today.getMonth()===month && today.getFullYear()===year
    const isSelected = selectedCalDay === key
    const hasEvents = calEvents[key]?.length > 0
    html += `<div class="cal-day ${isToday?'today':''} ${isSelected?'selected':''} ${hasEvents?'has-events':''}"
      onclick="selectDay(${year},${month},${d})">${d}</div>`
  }
  document.getElementById('calGrid').innerHTML = html
}

window.selectDay = function (y, m, d) {
  selectedCalDay = `${y}_${m}_${d}`
  renderCal()
  const label = new Date(y, m, d).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
  document.getElementById('calEventDate').textContent = label
  document.getElementById('calEventPanel').style.display = 'block'
  renderCalEvents()
}

window.addCalEvent = async function () {
  const input = document.getElementById('calEventInput')
  const text = input.value.trim()
  if (!text || !selectedCalDay) return
  input.value = ''
  await supabase.from('calendar_events').insert({ date_key: selectedCalDay, text })
  await loadCalEvents()
  renderCalEvents()
}

window.deleteCalEvent = async function (id) {
  await supabase.from('calendar_events').delete().eq('id', id)
  await loadCalEvents()
  renderCalEvents()
}

function renderCalEvents() {
  const events = calEvents[selectedCalDay] || []
  document.getElementById('calEventsList').innerHTML = events.map(e => `
    <li class="cal-event-item">
      <span>${esc(e.text)}</span>
      <button class="cal-event-del" onclick="deleteCalEvent(${e.id})">&#10005;</button>
    </li>
  `).join('')
}

document.getElementById('calEventInput').addEventListener('keydown', e => { if (e.key === 'Enter') window.addCalEvent() })

window.calPrev = function () { calDate.setMonth(calDate.getMonth()-1); selectedCalDay=null; document.getElementById('calEventPanel').style.display='none'; renderCal() }
window.calNext = function () { calDate.setMonth(calDate.getMonth()+1); selectedCalDay=null; document.getElementById('calEventPanel').style.display='none'; renderCal() }

// ── Boot ─────────────────────────────────────────────────────────
async function init() {
  await Promise.all([loadTasks(), loadGoals(), loadNotes(), loadIdeas(), loadCalEvents()])
  loadJournal()
}

init()
