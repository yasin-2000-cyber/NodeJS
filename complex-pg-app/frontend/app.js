// Configure API base. If you serve frontend separately, set this to your backend host.
const API_BASE = "http://localhost:3000";

const el = (id) => document.getElementById(id);
const authPanel = el("authPanel");
const appPanel = el("appPanel");

const btnLogout = el("btnLogout");
const btnRefresh = el("btnRefresh");
const btnStats = el("btnStats");

const formRegister = el("formRegister");
const formLogin = el("formLogin");
const authMsg = el("authMsg");

const formProject = el("formProject");
const projectList = el("projectList");

const formTask = el("formTask");
const taskList = el("taskList");
const tasksMeta = el("tasksMeta");

const filterStatus = el("filterStatus");
const filterPriority = el("filterPriority");
const filterQ = el("filterQ");
const pageSizeSel = el("pageSize");
const btnPrev = el("btnPrev");
const btnNext = el("btnNext");
const pageNum = el("pageNum");

const statsOut = el("statsOut");

let token = localStorage.getItem("token") || "";
let projects = [];
let selectedProjectId = null;

let state = {
  page: 1,
  pageSize: 10
};

function setMsg(node, text, isError = false) {
  node.textContent = text || "";
  node.className = "msg" + (isError ? " error" : "");
}

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {})
    }
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

function showApp(isAuthed) {
  authPanel.classList.toggle("hidden", isAuthed);
  appPanel.classList.toggle("hidden", !isAuthed);
  btnLogout.classList.toggle("hidden", !isAuthed);
}

