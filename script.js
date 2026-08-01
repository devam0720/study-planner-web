const STORAGE_KEY = 'studyloop-state-v1';
const AUTH_KEY = 'studyloop-auth-v1';
const DEFAULT_THEME = 'light';
const LEVEL_XP = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

const defaultData = () => ({
    user: {
        name: '',
        email: 'student@example.com',
        password: 'studyloop',
        avatar: '',
        theme: DEFAULT_THEME,
        notifications: true
    },
    xp: 260,
    streak: 6,
    focusMinutesToday: 90,
    completedSessions: 11,
    tasks: [
        {
            id: crypto.randomUUID(),
            name: 'Math assignment',
            description: 'Finish the problem set and upload it before 9 PM.',
            priority: 'High',
            category: 'Assignment',
            deadline: tomorrowAt(18, 0),
            duration: '45 min',
            repeat: 'Never',
            reminder: '1 hour before',
            completed: false
        },
        {
            id: crypto.randomUUID(),
            name: 'Physics revision',
            description: 'Review formula sheet and solve 10 sample problems.',
            priority: 'Medium',
            category: 'Study',
            deadline: tomorrowAt(20, 0),
            duration: '60 min',
            repeat: 'Never',
            reminder: '10 minutes before',
            completed: false
        },
        {
            id: crypto.randomUUID(),
            name: 'Read chemistry notes',
            description: 'Quick review before tomorrow’s class.',
            priority: 'Low',
            category: 'Personal',
            deadline: addDaysToDate(3, 17, 0),
            duration: '30 min',
            repeat: 'Never',
            reminder: 'None',
            completed: true
        }
    ],
    plannerBlocks: [
        { id: crypto.randomUUID(), start: '09:00', end: '10:00', task: 'Math', notes: 'Derivatives and practice set' },
        { id: crypto.randomUUID(), start: '10:30', end: '11:30', task: 'Chemistry', notes: 'Revise reactions and summaries' },
        { id: crypto.randomUUID(), start: '14:00', end: '15:00', task: 'Pomodoro session', notes: 'Deep focus block for assignment' }
    ],
    timetableRows: [
        ['09:00', 'Math', 'Physics', 'Chemistry', 'Study', 'Project', 'Gym', 'Rest'],
        ['11:00', 'Assignment', 'Class', 'Assignment', 'Class', 'Project', 'Free', 'Free'],
        ['14:00', 'Revision', 'Revision', 'Revision', 'Lab', 'Focus', 'Rest', 'Rest']
    ],
    achievements: [
        { id: 'focus-1', title: 'Complete 1 hour focus', threshold: 60, reward: 30, emoji: '🌱' },
        { id: 'focus-5', title: 'Complete 5 hours focus', threshold: 300, reward: 75, emoji: '🌿' },
        { id: 'focus-10', title: 'Complete 10 hours focus', threshold: 600, reward: 120, emoji: '🪴' },
        { id: 'focus-25', title: 'Complete 25 hours focus', threshold: 1500, reward: 220, emoji: '🌳' },
        { id: 'focus-50', title: 'Complete 50 hours focus', threshold: 3000, reward: 400, emoji: '🌲' },
        { id: 'focus-100', title: 'Complete 100 hours focus', threshold: 6000, reward: 900, emoji: '🏆' }
    ],
    session: {
        running: false,
        mode: 'focus',
        duration: 25 * 60,
        remaining: 25 * 60,
        breakDuration: 5 * 60,
        timer: null,
        breakActive: false,
        progress: 0
    },
    lastLogin: null
});

function tomorrowAt(hours, minutes) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
}

function addDaysToDate(days, hours, minutes) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
}

function loadState() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        return parsed ? { ...defaultData(), ...parsed, session: { ...defaultData().session, ...(parsed.session || {}) } } : defaultData();
    } catch {
        return defaultData();
    }
}

let state = loadState();

function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setAuth(isAuthed) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ authed: isAuthed, at: Date.now() }));
}

function getAuth() {
    try {
        return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch {
        return null;
    }
}

function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
}

function displayNameFor(user) {
    const rawName = String(user?.name || '').trim();
    if (rawName) return rawName;
    const email = String(user?.email || '').trim();
    if (email.includes('@')) {
        const localPart = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
        if (localPart) {
            return localPart.replace(/\b\w/g, (letter) => letter.toUpperCase());
        }
    }
    return 'Student';
}