function renderProjects() {
  projectList.innerHTML = "";
  for (const p of projects) {
    const li = document.createElement("li");
    li.className = "row space";

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.textContent = p.name;
    title.style.fontWeight = selectedProjectId === p.id ? "700" : "500";
    const sub = document.createElement("div");
    sub.className = "muted small";
    sub.textContent = `id=${p.id}`;
    left.appendChild(title);
    left.appendChild(sub);

    const right = document.createElement("div");
    right.className = "row gap";

    const btnSelect = document.createElement("button");
    btnSelect.className = "ghost";
    btnSelect.textContent = selectedProjectId === p.id ? "Selected" : "Select";
    btnSelect.onclick = () => {
      selectedProjectId = p.id;
      state.page = 1;
      renderProjects();
      loadTasks().catch(console.error);
    };

    const btnDel = document.createElement("button");
    btnDel.textContent = "Delete";
    btnDel.onclick = async () => {
      if (!confirm(`Delete project "${p.name}" and all its tasks?`)) return;
      await api(`/api/projects/${p.id}`, { method: "DELETE" });
      await loadProjects();
    };

    right.appendChild(btnSelect);
    right.appendChild(btnDel);

    li.appendChild(left);
    li.appendChild(right);
    projectList.appendChild(li);
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = "";

  for (const t of tasks) {
    const li = document.createElement("li");

    const header = document.createElement("div");
    header.className = "row space";

    const title = document.createElement("div");
    title.textContent = t.title;
    title.style.fontWeight = "700";

    const badge = document.createElement("div");
    badge.className = "muted small";
    badge.textContent = `${t.status} • ${t.priority}` + (t.due_date ? ` • due ${new Date(t.due_date).toLocaleString()}` : "");

    header.appendChild(title);
    header.appendChild(badge);

    const desc = document.createElement("div");
    desc.className = "top";
    desc.textContent = t.description || "";

    const controls = document.createElement("div");
    controls.className = "row gap top";

    const statusSel = document.createElement("select");
    ["todo","doing","done","blocked"].forEach(s => {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      if (s === t.status) o.selected = true;
      statusSel.appendChild(o);
    });

    const prioSel = document.createElement("select");
    ["low","medium","high","urgent"].forEach(p => {
      const o = document.createElement("option");
      o.value = p;
      o.textContent = p;
      if (p === t.priority) o.selected = true;
      prioSel.appendChild(o);
    });

    const btnSave = document.createElement("button");
    btnSave.textContent = "Save";
    btnSave.onclick = async () => {
      await api(`/api/tasks/${t.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusSel.value, priority: prioSel.value })
      });
      await loadTasks();
    };

    const btnDel = document.createElement("button");
    btnDel.textContent = "Delete";
    btnDel.onclick = async () => {
      if (!confirm("Delete task?")) return;
      await api(`/api/tasks/${t.id}`, { method: "DELETE" });
      await loadTasks();
    };

    controls.appendChild(statusSel);
    controls.appendChild(prioSel);
    controls.appendChild(btnSave);
    controls.appendChild(btnDel);

    li.appendChild(header);
    li.appendChild(desc);
    li.appendChild(controls);
    taskList.appendChild(li);
  }
}

async function loadProjects() {
  const data = await api("/api/projects");
  projects = data.projects;
  if (!selectedProjectId && projects[0]) selectedProjectId = projects[0].id;
  if (selectedProjectId && !projects.find(p => p.id === selectedProjectId)) {
    selectedProjectId = projects[0]?.id ?? null;
  }
  renderProjects();
  await loadTasks();
}

function buildTaskQuery() {
  const params = new URLSearchParams();
  if (selectedProjectId) params.set("projectId", String(selectedProjectId));
  if (filterStatus.value) params.set("status", filterStatus.value);
  if (filterPriority.value) params.set("priority", filterPriority.value);
  if (filterQ.value.trim()) params.set("q", filterQ.value.trim());
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  return params.toString();
}

async function loadTasks() {
  if (!selectedProjectId) {
    tasksMeta.textContent = "Create or select a project to view tasks.";
    taskList.innerHTML = "";
    return;
  }
  tasksMeta.textContent = "Loading...";
  const qs = buildTaskQuery();
  const data = await api(`/api/tasks?${qs}`);
  renderTasks(data.tasks);
  tasksMeta.textContent = `Project ${selectedProjectId} • returned ${data.tasks.length} tasks`;
  pageNum.textContent = String(state.page);
}

async function loadStats() {
  const data = await api("/api/stats");
  statsOut.textContent = JSON.stringify(data, null, 2);
}

function setToken(newToken) {
  token = newToken || "";
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

formRegister.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(formRegister);
  try {
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password")
      })
    });
    setMsg(authMsg, "Registered. You can login now.");
  } catch (err) {
    setMsg(authMsg, err.message, true);
  }
});

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(formLogin);
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password")
      })
    });
    setToken(data.token);
    setMsg(authMsg, "");
    showApp(true);
    await loadProjects();
  } catch (err) {
    setMsg(authMsg, err.message, true);
  }
});

btnLogout.addEventListener("click", () => {
  setToken("");
  showApp(false);
});

formProject.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(formProject);
  const name = String(fd.get("name") || "").trim();
  if (!name) return;
  await api("/api/projects", { method: "POST", body: JSON.stringify({ name }) });
  formProject.reset();
  await loadProjects();
});

formTask.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedProjectId) return alert("Select a project first.");

  const fd = new FormData(formTask);
  const dueLocal = fd.get("dueDate");
  // Convert datetime-local to ISO with timezone offset (best effort)
  const dueDate = dueLocal ? new Date(dueLocal).toISOString() : null;

  await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      projectId: String(selectedProjectId),
      title: fd.get("title"),
      description: fd.get("description") || "",
      status: fd.get("status"),
      priority: fd.get("priority"),
      dueDate
    })
  });
  formTask.reset();
  await loadTasks();
});

btnRefresh.addEventListener("click", () => loadTasks().catch(console.error));
btnStats.addEventListener("click", () => loadStats().catch(console.error));

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const refreshDebounced = debounce(() => {
  state.page = 1;
  loadTasks().catch(console.error);
}, 250);

filterStatus.addEventListener("change", refreshDebounced);
filterPriority.addEventListener("change", refreshDebounced);
filterQ.addEventListener("input", refreshDebounced);

pageSizeSel.addEventListener("change", () => {
  state.pageSize = Number(pageSizeSel.value);
  state.page = 1;
  loadTasks().catch(console.error);
});

btnPrev.addEventListener("click", () => {
  state.page = Math.max(1, state.page - 1);
  loadTasks().catch(console.error);
});

btnNext.addEventListener("click", () => {
  state.page += 1;
  loadTasks().catch(console.error);
});

// boot
(async function init() {
  showApp(!!token);
  if (token) {
    try {
      await loadProjects();
    } catch (e) {
      // token might be invalid/expired
      setToken("");
      showApp(false);
    }
  }
})();