function levelInfo(xp) {
    const level = Math.floor(xp / LEVEL_XP) + 1;
    const progress = xp % LEVEL_XP;
    return { level, progress, percentage: (progress / LEVEL_XP) * 100 };
}

function formatDateDistance(targetDate) {
    const diff = targetDate - new Date();
    const minutes = Math.round(diff / 60000);
    if (minutes <= 0) return 'Overdue';
    if (minutes < 60) return `Due in ${minutes}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return hours === 24 ? 'Due tomorrow' : `Due in ${hours}h`;
    return `Due in ${Math.round(hours / 24)} days`;
}

function formatClock(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function todaysGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function showToast(title, message, kind = 'success') {
    if (!state.user.notifications) return;
    const host = document.getElementById('toastHost');
    const toast = document.createElement('div');
    toast.className = `toast ${kind}`;
    toast.innerHTML = `<strong>${title}</strong><div class="small-muted">${message}</div>`;
    host.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

function openModal() {
    document.getElementById('taskModalBackdrop').classList.add('open');
    document.getElementById('taskModalBackdrop').setAttribute('aria-hidden', 'false');
    document.getElementById('taskName').focus();
}

function closeModal() {
    document.getElementById('taskModalBackdrop').classList.remove('open');
    document.getElementById('taskModalBackdrop').setAttribute('aria-hidden', 'true');
}

function setView(viewId) {
    document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === viewId));
    const titles = {
        dashboardView: ['Dashboard', 'A clear view of what matters today.'],
        tasksView: ['Tasks', 'Plan, prioritize, and complete the work.'],
        focusView: ['Focus', 'Run a session, grow the tree, collect XP.'],
        plannerView: ['Planner', 'Build the day and keep it visible.'],
        achievementsView: ['Achievements', 'Your unlocked badges and focus milestones.'],
        settingsView: ['Settings', 'Profile, preferences, and account controls.']
    };
    const [title, subtitle] = titles[viewId];
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle;
}

function toggleTheme(nextTheme) {
    const theme = nextTheme || (document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    state.user.theme = theme;
    document.getElementById('themeSwitch').checked = theme === 'dark';
    persistState();
}

function login(user) {
    state.user = { ...state.user, ...user, name: displayNameFor(user) };
    state.lastLogin = Date.now();
    persistState();
    setAuth(true);
    document.getElementById('authView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    syncInputs();
    renderAll();
    showToast('Welcome back', 'Your workspace is ready.');
}

function logout() {
    setAuth(false);
    document.getElementById('appView').classList.add('hidden');
    document.getElementById('authView').classList.remove('hidden');
    showToast('Signed out', 'Session closed locally.');
}

function syncInputs() {
    const name = displayNameFor(state.user);
    document.getElementById('profileName').value = name;
    document.getElementById('profileEmail').value = state.user.email;
    document.getElementById('themeSwitch').checked = state.user.theme === 'dark';
    document.getElementById('notificationsSwitch').checked = state.user.notifications;
    document.getElementById('sidebarName').textContent = name;
    document.getElementById('sidebarEmail').textContent = state.user.email;
    document.getElementById('sidebarAvatar').innerHTML = state.user.avatar ? `<img src="${state.user.avatar}" alt="Avatar">` : initials(name);
    document.getElementById('greetingChip').textContent = `${todaysGreeting()}, ${name.split(' ')[0]} 👋`;
    document.getElementById('focusMinutesInput').value = Math.max(5, Math.round((state.session.duration || 1500) / 60));
    document.getElementById('breakMinutesInput').value = Math.max(1, Math.round((state.session.breakDuration || 300) / 60));
}

function renderDashboard() {
    document.getElementById('statTasks').textContent = state.tasks.filter((task) => !task.completed).length;
    document.getElementById('statFocus').textContent = `${state.focusMinutesToday}m`;
    document.getElementById('statStreak').textContent = state.streak;
    document.getElementById('statXp').textContent = state.xp;

    const level = levelInfo(state.xp);
    document.getElementById('levelLabel').textContent = level.level;
    document.getElementById('xpLabel').textContent = state.xp;
    document.getElementById('xpBar').style.width = `${level.percentage}%`;
    document.getElementById('dashboardXpBar').style.width = `${level.percentage}%`;
    document.getElementById('progressPercent').textContent = `${Math.round(level.percentage)}%`;
    document.getElementById('progressText').textContent = `${level.progress} / 100 XP to Level ${level.level + 1}`;
    document.getElementById('completedSessions').textContent = state.completedSessions;
    document.getElementById('todayFocusMinutes').textContent = `${state.focusMinutesToday}m`;

    const subjectMeta = (value) => {
        const name = String(value || '').toLowerCase();
        if (name.includes('math')) return { icon: '∑', color: '#3a5bff' };
        if (name.includes('chem')) return { icon: '⚗', color: '#14b8a6' };
        if (name.includes('phys')) return { icon: '◌', color: '#f59e0b' };
        if (name.includes('bio')) return { icon: '◉', color: '#10b981' };
        if (name.includes('project')) return { icon: '▣', color: '#3a5bff' };
        if (name.includes('exam')) return { icon: '✦', color: '#ef4444' };
        return { icon: '•', color: '#3a5bff' };
    };

    const todayTimeline = document.getElementById('todayTimeline');
    const orderedBlocks = [...state.plannerBlocks].slice(0, 4);
    todayTimeline.innerHTML = orderedBlocks.length ? orderedBlocks.map((block) => `
        <article class="timeline-item">
            <div class="timeline-left">
                <div class="timeline-subject"><span class="timeline-dot" style="background:${subjectMeta(block.task).color}"></span>${escapeHtml(block.task || 'Planned block')}</div>
                <div class="timeline-time">${block.start} - ${block.end}</div>
            </div>
            <div class="timeline-meta">
                <strong>${escapeHtml(block.notes || 'No notes added')}</strong>
                <span>${subjectMeta(block.task).icon} ${escapeHtml(block.task)}</span>
            </div>
        </article>
    `).join('') : emptyCard('No blocks planned yet', 'Add a day block from the Planner view.', '🗓️');

    const upcomingTasks = [...state.tasks]
        .filter((task) => !task.completed)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 4);
    document.getElementById('upcomingTasks').innerHTML = upcomingTasks.length ? upcomingTasks.map(renderTaskPreview).join('') : emptyCard('No upcoming tasks', 'Create your first task and set a deadline.', '✓');
}

function emptyCard(title, subtitle, emoji) {
    return `
        <div class="empty-state">
            <div class="empty-icon">${emoji}</div>
            <strong>${title}</strong>
            <span>${subtitle}</span>
        </div>
    `;
}

function renderTaskPreview(task) {
    return `
        <article class="task-row ${task.completed ? 'completed' : ''}">
            <div class="task-top">
                <div>
                    <div class="task-title">${escapeHtml(task.name)}</div>
                    <div class="task-desc">${escapeHtml(task.description || 'No description')}</div>
                </div>
                <span class="status ${task.completed ? 'done' : ''}">${task.completed ? 'Done' : formatDateDistance(new Date(task.deadline))}</span>
            </div>
            <div class="task-actions">
                <span class="priority ${priorityClass(task.priority)}">${task.priority}</span>
                <span class="tag">${task.category}</span>
                <span class="ghost-tag">${task.duration || '45 min'}</span>
            </div>
        </article>
    `;
}

function priorityClass(priority) {
    return String(priority || '').toLowerCase();
}

function renderTasks() {
    const query = document.getElementById('taskSearch').value.trim().toLowerCase();
    const category = document.getElementById('taskFilter').value;
    const sort = document.getElementById('taskSort').value;
    const status = document.getElementById('taskStatusFilter').value;

    let list = [...state.tasks];
    if (query) list = list.filter((task) => [task.name, task.description, task.category, task.priority].join(' ').toLowerCase().includes(query));
    if (category !== 'all') list = list.filter((task) => task.category === category);
    if (status !== 'all') list = list.filter((task) => status === 'done' ? task.completed : !task.completed);

    list.sort((left, right) => {
        if (sort === 'priority') {
            const order = { high: 0, medium: 1, low: 2 };
            return order[priorityClass(left.priority)] - order[priorityClass(right.priority)];
        }
        if (sort === 'time') return parseInt(left.duration) - parseInt(right.duration);
        return new Date(left.deadline) - new Date(right.deadline);
    });

    const container = document.getElementById('taskList');
    if (!list.length) {
        container.innerHTML = emptyCard('No tasks yet', 'Create your first task.', '🧠');
        return;
    }

    container.innerHTML = list.map((task) => `
        <article class="task-row task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-top">
                <div class="task-main">
                    <input class="checkbox" type="checkbox" data-action="toggle-task" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                    <div>
                        <div class="task-title">${escapeHtml(task.name)}</div>
                        <div class="task-desc">${escapeHtml(task.description || 'No description')}</div>
                    </div>
                </div>
                <span class="status ${task.completed ? 'done' : ''}">${task.completed ? 'Completed' : formatDateDistance(new Date(task.deadline))}</span>
            </div>
            <div class="task-actions">
                <span class="priority ${priorityClass(task.priority)}">${task.priority}</span>
                <span class="tag">${task.category}</span>
                <span class="ghost-tag">${formatClock(task.deadline)}</span>
                <span class="ghost-tag">${escapeHtml(task.duration || '45 min')}</span>
            </div>
            <div class="helper-row">
                <div class="small-muted">Reminder: ${escapeHtml(task.reminder || 'None')} · Repeat: ${escapeHtml(task.repeat || 'Never')}</div>
                <div class="row-actions">
                    <button class="chip-btn" data-action="edit-task" data-id="${task.id}" type="button">Edit</button>
                    <button class="chip-btn" data-action="delete-task" data-id="${task.id}" type="button">Delete</button>
                </div>
            </div>
        </article>
    `).join('');
}

function renderPlanner() {
    const container = document.getElementById('plannerBlocks');
    if (!state.plannerBlocks.length) {
        container.innerHTML = emptyCard('No blocks yet', 'Add a schedule block to shape the day.', '📅');
        return;
    }
    container.innerHTML = state.plannerBlocks.map((block, index) => `
        <article class="block-row">
            <div class="row-top">
                <div>
                    <div class="task-title">${block.start} - ${block.end}</div>
                    <div class="task-desc">${escapeHtml(block.task)}</div>
                    <div class="small-muted">${escapeHtml(block.notes || 'No notes')}</div>
                </div>
                <span class="tag">Block ${index + 1}</span>
            </div>
            <div class="row-actions">
                <button class="chip-btn" data-action="move-block-up" data-id="${block.id}" type="button">Up</button>
                <button class="chip-btn" data-action="move-block-down" data-id="${block.id}" type="button">Down</button>
                <button class="chip-btn" data-action="delete-block" data-id="${block.id}" type="button">Delete</button>
            </div>
        </article>
    `).join('');
}

function renderAchievements() {
    const totalFocus = state.focusMinutesToday + (state.completedSessions * 25);
    document.getElementById('achievementList').innerHTML = state.achievements.map((achievement) => {
        const unlocked = totalFocus >= achievement.threshold;
        return `
            <article class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-badge">${achievement.emoji}</div>
                <div>
                    <div class="task-title">${escapeHtml(achievement.title)}</div>
                    <div class="task-desc">${achievement.threshold} focus minutes · +${achievement.reward} XP</div>
                </div>
                <span class="status ${unlocked ? 'done' : ''}">${unlocked ? 'Unlocked' : 'Locked'}</span>
            </article>
        `;
    }).join('');

    const stages = [
        { label: 'Seed', emoji: '🌱' },
        { label: 'Small Plant', emoji: '🪴' },
        { label: 'Young Tree', emoji: '🌳' },
        { label: 'Big Tree', emoji: '🌲' },
        { label: 'Champion', emoji: '🏆' }
    ];
    const stageIndex = Math.min(stages.length - 1, Math.floor(state.completedSessions / 2));
    document.getElementById('forestTrack').innerHTML = stages.map((stage, index) => `
        <div class="forest-node ${index === stageIndex ? 'active' : ''}">
            <span class="emoji">${stage.emoji}</span>
            <strong>${stage.label}</strong>
        </div>
    `).join('');

    document.getElementById('currentTreeDisplay').textContent = `${stages[stageIndex].emoji} ${stages[stageIndex].label}`;
    document.getElementById('forestStatus').textContent = state.session.running ? 'Growing now' : (state.completedSessions === 0 ? 'Seed planted' : 'Forest progressing');
    document.getElementById('focusModeLabel').textContent = state.session.breakActive ? 'Break session' : 'Focus session';
    document.getElementById('currentSessionLabel').textContent = state.session.running ? (state.session.breakActive ? 'Break in progress' : 'Focus in progress') : 'Ready to focus';
}

function renderTimetable() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const body = document.getElementById('timetableBody');
    body.innerHTML = state.timetableRows.map((row, rowIndex) => {
        const cells = days.map((day, dayIndex) => `
            <td contenteditable="true" data-row="${rowIndex}" data-col="${dayIndex + 1}" spellcheck="false">${escapeHtml(row[dayIndex + 1] || '')}</td>
        `).join('');
        return `
            <tr>
                <td><input type="time" value="${row[0]}" data-row="${rowIndex}" data-time="true"></td>
                ${cells}
                <td><button class="chip-btn" data-action="delete-row" data-id="${rowIndex}" type="button">Delete</button></td>
            </tr>
        `;
    }).join('');
}

function updateTimerRing() {
    const duration = state.session.duration || 1500;
    const remaining = state.session.remaining || duration;
    const ratio = Math.max(0, Math.min(1, (duration - remaining) / duration));
    document.getElementById('timerDisplay').textContent = formatDuration(remaining);
    const ring = document.getElementById('timerRing');
    ring.style.background = 'var(--surface)';
    ring.style.boxShadow = `inset 0 0 0 ${Math.max(8, Math.round(8 + ratio * 8))}px rgba(58, 91, 255, 0.12), var(--shadow)`;
    document.getElementById('focusStartBtn').textContent = state.session.running ? 'Running' : 'Start';
    document.getElementById('focusPauseBtn').textContent = state.session.running ? 'Pause' : 'Resume';
    document.getElementById('focusSkipBtn').disabled = !state.session.breakActive;
}

function formatDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function renderAll() {
    syncInputs();
    renderDashboard();
    renderTasks();
    renderPlanner();
    renderAchievements();
    renderTimetable();
    updateTimerRing();
    persistState();
}

function escapeHtml(value) {
    return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function addXp(amount) {
    state.xp += amount;
    persistState();
}

function addTaskFromForm(event) {
    event.preventDefault();
    const task = {
        id: crypto.randomUUID(),
        name: document.getElementById('taskName').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value,
        deadline: new Date(document.getElementById('taskDeadline').value).toISOString(),
        duration: document.getElementById('taskDuration').value.trim() || '45 min',
        repeat: document.getElementById('taskRepeat').value,
        reminder: document.getElementById('taskReminder').value,
        completed: false
    };
    state.tasks.unshift(task);
    addXp(20);
    renderAll();
    closeModal();
    event.target.reset();
    showToast('Task added', `${task.name} is now on your board.`);
}

function handleTaskAction(action, id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task && action !== 'delete-task') return;
    if (action === 'toggle-task') {
        task.completed = !task.completed;
        addXp(task.completed ? 20 : -20);
        if (task.completed) state.streak += 1;
        showToast(task.completed ? 'Task completed' : 'Task reopened', task.name);
    }
    if (action === 'edit-task') {
        openModal();
        document.getElementById('taskModalTitle').textContent = 'Edit task';
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDeadline').value = new Date(task.deadline).toISOString().slice(0, 16);
        document.getElementById('taskDuration').value = task.duration;
        document.getElementById('taskRepeat').value = task.repeat;
        document.getElementById('taskReminder').value = task.reminder;
        document.getElementById('taskForm').dataset.editing = task.id;
        return;
    }
    if (action === 'delete-task') {
        if (!confirm('Delete this task?')) return;
        state.tasks = state.tasks.filter((item) => item.id !== id);
        showToast('Task deleted', 'The item has been removed.');
    }
    renderAll();
}

function addPlannerBlock(event) {
    event.preventDefault();
    state.plannerBlocks.unshift({
        id: crypto.randomUUID(),
        start: document.getElementById('plannerStart').value,
        end: document.getElementById('plannerEnd').value,
        task: document.getElementById('plannerTask').value.trim(),
        notes: document.getElementById('plannerNotes').value.trim()
    });
    addXp(10);
    event.target.reset();
    renderAll();
    showToast('Block added', 'Your day plan was updated.');
}

function handlePlannerAction(action, id) {
    const index = state.plannerBlocks.findIndex((block) => block.id === id);
    if (index === -1) return;
    if (action === 'delete-block') {
        if (!confirm('Delete this planner block?')) return;
        state.plannerBlocks.splice(index, 1);
        showToast('Block deleted', 'Planner updated.');
    }
    if (action === 'move-block-up' && index > 0) {
        [state.plannerBlocks[index - 1], state.plannerBlocks[index]] = [state.plannerBlocks[index], state.plannerBlocks[index - 1]];
    }
    if (action === 'move-block-down' && index < state.plannerBlocks.length - 1) {
        [state.plannerBlocks[index + 1], state.plannerBlocks[index]] = [state.plannerBlocks[index], state.plannerBlocks[index + 1]];
    }
    renderAll();
}

function addTimetableRow() {
    state.timetableRows.push(['16:00', '', '', '', '', '', '', '']);
    renderAll();
    showToast('Row added', 'A new timetable row is ready.');
}

function handleTimetableEdit(event) {
    const target = event.target;
    if (target.matches('input[type="time"]')) {
        const row = Number(target.dataset.row);
        state.timetableRows[row][0] = target.value;
        persistState();
        return;
    }
    if (target.matches('td[contenteditable="true"]')) {
        const row = Number(target.dataset.row);
        const col = Number(target.dataset.col);
        state.timetableRows[row][col] = target.textContent.trim();
        persistState();
    }
}

function handleDeleteRow(index) {
    if (!confirm('Delete this timetable row?')) return;
    state.timetableRows.splice(index, 1);
    renderAll();
}

function saveProfile(event) {
    event.preventDefault();
    state.user.name = document.getElementById('profileName').value.trim();
    state.user.email = document.getElementById('profileEmail').value.trim();
    const file = document.getElementById('profileAvatar').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            state.user.avatar = reader.result;
            persistState();
            renderAll();
            showToast('Profile saved', 'Avatar and details updated.');
        };
        reader.readAsDataURL(file);
    } else {
        persistState();
        renderAll();
        showToast('Profile saved', 'Your details were updated.');
    }
}

function resetDemo() {
    if (!confirm('Reset all local demo data?')) return;
    state = defaultData();
    state.user.theme = document.documentElement.dataset.theme;
    persistState();
    renderAll();
    showToast('Reset complete', 'Local demo data restored.');
}

function deleteAccount() {
    if (!confirm('Delete this local account and all data?')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_KEY);
    state = defaultData();
    document.getElementById('authView').classList.remove('hidden');
    document.getElementById('appView').classList.add('hidden');
    showToast('Account deleted', 'Local storage cleared.');
}

function changePassword() {
    const nextPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    if (!nextPassword || nextPassword.length < 6) return showToast('Password too short', 'Use at least 6 characters.', 'error');
    if (nextPassword !== confirmPassword) return showToast('Passwords mismatch', 'Check the confirmation field.', 'error');
    state.user.password = nextPassword;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    persistState();
    showToast('Password updated', 'The local password was changed.');
}

function renderTaskModalForEdit(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    document.getElementById('taskModalTitle').textContent = 'Edit task';
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskDeadline').value = new Date(task.deadline).toISOString().slice(0, 16);
    document.getElementById('taskDuration').value = task.duration;
    document.getElementById('taskRepeat').value = task.repeat;
    document.getElementById('taskReminder').value = task.reminder;
    document.getElementById('taskForm').dataset.editing = task.id;
    openModal();
}

function startFocusSession() {
    const minutes = Math.max(5, Number(document.getElementById('focusMinutesInput').value || 25));
    const breakMinutes = Math.max(1, Number(document.getElementById('breakMinutesInput').value || 5));
    state.session.duration = minutes * 60;
    state.session.remaining = state.session.duration;
    state.session.breakDuration = breakMinutes * 60;
    state.session.running = true;
    state.session.breakActive = false;
    clearInterval(state.session.timer);
    state.session.timer = setInterval(tickFocusSession, 1000);
    showToast('Focus started', `${minutes} minute session in progress.`);
    renderAll();
}

function pauseResumeFocus() {
    if (state.session.running) {
        clearInterval(state.session.timer);
        state.session.running = false;
        showToast('Focus paused', 'You can resume whenever you want.');
    } else {
        state.session.running = true;
        state.session.timer = setInterval(tickFocusSession, 1000);
        showToast('Focus resumed', 'Continuing the current session.');
    }
    renderAll();
}

function resetFocus() {
    clearInterval(state.session.timer);
    state.session.running = false;
    state.session.breakActive = false;
    state.session.remaining = state.session.duration;
    updateTimerRing();
    showToast('Session reset', 'Timer returned to the start state.');
}

function skipBreak() {
    if (!state.session.breakActive) return;
    state.session.breakActive = false;
    state.session.running = true;
    state.session.remaining = state.session.duration;
    clearInterval(state.session.timer);
    state.session.timer = setInterval(tickFocusSession, 1000);
    renderAll();
    showToast('Break skipped', 'Back into focus mode.');
}

function tickFocusSession() {
    if (state.session.remaining > 0) {
        state.session.remaining -= 1;
        if (state.session.remaining % 60 === 0) {
            state.focusMinutesToday += 1;
        }
        updateTimerRing();
        persistState();
        return;
    }

    clearInterval(state.session.timer);
    state.session.running = false;
    state.session.breakActive = true;
    state.completedSessions += 1;
    state.focusMinutesToday += Math.max(1, Math.round((state.session.duration || 1500) / 60));
    state.xp += 30;
    state.forestLevel = Math.min(5, Math.floor(state.completedSessions / 2) + 1);
    state.session.remaining = state.session.breakDuration;
    updateTimerRing();
    renderAll();
    showToast('Session complete', '+30 XP earned. The tree grew.');
    persistState();
}

function handleAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((button) => button.classList.toggle('active', button.dataset.authTab === tab));
    document.getElementById('loginPanel').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signupPanel').classList.toggle('hidden', tab !== 'signup');
    document.getElementById('forgotPanel').classList.toggle('hidden', tab !== 'forgot');
}

function initializeTimetableListeners() {
    document.getElementById('timetableBody').addEventListener('input', handleTimetableEdit);
}

function bootstrap() {
    document.documentElement.dataset.theme = state.user.theme || DEFAULT_THEME;
    document.getElementById('themeSwitch').checked = document.documentElement.dataset.theme === 'dark';
    const auth = getAuth();
    if (auth?.authed) {
        document.getElementById('authView').classList.add('hidden');
        document.getElementById('appView').classList.remove('hidden');
    }
    syncInputs();
    renderAll();
    initializeTimetableListeners();
    if (!auth?.authed) {
        document.getElementById('appView').classList.add('hidden');
        document.getElementById('authView').classList.remove('hidden');
    }
}

document.querySelectorAll('.auth-tab').forEach((button) => button.addEventListener('click', () => handleAuthTab(button.dataset.authTab)));
document.getElementById('loginPanel').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) return;
    login({ name: state.user.name, email, password });
});
document.getElementById('signupPanel').addEventListener('submit', (event) => {
    event.preventDefault();
    login({
        name: document.getElementById('signupName').value.trim(),
        email: document.getElementById('signupEmail').value.trim(),
        password: document.getElementById('signupPassword').value.trim()
    });
    showToast('Account created', 'Your local profile is ready.');
});
document.getElementById('forgotPanel').addEventListener('submit', (event) => {
    event.preventDefault();
    showToast('Reset link sent', 'This MVP simulates the reset flow.');
});
document.getElementById('demoLoginBtn').addEventListener('click', () => login({ name: 'Student', email: 'student@example.com' }));
document.getElementById('themeBtn').addEventListener('click', () => toggleTheme());
document.getElementById('sidebarThemeBtn').addEventListener('click', () => toggleTheme());
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('logoutFromSettingsBtn').addEventListener('click', logout);
document.getElementById('openTaskModalBtn').addEventListener('click', openModal);
document.getElementById('quickAddTaskBtn').addEventListener('click', openModal);
document.getElementById('tasksAddBtn').addEventListener('click', openModal);
document.getElementById('closeTaskModalBtn').addEventListener('click', closeModal);
document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
document.getElementById('taskModalBackdrop').addEventListener('click', (event) => { if (event.target.id === 'taskModalBackdrop') closeModal(); });
document.getElementById('taskForm').addEventListener('submit', (event) => {
    const editing = event.target.dataset.editing;
    event.preventDefault();
    if (editing) {
        const task = state.tasks.find((item) => item.id === editing);
        if (task) {
            task.name = document.getElementById('taskName').value.trim();
            task.description = document.getElementById('taskDescription').value.trim();
            task.priority = document.getElementById('taskPriority').value;
            task.category = document.getElementById('taskCategory').value;
            task.deadline = new Date(document.getElementById('taskDeadline').value).toISOString();
            task.duration = document.getElementById('taskDuration').value.trim() || '45 min';
            task.repeat = document.getElementById('taskRepeat').value;
            task.reminder = document.getElementById('taskReminder').value;
            showToast('Task updated', 'Changes were saved.');
        }
        delete event.target.dataset.editing;
        closeModal();
        renderAll();
        return;
    }
    addTaskFromForm(event);
});
document.getElementById('plannerForm').addEventListener('submit', addPlannerBlock);
document.getElementById('profileForm').addEventListener('submit', saveProfile);
document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
document.getElementById('clearDemoBtn').addEventListener('click', resetDemo);
document.getElementById('deleteAccountBtn').addEventListener('click', deleteAccount);
document.getElementById('focusStartBtn').addEventListener('click', startFocusSession);
document.getElementById('focusPauseBtn').addEventListener('click', pauseResumeFocus);
document.getElementById('focusResetBtn').addEventListener('click', resetFocus);
document.getElementById('focusSkipBtn').addEventListener('click', skipBreak);
document.getElementById('quickStartFocusBtn').addEventListener('click', startFocusSession);
document.getElementById('startFocusHeroBtn').addEventListener('click', () => setView('focusView'));
document.getElementById('quickStartFocusBtn').addEventListener('click', () => setView('focusView'));
document.getElementById('plannerSummarizeBtn').addEventListener('click', () => showToast('Plan summary', state.plannerBlocks.length ? `You have ${state.plannerBlocks.length} blocks scheduled.` : 'No blocks planned yet.'));
document.getElementById('addTimetableRowBtn').addEventListener('click', addTimetableRow);
document.getElementById('taskSearch').addEventListener('input', renderTasks);
document.getElementById('taskFilter').addEventListener('change', renderTasks);
document.getElementById('taskSort').addEventListener('change', renderTasks);
document.getElementById('taskStatusFilter').addEventListener('change', renderTasks);

document.getElementById('navItems').addEventListener('click', (event) => {
    const btn = event.target.closest('.nav-btn');
    if (!btn) return;
    setView(btn.dataset.view);
});

document.body.addEventListener('click', (event) => {
    const switchViewBtn = event.target.closest('[data-switch-view]');
    if (switchViewBtn) setView(switchViewBtn.dataset.switchView);

    const actionTarget = event.target.closest('[data-action]');
    if (!actionTarget) return;
    const action = actionTarget.dataset.action;
    const id = actionTarget.dataset.id;
    if (action === 'delete-row') return handleDeleteRow(Number(id));
    if (action === 'delete-task') return handleTaskAction(action, id);
    if (action === 'toggle-task' || action === 'edit-task') return handleTaskAction(action, id);
    if (action === 'delete-block' || action === 'move-block-up' || action === 'move-block-down') return handlePlannerAction(action, id);
});

document.getElementById('notificationsSwitch').addEventListener('change', (event) => {
    state.user.notifications = event.target.checked;
    persistState();
    showToast('Notifications updated', event.target.checked ? 'Enabled' : 'Disabled');
});

document.getElementById('themeSwitch').addEventListener('change', (event) => toggleTheme(event.target.checked ? 'dark' : 'light'));

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
    if (event.key === 'n' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        openModal();
    }
    if (event.key === 'f' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setView('focusView');
    }
});

const authState = getAuth();
document.getElementById('authView').classList.toggle('hidden', !!authState?.authed);
document.getElementById('appView').classList.toggle('hidden', !authState?.authed);
bootstrap();