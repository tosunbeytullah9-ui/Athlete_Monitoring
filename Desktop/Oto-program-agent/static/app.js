/* ═══════════════════════════════════════════════════════════════════════════
   Movement Pattern Colour Map
   Based on the evidence-based taxonomy:
     Lower body  — warm palette (orange / amber / yellow)
     Upper body  — cool palette (blue / indigo / green / teal)
     Core        — red / pink / rose / purple spectrum
     Power/Speed — cyan / sky
     Gymnastics  — green spectrum
     Mobility    — neutral grey
   ═══════════════════════════════════════════════════════════════════════════ */
const PATTERN_COLORS = {
  // ── Upper Body Push ──────────────────────────────────────────────
  "Push – Horizontal":           "#3B82F6",   // blue-500
  "Push – Vertical":             "#6366F1",   // indigo-500

  // ── Upper Body Pull ──────────────────────────────────────────────
  "Pull – Horizontal":           "#10B981",   // emerald-500
  "Pull – Vertical":             "#0D9488",   // teal-600

  // ── Lower Body Hinge (Hip-Dominant) ─────────────────────────────
  "Hinge – Bilateral":           "#F97316",   // orange-500
  "Hinge – Unilateral":          "#EA580C",   // orange-600

  // ── Lower Body Squat (Knee-Dominant) ────────────────────────────
  "Squat – Bilateral":           "#D97706",   // amber-600
  "Squat – Unilateral":          "#B45309",   // amber-700

  // ── Loaded Carry ─────────────────────────────────────────────────
  "Loaded Carry":                "#65A30D",   // lime-600

  // ── Core (McGill sub-taxonomy) ───────────────────────────────────
  "Core – Anti-Extension":       "#EF4444",   // red-500
  "Core – Anti-Rotation":        "#EC4899",   // pink-500
  "Core – Anti-Lateral Flexion": "#F43F5E",   // rose-500
  "Core – Rotation":             "#A855F7",   // purple-500

  // ── Speed / Power ────────────────────────────────────────────────
  "Olympic Lifting":             "#0EA5E9",   // sky-500
  "Linear Speed & Acceleration": "#06B6D4",   // cyan-500
  "Change of Direction":         "#0891B2",   // cyan-600

  // ── Gymnastics-Specific ──────────────────────────────────────────
  "Straight-Arm Strength":       "#059669",   // emerald-600
  "Bent-Arm Gymnastics":         "#047857",   // emerald-700

  // ── Mobility ─────────────────────────────────────────────────────
  "Mobility / Flexibility":      "#6B7280",   // gray-500
};

const QUALITY_COLORS = {
  "Strength":             { bg: "#F1F5F9", text: "#475569" },
  "Power":                { bg: "#FEF3C7", text: "#B45309" },
  "Plyometric / Reactive":{ bg: "#EDE9FE", text: "#6D28D9" },
  "Speed / Agility":      { bg: "#ECFDF5", text: "#065F46" },
  "Mobility":             { bg: "#F0FDF4", text: "#166534" },
};

function patternColor(p) {
  if (PATTERN_COLORS[p]) return PATTERN_COLORS[p];
  const custom = (state.customPatterns || []).find(c => c.name === p);
  return custom?.color || "#4A7CF6";
}
function qualityStyle(q) { return QUALITY_COLORS[q] || { bg: "#F1F5F9", text: "#475569" }; }

/* ── State ────────────────────────────────────────────────────────────────── */
const state = {
  exercises: [],
  patterns:  [],
  filters: {
    search:          "",
    pattern:         "",
    difficulty:      "",
    training_quality:"",
    sport:           "",
    gender:          "",
  },
  editingId:        null,
  currentUser:      null,
  token:            null,
  athletes:         [],
  currentAthleteId: null,
};

/* ── DOM refs ─────────────────────────────────────────────────────────────── */
const $  = id => document.getElementById(id);
const grid          = $("exerciseGrid");
const emptyState    = $("emptyState");
const patternFilters= $("patternFilters");
const exerciseCount = $("exerciseCount");
const activeFilters = $("activeFilters");
const searchInput   = $("searchInput");
const clearSearch   = $("clearSearch");

/* ── API ──────────────────────────────────────────────────────────────────── */
async function apiFetch(path, opts = {}) {
  const headers = { "Content-Type": "application/json" };
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
  const res = await fetch(path, { headers, ...opts });
  if (res.status === 401) {
    logout();
    throw new Error("Session expired. Please sign in again.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

async function downloadFile(url, filename) {
  const headers = {};
  if (state.token) headers["Authorization"] = `Bearer ${state.token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    showToast(err.detail || "İndirme başarısız", "error");
    return;
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function loadExercises() {
  const params = new URLSearchParams();
  if (state.filters.search)          params.set("search",           state.filters.search);
  if (state.filters.pattern)         params.set("movement_pattern", state.filters.pattern);
  if (state.filters.difficulty)      params.set("difficulty",       state.filters.difficulty);
  if (state.filters.training_quality)params.set("training_quality", state.filters.training_quality);
  if (state.filters.sport)           params.set("sport_tag",        state.filters.sport);
  if (state.filters.gender)          params.set("gender_tag",       state.filters.gender);
  state.exercises = await apiFetch(`/api/exercises?${params}`);
  renderGrid();
}

async function loadMeta() {
  const meta = await apiFetch("/api/meta");
  state.patterns       = meta.movement_patterns;
  state.customPatterns = meta.custom_patterns || [];
  renderPatternFilters();
}

/* ── Render Grid ──────────────────────────────────────────────────────────── */
function renderGrid() {
  grid.innerHTML = "";
  exerciseCount.textContent = `${state.exercises.length} exercise${state.exercises.length !== 1 ? "s" : ""}`;

  if (state.exercises.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  state.exercises.forEach(ex => {
    const card = document.createElement("div");
    card.className = "exercise-card";
    const qs = qualityStyle(ex.training_quality);
    card.innerHTML = `
      <div class="card-header">
        <div class="card-names">
          <div class="card-name">${esc(ex.name)}</div>
          ${ex.name_tr ? `<div class="card-name-tr">${esc(ex.name_tr)}</div>` : ""}
        </div>
        <div class="difficulty-badge diff-${ex.difficulty}">${esc(ex.difficulty)}</div>
      </div>
      <div class="card-pattern-chip" style="background:${patternColor(ex.movement_pattern)}">
        <span class="dot"></span>${esc(ex.movement_pattern)}
      </div>
      <div class="card-quality-chip" style="background:${qs.bg};color:${qs.text}">
        ${esc(ex.training_quality || "Strength")}
      </div>
      <div class="card-muscles">
        <strong>Primary:</strong> ${esc((ex.primary_muscles || []).join(", ") || "—")}
      </div>
      <div class="card-footer">
        ${(ex.sport_tags || []).map(t => `<span class="sport-tag sport-${t}">${t}</span>`).join("")}
      </div>
    `;
    card.addEventListener("click", () => openDetailModal(ex));
    grid.appendChild(card);
  });
}

/* ── Render Pattern Filters ───────────────────────────────────────────────── */
function renderPatternFilters() {
  patternFilters.innerHTML = "";

  const allItem = document.createElement("div");
  allItem.className = "pattern-item" + (state.filters.pattern === "" ? " active" : "");
  allItem.innerHTML = `<span class="pattern-dot" style="background:#4A7CF6"></span><span>All Patterns</span>`;
  allItem.addEventListener("click", () => {
    state.filters.pattern = "";
    loadExercises();
    renderPatternFilters();
    renderActiveFilters();
  });
  patternFilters.appendChild(allItem);

  const customNames = new Set((state.customPatterns || []).map(c => c.name));
  const isCoachOrStaff = ["coach", "staff"].includes(state.currentUser?.role);

  state.patterns.forEach(p => {
    const item = document.createElement("div");
    item.className = "pattern-item" + (state.filters.pattern === p ? " active" : "");
    const color = patternColor(p);
    const isCustom = customNames.has(p);
    item.innerHTML = `
      <span class="pattern-dot" style="background:${color}"></span>
      <span style="flex:1">${esc(p)}</span>
      ${isCustom && isCoachOrStaff ? `<button class="pattern-delete-btn" title="Delete category" onclick="deletePattern(event,'${esc(p).replace(/'/g,"\\'")}')"><i class="fa-solid fa-xmark"></i></button>` : ""}
    `;
    item.addEventListener("click", () => {
      state.filters.pattern = (state.filters.pattern === p) ? "" : p;
      loadExercises();
      renderPatternFilters();
      renderActiveFilters();
    });
    patternFilters.appendChild(item);
  });
}

/* ── Category Management ──────────────────────────────────────────────────── */
function openCategoryModal() {
  $("categoryName").value  = "";
  $("categoryColor").value = "#4A7CF6";
  $("categoryModal").classList.remove("hidden");
  $("categoryName").focus();
}

$("categoryModalClose").addEventListener("click", () => $("categoryModal").classList.add("hidden"));
$("addCategoryBtn").addEventListener("click", openCategoryModal);

$("saveCategoryBtn").addEventListener("click", async () => {
  const name  = $("categoryName").value.trim();
  const color = $("categoryColor").value;
  if (!name) { alert("Name is required."); return; }
  try {
    await apiFetch("/api/meta/patterns", { method: "POST", body: JSON.stringify({ name, color }) });
    $("categoryModal").classList.add("hidden");
    await loadMeta();
    populatePatternSelect();
  } catch (err) { alert("Error: " + err.message); }
});

async function deletePattern(e, name) {
  e.stopPropagation();
  if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
  try {
    await apiFetch(`/api/meta/patterns/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (state.filters.pattern === name) state.filters.pattern = "";
    await loadMeta();
    populatePatternSelect();
    renderActiveFilters();
  } catch (err) { alert("Error: " + err.message); }
}

/* ── Active Filter Tags ───────────────────────────────────────────────────── */
function renderActiveFilters() {
  activeFilters.innerHTML = "";
  const add = (label, key) => {
    const tag = document.createElement("div");
    tag.className = "filter-tag";
    tag.innerHTML = `${esc(label)} <button title="Remove"><i class="fa-solid fa-xmark"></i></button>`;
    tag.querySelector("button").addEventListener("click", () => {
      state.filters[key] = "";
      if (key === "pattern") renderPatternFilters();
      // reset the corresponding chip UI
      const chipGroups = {
        difficulty: "difficultyFilters",
        training_quality: "qualityFilters",
        sport: "sportFilters",
        gender: "genderFilters",
      };
      if (chipGroups[key]) {
        const container = $(chipGroups[key]);
        container.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        container.querySelector(".chip[data-val='']").classList.add("active");
      }
      loadExercises();
      renderActiveFilters();
    });
    activeFilters.appendChild(tag);
  };
  if (state.filters.pattern)         add(`Pattern: ${state.filters.pattern}`, "pattern");
  if (state.filters.training_quality)add(`Quality: ${state.filters.training_quality}`, "training_quality");
  if (state.filters.difficulty)      add(`Difficulty: ${state.filters.difficulty}`, "difficulty");
  if (state.filters.sport)           add(`Sport: ${state.filters.sport}`, "sport");
  if (state.filters.gender)          add(`Gender: ${state.filters.gender}`, "gender");
  if (state.filters.search)          add(`Search: "${state.filters.search}"`, "search");
}

/* ── Detail Modal ─────────────────────────────────────────────────────────── */
function openDetailModal(ex) {
  const modal = $("detailModal");
  const content = $("detailContent");

  const qs = qualityStyle(ex.training_quality);
  const sportTags = (ex.sport_tags || []).map(t => `<span class="sport-tag sport-${t}">${t}</span>`).join(" ");
  const primaryPills = (ex.primary_muscles || []).map(m => `<span class="muscle-pill primary">${esc(m)}</span>`).join("");
  const secondaryPills = (ex.secondary_muscles || []).map(m => `<span class="muscle-pill">${esc(m)}</span>`).join("");
  const cues = (ex.coaching_cues || []).map(c => `<li>${esc(c)}</li>`).join("");
  const equipment = (ex.equipment || []).join(", ") || "—";
  const genderTags = (ex.gender_tags || []).join(", ");

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-name">${esc(ex.name)}</div>
      ${ex.name_tr ? `<div class="detail-name-tr">${esc(ex.name_tr)}</div>` : ""}
      <div class="detail-meta">
        <div class="card-pattern-chip" style="background:${patternColor(ex.movement_pattern)}">
          <span class="dot"></span>${esc(ex.movement_pattern)}
        </div>
        <div class="card-quality-chip" style="background:${qs.bg};color:${qs.text}">
          ${esc(ex.training_quality || "Strength")}
        </div>
        <div class="difficulty-badge diff-${ex.difficulty}">${esc(ex.difficulty)}</div>
        ${sportTags}
      </div>
    </div>

    ${ex.description ? `
    <div class="detail-section">
      <div class="detail-section-label">Description</div>
      <p>${esc(ex.description)}</p>
    </div>` : ""}

    <div class="detail-section">
      <div class="detail-section-label">Muscles</div>
      ${primaryPills ? `<div class="muscle-pills" style="margin-bottom:6px">${primaryPills}</div>` : ""}
      ${secondaryPills ? `<div class="muscle-pills">${secondaryPills}</div>` : ""}
    </div>

    ${cues ? `
    <div class="detail-section">
      <div class="detail-section-label">Coaching Cues</div>
      <ul class="cue-list">${cues}</ul>
    </div>` : ""}

    <div class="detail-section">
      <div class="detail-section-label">Details</div>
      <p style="font-size:0.84rem; color:#6B7280">
        <strong>Equipment:</strong> ${esc(equipment)}&nbsp;&nbsp;
        <strong>Category:</strong> ${esc(ex.category || "—")}&nbsp;&nbsp;
        <strong>Gender:</strong> ${esc(genderTags)}
      </p>
    </div>

    ${ex.notes ? `
    <div class="detail-section">
      <div class="detail-section-label">Notes</div>
      <p style="font-style:italic; color:#6B7280">${esc(ex.notes)}</p>
    </div>` : ""}

    ${ex.video_url ? `
    <div class="detail-section">
      <div class="detail-section-label">Video</div>
      <a href="${esc(ex.video_url)}" target="_blank" rel="noopener" style="color:#4A7CF6;font-size:0.88rem">
        <i class="fa-solid fa-play-circle"></i> Watch video
      </a>
    </div>` : ""}
  `;

  $("detailEdit").onclick   = () => { closeModal("detailModal"); openFormModal(ex); };
  $("detailDelete").onclick = () => confirmDelete(ex);
  modal.classList.remove("hidden");
}

/* ── Form Modal ───────────────────────────────────────────────────────────── */
const PATTERNS_DEFAULT = Object.keys(PATTERN_COLORS);

function populatePatternSelect() {
  const sel = $("f-pattern");
  sel.innerHTML = "";
  const allPatterns = [...new Set([...PATTERNS_DEFAULT, ...state.patterns])];
  allPatterns.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    sel.appendChild(opt);
  });
}

function openFormModal(ex = null) {
  state.editingId = ex ? ex.id : null;
  $("formTitle").textContent = ex ? "Edit Exercise" : "Add Exercise";
  populatePatternSelect();

  $("f-name").value       = ex?.name        || "";
  $("f-name-tr").value    = ex?.name_tr     || "";
  $("f-pattern").value    = ex?.movement_pattern || PATTERNS_DEFAULT[0];
  $("f-quality").value    = ex?.training_quality || "Strength";
  $("f-category").value   = ex?.category    || "";
  $("f-difficulty").value = ex?.difficulty  || "Intermediate";
  $("f-equipment").value  = (ex?.equipment  || []).join(", ");
  $("f-primary").value    = (ex?.primary_muscles   || []).join(", ");
  $("f-secondary").value  = (ex?.secondary_muscles || []).join(", ");
  $("f-description").value= ex?.description || "";
  $("f-cues").value       = (ex?.coaching_cues || []).join("\n");
  $("f-sport").value      = (ex?.sport_tags  || []).join(", ");
  $("f-gender").value     = (ex?.gender_tags || ["all"]).join(", ");
  $("f-video").value      = ex?.video_url   || "";
  $("f-notes").value      = ex?.notes       || "";

  $("formModal").classList.remove("hidden");
  $("f-name").focus();
}

$("exerciseForm").addEventListener("submit", async e => {
  e.preventDefault();
  const splitComma = v => v.split(",").map(s => s.trim()).filter(Boolean);
  const splitLine  = v => v.split("\n").map(s => s.trim()).filter(Boolean);

  const payload = {
    name:              $("f-name").value.trim(),
    name_tr:           $("f-name-tr").value.trim() || null,
    movement_pattern:  $("f-pattern").value,
    training_quality:  $("f-quality").value,
    category:          $("f-category").value.trim() || null,
    difficulty:        $("f-difficulty").value,
    equipment:         splitComma($("f-equipment").value),
    primary_muscles:   splitComma($("f-primary").value),
    secondary_muscles: splitComma($("f-secondary").value),
    description:       $("f-description").value.trim() || null,
    coaching_cues:     splitLine($("f-cues").value),
    sport_tags:        splitComma($("f-sport").value),
    gender_tags:       splitComma($("f-gender").value) || ["all"],
    video_url:         $("f-video").value.trim() || null,
    notes:             $("f-notes").value.trim() || null,
  };

  try {
    if (state.editingId) {
      await apiFetch(`/api/exercises/${state.editingId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch("/api/exercises", { method: "POST", body: JSON.stringify(payload) });
    }
    closeModal("formModal");
    await loadMeta();
    await loadExercises();
  } catch (err) {
    alert("Error: " + err.message);
  }
});

/* ── Delete ───────────────────────────────────────────────────────────────── */
function confirmDelete(ex) {
  $("confirmMsg").textContent = `Delete "${ex.name}"? This cannot be undone.`;
  $("confirmModal").classList.remove("hidden");

  $("confirmYes").onclick = async () => {
    try {
      await apiFetch(`/api/exercises/${ex.id}`, { method: "DELETE" });
      closeModal("confirmModal");
      closeModal("detailModal");
      await loadMeta();
      await loadExercises();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };
}

/* ── Modal helpers ────────────────────────────────────────────────────────── */
function closeModal(id) { $(id).classList.add("hidden"); }

$("detailClose").onclick = () => closeModal("detailModal");
$("formClose").onclick   = () => closeModal("formModal");
$("formCancel").onclick  = () => closeModal("formModal");
$("confirmNo").onclick   = () => closeModal("confirmModal");
$("resetFiltersBtn").onclick = resetAll;

["detailModal","formModal","confirmModal"].forEach(id => {
  $(id).addEventListener("click", e => { if (e.target === $(id)) closeModal(id); });
});

/* ── Sidebar toggle ───────────────────────────────────────────────────────── */
function closeMobileSidebar() {
  $("sidebar").classList.remove("mobile-open");
  $("sidebarOverlay").classList.remove("active");
}

$("sidebarToggle").addEventListener("click", () => {
  if (window.innerWidth <= 768) {
    $("sidebar").classList.toggle("mobile-open");
    $("sidebarOverlay").classList.toggle("active");
  } else {
    $("sidebar").classList.toggle("collapsed");
  }
});

$("sidebarOverlay").addEventListener("click", closeMobileSidebar);

/* ── Search ───────────────────────────────────────────────────────────────── */
let searchTimer;
searchInput.addEventListener("input", e => {
  clearTimeout(searchTimer);
  const val = e.target.value.trim();
  clearSearch.classList.toggle("visible", val.length > 0);
  searchTimer = setTimeout(() => {
    state.filters.search = val;
    loadExercises();
    renderActiveFilters();
  }, 300);
});
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  clearSearch.classList.remove("visible");
  state.filters.search = "";
  loadExercises();
  renderActiveFilters();
});

/* ── Chip filter wiring ───────────────────────────────────────────────────── */
function setupChips(containerId, stateKey) {
  $(containerId).addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $(containerId).querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.filters[stateKey] = chip.dataset.val;
    loadExercises();
    renderActiveFilters();
  });
}
setupChips("qualityFilters",     "training_quality");
setupChips("difficultyFilters",  "difficulty");
setupChips("sportFilters",       "sport");
setupChips("genderFilters",      "gender");

/* ── Add button ───────────────────────────────────────────────────────────── */
$("addExerciseBtn").addEventListener("click", () => openFormModal());

/* ── Reset all ────────────────────────────────────────────────────────────── */
function resetAll() {
  Object.keys(state.filters).forEach(k => state.filters[k] = "");
  searchInput.value = "";
  clearSearch.classList.remove("visible");
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".chip[data-val='']").forEach(c => c.classList.add("active"));
  renderPatternFilters();
  loadExercises();
  renderActiveFilters();
}

/* ── Escape HTML ──────────────────────────────────────────────────────────── */
function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ── Keyboard shortcuts ───────────────────────────────────────────────────── */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    ["detailModal","formModal","confirmModal"].forEach(id => closeModal(id));
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

/* ── Auth ─────────────────────────────────────────────────────────────────── */
function logout() {
  state.token       = null;
  state.currentUser = null;
  $("loginOverlay").classList.remove("hidden");
  $("loginError").classList.add("hidden");
  $("loginUsername").value = "";
  $("loginPassword").value = "";
  $("loginUsername").focus();
}

function applyRoleUI() {
  const role           = state.currentUser?.role;
  const isCoach        = role === "coach";
  const isStaff        = role === "staff";
  const isCoachOrStaff = isCoach || isStaff;
  $("userLabel").textContent = `${state.currentUser?.username} · ${role}`;

  // User management: coach only
  $("usersBtn").classList.toggle("hidden", !isCoach);
  // Library: coach only (staff does not see Library)
  $("tabLibrary").classList.toggle("hidden", !isCoach);
  // Athletes: coach and staff
  $("tabAthletes").classList.toggle("hidden", !isCoachOrStaff);
  // Teams: coach only (staff does not see Teams)
  $("tabTeams").classList.toggle("hidden", !isCoach);
  // Statistics: coach and staff
  $("tabStats").classList.toggle("hidden", !isCoachOrStaff);
  // 1RM Records: coach only (staff does not see 1RM Records)
  $("tabOneRM").classList.toggle("hidden", isStaff);
  $("addExerciseBtn").classList.toggle("hidden", !isCoachOrStaff);
  $("addCategoryBtn").classList.toggle("hidden", !isCoachOrStaff);

  // Apply athlete-mode CSS class for hiding edit controls in rendered HTML
  document.body.classList.toggle("athlete-mode", !isCoachOrStaff);
}

async function checkAuth() {
  localStorage.removeItem("auth_token");   // clear any stale saved session
  showSignInPanel();
  $("loginOverlay").classList.remove("hidden");
}

async function startApp() {
  $("loginOverlay").classList.add("hidden");
  applyRoleUI();
  if (state.currentUser.role === "coach" || state.currentUser.role === "staff") {
    await loadMeta();
    await loadExercises();
    switchView("library");
  } else {
    switchView("programs");
  }
  initPrograms();
}

/* ── Sign In / Sign Up panel toggle ──────────────────────────────────────── */
function showSignInPanel() {
  $("signUpPanel").classList.add("hidden");
  $("signInPanel").classList.remove("hidden");
  $("loginError").classList.add("hidden");
  $("loginUsername").focus();
}

function showSignUpPanel() {
  $("signInPanel").classList.add("hidden");
  $("signUpPanel").classList.remove("hidden");
  $("signupError").classList.add("hidden");
  $("signupUsername").focus();
}

$("showSignUpLink").addEventListener("click", e => { e.preventDefault(); showSignUpPanel(); });
$("showSignInLink").addEventListener("click", e => { e.preventDefault(); showSignInPanel(); });

$("loginBtn").addEventListener("click", doLogin);
$("loginPassword").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
$("loginUsername").addEventListener("keydown", e => { if (e.key === "Enter") $("loginPassword").focus(); });

async function doLogin() {
  const username = $("loginUsername").value.trim();
  const password = $("loginPassword").value;
  if (!username || !password) return;
  $("loginBtn").disabled = true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      $("loginError").textContent = err.detail || "Invalid username or password";
      $("loginError").classList.remove("hidden");
      $("loginPassword").value = "";
      $("loginPassword").focus();
      return;
    }
    const data = await res.json();
    state.token       = data.token;
    state.currentUser = data.user;
    $("loginError").classList.add("hidden");
    await startApp();
  } catch (err) {
    $("loginError").textContent = "Connection error. Is the server running?";
    $("loginError").classList.remove("hidden");
  } finally {
    $("loginBtn").disabled = false;
  }
}

/* ── Sign Up ──────────────────────────────────────────────────────────────── */
$("signupBtn").addEventListener("click", doSignup);
$("signupConfirm").addEventListener("keydown", e => { if (e.key === "Enter") doSignup(); });
$("signupPassword").addEventListener("keydown", e => { if (e.key === "Enter") $("signupConfirm").focus(); });
$("signupUsername").addEventListener("keydown", e => { if (e.key === "Enter") $("signupPassword").focus(); });

$("signupRoleChips").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  $("signupRoleChips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
});

async function doSignup() {
  const username = $("signupUsername").value.trim();
  const password = $("signupPassword").value;
  const confirm  = $("signupConfirm").value;
  const role     = $("signupRoleChips").querySelector(".chip.active")?.dataset.val || "athlete";

  const showErr = msg => {
    $("signupError").textContent = msg;
    $("signupError").classList.remove("hidden");
  };

  if (!username || !password) { showErr("Username and password are required"); return; }
  if (password !== confirm) {
    showErr("Passwords do not match");
    $("signupConfirm").value = "";
    $("signupConfirm").focus();
    return;
  }

  $("signupBtn").disabled = true;
  $("signupError").classList.add("hidden");

  try {
    const res = await fetch("/api/auth/signup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, password, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showErr(err.detail || "Sign up failed. Please try again.");
      $("signupPassword").value = "";
      $("signupConfirm").value  = "";
      $("signupPassword").focus();
      return;
    }
    const data = await res.json();
    state.token       = data.token;
    state.currentUser = data.user;
    $("signupUsername").value = "";
    $("signupPassword").value = "";
    $("signupConfirm").value  = "";
    $("signupRoleChips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    $("signupRoleChips").querySelector(".chip[data-val='athlete']").classList.add("active");
    await startApp();
  } catch (_) {
    showErr("Connection error. Is the server running?");
  } finally {
    $("signupBtn").disabled = false;
  }
}

$("logoutBtn").addEventListener("click", logout);

/* ── Google Sign-In ───────────────────────────────────────────────────────── */
async function initGoogleSignIn() {
  try {
    const res  = await fetch("/api/auth/google-client-id");
    const data = await res.json();
    if (!data.client_id) return;

    // Wait for the GSI library to load
    let attempts = 0;
    while (typeof google === "undefined" && attempts < 20) {
      await new Promise(r => setTimeout(r, 250));
      attempts++;
    }
    if (typeof google === "undefined") return;

    google.accounts.id.initialize({
      client_id: data.client_id,
      callback:  handleGoogleCredential,
    });
    google.accounts.id.renderButton(
      $("googleSignInBtn"),
      { theme: "outline", size: "large", width: 288, text: "signup_with" }
    );
    $("googleSignInWrapper").classList.remove("hidden");
  } catch (_) {
    // Google sign-in unavailable — silent fail
  }
}

async function handleGoogleCredential(response) {
  $("loginError").classList.add("hidden");
  try {
    const res = await fetch("/api/auth/google", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ credential: response.credential }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      $("loginError").textContent = err.detail || "Google sign-in failed";
      $("loginError").classList.remove("hidden");
      return;
    }
    const data = await res.json();
    state.token       = data.token;
    state.currentUser = data.user;
    await startApp();
  } catch (_) {
    $("loginError").textContent = "Connection error. Is the server running?";
    $("loginError").classList.remove("hidden");
  }
}

initGoogleSignIn();

/* ── User management ──────────────────────────────────────────────────────── */
$("usersBtn").addEventListener("click", openUsersModal);
$("usersModalClose").addEventListener("click", () => closeModal("usersModal"));
$("usersModal").addEventListener("click", e => { if (e.target === $("usersModal")) closeModal("usersModal"); });

// Role chip selector in users modal
$("newUserRoleChips").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  $("newUserRoleChips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
});

async function openUsersModal() {
  await loadUsersList();
  $("newUserUsername").value = "";
  $("newUserPassword").value = "";
  $("usersModal").classList.remove("hidden");
}

async function loadUsersList() {
  const users = await apiFetch("/api/users");
  const list  = $("usersList");
  list.innerHTML = "";
  users.forEach(u => {
    const row = document.createElement("div");
    row.className = "user-row";
    const isSelf = u.id === state.currentUser?.id;
    row.innerHTML = `
      <div class="user-row-info">
        <span class="user-row-name">${esc(u.username)}</span>
        <span class="user-role-badge role-${u.role}">${u.role}</span>
        ${isSelf ? '<span style="font-size:.75rem;color:#9CA3AF">(you)</span>' : ""}
      </div>
      <div class="user-row-actions">
        ${!isSelf ? `<button class="btn-danger btn-sm" onclick="deleteUser(${u.id}, '${esc(u.username)}')"><i class="fa-solid fa-trash"></i></button>` : ""}
      </div>
    `;
    list.appendChild(row);
  });
}

async function deleteUser(uid, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try {
    await apiFetch(`/api/users/${uid}`, { method: "DELETE" });
    await loadUsersList();
  } catch (err) { alert("Error: " + err.message); }
}

$("addUserBtn").addEventListener("click", async () => {
  const username = $("newUserUsername").value.trim();
  const password = $("newUserPassword").value;
  const role     = $("newUserRoleChips").querySelector(".chip.active")?.dataset.val || "athlete";
  if (!username || !password) { alert("Username and password are required."); return; }
  try {
    await apiFetch("/api/users", { method: "POST", body: JSON.stringify({ username, password, role }) });
    $("newUserUsername").value = "";
    $("newUserPassword").value = "";
    await loadUsersList();
  } catch (err) { alert("Error: " + err.message); }
});

/* ── Init ─────────────────────────────────────────────────────────────────── */
(async function init() {
  await checkAuth();
})();

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRAMS FEATURE
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Constants ────────────────────────────────────────────────────────────── */
const PHASE_COLORS = {
  accumulation:    "#3B82F6",
  intensification: "#F97316",
  realization:     "#EF4444",
  deload:          "#22C55E",
};

const PHASE_LABELS = {
  accumulation:    "Accum",
  intensification: "Intens",
  realization:     "Real",
  deload:          "Deload",
};

const GOAL_DEFAULTS = {
  strength:    { sets: 4, reps: "4",     intensity_type: "pct_1rm", intensity_value: "80", rest_seconds: 180 },
  hypertrophy: { sets: 4, reps: "8-10",  intensity_type: "rpe",     intensity_value: "8",  rest_seconds: 90  },
  power:       { sets: 4, reps: "3",     intensity_type: "pct_1rm", intensity_value: "75", rest_seconds: 150 },
  endurance:   { sets: 3, reps: "15-20", intensity_type: "rpe",     intensity_value: "7",  rest_seconds: 60  },
  mixed:       { sets: 3, reps: "8",     intensity_type: "rpe",     intensity_value: "8",  rest_seconds: 120 },
};

/* ── Program state ────────────────────────────────────────────────────────── */
const pState = {
  programs:            [],
  currentProgram:      null,
  activeWeekNum:       1,
  sexSessionId:        null,    // session being edited in the exercise modal
  sexEditId:           null,    // session-exercise id when editing (null = new)
  sexSelectedEx:       null,    // { id, name } selected from search
  oneRMMap:            {},      // exercise_id → weight_kg (float), loaded when editor opens
  contextAthleteId:    null,    // athlete id when creating program from athlete detail
  contextAthleteName:  null,    // athlete name for modal title display
  fromAthleteId:       null,    // athlete id to return to after leaving program editor
  contextTeamId:       null,
  contextTeamName:     null,
  fromTeamId:          null,
  teamMembers:         [],
  teamContextAthleteId: null,
  apvWeekNum:          1,
  apvDayNum:           1,
};

/* ── View switcher ────────────────────────────────────────────────────────── */
function switchView(view) {
  const isLib      = view === "library";
  const isProg     = view === "programs";
  const isORM      = view === "one-rm";
  const isAthletes = view === "athletes";
  const isAthDet   = view === "athlete-detail";
  const isTeams    = view === "teams";
  const isTeamDet  = view === "team-detail";
  const isStats    = view === "stats";
  const isLM       = view === "load-monitoring";

  $("libraryView").classList.toggle("hidden", !isLib);
  $("sidebar").classList.toggle("hidden", !isLib);
  $("sidebarToggle").classList.toggle("hidden", !isLib);
  if (!isLib) closeMobileSidebar();
  $("librarySearchBox").classList.toggle("hidden", !isLib);
  $("programsView").classList.toggle("hidden", !isProg);
  $("oneRMView").classList.toggle("hidden", !isORM);
  $("athletesView").classList.toggle("hidden", !isAthletes);
  $("athleteDetailView").classList.toggle("hidden", !isAthDet);
  $("teamsView").classList.toggle("hidden", !isTeams);
  $("teamDetailView").classList.toggle("hidden", !isTeamDet);
  $("statsView").classList.toggle("hidden", !isStats);
  $("loadMonitoringView").classList.toggle("hidden", !isLM);

  const isCoachOrStaff = ["coach", "staff"].includes(state.currentUser?.role);
  $("addExerciseBtn").classList.toggle("hidden", !isLib);
  $("importExcelBtn").classList.toggle("hidden", !isProg || !isCoachOrStaff);
  $("newProgramBtn").classList.toggle("hidden", !isProg);
  $("addOneRMBtn").classList.toggle("hidden", !isORM || !isCoachOrStaff);

  $("tabLibrary").classList.toggle("active", isLib);
  $("tabPrograms").classList.toggle("active", isProg);
  $("tabOneRM").classList.toggle("active", isORM);
  $("tabAthletes").classList.toggle("active", isAthletes || isAthDet);
  $("tabTeams").classList.toggle("active", isTeams || isTeamDet);
  $("tabStats").classList.toggle("active", isStats);
  $("tabLoadMonitoring").classList.toggle("active", isLM);

  if (isProg) loadPrograms();
  if (isORM)  loadOneRM();
  if (isAthletes) loadAthletes();
  if (isTeams) loadTeams();
  if (isStats) loadStats();
  if (isLM)   initLoadMonitoring();
}

$("tabLibrary").addEventListener("click",  () => switchView("library"));
$("tabPrograms").addEventListener("click", () => switchView("programs"));
$("tabOneRM").addEventListener("click",    () => switchView("one-rm"));
$("tabAthletes").addEventListener("click", () => switchView("athletes"));
$("tabTeams").addEventListener("click",    () => switchView("teams"));
$("tabStats").addEventListener("click",    () => switchView("stats"));
$("tabLoadMonitoring").addEventListener("click", () => switchView("load-monitoring"));
$("newProgramBtn").addEventListener("click", openNewProgramModal);
$("addOneRMBtn").addEventListener("click", () => openOneRMModal());
$("importExcelBtn").addEventListener("click", openImportExcelModal);
$("importExcelInput").addEventListener("change", handleExcelImport);
$("importExcelModalClose").addEventListener("click", closeImportExcelModal);
$("importExcelModalCancel").addEventListener("click", closeImportExcelModal);
$("importExcelModalConfirm").addEventListener("click", () => $("importExcelInput").click());

// Chip toggle for assign type
$("importAssignChips").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  $("importAssignChips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  const val = chip.dataset.val;
  $("importAthleteSection").classList.toggle("hidden", val !== "athlete");
  $("importTeamSection").classList.toggle("hidden", val !== "team");
});

async function openImportExcelModal() {
  // Ensure athletes and teams are loaded
  if (!state.athletes?.length) {
    const athletes = await apiFetch("/api/athletes").catch(() => []);
    state.athletes = athletes;
    aState.athletes = athletes;
  }
  if (!tState.teams?.length) {
    const teams = await apiFetch("/api/teams").catch(() => []);
    tState.teams = teams;
  }

  // Populate athlete dropdown
  const aSel = $("importAthleteSelect");
  aSel.innerHTML = '<option value="">— Sporcu seçin —</option>';
  (state.athletes || []).forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.name;
    aSel.appendChild(opt);
  });

  // Populate team dropdown
  const tSel = $("importTeamSelect");
  tSel.innerHTML = '<option value="">— Takım seçin —</option>';
  (tState.teams || []).forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    tSel.appendChild(opt);
  });

  // Reset chips to "none"
  $("importAssignChips").querySelectorAll(".chip").forEach(c =>
    c.classList.toggle("active", c.dataset.val === "none")
  );
  $("importAthleteSection").classList.add("hidden");
  $("importTeamSection").classList.add("hidden");

  $("importExcelModal").classList.remove("hidden");
}

function closeImportExcelModal() {
  $("importExcelModal").classList.add("hidden");
  $("importExcelInput").value = "";
}

async function handleExcelImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = "";

  closeImportExcelModal();

  const assignType = $("importAssignChips").querySelector(".chip.active")?.dataset.val || "none";
  const athleteId  = assignType === "athlete" ? $("importAthleteSelect").value  : "";
  const teamId     = assignType === "team"    ? $("importTeamSelect").value     : "";

  const btn = $("importExcelBtn");
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span class="btn-text"> İçe Aktarılıyor…</span>';

  try {
    const fd = new FormData();
    fd.append("file", file);
    if (athleteId) fd.append("athlete_id", athleteId);
    if (teamId)    fd.append("team_id",    teamId);

    const res = await fetch("/api/import/excel", {
      method: "POST",
      headers: { Authorization: `Bearer ${state.token}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "İçe aktarma başarısız");

    let msg = `${data.imported} program oluşturuldu.`;
    if (assignType === "athlete" && athleteId) {
      const a = (state.athletes || []).find(x => String(x.id) === String(athleteId));
      if (a) msg += `\nAtandı: ${a.name}`;
    } else if (assignType === "team" && teamId) {
      const t = (tState.teams || []).find(x => String(x.id) === String(teamId));
      if (t) msg += `\nAtandı: ${t.name}`;
    }
    if (data.unmatched_exercises?.length) {
      msg += `\n\nEşleşmeyen egzersizler (${data.unmatched_exercises.length}):\n${data.unmatched_exercises.join(", ")}`;
    }
    alert(msg);
    await loadPrograms();
    if (assignType === "team" && teamId && tState.currentTeam?.id === parseInt(teamId)) {
      await loadTeamPrograms(parseInt(teamId));
    }
    if (assignType === "athlete" && athleteId && aState.currentAthlete?.id === parseInt(athleteId)) {
      await loadAthletePrograms(parseInt(athleteId));
    }
  } catch (err) {
    alert("Hata: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

/* ── Load & render program cards ──────────────────────────────────────────── */
async function loadPrograms() {
  pState.programs = await apiFetch("/api/programs");
  renderProgramCards();
}

function renderProgramCards() {
  const grid = $("programsGrid");
  const empty = $("programsEmpty");
  const list = $("programsList");
  const editor = $("programEditor");

  editor.classList.add("hidden");
  $("athleteProgramView").classList.add("hidden");
  list.classList.remove("hidden");
  grid.innerHTML = "";

  if (pState.programs.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  pState.programs.forEach(p => {
    const card = document.createElement("div");
    card.className = "program-card";

    const goalCls = `goal-${p.goal}`;
    const phasesBar = (p.phases || []).map(ph =>
      `<div class="phase-bar-segment" style="background:${PHASE_COLORS[ph] || '#CBD5E1'}" title="${ph}"></div>`
    ).join("");

    const levelLabel = p.athlete_level
      ? `<span class="program-badge">${esc(p.athlete_level)}</span>` : "";
    const sportLabel = p.sport
      ? `<span class="program-badge">${esc(p.sport)}</span>` : "";
    const startLabel = p.start_date
      ? `<span>From ${esc(p.start_date)}</span>` : `<span>No start date</span>`;
    const teamLabel = p.team_id
      ? `<span class="program-badge" style="background:#EFF6FF;color:#1D4ED8"><i class="fa-solid fa-people-group" style="margin-right:3px"></i>Team</span>`
      : (p.athlete_id
        ? `<span class="program-badge" style="background:#F0FDF4;color:#166534"><i class="fa-solid fa-person-running" style="margin-right:3px"></i>Individual</span>`
        : "");

    card.innerHTML = `
      <div class="program-card-name">${esc(p.name)}</div>
      <div class="program-card-meta">
        <span class="program-badge ${goalCls}">${esc(p.goal)}</span>
        <span class="program-badge">${p.duration_weeks}w · ${p.days_per_week}d/wk</span>
        ${levelLabel}
        ${sportLabel}
        ${teamLabel}
      </div>
      <div class="phase-bar">${phasesBar}</div>
      <div class="program-card-footer">
        ${startLabel}
        <div class="program-card-actions">
          <button class="btn-icon edit-prog" title="Edit program"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon danger del-prog" title="Delete program"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;

    card.addEventListener("click", e => {
      if (e.target.closest(".edit-prog")) { e.stopPropagation(); openNewProgramModal(p); return; }
      if (e.target.closest(".del-prog"))  { e.stopPropagation(); confirmDeleteProgram(p); return; }
      openProgramEditor(p.id);
    });

    grid.appendChild(card);
  });
}

/* ── Program editor ───────────────────────────────────────────────────────── */
async function openProgramEditor(pidOrObj) {
  const pid = (typeof pidOrObj === "object") ? pidOrObj.id : pidOrObj;
  pState.currentProgram = await apiFetch(`/api/programs/${pid}/full`);

  // Pre-load all 1RM records into a fast lookup map (exercise_id → kg)
  const ormRecords = await apiFetch("/api/one-rm").catch(() => []);
  pState.oneRMMap = {};
  ormRecords.forEach(r => {
    if (r.exercise_id) {
      // Keep the most recent record per exercise (API already orders by date desc)
      if (!(r.exercise_id in pState.oneRMMap)) {
        pState.oneRMMap[r.exercise_id] = parseFloat(r.weight_kg);
      }
    }
  });

  // ── Athlete path: show simplified read-only view ──────────────────────────
  if (document.body.classList.contains("athlete-mode")) {
    pState.apvWeekNum = 1;
    pState.apvDayNum  = 1;
    $("programsList").classList.add("hidden");
    $("athleteProgramView").classList.remove("hidden");
    renderAthleteView();
    return;
  }
  // ─────────────────────────────────────────────────────────────────────────

  pState.activeWeekNum = 1;

  // If this is a team program, load team members and clear 1RM map (use athlete context selector instead)
  pState.teamMembers = [];
  pState.teamContextAthleteId = null;
  if (pState.currentProgram.team_id) {
    const isAthlete = state.currentUser?.role === "athlete";
    if (!isAthlete) {
      const team = await apiFetch("/api/teams/" + pState.currentProgram.team_id).catch(() => null);
      if (team) {
        pState.teamMembers = team.members || [];
        pState.oneRMMap = {};  // will be loaded when athlete is selected
      }
    }
    // Athletes keep the oneRMMap already loaded above (their own records)
  }

  $("programsList").classList.add("hidden");
  const editor = $("programEditor");
  editor.classList.remove("hidden");

  renderEditorHeader();
  renderWeekTimeline();
  renderSessionGrid();
}

function renderEditorHeader() {
  const p = pState.currentProgram;
  const goalCls = `goal-${p.goal}`;
  const levelBadge = p.athlete_level
    ? `<span class="program-badge">${esc(p.athlete_level)}</span>` : "";
  const sportBadge = p.sport
    ? `<span class="program-badge">${esc(p.sport)}</span>` : "";
  const teamBadge = p.team_id
    ? `<span class="program-badge" style="background:#EFF6FF;color:#1D4ED8"><i class="fa-solid fa-people-group" style="margin-right:4px"></i>${esc(p.team_name || "Team")}</span>`
    : "";

  let athleteSelector = "";
  if (p.team_id && pState.teamMembers.length > 0) {
    const options = pState.teamMembers.map(a =>
      `<option value="${a.id}" ${pState.teamContextAthleteId === a.id ? "selected" : ""}>${esc(a.name)}</option>`
    ).join("");
    athleteSelector = `
      <div style="display:flex;align-items:center;gap:8px;margin-right:12px">
        <label style="font-size:0.8rem;color:#6B7280;white-space:nowrap">Loads for:</label>
        <select id="teamAthleteCtx" style="padding:5px 8px;border:1.5px solid #E4E7ED;border-radius:8px;font-size:0.85rem;outline:none">
          <option value="">— select athlete —</option>
          ${options}
        </select>
      </div>
    `;
  }

  $("programEditorHeader").innerHTML = `
    <div class="editor-header-left">
      <div class="editor-program-name">${esc(p.name)}</div>
      <div class="editor-program-meta">
        <span class="program-badge ${goalCls}">${esc(p.goal)}</span>
        <span class="program-badge">${p.duration_weeks} weeks</span>
        <span class="program-badge">${p.days_per_week} days/week</span>
        <span class="program-badge">${esc(p.periodization_type)}</span>
        ${levelBadge}${sportBadge}${teamBadge}
      </div>
    </div>
    <div class="editor-header-right">
      ${athleteSelector}
      <button class="btn-ghost" id="exportExcelBtn" title="Excel olarak indir"><i class="fa-solid fa-file-excel"></i> Excel</button>
      <button class="btn-ghost" id="exportPdfBtn" title="PDF olarak indir"><i class="fa-solid fa-file-pdf"></i> PDF</button>
      <button class="btn-ghost" id="editorBackBtn"><i class="fa-solid fa-arrow-left"></i> All Programs</button>
    </div>
  `;
  $("exportExcelBtn").addEventListener("click", () => {
    const p = pState.currentProgram;
    downloadFile(`/api/programs/${p.id}/export/excel`, `${p.name}.xlsx`);
  });
  $("exportPdfBtn").addEventListener("click", () => {
    const p = pState.currentProgram;
    downloadFile(`/api/programs/${p.id}/export/pdf`, `${p.name}.pdf`);
  });
  $("editorBackBtn").addEventListener("click", () => {
    if (pState.fromAthleteId) {
      const aid = pState.fromAthleteId;
      pState.fromAthleteId = null;
      openAthleteDetail(aid);
    } else if (pState.fromTeamId) {
      const tid = pState.fromTeamId;
      pState.fromTeamId = null;
      openTeamDetail(tid);
    } else {
      $("programEditor").classList.add("hidden");
      $("programsList").classList.remove("hidden");
      loadPrograms();
    }
  });

  const ctxSel = $("teamAthleteCtx");
  if (ctxSel) {
    ctxSel.addEventListener("change", async () => {
      const aid = parseInt(ctxSel.value) || null;
      pState.teamContextAthleteId = aid;
      if (aid) {
        const records = await apiFetch("/api/athletes/" + aid + "/one-rm").catch(() => []);
        pState.oneRMMap = {};
        records.forEach(r => {
          if (r.exercise_id && !(r.exercise_id in pState.oneRMMap)) {
            pState.oneRMMap[r.exercise_id] = parseFloat(r.weight_kg);
          }
        });
      } else {
        pState.oneRMMap = {};
      }
      renderSessionGrid();
    });
  }
}

function renderWeekTimeline() {
  const p = pState.currentProgram;
  const tl = $("weekTimeline");
  tl.innerHTML = "";
  (p.weeks || []).forEach(w => {
    const color = PHASE_COLORS[w.phase] || "#CBD5E1";
    const label = PHASE_LABELS[w.phase] || (w.phase || "");
    const isActive = w.week_number === pState.activeWeekNum;
    const block = document.createElement("div");
    block.className = "week-block" + (isActive ? " active" : "");
    block.style.background = color;
    block.innerHTML = `
      <div class="week-block-num">W${w.week_number}</div>
    `;
    block.title = `Week ${w.week_number}`;
    block.addEventListener("click", () => {
      pState.activeWeekNum = w.week_number;
      renderWeekTimeline();
      renderSessionGrid();
    });
    tl.appendChild(block);
  });
}

function renderSessionGrid() {
  const p = pState.currentProgram;
  const week = (p.weeks || []).find(w => w.week_number === pState.activeWeekNum);
  const grid = $("sessionGrid");
  const title = $("sessionGridTitle");

  if (!week) { grid.innerHTML = ""; return; }

  title.innerHTML = `Week ${week.week_number} Sessions`;

  grid.style.setProperty("--days", p.days_per_week);
  grid.innerHTML = "";

  for (let day = 1; day <= p.days_per_week; day++) {
    const col = document.createElement("div");
    col.className = "session-col";
    col.innerHTML = `<div class="session-col-label">Day ${day}</div>`;

    const sessions = (week.sessions || []).filter(s => s.day_number === day);
    sessions.forEach(s => {
      col.appendChild(buildSessionCard(s, week.week_number));
    });

    const addBtn = document.createElement("button");
    addBtn.className = "add-session-btn";
    addBtn.innerHTML = `<i class="fa-solid fa-plus"></i> Add Session`;
    addBtn.addEventListener("click", () => promptAddSession(week.week_number, day));
    col.appendChild(addBtn);

    grid.appendChild(col);
  }
}

function buildSessionCard(session) {
  const card = document.createElement("div");
  card.className = "session-card";

  // Egzersizleri pairing_group'a göre grupla
  const groups = {};
  const ungrouped = [];
  (session.exercises || []).forEach(ex => {
    if (ex.pairing_group) {
      if (!groups[ex.pairing_group]) groups[ex.pairing_group] = [];
      groups[ex.pairing_group].push(ex);
    } else {
      ungrouped.push(ex);
    }
  });

  let exHtml = "";
  Object.keys(groups).sort().forEach(letter => {
    exHtml += buildPairingGroup(letter, groups[letter]);
  });
  ungrouped.forEach(ex => { exHtml += buildExRow(ex); });

  card.innerHTML = `
    <div class="session-card-header">
      <div class="session-card-name">${esc(session.session_name || "Session")}</div>
      <div class="session-card-actions">
        <button class="btn-icon del-session" title="Delete session"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
    <div class="ex-list">${exHtml}</div>
    <button class="add-ex-btn" style="margin-top:6px">
      <i class="fa-solid fa-plus"></i> Add Exercise
    </button>
  `;

  card.querySelector(".del-session").addEventListener("click", () => confirmDeleteSession(session));
  card.querySelector(".add-ex-btn").addEventListener("click", () => openSessionExModal(session.id, null));
  card.querySelectorAll(".ex-row").forEach(row => {
    const exId = parseInt(row.dataset.exid);
    const ex = (session.exercises || []).find(e => e.id === exId);
    if (ex) row.addEventListener("click", () => openSessionExModal(session.id, ex));
  });

  return card;
}

function buildPairingGroup(letter, exercises) {
  const sorted = [...exercises].sort((a, b) => (a.pairing_slot || 0) - (b.pairing_slot || 0));
  const rows = sorted.map(ex => buildExRow(ex, letter)).join("");
  return `
    <div class="pairing-group">
      <div class="pairing-group-header">
        <span class="pairing-badge">${esc(letter)}</span>
        <span class="pairing-group-label">Superset / Eşleştirme</span>
      </div>
      ${rows}
    </div>`;
}

function _setLabel(s) {
  if (!s.intensity_type || !s.intensity_value) return s.reps ? esc(s.reps) : "—";
  const intLabel = {
    load_kg:    `${s.intensity_value} kg`,
    pct_1rm:    `${s.intensity_value}% 1RM`,
    rpe:        `RPE ${s.intensity_value}`,
    rir:        `RIR ${s.intensity_value}`,
    bodyweight: "BW",
  }[s.intensity_type] || s.intensity_value;
  return s.reps ? `${esc(s.reps)} @ ${esc(intLabel)}` : esc(intLabel);
}

function buildExRow(ex, pairingLetter) {
  const setsData = ex.sets_data || [];
  const setsCount = setsData.length || ex.sets || 0;
  const slotLabel = pairingLetter && ex.pairing_slot
    ? `<span class="pairing-slot-label">${esc(pairingLetter)}${ex.pairing_slot}</span>`
    : "";

  let setsHtml = "";
  if (setsData.length) {
    setsHtml = `<div class="ex-sets-list">${
      setsData.map(s =>
        `<span class="ex-set-chip"><span class="ex-set-num">${s.set_number}</span>${_setLabel(s)}</span>`
      ).join("")
    }</div>`;
  } else {
    // Legacy: no per-set data
    const reps = ex.reps || "—";
    setsHtml = `<span class="prescription-text">${esc(setsCount)}×${esc(reps)}</span>`;
    if (ex.intensity_type && ex.intensity_value) {
      const label = {
        pct_1rm:    `${ex.intensity_value}% 1RM`,
        rpe:        `RPE ${ex.intensity_value}`,
        rir:        `RIR ${ex.intensity_value}`,
        load_kg:    `${ex.intensity_value} kg`,
        bodyweight: "BW",
      }[ex.intensity_type] || ex.intensity_value;
      setsHtml += ` <span class="intensity-badge">${esc(label)}</span>`;
    }
  }

  const rest = ex.rest_seconds ? `<span class="ex-rest-label">${ex.rest_seconds}s rest</span>` : "";

  const videoLink = ex.video_url
    ? `<a href="${esc(ex.video_url)}" target="_blank" rel="noopener" class="ex-video-link" title="Watch video"><i class="fa-solid fa-circle-play"></i></a>`
    : "";

  return `
    <div class="ex-row" data-exid="${ex.id}">
      <div class="ex-row-name">${slotLabel}${esc(ex.exercise_name || "Exercise")}${videoLink}</div>
      ${setsHtml}
      ${rest}
      <button class="btn-icon danger del-ex" data-id="${ex.id}" title="Remove" style="width:22px;height:22px;flex-shrink:0" onclick="event.stopPropagation();deleteSessionEx(${ex.id})"><i class="fa-solid fa-xmark" style="font-size:.65rem"></i></button>
    </div>
  `;
}

/* ── Athlete simplified program view ─────────────────────────────────────── */
function renderAthleteView() {
  const p = pState.currentProgram;
  $("apvProgramTitle").textContent = p.name;
  const goal  = p.goal ? `<span class="program-badge goal-${esc(p.goal)}">${esc(p.goal)}</span>` : "";
  const weeks = `<span class="program-badge">${p.duration_weeks}w · ${p.days_per_week}d/wk</span>`;
  const level = p.athlete_level ? `<span class="program-badge">${esc(p.athlete_level)}</span>` : "";
  $("apvProgramMeta").innerHTML = [goal, weeks, level].filter(Boolean).join(" ");
  $("apvExportExcelBtn").addEventListener("click", () => {
    downloadFile(`/api/programs/${p.id}/export/excel`, `${p.name}.xlsx`);
  });
  $("apvExportPdfBtn").addEventListener("click", () => {
    downloadFile(`/api/programs/${p.id}/export/pdf`, `${p.name}.pdf`);
  });
  renderApvWeekTabs();
  renderApvDayTabs();
  renderApvExercises();
}

function renderApvWeekTabs() {
  const p    = pState.currentProgram;
  const tabs = $("apvWeekTabs");
  tabs.innerHTML = "";
  (p.weeks || []).forEach(w => {
    const btn = document.createElement("button");
    btn.className = "apv-week-tab" + (w.week_number === pState.apvWeekNum ? " active" : "");
    btn.textContent = `W${w.week_number}`;
    if (w.phase) btn.title = w.phase;
    btn.addEventListener("click", () => {
      pState.apvWeekNum = w.week_number;
      pState.apvDayNum  = 1;
      renderApvWeekTabs();
      renderApvDayTabs();
      renderApvExercises();
    });
    tabs.appendChild(btn);
  });
  $("apvPrevWeek").disabled = pState.apvWeekNum <= 1;
  $("apvNextWeek").disabled = pState.apvWeekNum >= (p.weeks || []).length;
}

function renderApvDayTabs() {
  const p    = pState.currentProgram;
  const week = (p.weeks || []).find(w => w.week_number === pState.apvWeekNum);
  const tabs = $("apvDayTabs");
  tabs.innerHTML = "";
  if (!week) return;
  const days = [...new Set((week.sessions || []).map(s => s.day_number))].sort((a, b) => a - b);
  if (days.length === 0) {
    tabs.innerHTML = `<span class="apv-no-sessions">Bu hafta için antrenman yok.</span>`;
    return;
  }
  if (!days.includes(pState.apvDayNum)) pState.apvDayNum = days[0];
  days.forEach(day => {
    const btn = document.createElement("button");
    btn.className = "apv-day-tab" + (day === pState.apvDayNum ? " active" : "");
    const firstSession = (week.sessions || []).find(s => s.day_number === day);
    btn.textContent = firstSession?.session_name || `Gün ${day}`;
    btn.addEventListener("click", () => {
      pState.apvDayNum = day;
      renderApvDayTabs();
      renderApvExercises();
    });
    tabs.appendChild(btn);
  });
}

function renderApvExercises() {
  const p    = pState.currentProgram;
  const week = (p.weeks || []).find(w => w.week_number === pState.apvWeekNum);
  const list = $("apvExerciseList");
  list.innerHTML = "";
  if (!week) return;
  const sessions = (week.sessions || []).filter(s => s.day_number === pState.apvDayNum);
  if (sessions.length === 0) {
    list.innerHTML = `<div class="apv-empty"><i class="fa-solid fa-dumbbell"></i><p>Bu gün için egzersiz yok.</p></div>`;
    return;
  }
  sessions.forEach(session => {
    if (sessions.length > 1) {
      const heading = document.createElement("div");
      heading.className = "apv-session-heading";
      heading.textContent = session.session_name || "Antrenman";
      list.appendChild(heading);
    }
    (session.exercises || []).forEach((ex, idx) => {
      list.appendChild(buildApvExCard(ex, idx + 1));
    });
  });
}

function buildApvExCard(ex, num) {
  const setsData = ex.sets_data || [];

  let detailsHtml = "";
  if (setsData.length) {
    // Per-set display
    detailsHtml = setsData.map(s => {
      const intMap = {
        load_kg:    `${s.intensity_value} kg`,
        pct_1rm:    `${s.intensity_value}% 1RM`,
        rpe:        `RPE ${s.intensity_value}`,
        rir:        `RIR ${s.intensity_value}`,
        bodyweight: "Vücut Ağırlığı",
      };
      let label = s.reps || "—";
      if (s.intensity_type && s.intensity_value) {
        const intLabel = intMap[s.intensity_type] || s.intensity_value;
        // If %1RM and we have stored 1RM, show computed kg
        let computedKg = "";
        if (s.intensity_type === "pct_1rm" && ex.exercise_id && ex.exercise_id in pState.oneRMMap) {
          const rounded = Math.round(pState.oneRMMap[ex.exercise_id] * (parseFloat(s.intensity_value) / 100) / 2.5) * 2.5;
          computedKg = ` <span class="apv-ex-kg">${rounded.toFixed(1)} kg</span>`;
        }
        label += ` @ ${esc(intLabel)}${computedKg}`;
      }
      return `<span class="apv-set-chip"><b>${s.set_number}.</b> ${label}</span>`;
    }).join(" ");
  } else {
    // Legacy fallback
    const sets = ex.sets || "—";
    const reps = ex.reps || "—";
    const intensityMap = {
      pct_1rm:    `${ex.intensity_value}% 1RM`,
      rpe:        `RPE ${ex.intensity_value}`,
      rir:        `RIR ${ex.intensity_value}`,
      load_kg:    `${ex.intensity_value} kg`,
      bodyweight: "Vücut Ağırlığı",
    };
    const intensityText = (ex.intensity_type && ex.intensity_value) ? (intensityMap[ex.intensity_type] || esc(ex.intensity_value)) : "";
    let workingKg = "";
    if (ex.intensity_type === "pct_1rm" && ex.exercise_id && ex.exercise_id in pState.oneRMMap) {
      const rounded = Math.round(pState.oneRMMap[ex.exercise_id] * (parseFloat(ex.intensity_value) / 100) / 2.5) * 2.5;
      workingKg = `<span class="apv-ex-kg">${rounded.toFixed(1)} kg</span>`;
    }
    detailsHtml = `<span class="apv-ex-sets">${sets}<span class="apv-ex-x">×</span>${reps}</span>
      ${intensityText ? `<span class="apv-ex-intensity">${esc(intensityText)}</span>` : ""}
      ${workingKg}`;
  }

  const restText = ex.rest_seconds ? `${ex.rest_seconds}sn dinlenme` : "";
  const videoBtn = ex.video_url
    ? `<a href="${esc(ex.video_url)}" target="_blank" rel="noopener" class="apv-video-btn"><i class="fa-solid fa-circle-play"></i> Video</a>`
    : "";
  const card = document.createElement("div");
  card.className = "apv-ex-card";
  card.innerHTML = `
    <div class="apv-ex-num">${num}</div>
    <div class="apv-ex-body">
      <div class="apv-ex-name">${esc(ex.exercise_name || "Egzersiz")}</div>
      <div class="apv-ex-details">
        ${detailsHtml}
        ${restText ? `<span class="apv-ex-rest"><i class="fa-solid fa-clock"></i> ${restText}</span>` : ""}
      </div>
    </div>
    ${videoBtn}
  `;
  return card;
}

/* ── Add session prompt ───────────────────────────────────────────────────── */
/* ── Sync Week 1 day → same day in all other weeks ───────────────────────── */
async function _syncAndRefresh(dayNum) {
  const pid = pState.currentProgram.id;
  if (pState.activeWeekNum === 1 && (pState.currentProgram.duration_weeks || 1) > 1 && dayNum) {
    await apiFetch(`/api/programs/${pid}/sync-week1?day_number=${dayNum}`, { method: "POST" }).catch(() => {});
  }
  pState.currentProgram = await apiFetch(`/api/programs/${pid}/full`);
  renderSessionGrid();
}

function _dayForSession(sid) {
  for (const week of pState.currentProgram.weeks || []) {
    for (const s of week.sessions || []) {
      if (s.id === sid) return s.day_number;
    }
  }
  return null;
}

function _sessionForExercise(seid) {
  for (const week of pState.currentProgram.weeks || []) {
    for (const s of week.sessions || []) {
      if ((s.exercises || []).some(e => e.id === seid)) return s;
    }
  }
  return null;
}

async function promptAddSession(weekNum, dayNum) {
  const name = prompt(`Session name for Week ${weekNum}, Day ${dayNum}:`, "Session") || "Session";
  try {
    await apiFetch(`/api/programs/${pState.currentProgram.id}/sessions`, {
      method: "POST",
      body: JSON.stringify({ week_number: weekNum, day_number: dayNum, session_name: name }),
    });
    await _syncAndRefresh(dayNum);
  } catch (err) { alert("Error: " + err.message); }
}

/* ── Delete session ───────────────────────────────────────────────────────── */
function confirmDeleteSession(session) {
  $("confirmMsg").textContent = `Delete session "${session.session_name || "Session"}" and all its exercises?`;
  $("confirmModal").classList.remove("hidden");
  $("confirmYes").onclick = async () => {
    try {
      await apiFetch(`/api/sessions/${session.id}`, { method: "DELETE" });
      closeModal("confirmModal");
      await _syncAndRefresh(session.day_number);
    } catch (err) { alert("Error: " + err.message); }
  };
}

/* ── Delete session exercise ──────────────────────────────────────────────── */
async function deleteSessionEx(seid) {
  try {
    const ownerSession = _sessionForExercise(seid);
    await apiFetch(`/api/session-exercises/${seid}`, { method: "DELETE" });
    await _syncAndRefresh(ownerSession?.day_number ?? null);
  } catch (err) { alert("Error: " + err.message); }
}

/* ── Session exercise modal ───────────────────────────────────────────────── */
let sexSearchTimer;

async function _populateSexCategories() {
  const sel = $("sex-category");
  const current = sel.value;
  sel.innerHTML = `<option value="">— Kategori seçin —</option>`;
  const meta = await apiFetch("/api/meta");
  (meta.movement_patterns || []).forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    if (p === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

function _sexShowSelectionPhase(ex) {
  $("sexStep1").classList.add("hidden");
  $("sexStep2").classList.add("hidden");
  $("sexSelectedDisplay").classList.remove("hidden");
  $("sexSelectedName").textContent = ex.name;
}

function _sexResetToStep1() {
  pState.sexSelectedEx = null;
  $("sexSelectedDisplay").classList.add("hidden");
  $("sexSelectedName").textContent = "—";
  $("sex-category").value = "";
  $("sex-search").value = "";
  $("sexSearchResults").innerHTML = "";
  $("sexStep1").classList.remove("hidden");
  $("sexStep2").classList.add("hidden");
}

async function openSessionExModal(sessionId, exData) {
  pState.sexSessionId = sessionId;
  pState.sexEditId    = exData ? exData.id : null;
  pState.sexSelectedEx = exData ? { id: exData.exercise_id, name: exData.exercise_name } : null;

  $("sessionExTitle").textContent = exData ? "Edit Exercise" : "Add Exercise";
  $("sex-search").value = "";
  $("sexSearchResults").innerHTML = "";

  await _populateSexCategories();

  if (pState.sexSelectedEx && pState.sexSelectedEx.name) {
    $("sexStep1").classList.add("hidden");
    $("sexStep2").classList.add("hidden");
    $("sexSelectedDisplay").classList.remove("hidden");
    $("sexSelectedName").textContent = pState.sexSelectedEx.name;
  } else {
    $("sexSelectedDisplay").classList.add("hidden");
    $("sexSelectedName").textContent = "—";
    $("sexStep1").classList.remove("hidden");
    $("sexStep2").classList.add("hidden");
  }

  // Fill defaults from goal or from existing exercise data
  const goal = pState.currentProgram ? pState.currentProgram.goal : "strength";
  const defaults = GOAL_DEFAULTS[goal] || GOAL_DEFAULTS.mixed;

  $("sex-sets").value  = exData ? (exData.sets || "")         : defaults.sets;
  $("sex-reps").value  = exData ? (exData.reps || "")         : defaults.reps;
  $("sex-rest").value  = exData ? (exData.rest_seconds || "") : defaults.rest_seconds;
  $("sex-tempo").value = exData ? (exData.tempo || "")        : "";
  $("sex-notes").value = exData ? (exData.notes || "")        : "";

  // Eşleştirme alanları
  const hasPairing = !!(exData && exData.pairing_group);
  $("sex-pairing-toggle").checked = hasPairing;
  $("pairingOptions").classList.toggle("hidden", !hasPairing);
  $("sex-pairing-group").value = exData?.pairing_group || "";
  $("sex-pairing-slot").value  = exData?.pairing_slot  || "";

  // Load per-set data
  if (exData && exData.sets_data && exData.sets_data.length) {
    sexSetsData = exData.sets_data.map(s => ({
      set_number:      s.set_number,
      reps:            s.reps || "",
      intensity_type:  s.intensity_type || "",
      intensity_value: s.intensity_value || "",
      notes:           s.notes || "",
    }));
  } else if (exData && exData.sets) {
    // Legacy exercise with sets count but no per-set rows — auto-populate
    sexSetsData = Array.from({ length: exData.sets }, (_, i) => ({
      set_number:      i + 1,
      reps:            exData.reps || defaults.reps,
      intensity_type:  exData.intensity_type || defaults.intensity_type,
      intensity_value: exData.intensity_value || defaults.intensity_value,
      notes:           "",
    }));
  } else {
    // New exercise: auto-generate default sets from goal
    sexSetsData = Array.from({ length: defaults.sets }, (_, i) => ({
      set_number:      i + 1,
      reps:            defaults.reps,
      intensity_type:  defaults.intensity_type,
      intensity_value: defaults.intensity_value,
      notes:           "",
    }));
  }
  renderSetsTable();

  $("sessionExModal").classList.remove("hidden");
  $("sex-search").focus();
}

$("sex-pairing-toggle").addEventListener("change", e => {
  $("pairingOptions").classList.toggle("hidden", !e.target.checked);
});

$("sex-category").addEventListener("change", async e => {
  const pattern = e.target.value;
  $("sex-search").value = "";
  if (!pattern) {
    $("sexStep2").classList.add("hidden");
    $("sexSearchResults").innerHTML = "";
    return;
  }
  $("sexStep2").classList.remove("hidden");
  const results = await apiFetch(`/api/exercises?movement_pattern=${encodeURIComponent(pattern)}`);
  renderSexResults(results);
  $("sex-search").focus();
});

$("sex-search").addEventListener("input", e => {
  clearTimeout(sexSearchTimer);
  const val = e.target.value.trim();
  const pattern = $("sex-category").value;
  if (!val) {
    if (pattern) {
      sexSearchTimer = setTimeout(async () => {
        const results = await apiFetch(`/api/exercises?movement_pattern=${encodeURIComponent(pattern)}`);
        renderSexResults(results);
      }, 150);
    } else {
      $("sexSearchResults").innerHTML = "";
    }
    return;
  }
  sexSearchTimer = setTimeout(async () => {
    const params = new URLSearchParams({ search: val });
    if (pattern) params.set("movement_pattern", pattern);
    const results = await apiFetch(`/api/exercises?${params}`);
    renderSexResults(results);
  }, 250);
});

$("sexChangeBtn").addEventListener("click", () => {
  _sexResetToStep1();
});

function renderSexResults(exercises) {
  const container = $("sexSearchResults");
  container.innerHTML = "";
  if (exercises.length === 0) {
    container.innerHTML = `<div style="padding:10px 12px;font-size:.8rem;color:#9CA3AF">Egzersiz bulunamadı</div>`;
    return;
  }
  exercises.forEach(ex => {
    const item = document.createElement("div");
    item.className = "ex-search-result-item" + (pState.sexSelectedEx?.id === ex.id ? " selected" : "");
    item.innerHTML = `
      <span>${esc(ex.name)}</span>
      <span class="ex-search-result-pattern">${esc(ex.movement_pattern)}</span>
    `;
    item.addEventListener("click", () => {
      pState.sexSelectedEx = { id: ex.id, name: ex.name };
      _sexShowSelectionPhase(ex);
    });
    container.appendChild(item);
  });
}

$("sessionExSave").addEventListener("click", async () => {
  if (!pState.sexSelectedEx && !$("sex-reps").value && !$("sex-sets").value) {
    alert("Please search and select an exercise, or fill in at least sets/reps.");
    return;
  }
  const pairingOn = $("sex-pairing-toggle").checked;
  const payload = {
    exercise_id:   pState.sexSelectedEx?.id   || null,
    exercise_name: pState.sexSelectedEx?.name || null,
    sets:          parseInt($("sex-sets").value)  || sexSetsData.length || null,
    reps:          $("sex-reps").value.trim()      || null,
    rest_seconds:  parseInt($("sex-rest").value)   || null,
    tempo:         $("sex-tempo").value.trim()      || null,
    notes:         $("sex-notes").value.trim()      || null,
    pairing_group: pairingOn ? ($("sex-pairing-group").value || null) : null,
    pairing_slot:  pairingOn ? (parseInt($("sex-pairing-slot").value) || null) : null,
    sets_data:     sexSetsData.map(s => ({
      set_number:      s.set_number,
      reps:            s.reps            || null,
      intensity_type:  s.intensity_type  || null,
      intensity_value: s.intensity_value || null,
      notes:           s.notes           || null,
    })),
  };
  try {
    if (pState.sexEditId) {
      await apiFetch(`/api/session-exercises/${pState.sexEditId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch(`/api/sessions/${pState.sexSessionId}/exercises`, { method: "POST", body: JSON.stringify(payload) });
    }
    const day = _dayForSession(pState.sexSessionId);
    closeModal("sessionExModal");
    await _syncAndRefresh(day);
  } catch (err) { alert("Error: " + err.message); }
});

$("sessionExClose").addEventListener("click",  () => { _sexResetToStep1(); closeModal("sessionExModal"); });
$("sessionExCancel").addEventListener("click", () => { _sexResetToStep1(); closeModal("sessionExModal"); });
$("sessionExModal").addEventListener("click", e => { if (e.target === $("sessionExModal")) { _sexResetToStep1(); closeModal("sessionExModal"); } });

/* ── Per-set table ────────────────────────────────────────────────────────── */
let sexSetsData = []; // working copy while modal is open

function renderSetsTable() {
  const tbody = $("setsTableBody");
  const empty = $("setsEmpty");
  if (!sexSetsData.length) {
    tbody.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  tbody.innerHTML = sexSetsData.map((s, i) => `
    <tr>
      <td class="set-num">${s.set_number}</td>
      <td><input type="text" class="set-input set-reps" value="${esc(s.reps || "")}" placeholder="—" data-idx="${i}" /></td>
      <td>
        <select class="set-input set-intensity-type" data-idx="${i}">
          <option value="">—</option>
          <option value="load_kg"    ${s.intensity_type === "load_kg"    ? "selected" : ""}>kg</option>
          <option value="pct_1rm"   ${s.intensity_type === "pct_1rm"   ? "selected" : ""}>% 1RM</option>
          <option value="rpe"       ${s.intensity_type === "rpe"       ? "selected" : ""}>RPE</option>
          <option value="rir"       ${s.intensity_type === "rir"       ? "selected" : ""}>RIR</option>
          <option value="bodyweight"${s.intensity_type === "bodyweight"? "selected" : ""}>BW</option>
        </select>
      </td>
      <td><input type="text" class="set-input set-intensity-value" value="${esc(s.intensity_value || "")}" placeholder="—" data-idx="${i}" /></td>
      <td><button type="button" class="btn-icon danger remove-set-btn" data-idx="${i}" title="Remove set"><i class="fa-solid fa-xmark" style="font-size:.65rem"></i></button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".set-reps").forEach(el =>
    el.addEventListener("input", e => { sexSetsData[+e.target.dataset.idx].reps = e.target.value.trim(); })
  );
  tbody.querySelectorAll(".set-intensity-type").forEach(el =>
    el.addEventListener("change", e => { sexSetsData[+e.target.dataset.idx].intensity_type = e.target.value; })
  );
  tbody.querySelectorAll(".set-intensity-value").forEach(el =>
    el.addEventListener("input", e => { sexSetsData[+e.target.dataset.idx].intensity_value = e.target.value.trim(); })
  );
  tbody.querySelectorAll(".remove-set-btn").forEach(el =>
    el.addEventListener("click", e => {
      sexSetsData.splice(+e.currentTarget.dataset.idx, 1);
      sexSetsData.forEach((s, i) => { s.set_number = i + 1; });
      renderSetsTable();
    })
  );
}

function _addSetRow() {
  const last = sexSetsData[sexSetsData.length - 1];
  sexSetsData.push({
    set_number:      sexSetsData.length + 1,
    reps:            last?.reps            || $("sex-reps").value.trim() || "",
    intensity_type:  last?.intensity_type  || "",
    intensity_value: last?.intensity_value || "",
    notes:           "",
  });
  renderSetsTable();
}

function _generateSets() {
  const count = parseInt($("sex-sets").value);
  if (!count || count < 1) return;
  const defaultReps = $("sex-reps").value.trim();
  const baseType  = sexSetsData[0]?.intensity_type  || "";
  const baseVal   = sexSetsData[0]?.intensity_value || "";
  sexSetsData = Array.from({ length: count }, (_, i) => ({
    set_number:      i + 1,
    reps:            sexSetsData[i]?.reps            ?? defaultReps,
    intensity_type:  sexSetsData[i]?.intensity_type  ?? baseType,
    intensity_value: sexSetsData[i]?.intensity_value ?? baseVal,
    notes:           sexSetsData[i]?.notes           ?? "",
  }));
  renderSetsTable();
}

$("addSetRowBtn").addEventListener("click", _addSetRow);
$("generateSetsBtn").addEventListener("click", _generateSets);

/* ── New/Edit Program Modal ───────────────────────────────────────────────── */
let _editingProgramId = null;

async function openNewProgramModal(programData = null) {
  _editingProgramId = programData ? programData.id : null;
  if (programData) {
    $("programModalTitle").textContent = "Edit Program";
  } else if (pState.contextAthleteName) {
    $("programModalTitle").textContent = `New Program — ${pState.contextAthleteName}`;
  } else {
    $("programModalTitle").textContent = "New Training Program";
  }
  $("programModalSave").innerHTML = programData
    ? '<i class="fa-solid fa-check"></i> Save Changes'
    : '<i class="fa-solid fa-check"></i> Create Program';

  $("pm-name").value = programData?.name || "";
  $("pm-start-date").value = programData?.start_date || "";
  $("pm-notes").value = programData?.notes || "";

  // Weeks slider
  const weeks = programData?.duration_weeks || 8;
  $("pm-weeks").value = weeks;
  $("pm-weeks-val").textContent = weeks;
  _updateProgramEndDate();

  // Days selector
  const days = programData?.days_per_week || 3;
  $("pm-days-selector").querySelectorAll(".day-btn").forEach(b => {
    b.classList.toggle("active", parseInt(b.dataset.val) === days);
  });

  // Chip selectors
  setChipSelectorValue("pm-goal-chips",   programData?.goal               || "strength");
  setChipSelectorValue("pm-period-chips", programData?.periodization_type || "block");
  setChipSelectorValue("pm-level-chips",  programData?.athlete_level      || "intermediate");
  setChipSelectorValue("pm-sport-chips",  programData?.sport              || "general");

  // Team select
  const teamSection = $("pm-team-section");
  const teamSelect = $("pm-team-select");
  if (pState.contextAthleteId) {
    teamSection.classList.add("hidden");
  } else {
    teamSection.classList.remove("hidden");
    const teams = await apiFetch("/api/teams").catch(() => []);
    teamSelect.innerHTML = '<option value="">No team</option>';
    teams.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name + (t.sport ? ` (${t.sport})` : "");
      if (programData?.team_id === t.id || pState.contextTeamId === t.id) opt.selected = true;
      teamSelect.appendChild(opt);
    });
  }

  $("programModal").classList.remove("hidden");
  $("pm-name").focus();
}

function setChipSelectorValue(containerId, value) {
  $(containerId).querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("active", c.dataset.val === value);
  });
}

function getChipSelectorValue(containerId) {
  const active = $(containerId).querySelector(".chip.active");
  return active ? active.dataset.val : null;
}

// Weeks slider live update + end date recalc
$("pm-weeks").addEventListener("input", e => {
  $("pm-weeks-val").textContent = e.target.value;
  _updateProgramEndDate();
});

$("pm-start-date").addEventListener("change", _updateProgramEndDate);

function _updateProgramEndDate() {
  const startVal = $("pm-start-date").value;
  const weeks = parseInt($("pm-weeks").value) || 0;
  const endField = $("pm-end-date");
  if (startVal && weeks > 0) {
    const end = new Date(startVal);
    end.setDate(end.getDate() + weeks * 7 - 1);
    endField.value = end.toISOString().slice(0, 10);
  } else {
    endField.value = "";
  }
}

// Days selector buttons
$("pm-days-selector").addEventListener("click", e => {
  const btn = e.target.closest(".day-btn");
  if (!btn) return;
  $("pm-days-selector").querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
});

// Chip single-select in program modal
["pm-goal-chips", "pm-period-chips", "pm-level-chips", "pm-sport-chips"].forEach(id => {
  $(id).addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $(id).querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
  });
});

$("programModalSave").addEventListener("click", async () => {
  const name = $("pm-name").value.trim();
  if (!name) { alert("Please enter a program name."); $("pm-name").focus(); return; }

  const activeDay = $("pm-days-selector").querySelector(".day-btn.active");
  const payload = {
    name,
    start_date:         $("pm-start-date").value || null,
    duration_weeks:     parseInt($("pm-weeks").value),
    days_per_week:      activeDay ? parseInt(activeDay.dataset.val) : 3,
    goal:               getChipSelectorValue("pm-goal-chips")   || "strength",
    periodization_type: getChipSelectorValue("pm-period-chips") || "block",
    athlete_level:      getChipSelectorValue("pm-level-chips")  || null,
    sport:              getChipSelectorValue("pm-sport-chips")  || null,
    notes:              $("pm-notes").value.trim() || null,
    athlete_id:         pState.contextAthleteId || null,
    team_id:            parseInt($("pm-team-select").value) || null,
  };

  try {
    if (_editingProgramId) {
      await apiFetch(`/api/programs/${_editingProgramId}`, { method: "PUT", body: JSON.stringify(payload) });
      closeModal("programModal");
      await loadPrograms();
    } else {
      const created = await apiFetch("/api/programs", { method: "POST", body: JSON.stringify(payload) });
      const fromAthlete = pState.contextAthleteId;
      const fromTeam = pState.contextTeamId;
      pState.contextAthleteId   = null;
      pState.contextAthleteName = null;
      pState.contextTeamId      = null;
      pState.contextTeamName    = null;
      closeModal("programModal");
      if (fromAthlete) {
        pState.fromAthleteId = fromAthlete;
      }
      if (fromTeam) {
        pState.fromTeamId = fromTeam;
      }
      await openProgramEditor(created.id);
      return;
    }
  } catch (err) { alert("Error: " + err.message); }
});

$("programModalClose").addEventListener("click",  () => closeModal("programModal"));
$("programModalCancel").addEventListener("click", () => closeModal("programModal"));
$("programModal").addEventListener("click", e => { if (e.target === $("programModal")) closeModal("programModal"); });

/* ── Delete program ───────────────────────────────────────────────────────── */
function confirmDeleteProgram(p) {
  $("confirmMsg").textContent = `Delete program "${p.name}"? This will remove all weeks, sessions, and exercises.`;
  $("confirmModal").classList.remove("hidden");
  $("confirmYes").onclick = async () => {
    try {
      await apiFetch(`/api/programs/${p.id}`, { method: "DELETE" });
      closeModal("confirmModal");
      await loadPrograms();
    } catch (err) { alert("Error: " + err.message); }
  };
}

/* ── Keyboard close for new modals ────────────────────────────────────────── */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeModal("programModal");
    closeModal("sessionExModal");
    closeModal("oneRMModal");
  }
}, true);

/* ── Init programs ────────────────────────────────────────────────────────── */
function initPrograms() {
  // Nothing async needed at startup — programs and 1RM load on tab switch

  // Athlete simplified view: back button and week prev/next
  $("apvBackBtn").addEventListener("click", () => {
    $("athleteProgramView").classList.add("hidden");
    $("programsList").classList.remove("hidden");
  });

  $("apvPrevWeek").addEventListener("click", () => {
    if (pState.apvWeekNum > 1) {
      pState.apvWeekNum--;
      pState.apvDayNum = 1;
      renderApvWeekTabs();
      renderApvDayTabs();
      renderApvExercises();
    }
  });

  $("apvNextWeek").addEventListener("click", () => {
    const maxWeek = (pState.currentProgram?.weeks || []).length;
    if (pState.apvWeekNum < maxWeek) {
      pState.apvWeekNum++;
      pState.apvDayNum = 1;
      renderApvWeekTabs();
      renderApvDayTabs();
      renderApvExercises();
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   1RM RECORDS FEATURE
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 1RM state ────────────────────────────────────────────────────────────── */
const ormState = {
  records:          [],
  editingId:        null,
  selectedEx:       null,    // { id, name } from exercise search
  ormExSearchTimer: null,
  athleteId:        null,    // athlete context when adding 1RM from athlete detail
};

/* ── Load & render 1RM table ──────────────────────────────────────────────── */
async function loadOneRM(searchTerm) {
  const qs = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
  ormState.records = await apiFetch(`/api/one-rm${qs}`);
  renderORMTable();
  // Derived 1RMs only shown when not filtering (search is empty)
  if (!searchTerm) {
    const derived = await apiFetch("/api/one-rm/derived").catch(() => []);
    renderDerivedRMTable(derived);
  } else {
    $("derivedRMSection").classList.add("hidden");
  }
}

function renderORMTable() {
  const tbody  = $("ormTableBody");
  const empty  = $("ormEmpty");
  tbody.innerHTML = "";

  if (ormState.records.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  ormState.records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="one-rm-exercise-name">${esc(r.exercise_name)}</td>
      <td><span class="one-rm-weight">${esc(r.weight_kg)} kg</span></td>
      <td class="one-rm-date">${r.test_date ? esc(r.test_date) : "—"}</td>
      <td class="one-rm-notes-cell" title="${esc(r.notes || "")}">${r.notes ? esc(r.notes) : "—"}</td>
      <td>
        <div class="one-rm-actions">
          <button class="btn-icon" title="Edit" onclick="openOneRMModal(${r.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon danger" title="Delete" onclick="deleteORMRecord(${r.id}, '${esc(r.exercise_name).replace(/'/g,"\\'")}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ── Derived (calculated) 1RM table ──────────────────────────────────────── */
function renderDerivedRMTable(derived) {
  const section = $("derivedRMSection");
  const tbody   = $("derivedRMTableBody");
  tbody.innerHTML = "";

  if (!derived || derived.length === 0) {
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");
  derived.forEach(d => {
    const tr = document.createElement("tr");
    const pctLabel = (d.factor * 100).toFixed(d.factor % 0.01 === 0 ? 0 : 1) + "%";
    tr.innerHTML = `
      <td class="one-rm-exercise-name">${esc(d.exercise_name)}</td>
      <td><span class="one-rm-weight derived-weight">${d.weight_kg.toFixed(1)} kg${d.per_hand ? " <span class=\"per-hand-badge\">each hand</span>" : ""}</span></td>
      <td class="derived-formula">${esc(pctLabel)} of ${esc(d.source_name)} (${d.source_weight} kg)</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ── 1RM search box ───────────────────────────────────────────────────────── */
let ormSearchTimer;
$("ormSearchInput").addEventListener("input", e => {
  clearTimeout(ormSearchTimer);
  ormSearchTimer = setTimeout(() => loadOneRM(e.target.value.trim()), 300);
});

/* ── Open 1RM modal ───────────────────────────────────────────────────────── */
function openOneRMModal(recordIdOrObj) {
  // Accept either a numeric id (from the main 1RM table) or a full record object (from athlete detail)
  let existing = null;
  if (recordIdOrObj && typeof recordIdOrObj === "object") {
    existing = recordIdOrObj;
  } else if (recordIdOrObj) {
    existing = ormState.records.find(r => r.id === recordIdOrObj) || null;
  }
  ormState.editingId = existing ? existing.id : null;
  ormState.selectedEx = existing
    ? { id: existing.exercise_id, name: existing.exercise_name }
    : null;

  $("ormModalTitle").textContent = existing ? "Edit 1RM Record" : "Add 1RM Record";
  $("orm-ex-search").value = "";
  $("ormExSearchResults").innerHTML = "";
  $("ormCalcResult").classList.add("hidden");
  $("orm-calc-weight").value = "";
  $("orm-calc-reps").value   = "";

  if (ormState.selectedEx) {
    $("ormSelectedDisplay").classList.remove("hidden");
    $("ormSelectedName").textContent = ormState.selectedEx.name;
  } else {
    $("ormSelectedDisplay").classList.add("hidden");
    $("ormSelectedName").textContent = "—";
  }

  $("orm-weight").value = existing ? existing.weight_kg : "";
  $("orm-date").value   = existing ? (existing.test_date || "") : "";
  $("orm-notes").value  = existing ? (existing.notes || "") : "";

  $("oneRMModal").classList.remove("hidden");
  $("orm-ex-search").focus();
}

/* ── Exercise search inside 1RM modal ────────────────────────────────────── */
let ormExSearchTimer;
$("orm-ex-search").addEventListener("input", e => {
  clearTimeout(ormExSearchTimer);
  const val = e.target.value.trim();
  if (!val) { $("ormExSearchResults").innerHTML = ""; return; }
  ormExSearchTimer = setTimeout(async () => {
    const results = await apiFetch(`/api/exercises?search=${encodeURIComponent(val)}`);
    renderORMExResults(results.slice(0, 10));
  }, 250);
});

function renderORMExResults(exercises) {
  const container = $("ormExSearchResults");
  container.innerHTML = "";
  if (exercises.length === 0) {
    container.innerHTML = `<div style="padding:10px 12px;font-size:.8rem;color:#9CA3AF">No exercises found</div>`;
    return;
  }
  exercises.forEach(ex => {
    const item = document.createElement("div");
    item.className = "ex-search-result-item" + (ormState.selectedEx?.id === ex.id ? " selected" : "");
    item.innerHTML = `
      <span>${esc(ex.name)}</span>
      <span class="ex-search-result-pattern">${esc(ex.movement_pattern)}</span>
    `;
    item.addEventListener("click", () => {
      ormState.selectedEx = { id: ex.id, name: ex.name };
      $("ormSelectedDisplay").classList.remove("hidden");
      $("ormSelectedName").textContent = ex.name;
      $("ormExSearchResults").innerHTML = "";
      $("orm-ex-search").value = "";
    });
    container.appendChild(item);
  });
}

/* ── 1RM Calculator (Epley formula) ──────────────────────────────────────── */
// Epley: 1RM = weight × (1 + reps / 30)
// Brzycki: 1RM = weight × (36 / (37 − reps))
// We use Epley as primary, show both if desired
function calcOneRM(weightKg, reps) {
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

$("ormCalcBtn").addEventListener("click", () => {
  const w = parseFloat($("orm-calc-weight").value);
  const r = parseInt($("orm-calc-reps").value);
  if (!w || !r || r < 1 || r > 30) {
    alert("Enter a valid weight and rep count (1–30).");
    return;
  }
  const estimated = calcOneRM(w, r);
  const rounded = Math.round(estimated * 4) / 4; // round to nearest 0.25 kg
  $("ormCalcValue").textContent = `${rounded.toFixed(2)} kg`;
  $("ormCalcResult").classList.remove("hidden");
  $("ormCalcUseBtn").dataset.value = rounded.toFixed(2);
});

$("ormCalcUseBtn").addEventListener("click", () => {
  $("orm-weight").value = $("ormCalcUseBtn").dataset.value;
});

/* ── Save 1RM record ──────────────────────────────────────────────────────── */
$("ormModalSave").addEventListener("click", async () => {
  const weight = $("orm-weight").value.trim();
  if (!weight || isNaN(parseFloat(weight))) {
    alert("Please enter a valid weight.");
    $("orm-weight").focus();
    return;
  }
  const exerciseName = ormState.selectedEx?.name || prompt("Exercise name:");
  if (!exerciseName) return;

  const payload = {
    exercise_id:   ormState.selectedEx?.id || null,
    exercise_name: exerciseName,
    weight_kg:     weight,
    test_date:     $("orm-date").value || null,
    notes:         $("orm-notes").value.trim() || null,
    athlete_id:    ormState.athleteId || null,
  };

  try {
    if (ormState.editingId) {
      await apiFetch(`/api/one-rm/${ormState.editingId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch("/api/one-rm", { method: "POST", body: JSON.stringify(payload) });
    }
    closeModal("oneRMModal");
    const athleteCtx = ormState.athleteId;
    ormState.athleteId = null;
    if (athleteCtx) {
      await loadAthleteORM(athleteCtx);
    } else {
      await loadOneRM($("ormSearchInput").value.trim() || undefined);
    }
  } catch (err) { alert("Error: " + err.message); }
});

$("ormModalClose").addEventListener("click",  () => closeModal("oneRMModal"));
$("ormModalCancel").addEventListener("click", () => closeModal("oneRMModal"));
$("oneRMModal").addEventListener("click", e => { if (e.target === $("oneRMModal")) closeModal("oneRMModal"); });

/* ── Delete 1RM record ────────────────────────────────────────────────────── */
async function deleteORMRecord(id, name) {
  $("confirmMsg").textContent = `Delete 1RM record for "${name}"?`;
  $("confirmModal").classList.remove("hidden");
  $("confirmYes").onclick = async () => {
    try {
      await apiFetch(`/api/one-rm/${id}`, { method: "DELETE" });
      closeModal("confirmModal");
      await loadOneRM($("ormSearchInput").value.trim() || undefined);
    } catch (err) { alert("Error: " + err.message); }
  };
}


/* ═══════════════════════════════════════════════════════════════════════════
   ATHLETES FEATURE
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Athlete state ────────────────────────────────────────────────────────── */
const aState = {
  athletes:       [],
  currentAthlete: null,
  editingId:      null,
};

/* ── Sport icon/color maps ────────────────────────────────────────────────── */
const SPORT_ICONS = {
  gymnastics:  "fa-solid fa-ring",
  football:    "fa-solid fa-football",
  soccer:      "fa-solid fa-futbol",
  basketball:  "fa-solid fa-basketball",
  volleyball:  "fa-solid fa-volleyball",
  general:     "fa-solid fa-person-running",
};

const SPORT_COLORS = {
  gymnastics:  "#059669",
  football:    "#D97706",
  soccer:      "#16A34A",
  basketball:  "#EA580C",
  volleyball:  "#7C3AED",
  general:     "#4A7CF6",
};

const LEVEL_COLORS = {
  beginner:     { bg: "#F0FDF4", text: "#166534" },
  intermediate: { bg: "#EFF6FF", text: "#1D4ED8" },
  advanced:     { bg: "#FEF3C7", text: "#B45309" },
  elite:        { bg: "#FDF4FF", text: "#7E22CE" },
};

function sportColor(s) { return SPORT_COLORS[s] || "#6B7280"; }
function sportIcon(s)  { return SPORT_ICONS[s]  || "fa-solid fa-person-running"; }
function levelStyle(l) { return LEVEL_COLORS[l] || { bg: "#F1F5F9", text: "#475569" }; }

/* ── Load & render athletes ───────────────────────────────────────────────── */
async function loadAthletes() {
  aState.athletes = await apiFetch("/api/athletes");
  state.athletes  = aState.athletes;
  renderAthletes();
}

function renderAthletes() {
  const grid  = $("athletesGrid");
  const empty = $("athletesEmpty");
  grid.innerHTML = "";

  if (aState.athletes.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  aState.athletes.forEach(a => {
    const card = document.createElement("div");
    card.className = "athlete-card";
    const age    = a.birth_year ? new Date().getFullYear() - a.birth_year : null;
    const ageStr = age ? "Age: " + age : "";
    const ls     = levelStyle(a.level);
    const sc     = sportColor(a.sport);
    const si     = sportIcon(a.sport);

    const levelBadge = a.level
      ? `<div class="athlete-card-level" style="background:${ls.bg};color:${ls.text}">${esc(a.level)}</div>`
      : "";
    const sportSpan = a.sport
      ? `<span style="color:${sc};font-weight:600;text-transform:capitalize">${esc(a.sport)}</span>`
      : "";
    const posSpan = a.position
      ? `<span class="athlete-card-position">&middot; ${esc(a.position)}</span>`
      : "";
    const ageStat = ageStr
      ? `<div class="athlete-stat"><i class="fa-solid fa-cake-candles"></i> ${ageStr}</div>`
      : "";

    card.innerHTML = `
      <div class="athlete-card-sport-bar" style="background:${sc}"></div>
      <div class="athlete-card-body">
        <div class="athlete-card-header">
          <div class="athlete-card-avatar" style="background:${sc}22;color:${sc}">
            <i class="${si}"></i>
          </div>
          <div class="athlete-card-info">
            <div class="athlete-card-name">${esc(a.name)}</div>
            <div class="athlete-card-sub">${sportSpan}${posSpan}</div>
          </div>
          ${levelBadge}
        </div>
        <div class="athlete-card-stats">
          ${ageStat}
          <div class="athlete-stat"><i class="fa-solid fa-calendar-days"></i> ${a.program_count || 0} programs</div>
          <div class="athlete-stat"><i class="fa-solid fa-weight-hanging"></i> ${a.one_rm_count || 0} max records</div>
          ${a.username
            ? `<div class="athlete-stat" title="Login username"><i class="fa-solid fa-user" style="color:#3B82F6"></i> ${esc(a.username)}</div>`
            : `<div class="athlete-stat" style="color:#F97316" title="No login account yet"><i class="fa-solid fa-user-slash"></i> No account</div>`}
        </div>
        <div class="athlete-card-footer">
          <button class="btn-primary btn-sm open-athlete-btn" data-id="${a.id}">
            <i class="fa-solid fa-arrow-right"></i> Open
          </button>
          <button class="btn-ghost btn-sm edit-athlete-btn" data-id="${a.id}" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-danger btn-sm delete-athlete-btn" data-id="${a.id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".open-athlete-btn").forEach(btn => {
    btn.addEventListener("click", () => openAthleteDetail(parseInt(btn.dataset.id)));
  });
  grid.querySelectorAll(".edit-athlete-btn").forEach(btn => {
    btn.addEventListener("click", () => openAthleteModal(parseInt(btn.dataset.id)));
  });
  grid.querySelectorAll(".delete-athlete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteAthlete(parseInt(btn.dataset.id)));
  });
}

/* ── Athlete detail view ──────────────────────────────────────────────────── */
async function openAthleteDetail(aid) {
  const a = aState.athletes.find(x => x.id === aid) || await apiFetch("/api/athletes/" + aid);
  aState.currentAthlete = a;
  state.currentAthleteId = aid;

  const age = a.birth_year ? (new Date().getFullYear() - a.birth_year) + " yrs" : null;
  const sc  = sportColor(a.sport);
  const ls  = levelStyle(a.level);

  $("athleteDetailName").textContent = a.name;

  const sep = '<span style="color:#E5E7EB;margin:0 6px">&middot;</span>';
  const metaParts = [];
  if (a.sport)    metaParts.push(`<span style="color:${sc};font-weight:600;text-transform:capitalize"><i class="${sportIcon(a.sport)}"></i> ${esc(a.sport)}</span>`);
  if (a.position) metaParts.push(`<span>${esc(a.position)}</span>`);
  if (a.level)    metaParts.push(`<span style="background:${ls.bg};color:${ls.text};padding:2px 8px;border-radius:99px;font-size:.75rem;font-weight:600">${esc(a.level)}</span>`);
  if (age)        metaParts.push(`<span style="color:#9CA3AF">${age}</span>`);
  if (a.gender)   metaParts.push(`<span style="color:#9CA3AF;text-transform:capitalize">${esc(a.gender)}</span>`);
  if (a.username) metaParts.push(`<span style="color:#3B82F6"><i class="fa-solid fa-user"></i> ${esc(a.username)}</span>`);
  $("athleteDetailMeta").innerHTML = metaParts.join(sep);

  switchView("athlete-detail");
  await loadAthletePrograms(aid);
  await loadAthleteORM(aid);
}

async function loadAthletePrograms(aid) {
  const programs = await apiFetch("/api/athletes/" + aid + "/programs");
  const grid  = $("athleteProgramsGrid");
  const empty = $("athleteProgramsEmpty");
  grid.innerHTML = "";

  if (programs.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  programs.forEach(p => {
    const card = document.createElement("div");
    card.className = "program-card";
    const goalCls   = "goal-" + p.goal;
    const phasesBar = (p.phases || []).map(ph =>
      `<div class="phase-bar-segment" style="background:${PHASE_COLORS[ph] || '#CBD5E1'}" title="${ph}"></div>`
    ).join("");
    const levelLabel = p.athlete_level ? `<span class="program-badge">${esc(p.athlete_level)}</span>` : "";
    const sportLabel = p.sport         ? `<span class="program-badge">${esc(p.sport)}</span>` : "";
    const startLabel = p.start_date    ? `<span>From ${esc(p.start_date)}</span>` : "<span>No start date</span>";

    card.innerHTML = `
      <div class="program-card-name">${esc(p.name)}</div>
      <div class="program-card-meta">
        <span class="program-badge ${goalCls}">${esc(p.goal)}</span>
        <span class="program-badge">${p.duration_weeks}w &middot; ${p.days_per_week}d/wk</span>
        ${levelLabel}${sportLabel}
      </div>
      <div class="phase-bar">${phasesBar}</div>
      <div class="program-card-footer">
        ${startLabel}
        <div class="program-card-actions">
          <button class="btn-ghost btn-sm open-prog-from-athlete" data-id="${p.id}" title="Open">
            <i class="fa-solid fa-arrow-right"></i> Open
          </button>
          <button class="btn-danger btn-sm delete-prog-athlete" data-id="${p.id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll(".open-prog-from-athlete").forEach(btn => {
    btn.addEventListener("click", () => {
      pState.fromAthleteId = aState.currentAthlete?.id;
      openProgramFromAthleteDetail(parseInt(btn.dataset.id));
    });
  });
  grid.querySelectorAll(".delete-prog-athlete").forEach(btn => {
    btn.addEventListener("click", () => deleteAthleteProgram(parseInt(btn.dataset.id)));
  });
}

async function openProgramFromAthleteDetail(pid) {
  if (!pState.programs.length) {
    pState.programs = await apiFetch("/api/programs");
  }
  switchView("programs");
  await openProgramEditor(pid);
}

async function deleteAthleteProgram(pid) {
  $("confirmMsg").textContent = "Delete this program? This cannot be undone.";
  $("confirmModal").classList.remove("hidden");
  $("confirmYes").onclick = async () => {
    try {
      await apiFetch("/api/programs/" + pid, { method: "DELETE" });
      closeModal("confirmModal");
      await loadAthletePrograms(aState.currentAthlete.id);
    } catch (err) { alert("Error: " + err.message); }
  };
}

async function loadAthleteORM(aid) {
  const records = await apiFetch("/api/athletes/" + aid + "/one-rm");
  const tbody = $("athleteORMTableBody");
  const empty = $("athleteORMEmpty");
  tbody.innerHTML = "";

  if (records.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  records.forEach(r => {
    const tr = document.createElement("tr");
    const notesCell = r.notes    ? esc(r.notes)     : '<span style="color:#9CA3AF">&mdash;</span>';
    const dateCell  = r.test_date ? esc(r.test_date) : '<span style="color:#9CA3AF">&mdash;</span>';
    tr.innerHTML = `
      <td><strong>${esc(r.exercise_name)}</strong></td>
      <td><span style="font-weight:700;color:#1E293B">${esc(r.weight_kg)} kg</span></td>
      <td>${dateCell}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${notesCell}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-ghost btn-sm orm-edit-btn"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-danger btn-sm orm-del-btn"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    tr.querySelector(".orm-edit-btn").addEventListener("click", () => openORMModalForAthlete(aid, r));
    tr.querySelector(".orm-del-btn").addEventListener("click",  () => deleteAthleteORM(r.id, r.exercise_name));
    tbody.appendChild(tr);
  });
}

function openORMModalForAthlete(aid, record) {
  ormState.athleteId = aid;
  openOneRMModal(record);
}

async function deleteAthleteORM(rid, name) {
  $("confirmMsg").textContent = 'Delete 1RM record for "' + name + '"?';
  $("confirmModal").classList.remove("hidden");
  $("confirmYes").onclick = async () => {
    try {
      await apiFetch("/api/one-rm/" + rid, { method: "DELETE" });
      closeModal("confirmModal");
      await loadAthleteORM(aState.currentAthlete.id);
    } catch (err) { alert("Error: " + err.message); }
  };
}

/* ── Username slug generator (mirrors Python backend) ─────────────────────── */
function slugAthleteUsername(name) {
  const tr = { 'ı':'i','İ':'i','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ş':'s','Ş':'s','ö':'o','Ö':'o','ç':'c','Ç':'c' };
  let s = name.toLowerCase().replace(/[ıİğĞüÜşŞöÖçÇ]/g, ch => tr[ch] || ch);
  s = s.replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  return s;
}

/* ── New/Edit Athlete Modal ───────────────────────────────────────────────── */
async function openAthleteModal(athleteId) {
  if (athleteId === undefined) athleteId = null;
  aState.editingId = athleteId;
  const isEdit = !!athleteId;
  $("athleteModalTitle").textContent = isEdit ? "Edit Athlete" : "New Athlete";

  // Reset form
  $("am-name").value            = "";
  $("am-birth-year").value      = "";
  $("am-position").value        = "";
  $("am-notes").value           = "";
  $("am-password").value        = "";
  $("am-password-confirm").value= "";
  resetChips("am-sport-chips");
  resetChips("am-gender-chips");
  resetChips("am-level-chips", "intermediate");

  // Password section: on create = required; on edit = optional (leave blank = keep)
  $("am-password-label").innerHTML = isEdit
    ? 'New Password <span class="hint">(optional)</span>'
    : 'Password <span class="req">*</span>';
  $("am-password-hint").classList.toggle("hidden", !isEdit);
  $("am-username-preview").classList.add("hidden");
  $("am-existing-username").classList.add("hidden");

  if (isEdit) {
    const a = aState.athletes.find(x => x.id === athleteId) || await apiFetch("/api/athletes/" + athleteId);
    $("am-name").value       = a.name       || "";
    $("am-birth-year").value = a.birth_year || "";
    $("am-position").value   = a.position   || "";
    $("am-notes").value      = a.notes      || "";
    setChip("am-sport-chips",  a.sport  || "");
    setChip("am-gender-chips", a.gender || "");
    setChip("am-level-chips",  a.level  || "intermediate");

    if (a.username) {
      $("am-existing-username-value").textContent = a.username;
      $("am-existing-username").classList.remove("hidden");
    } else {
      // No account yet — show slug preview so coach knows what will be created
      updateUsernamePreview(a.name);
    }
  }

  $("athleteModal").classList.remove("hidden");
  $("am-name").focus();
}

function updateUsernamePreview(name) {
  if (!aState.editingId && name.trim().length > 1) {
    $("am-username-value").textContent = slugAthleteUsername(name.trim());
    $("am-username-preview").classList.remove("hidden");
  } else {
    $("am-username-preview").classList.add("hidden");
  }
}

$("am-name").addEventListener("input", () => {
  updateUsernamePreview($("am-name").value);
});

function resetChips(containerId, defaultVal) {
  if (defaultVal === undefined) defaultVal = "";
  const container = $(containerId);
  container.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("active", c.dataset.val === defaultVal);
  });
}

function setChip(containerId, val) {
  const container = $(containerId);
  container.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("active", c.dataset.val === val);
  });
}

["am-sport-chips", "am-gender-chips", "am-level-chips"].forEach(id => {
  $(id).addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    $(id).querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
  });
});

$("newAthleteBtn").addEventListener("click", () => openAthleteModal());
$("athleteModalClose").addEventListener("click",  () => closeModal("athleteModal"));
$("athleteModalCancel").addEventListener("click", () => closeModal("athleteModal"));
$("athleteModal").addEventListener("click", e => { if (e.target === $("athleteModal")) closeModal("athleteModal"); });

$("athleteModalSave").addEventListener("click", async () => {
  const name     = $("am-name").value.trim();
  const password = $("am-password").value;
  const confirm  = $("am-password-confirm").value;
  const isEdit   = !!aState.editingId;

  if (!name) { alert("Athlete name is required."); $("am-name").focus(); return; }

  // Password validation
  if (!isEdit && !password) {
    alert("Password is required to create an athlete account.");
    $("am-password").focus();
    return;
  }
  if (password && password.length < 4) {
    alert("Password must be at least 4 characters.");
    $("am-password").focus();
    return;
  }
  if (password && password !== confirm) {
    alert("Passwords do not match.");
    $("am-password-confirm").focus();
    return;
  }

  const payload = {
    name,
    birth_year: parseInt($("am-birth-year").value) || null,
    sport:      $("am-sport-chips").querySelector(".chip.active")?.dataset.val  || null,
    gender:     $("am-gender-chips").querySelector(".chip.active")?.dataset.val || null,
    level:      $("am-level-chips").querySelector(".chip.active")?.dataset.val  || null,
    position:   $("am-position").value.trim() || null,
    notes:      $("am-notes").value.trim()    || null,
  };
  if (!payload.sport)  delete payload.sport;
  if (!payload.gender) delete payload.gender;
  if (password)        payload.password = password;

  try {
    let result;
    if (isEdit) {
      result = await apiFetch("/api/athletes/" + aState.editingId, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      result = await apiFetch("/api/athletes", { method: "POST", body: JSON.stringify(payload) });
    }
    closeModal("athleteModal");
    await loadAthletes();
    if (isEdit && aState.currentAthlete?.id === aState.editingId) {
      await openAthleteDetail(aState.editingId);
    } else if (!isEdit && result?.username) {
      // Show the generated username to the coach right after creating
      setTimeout(() => alert(`Athlete created!\nLogin username: ${result.username}\nPassword: set by you`), 100);
    }
  } catch (err) { alert("Error: " + err.message); }
});

async function deleteAthlete(aid) {
  const a = aState.athletes.find(x => x.id === aid);
  const aName = a ? a.name : "";
  $("confirmMsg").textContent = 'Delete athlete "' + aName + '"? Their programs and 1RM records will remain but be unlinked.';
  $("confirmModal").classList.remove("hidden");
  $("confirmYes").onclick = async () => {
    try {
      await apiFetch("/api/athletes/" + aid, { method: "DELETE" });
      closeModal("confirmModal");
      await loadAthletes();
    } catch (err) { alert("Error: " + err.message); }
  };
}

/* ── Athlete detail action buttons ───────────────────────────────────────── */
$("backToAthletesBtn").addEventListener("click", () => switchView("athletes"));

$("editAthleteBtn").addEventListener("click", () => {
  if (aState.currentAthlete) openAthleteModal(aState.currentAthlete.id);
});

$("athleteNewProgramBtn").addEventListener("click", () => {
  pState.contextAthleteId   = aState.currentAthlete?.id;
  pState.contextAthleteName = aState.currentAthlete?.name;
  openNewProgramModal();
});

$("athleteAddORMBtn").addEventListener("click", () => {
  ormState.athleteId = aState.currentAthlete?.id;
  openOneRMModal();
});

/* ═══════════════════════════════════════════════════════════════════════════
   TEAMS FEATURE
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Team state ───────────────────────────────────────────────────────────── */
const tState = {
  teams:       [],
  currentTeam: null,
  editingId:   null,
};

/* ── Load & render teams ──────────────────────────────────────────────────── */
async function loadTeams() {
  tState.teams = await apiFetch("/api/teams");
  renderTeams();
}

function renderTeams() {
  const grid  = $("teamsGrid");
  const empty = $("teamsEmpty");
  grid.innerHTML = "";

  if (tState.teams.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  tState.teams.forEach(t => {
    const card = document.createElement("div");
    card.className = "athlete-card";
    const sc = sportColor(t.sport);
    const si = sportIcon(t.sport);
    const sportSpan = t.sport
      ? `<span style="color:${sc};font-weight:600;text-transform:capitalize">${esc(t.sport)}</span>`
      : `<span style="color:#6B7280">General</span>`;

    card.innerHTML = `
      <div class="athlete-card-sport-bar" style="background:${sc}"></div>
      <div class="athlete-card-body">
        <div class="athlete-card-header">
          <div class="athlete-card-avatar" style="background:${sc}22;color:${sc}">
            <i class="${si}"></i>
          </div>
          <div class="athlete-card-info">
            <div class="athlete-card-name">${esc(t.name)}</div>
            <div class="athlete-card-sub">${sportSpan}</div>
          </div>
        </div>
        <div class="athlete-card-stats">
          <div class="athlete-stat"><i class="fa-solid fa-users"></i> ${t.member_count || 0} athletes</div>
          <div class="athlete-stat"><i class="fa-solid fa-calendar-days"></i> ${t.program_count || 0} programs</div>
        </div>
        <div class="athlete-card-actions">
          <button class="btn-ghost btn-sm edit-team-btn" data-id="${t.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-danger btn-sm del-team-btn" data-id="${t.id}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    card.addEventListener("click", e => {
      if (e.target.closest(".edit-team-btn")) { e.stopPropagation(); openTeamModal(t.id); return; }
      if (e.target.closest(".del-team-btn"))  { e.stopPropagation(); confirmDeleteTeam(t.id, t.name); return; }
      openTeamDetail(t.id);
    });
    grid.appendChild(card);
  });
}

/* ── Team detail ──────────────────────────────────────────────────────────── */
async function openTeamDetail(tid) {
  const team = await apiFetch("/api/teams/" + tid);
  tState.currentTeam = team;

  $("teamDetailName").textContent = team.name;
  const sportStr = team.sport ? team.sport.charAt(0).toUpperCase() + team.sport.slice(1) : "General";
  const memberStr = `${team.member_count || 0} athletes`;
  $("teamDetailMeta").textContent = `${sportStr} · ${memberStr}`;

  switchView("team-detail");
  renderTeamRoster(team.members || []);
  await loadTeamPrograms(tid);
}

function renderTeamRoster(members) {
  const grid  = $("teamRosterGrid");
  const empty = $("teamRosterEmpty");
  grid.innerHTML = "";

  if (!members.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  members.forEach(a => {
    const card = document.createElement("div");
    card.className = "athlete-card";
    const sc = sportColor(a.sport);
    const si = sportIcon(a.sport);
    const sportSpan = a.sport
      ? `<span style="color:${sc};font-weight:600;text-transform:capitalize">${esc(a.sport)}</span>` : "";
    const posSpan = a.position ? `<span class="athlete-card-position">&middot; ${esc(a.position)}</span>` : "";
    const ls = levelStyle(a.level);
    const levelBadge = a.level
      ? `<div class="athlete-card-level" style="background:${ls.bg};color:${ls.text}">${esc(a.level)}</div>` : "";

    card.innerHTML = `
      <div class="athlete-card-sport-bar" style="background:${sc}"></div>
      <div class="athlete-card-body">
        <div class="athlete-card-header">
          <div class="athlete-card-avatar" style="background:${sc}22;color:${sc}">
            <i class="${si}"></i>
          </div>
          <div class="athlete-card-info">
            <div class="athlete-card-name">${esc(a.name)}</div>
            <div class="athlete-card-sub">${sportSpan}${posSpan}</div>
          </div>
          ${levelBadge}
        </div>
        <div class="athlete-card-actions" style="margin-top:10px">
          <button class="btn-danger btn-sm remove-member-btn" data-aid="${a.id}" title="Remove from team">
            <i class="fa-solid fa-user-minus"></i> Remove
          </button>
        </div>
      </div>
    `;
    card.querySelector(".remove-member-btn").addEventListener("click", e => {
      e.stopPropagation();
      confirmRemoveMember(a.id, a.name);
    });
    grid.appendChild(card);
  });
}

async function confirmRemoveMember(aid, name) {
  $("confirmMsg").textContent = `Remove ${name} from this team?`;
  $("confirmModal").classList.remove("hidden");
  $("confirmYes").onclick = async () => {
    try {
      await apiFetch(`/api/teams/${tState.currentTeam.id}/members/${aid}`, { method: "DELETE" });
      closeModal("confirmModal");
      const updated = await apiFetch("/api/teams/" + tState.currentTeam.id);
      tState.currentTeam = updated;
      renderTeamRoster(updated.members || []);
    } catch (err) { alert("Error: " + err.message); }
  };
}

async function loadTeamPrograms(tid) {
  const programs = await apiFetch("/api/teams/" + tid + "/programs");
  const grid  = $("teamProgramsGrid");
  const empty = $("teamProgramsEmpty");
  grid.innerHTML = "";

  if (!programs.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  programs.forEach(p => {
    const card = document.createElement("div");
    card.className = "program-card";
    const goalCls = `goal-${p.goal}`;
    const phasesBar = (p.phases || []).map(ph =>
      `<div class="phase-bar-segment" style="background:${PHASE_COLORS[ph] || '#CBD5E1'}" title="${ph}"></div>`
    ).join("");
    const startLabel = p.start_date ? `<span>From ${esc(p.start_date)}</span>` : `<span>No start date</span>`;

    card.innerHTML = `
      <div class="program-card-name">${esc(p.name)}</div>
      <div class="program-card-meta">
        <span class="program-badge ${goalCls}">${esc(p.goal)}</span>
        <span class="program-badge">${p.duration_weeks}w · ${p.days_per_week}d/wk</span>
      </div>
      <div class="phase-bar">${phasesBar}</div>
      <div class="program-card-footer">
        ${startLabel}
        <div class="program-card-actions">
          <button class="btn-icon del-team-prog" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
    card.addEventListener("click", e => {
      if (e.target.closest(".del-team-prog")) {
        e.stopPropagation();
        $("confirmMsg").textContent = `Delete program "${p.name}"?`;
        $("confirmModal").classList.remove("hidden");
        $("confirmYes").onclick = async () => {
          try {
            await apiFetch("/api/programs/" + p.id, { method: "DELETE" });
            closeModal("confirmModal");
            await loadTeamPrograms(tState.currentTeam.id);
          } catch (err) { alert("Error: " + err.message); }
        };
        return;
      }
      pState.fromTeamId = tState.currentTeam?.id;
      switchView("programs");
      openProgramEditor(p.id);
    });
    grid.appendChild(card);
  });
}

/* ── Team modal ───────────────────────────────────────────────────────────── */
async function openTeamModal(teamId) {
  tState.editingId = teamId || null;
  const isEdit = !!teamId;
  $("teamModalTitle").textContent = isEdit ? "Edit Team" : "New Team";
  $("tm-name").value  = "";
  $("tm-notes").value = "";
  resetChips("tm-sport-chips");

  if (isEdit) {
    const t = tState.teams.find(x => x.id === teamId) || await apiFetch("/api/teams/" + teamId);
    $("tm-name").value  = t.name  || "";
    $("tm-notes").value = t.notes || "";
    setChip("tm-sport-chips", t.sport || "");
  }

  $("teamModal").classList.remove("hidden");
  $("tm-name").focus();
}

$("newTeamBtn").addEventListener("click", () => openTeamModal());
$("teamModalClose").addEventListener("click",  () => closeModal("teamModal"));
$("teamModalCancel").addEventListener("click", () => closeModal("teamModal"));
$("teamModal").addEventListener("click", e => { if (e.target === $("teamModal")) closeModal("teamModal"); });

$("tm-sport-chips").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  $("tm-sport-chips").querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
});

$("teamModalSave").addEventListener("click", async () => {
  const name = $("tm-name").value.trim();
  if (!name) { alert("Team name is required."); $("tm-name").focus(); return; }
  const payload = {
    name,
    sport: $("tm-sport-chips").querySelector(".chip.active")?.dataset.val || null,
    notes: $("tm-notes").value.trim() || null,
  };
  if (!payload.sport) payload.sport = null;
  try {
    if (tState.editingId) {
      await apiFetch("/api/teams/" + tState.editingId, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch("/api/teams", { method: "POST", body: JSON.stringify(payload) });
    }
    closeModal("teamModal");
    await loadTeams();
    if (tState.editingId && tState.currentTeam?.id === tState.editingId) {
      await openTeamDetail(tState.editingId);
    }
  } catch (err) { alert("Error: " + err.message); }
});

async function confirmDeleteTeam(tid, name) {
  $("confirmMsg").textContent = `Delete team "${name}"? Athletes and programs will not be deleted.`;
  $("confirmModal").classList.remove("hidden");
  $("confirmYes").onclick = async () => {
    try {
      await apiFetch("/api/teams/" + tid, { method: "DELETE" });
      closeModal("confirmModal");
      await loadTeams();
    } catch (err) { alert("Error: " + err.message); }
  };
}

/* ── Add member modal ─────────────────────────────────────────────────────── */
$("backToTeamsBtn").addEventListener("click", () => switchView("teams"));
$("editTeamBtn").addEventListener("click",    () => { if (tState.currentTeam) openTeamModal(tState.currentTeam.id); });

$("teamNewProgramBtn").addEventListener("click", () => {
  pState.contextTeamId   = tState.currentTeam?.id;
  pState.contextTeamName = tState.currentTeam?.name;
  pState.contextAthleteId   = null;
  pState.contextAthleteName = null;
  openNewProgramModal();
});

$("addMemberBtn").addEventListener("click", async () => {
  const athletes = await apiFetch("/api/athletes");
  const teamMemberIds = new Set((tState.currentTeam?.members || []).map(m => m.id));
  const available = athletes.filter(a => !teamMemberIds.has(a.id));

  const sel = $("member-athlete-select");
  sel.innerHTML = '<option value="">— Select an athlete —</option>';
  available.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.name + (a.sport ? ` (${a.sport})` : "");
    sel.appendChild(opt);
  });

  $("addMemberModal").classList.remove("hidden");
});

$("addMemberModalClose").addEventListener("click",  () => closeModal("addMemberModal"));
$("addMemberModalCancel").addEventListener("click", () => closeModal("addMemberModal"));
$("addMemberModal").addEventListener("click", e => { if (e.target === $("addMemberModal")) closeModal("addMemberModal"); });

$("addMemberModalSave").addEventListener("click", async () => {
  const aid = parseInt($("member-athlete-select").value);
  if (!aid) { alert("Please select an athlete."); return; }
  try {
    await apiFetch(`/api/teams/${tState.currentTeam.id}/members`, {
      method: "POST",
      body: JSON.stringify({ athlete_id: aid }),
    });
    closeModal("addMemberModal");
    const updated = await apiFetch("/api/teams/" + tState.currentTeam.id);
    tState.currentTeam = updated;
    $("teamDetailMeta").textContent = `${updated.sport ? updated.sport.charAt(0).toUpperCase() + updated.sport.slice(1) : "General"} · ${updated.member_count || 0} athletes`;
    renderTeamRoster(updated.members || []);
  } catch (err) { alert("Error: " + err.message); }
});

/* ═══════════════════════════════════════════════════════════════════════════
   STATISTICS
   ═══════════════════════════════════════════════════════════════════════════ */

const statsState = {
  activeTab:              "individual",
  individualChart:        null,
  teamChart:              null,
  compareChart:           null,
  compareAthletes:        [],       // { id, name, sport, records: null | [] }
  compareExercises:       new Set(),
  compareAllExercises:    [],
  compareAllAthletesList: [],
  compareInitialized:     false,
};

/* Colour palette for athletes in team comparison */
const ATHLETE_PALETTE = [
  "#4A7CF6", "#10B981", "#F97316", "#A855F7", "#EF4444",
  "#06B6D4", "#D97706", "#EC4899", "#059669", "#6366F1",
  "#84CC16", "#F59E0B", "#3B82F6", "#14B8A6", "#E879F9",
];

/* ── Sub-tab switching ────────────────────────────────────────────────────── */
$("statsTabIndividual").addEventListener("click", () => {
  statsState.activeTab = "individual";
  $("statsTabIndividual").classList.add("active");
  $("statsTabTeam").classList.remove("active");
  $("statsTabCompare").classList.remove("active");
  $("statsIndividualPanel").classList.remove("hidden");
  $("statsTeamPanel").classList.add("hidden");
  $("statsComparePanel").classList.add("hidden");
});

$("statsTabTeam").addEventListener("click", () => {
  statsState.activeTab = "team";
  $("statsTabTeam").classList.add("active");
  $("statsTabIndividual").classList.remove("active");
  $("statsTabCompare").classList.remove("active");
  $("statsTeamPanel").classList.remove("hidden");
  $("statsIndividualPanel").classList.add("hidden");
  $("statsComparePanel").classList.add("hidden");
});

$("statsTabCompare").addEventListener("click", () => {
  statsState.activeTab = "compare";
  $("statsTabCompare").classList.add("active");
  $("statsTabIndividual").classList.remove("active");
  $("statsTabTeam").classList.remove("active");
  $("statsComparePanel").classList.remove("hidden");
  $("statsIndividualPanel").classList.add("hidden");
  $("statsTeamPanel").classList.add("hidden");
});

/* ── Load stats view (populate dropdowns) ────────────────────────────────── */
async function loadStats() {
  const [athletes, teams] = await Promise.all([
    apiFetch("/api/athletes"),
    apiFetch("/api/teams"),
  ]);

  /* Athlete dropdown */
  const aSel = $("statsAthleteSelect");
  const prevAid = aSel.value;
  aSel.innerHTML = '<option value="">— Choose an athlete —</option>';
  athletes.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.name + (a.sport ? ` (${a.sport})` : "");
    aSel.appendChild(opt);
  });
  if (prevAid) aSel.value = prevAid;

  /* Team dropdown */
  const tSel = $("statsTeamSelect");
  const prevTid = tSel.value;
  tSel.innerHTML = '<option value="">— Choose a team —</option>';
  teams.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name + (t.sport ? ` (${t.sport})` : "");
    tSel.appendChild(opt);
  });
  if (prevTid) tSel.value = prevTid;

  /* Comparison dropdown */
  statsState.compareAllAthletesList = athletes;
  const cSel = $("compareAthleteSelect");
  cSel.innerHTML = '<option value="">— Add an athlete —</option>';
  athletes.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.name + (a.sport ? ` (${a.sport})` : "");
    cSel.appendChild(opt);
  });
  rebuildCompareAthleteDropdown();
  initComparePanel();
}

/* ── Individual athlete stats ────────────────────────────────────────────── */
$("statsAthleteSelect").addEventListener("change", async e => {
  const aid = parseInt(e.target.value);
  if (!aid) {
    $("statsIndividualContent").classList.add("hidden");
    $("statsIndividualEmpty").classList.remove("hidden");
    return;
  }
  await renderIndividualStats(aid);
});

async function renderIndividualStats(athleteId) {
  const [records, athlete] = await Promise.all([
    apiFetch(`/api/athletes/${athleteId}/one-rm`),
    apiFetch(`/api/athletes/${athleteId}`),
  ]);

  $("statsIndividualEmpty").classList.add("hidden");
  $("statsIndividualContent").classList.remove("hidden");

  /* Sort by weight descending */
  const sorted = [...records].sort((a, b) => parseFloat(b.weight_kg) - parseFloat(a.weight_kg));
  const heaviest = sorted[0];

  /* Summary cards */
  $("statsIndividualSummary").innerHTML = `
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#4A7CF6"><i class="fa-solid fa-weight-hanging"></i></div>
      <div class="stats-summary-value">${records.length}</div>
      <div class="stats-summary-label">Exercises Tracked</div>
    </div>
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#10B981"><i class="fa-solid fa-arrow-up"></i></div>
      <div class="stats-summary-value">${heaviest ? parseFloat(heaviest.weight_kg).toFixed(1) + " kg" : "—"}</div>
      <div class="stats-summary-label">Heaviest Lift</div>
    </div>
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#F97316"><i class="fa-solid fa-trophy"></i></div>
      <div class="stats-summary-value" style="font-size:1rem">${heaviest ? esc(heaviest.exercise_name) : "—"}</div>
      <div class="stats-summary-label">Top Exercise</div>
    </div>
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#A855F7"><i class="fa-solid fa-person-running"></i></div>
      <div class="stats-summary-value" style="font-size:1rem">${athlete.sport ? esc(athlete.sport.charAt(0).toUpperCase() + athlete.sport.slice(1)) : "—"}</div>
      <div class="stats-summary-label">Sport</div>
    </div>
  `;

  /* Destroy old chart */
  if (statsState.individualChart) {
    statsState.individualChart.destroy();
    statsState.individualChart = null;
  }

  const wrap   = $("statsIndividualChartWrap");

  if (records.length === 0) {
    wrap.innerHTML = `<div class="stats-no-data"><i class="fa-solid fa-chart-bar"></i><p>No 1RM records for this athlete yet.</p></div>`;
    return;
  }

  /* Recreate canvas if it was replaced by no-data message */
  if (!$("individualRMChart")) {
    wrap.innerHTML = '<canvas id="individualRMChart"></canvas>';
  }

  const labels   = sorted.map(r => r.exercise_name);
  const values   = sorted.map(r => parseFloat(r.weight_kg));
  const bgColors = sorted.map((_, i) => ATHLETE_PALETTE[i % ATHLETE_PALETTE.length] + "CC");
  const bdColors = sorted.map((_, i) => ATHLETE_PALETTE[i % ATHLETE_PALETTE.length]);

  const chartHeight = Math.max(300, labels.length * 42);
  $("individualRMChart").style.height = chartHeight + "px";
  wrap.style.height = chartHeight + "px";

  statsState.individualChart = new Chart($("individualRMChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "1RM (kg)",
        data: values,
        backgroundColor: bgColors,
        borderColor: bdColors,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `  ${ctx.parsed.x.toFixed(1)} kg`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: "Weight (kg)", font: { size: 12, weight: "600" } },
          grid: { color: "#F1F5F9" },
          ticks: { font: { size: 12 } },
        },
        y: {
          ticks: { font: { size: 12 } },
          grid: { display: false },
        },
      },
    },
  });
}

/* ── Team stats ───────────────────────────────────────────────────────────── */
$("statsTeamSelect").addEventListener("change", async e => {
  const tid = parseInt(e.target.value);
  if (!tid) {
    $("statsTeamContent").classList.add("hidden");
    $("statsTeamEmpty").classList.remove("hidden");
    return;
  }
  await renderTeamStats(tid);
});

async function renderTeamStats(teamId) {
  const team    = await apiFetch("/api/teams/" + teamId);
  const members = team.members || [];

  $("statsTeamEmpty").classList.add("hidden");
  $("statsTeamContent").classList.remove("hidden");

  /* Fetch every member's 1RM records in parallel */
  const allData = await Promise.all(
    members.map(m =>
      apiFetch(`/api/athletes/${m.id}/one-rm`)
        .then(records => ({ athlete: m, records }))
        .catch(() => ({ athlete: m, records: [] }))
    )
  );

  /* Summary cards */
  const totalRecords = allData.reduce((s, d) => s + d.records.length, 0);
  const athletesWithData = allData.filter(d => d.records.length > 0).length;
  $("statsTeamSummary").innerHTML = `
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#4A7CF6"><i class="fa-solid fa-users"></i></div>
      <div class="stats-summary-value">${members.length}</div>
      <div class="stats-summary-label">Athletes</div>
    </div>
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#10B981"><i class="fa-solid fa-weight-hanging"></i></div>
      <div class="stats-summary-value">${totalRecords}</div>
      <div class="stats-summary-label">Total Records</div>
    </div>
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#F97316"><i class="fa-solid fa-chart-bar"></i></div>
      <div class="stats-summary-value">${athletesWithData}</div>
      <div class="stats-summary-label">With Data</div>
    </div>
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#A855F7"><i class="fa-solid fa-futbol"></i></div>
      <div class="stats-summary-value" style="font-size:1rem">${team.sport ? esc(team.sport.charAt(0).toUpperCase() + team.sport.slice(1)) : "General"}</div>
      <div class="stats-summary-label">Sport</div>
    </div>
  `;

  /* Destroy old chart */
  if (statsState.teamChart) {
    statsState.teamChart.destroy();
    statsState.teamChart = null;
  }

  const wrap   = $("statsTeamChartWrap");

  /* Collect all unique exercises that have at least one record */
  const exerciseSet = new Set();
  allData.forEach(d => d.records.forEach(r => exerciseSet.add(r.exercise_name)));
  const exercises = [...exerciseSet].sort();

  if (exercises.length === 0) {
    wrap.innerHTML = `<div class="stats-no-data"><i class="fa-solid fa-chart-bar"></i><p>No 1RM records found for any team member.</p></div>`;
    return;
  }

  /* Recreate canvas if replaced */
  if (!$("teamRMChart")) {
    wrap.innerHTML = '<canvas id="teamRMChart"></canvas>';
  }

  /* One dataset per athlete */
  const datasets = allData
    .filter(d => d.records.length > 0)
    .map((d, i) => ({
      label: d.athlete.name,
      data: exercises.map(ex => {
        const rec = d.records.find(r => r.exercise_name === ex);
        return rec ? parseFloat(rec.weight_kg) : null;
      }),
      backgroundColor: ATHLETE_PALETTE[i % ATHLETE_PALETTE.length] + "BB",
      borderColor:     ATHLETE_PALETTE[i % ATHLETE_PALETTE.length],
      borderWidth: 1.5,
      borderRadius: 4,
      borderSkipped: false,
    }));

  const chartHeight = Math.max(350, exercises.length * 50 + 60);
  $("teamRMChart").style.height = chartHeight + "px";
  wrap.style.height = chartHeight + "px";

  statsState.teamChart = new Chart($("teamRMChart"), {
    type: "bar",
    data: { labels: exercises, datasets },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { font: { size: 12 }, padding: 16, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.x;
              return `  ${ctx.dataset.label}: ${v != null ? v.toFixed(1) + " kg" : "—"}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: "Weight (kg)", font: { size: 12, weight: "600" } },
          grid: { color: "#F1F5F9" },
          ticks: { font: { size: 12 } },
        },
        y: {
          ticks: { font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPARISON PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function initComparePanel() {
  if (statsState.compareInitialized) return;
  statsState.compareInitialized = true;

  $("compareAthleteSelect").addEventListener("change", e => {
    const aid = parseInt(e.target.value);
    if (aid) addCompareAthlete(aid);
  });

  $("compareAthleteChips").addEventListener("click", e => {
    const btn = e.target.closest(".compare-chip-remove");
    if (btn) removeCompareAthlete(parseInt(btn.dataset.id));
  });

  $("compareExerciseChips").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const ex = chip.dataset.ex;
    if (statsState.compareExercises.has(ex)) {
      statsState.compareExercises.delete(ex);
      chip.classList.remove("active");
    } else {
      statsState.compareExercises.add(ex);
      chip.classList.add("active");
    }
    maybeRenderCompareChart();
  });

  $("compareSelectAllEx").addEventListener("click", () => {
    statsState.compareAllExercises.forEach(ex => statsState.compareExercises.add(ex));
    renderCompareExerciseChips();
    maybeRenderCompareChart();
  });

  $("compareDeselectAllEx").addEventListener("click", () => {
    statsState.compareExercises.clear();
    renderCompareExerciseChips();
    maybeRenderCompareChart();
  });
}

function rebuildCompareAthleteDropdown() {
  const opts = $("compareAthleteSelect").querySelectorAll("option");
  opts.forEach(opt => {
    if (!opt.value) return;
    const selected = statsState.compareAthletes.some(a => String(a.id) === opt.value);
    opt.disabled = selected;
    opt.style.color = selected ? "#9CA3AF" : "";
  });
}

async function addCompareAthlete(athleteId) {
  if (statsState.compareAthletes.some(a => a.id === athleteId)) return;
  const athlete = statsState.compareAllAthletesList.find(a => a.id === athleteId);
  if (!athlete) return;

  statsState.compareAthletes.push({ ...athlete, records: null });
  $("compareAthleteSelect").value = "";
  rebuildCompareAthleteDropdown();
  renderCompareAthleteChips();

  try {
    const records = await apiFetch(`/api/athletes/${athleteId}/one-rm`);
    const entry = statsState.compareAthletes.find(a => a.id === athleteId);
    if (entry) entry.records = records;
  } catch (_) {
    const entry = statsState.compareAthletes.find(a => a.id === athleteId);
    if (entry) entry.records = [];
  }

  recomputeCompareExercises();
  renderCompareAthleteChips();
  renderCompareExerciseChips();
  maybeRenderCompareChart();
}

function removeCompareAthlete(athleteId) {
  const idx = statsState.compareAthletes.findIndex(a => a.id === athleteId);
  if (idx === -1) return;
  statsState.compareAthletes.splice(idx, 1);
  recomputeCompareExercises();
  renderCompareAthleteChips();
  renderCompareExerciseChips();
  maybeRenderCompareChart();
  rebuildCompareAthleteDropdown();
}

function recomputeCompareExercises() {
  const exSet = new Set();
  statsState.compareAthletes.forEach(a => {
    if (Array.isArray(a.records)) a.records.forEach(r => exSet.add(r.exercise_name));
  });
  statsState.compareAllExercises = [...exSet].sort();

  /* Prune selected exercises that no longer exist */
  statsState.compareExercises.forEach(ex => {
    if (!exSet.has(ex)) statsState.compareExercises.delete(ex);
  });

  /* Auto-select all when exercises first appear */
  if (statsState.compareExercises.size === 0 && statsState.compareAllExercises.length > 0) {
    statsState.compareAllExercises.forEach(ex => statsState.compareExercises.add(ex));
  }
}

function renderCompareAthleteChips() {
  const container = $("compareAthleteChips");
  container.innerHTML = "";

  statsState.compareAthletes.forEach((a, i) => {
    const color = ATHLETE_PALETTE[i % ATHLETE_PALETTE.length];
    const chip = document.createElement("span");
    chip.className = "compare-athlete-chip";
    chip.style.borderColor = color;
    chip.style.color = color;
    chip.innerHTML = `
      ${esc(a.name)}
      ${a.records === null ? '<i class="fa-solid fa-spinner fa-spin" style="font-size:.7rem;opacity:.6"></i>' : ""}
      <button class="compare-chip-remove" data-id="${a.id}" title="Remove ${esc(a.name)}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    container.appendChild(chip);
  });

  const readyCount = statsState.compareAthletes.filter(a => a.records !== null).length;
  $("compareExerciseSection").classList.toggle("hidden", readyCount < 2);
}

function renderCompareExerciseChips() {
  const container = $("compareExerciseChips");
  container.innerHTML = "";
  statsState.compareAllExercises.forEach(ex => {
    const btn = document.createElement("button");
    btn.className = "chip" + (statsState.compareExercises.has(ex) ? " active" : "");
    btn.dataset.ex = ex;
    btn.textContent = ex;
    container.appendChild(btn);
  });
}

function maybeRenderCompareChart() {
  const readyAthletes = statsState.compareAthletes.filter(a => Array.isArray(a.records));
  const selEx = [...statsState.compareExercises];

  if (readyAthletes.length < 2 || selEx.length === 0) {
    $("compareChartContent").classList.add("hidden");
    $("compareEmpty").classList.remove("hidden");

    if (readyAthletes.length === 0) {
      $("compareEmptyMsg").textContent = "Select at least 2 athletes to begin comparing.";
    } else if (readyAthletes.length === 1) {
      $("compareEmptyMsg").textContent = "Add at least 1 more athlete to compare.";
    } else {
      $("compareEmptyMsg").textContent = "Select at least 1 exercise to display the chart.";
    }

    if (statsState.compareChart) {
      statsState.compareChart.destroy();
      statsState.compareChart = null;
    }
    return;
  }

  $("compareEmpty").classList.add("hidden");
  $("compareChartContent").classList.remove("hidden");
  renderCompareChart(readyAthletes, selEx);
}

function renderCompareChart(readyAthletes, selectedExercises) {
  if (statsState.compareChart) {
    statsState.compareChart.destroy();
    statsState.compareChart = null;
  }

  /* Recreate canvas if it was replaced by a no-data message */
  if (!$("compareRMChart")) {
    $("compareChartWrap").innerHTML = '<canvas id="compareRMChart"></canvas>';
  }

  /* Summary cards */
  const dataPoints = readyAthletes.reduce((sum, a) => {
    return sum + selectedExercises.filter(ex => a.records.some(r => r.exercise_name === ex)).length;
  }, 0);

  $("compareCompareSummary").innerHTML = `
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#4A7CF6"><i class="fa-solid fa-users"></i></div>
      <div class="stats-summary-value">${readyAthletes.length}</div>
      <div class="stats-summary-label">Athletes Compared</div>
    </div>
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#10B981"><i class="fa-solid fa-dumbbell"></i></div>
      <div class="stats-summary-value">${selectedExercises.length}</div>
      <div class="stats-summary-label">Exercises Shown</div>
    </div>
    <div class="stats-summary-card">
      <div class="stats-summary-icon" style="color:#F97316"><i class="fa-solid fa-weight-hanging"></i></div>
      <div class="stats-summary-value">${dataPoints}</div>
      <div class="stats-summary-label">Data Points</div>
    </div>
  `;

  /* One dataset per athlete, palette index = position in compareAthletes array */
  const datasets = readyAthletes.map(a => {
    const i = statsState.compareAthletes.findIndex(x => x.id === a.id);
    const color = ATHLETE_PALETTE[i % ATHLETE_PALETTE.length];
    return {
      label: a.name,
      data: selectedExercises.map(ex => {
        const rec = a.records.find(r => r.exercise_name === ex);
        return rec ? parseFloat(rec.weight_kg) : null;
      }),
      backgroundColor: color + "BB",
      borderColor:     color,
      borderWidth: 1.5,
      borderRadius: 4,
      borderSkipped: false,
    };
  });

  const chartHeight = Math.max(350, selectedExercises.length * 50 * Math.max(1, readyAthletes.length * 0.4) + 60);
  $("compareRMChart").style.height = chartHeight + "px";
  $("compareChartWrap").style.height = chartHeight + "px";

  statsState.compareChart = new Chart($("compareRMChart"), {
    type: "bar",
    data: { labels: selectedExercises, datasets },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { font: { size: 12 }, padding: 16, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.x;
              return `  ${ctx.dataset.label}: ${v != null ? v.toFixed(1) + " kg" : "—"}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: "Weight (kg)", font: { size: 12, weight: "600" } },
          grid: { color: "#F1F5F9" },
          ticks: { font: { size: 12 } },
        },
        y: {
          ticks: { font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

/* =============================================================================
   LOAD MONITORING
============================================================================= */

const lmState = {
  athleteId: null, dashboardData: null, wellnessId: null,
  wellnessValues: { sleep_quality:null, fatigue:null, muscle_soreness:null, stress_mood:null },
  editingLogId: null, acwrChart: null, weeklyChart: null, hooperChart: null,
  selectedSessionType: "strength", selectedRpe: null,
};

const ZONE_LABELS = {
  optimal:"Optimal Bolge", caution:"Dikkat", high_risk:"Yuksek Risk",
  critical:"Kritik", undertraining:"Yetersiz Yuklenme", insufficient_data:"Veri Biriktirilyor",
};
const ZONE_ADVICE = {
  optimal:           "Antrenman yukunuz dengeli. Devam edin.",
  caution:           "Yuk artisi izleniyor. Bu haftaki yogunluga dikkat edin.",
  high_risk:         "Yuk yuksek. Yogun antrenman yapmaktan kaginin.",
  critical:          "Asiri yuklenme. Mutlaka dinlenin ve antrenorunuzle gorusun.",
  undertraining:     "Yuk dusuk. Antrenman yogunlugunu kademeli artirabilirsiniz.",
  insufficient_data: "ACWR hesaplamak icin daha fazla veri biriktirilmektedir.",
};

async function initLoadMonitoring() {
  const isCoachOrStaff = ["coach","staff"].includes(state.currentUser?.role);
  if (isCoachOrStaff) {
    $("lmCoachSelector").classList.remove("hidden");
    $("lmDashboard").classList.add("hidden");
    await populateLMAthleteSelect();
  } else {
    $("lmCoachSelector").classList.add("hidden");
    const athleteId = state.currentUser?.athlete_id;
    if (!athleteId) { showToast("Sporcu profili bulunamadi.", "error"); return; }
    lmState.athleteId = athleteId;
    await loadDashboard(athleteId);
  }
}

async function populateLMAthleteSelect() {
  try {
    const athletes = await apiFetch("/api/athletes");
    const sel = $("lmAthleteSelect");
    sel.innerHTML = '<option value="">- Sporcu secin -</option>';
    athletes.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.name + (a.sport ? " (" + a.sport + ")" : "");
      sel.appendChild(opt);
    });
  } catch(e) { showToast("Sporcular yuklenemedi.", "error"); }
}

$("lmAthleteSelect").addEventListener("change", async e => {
  const id = parseInt(e.target.value);
  if (!id) { $("lmDashboard").classList.add("hidden"); return; }
  lmState.athleteId = id;
  await loadDashboard(id);
});

$("lmRefreshBtn").addEventListener("click", () => { if (lmState.athleteId) loadDashboard(lmState.athleteId); });

async function loadDashboard(athleteId) {
  try {
    const data = await apiFetch("/api/dashboard/" + athleteId);
    lmState.dashboardData = data;
    renderDashboard(data);
    $("lmDashboard").classList.remove("hidden");
  } catch(e) { showToast("Dashboard yuklenemedi: " + e.message, "error"); }
}

function renderDashboard(data) {
  const today = new Date().toLocaleDateString("tr-TR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  $("lmAthleteName").textContent = data.athlete.name;
  $("lmDateLabel").textContent   = today;

  // Avatar baş harfi
  const av = $("lmDashAvatar");
  if (av) av.textContent = (data.athlete.name || "?")[0].toUpperCase();

  renderKpiRow(data);
  renderWellnessCard(data.today.wellness);
  renderACWRCard(data.acwr);
  renderTodaySessions(data.today);
  renderACWRChart(data.acwr.timeline);
  renderWeeklyChart(data.weekly_summary);
  renderHooperChart(data.hooper_trend);
  renderMonthlyStats(data.monthly_summary, data.acwr);
}

function renderKpiRow(data) {
  const acwr   = data.acwr;
  const today  = data.today;
  const zone   = acwr.zone;
  const val    = acwr.current;
  const zoneCls = { optimal:"#22C55E", caution:"#EAB308", high_risk:"#F97316", critical:"#EF4444", undertraining:"#3B82F6", insufficient_data:"#9CA3AF" };

  // ACWR
  const kpiACWR = $("lmKpiACWR");
  if (kpiACWR) {
    kpiACWR.textContent = val != null ? val.toFixed(2) : "—";
    kpiACWR.style.color = zoneCls[zone] || "#1A1D23";
  }
  const dot = $("lmKpiACWRDot");
  if (dot) { dot.style.background = zoneCls[zone] || "#9CA3AF"; }

  const kpiAcute = $("lmKpiAcute");
  if (kpiAcute) kpiAcute.textContent = acwr.acute_7d != null ? acwr.acute_7d.toFixed(1) + " AU" : "—";

  const kpiChronic = $("lmKpiChronic");
  if (kpiChronic) kpiChronic.textContent = acwr.chronic_28d != null ? acwr.chronic_28d.toFixed(1) + " AU" : "—";

  const kpiToday = $("lmKpiToday");
  if (kpiToday) kpiToday.textContent = today.total_load_today != null ? today.total_load_today.toFixed(1) + " AU" : "—";

  const kpiHooper = $("lmKpiHooper");
  if (kpiHooper && today.wellness) {
    kpiHooper.textContent = today.wellness.hooper_index + " / 20";
  } else if (kpiHooper) {
    kpiHooper.textContent = "—";
  }
}

function renderWellnessCard(wellness) {
  if (!wellness) {
    $("lmWellnessForm").classList.remove("hidden");
    $("lmWellnessDone").classList.add("hidden");
    $("lmWellnessBadge").textContent   = "Girilmedi";
    $("lmWellnessBadge").style.cssText = "background:#FEF2F2;color:#991B1B";
    lmState.wellnessId = null;
    resetWellnessForm();
  } else {
    $("lmWellnessForm").classList.add("hidden");
    $("lmWellnessDone").classList.remove("hidden");
    lmState.wellnessId = wellness.id;
    const zones = { excellent:{bg:"#F0FDF4",color:"#15803D",label:"Mukemmel"}, normal:{bg:"#F9FAFB",color:"#374151",label:"Normal"}, caution:{bg:"#FEFCE8",color:"#92400E",label:"Dikkat"}, critical:{bg:"#FEF2F2",color:"#991B1B",label:"Kritik"} };
    const zc = zones[wellness.hooper_zone] || zones.normal;
    $("lmWellnessBadge").textContent   = "Tamamlandi";
    $("lmWellnessBadge").style.cssText = "background:#F0FDF4;color:#15803D";
    $("lmHooperDisplay").innerHTML = '<span class="lm-hooper-num" style="color:' + zc.color + '">' + wellness.hooper_index + '</span><span class="lm-hooper-label">/ 20 Hooper Index</span><span class="lm-hooper-zone-tag" style="background:' + zc.bg + ';color:' + zc.color + '">' + zc.label + '</span>';
    $("lmWellnessSummary").innerHTML = [
      {val:wellness.sleep_quality,lbl:"Uyku"},{val:wellness.fatigue,lbl:"Yorgunluk"},
      {val:wellness.muscle_soreness,lbl:"Kas Agrisi"},{val:wellness.stress_mood,lbl:"Stres"},
    ].map(function(m){ return '<div class="lm-wellness-summary-item"><div class="wsm-val">' + m.val + '</div><div class="wsm-lbl">' + m.lbl + '</div></div>'; }).join("");
    $("lmWellnessDoneNotes").textContent = wellness.notes ? ('"' + wellness.notes + '"') : "";
  }
}

function resetWellnessForm() {
  lmState.wellnessValues = { sleep_quality:null, fatigue:null, muscle_soreness:null, stress_mood:null };
  document.querySelectorAll(".lm-rating-btn").forEach(function(b){ b.classList.remove("selected"); });
  $("lmWellnessNotes").value = "";
  $("lmHooperScore").textContent = "-";
  $("lmSaveWellnessBtn").disabled = true;
}

document.querySelectorAll(".lm-rating-btns").forEach(function(group) {
  group.addEventListener("click", function(e) {
    const btn = e.target.closest(".lm-rating-btn");
    if (!btn) return;
    const field = group.dataset.field;
    group.querySelectorAll(".lm-rating-btn").forEach(function(b){ b.classList.remove("selected"); });
    btn.classList.add("selected");
    lmState.wellnessValues[field] = parseInt(btn.dataset.val);
    updateHooperPreview();
  });
});

function updateHooperPreview() {
  const v = lmState.wellnessValues;
  if (v.sleep_quality && v.fatigue && v.muscle_soreness && v.stress_mood) {
    $("lmHooperScore").textContent  = (v.sleep_quality + v.fatigue + v.muscle_soreness + v.stress_mood) + " / 20";
    $("lmSaveWellnessBtn").disabled = false;
  } else {
    $("lmHooperScore").textContent  = "-";
    $("lmSaveWellnessBtn").disabled = true;
  }
}

$("lmSaveWellnessBtn").addEventListener("click", async function() {
  const v = lmState.wellnessValues;
  try {
    await apiFetch("/api/wellness", { method:"POST", body: JSON.stringify({
      athlete_id: lmState.athleteId, date: new Date().toISOString().slice(0,10),
      sleep_quality:v.sleep_quality, fatigue:v.fatigue,
      muscle_soreness:v.muscle_soreness, stress_mood:v.stress_mood,
      notes: $("lmWellnessNotes").value.trim() || null,
    })});
    showToast("Sabah check-in kaydedildi!", "success");
    loadDashboard(lmState.athleteId);
  } catch(e) { showToast(e.message, "error"); }
});

$("lmEditWellnessBtn").addEventListener("click", function() {
  const wd = lmState.dashboardData && lmState.dashboardData.today && lmState.dashboardData.today.wellness;
  if (!wd) return;
  $("lmWellnessDone").classList.add("hidden");
  $("lmWellnessForm").classList.remove("hidden");
  ["sleep_quality","fatigue","muscle_soreness","stress_mood"].forEach(function(field) {
    const val = wd[field];
    lmState.wellnessValues[field] = val;
    const group = document.querySelector('.lm-rating-btns[data-field="' + field + '"]');
    if (!group) return;
    group.querySelectorAll(".lm-rating-btn").forEach(function(b){ b.classList.remove("selected"); });
    const t = group.querySelector('.lm-rating-btn[data-val="' + val + '"]');
    if (t) t.classList.add("selected");
  });
  $("lmWellnessNotes").value = wd.notes || "";
  updateHooperPreview();
  $("lmSaveWellnessBtn").onclick = async function() {
    const v = lmState.wellnessValues;
    try {
      await apiFetch("/api/wellness/" + lmState.wellnessId, { method:"PUT", body: JSON.stringify({
        sleep_quality:v.sleep_quality, fatigue:v.fatigue,
        muscle_soreness:v.muscle_soreness, stress_mood:v.stress_mood,
        notes: $("lmWellnessNotes").value.trim() || null,
      })});
      showToast("Check-in guncellendi!", "success");
      $("lmSaveWellnessBtn").onclick = null;
      loadDashboard(lmState.athleteId);
    } catch(e) { showToast(e.message, "error"); }
  };
});

function renderACWRCard(acwr) {
  const val = acwr.current; const zone = acwr.zone;
  $("lmACWRBig").textContent       = val != null ? val.toFixed(2) : "-";
  $("lmACWRBig").className         = "lm-acwr-big zone-" + zone;
  $("lmACWRZoneLabel").textContent  = ZONE_LABELS[zone] || zone;
  $("lmACWRZoneLabel").className    = "lm-acwr-zone-label zone-bg-" + zone + " zone-" + zone;
  $("lmACWRBadge").textContent      = ZONE_LABELS[zone] || zone;
  $("lmAcuteVal").textContent       = acwr.acute_7d   != null ? Math.round(acwr.acute_7d)    : "-";
  $("lmChronicVal").textContent     = acwr.chronic_28d != null ? Math.round(acwr.chronic_28d) : "-";
  $("lmDataDaysVal").textContent    = acwr.data_days + " gun";
  $("lmACWRPartial").classList.toggle("hidden", !acwr.is_partial);
  $("lmACWRAdvice").textContent     = ZONE_ADVICE[zone] || "";
  $("lmACWRAdvice").className       = "lm-acwr-advice zone-bg-" + zone + " zone-" + zone;
  if (val != null) {
    $("lmZoneIndicator").style.display = "block";
    $("lmZoneIndicator").style.left    = (Math.min(Math.max(val / 2.5, 0), 1) * 100) + "%";
  } else { $("lmZoneIndicator").style.display = "none"; }
}

function renderTodaySessions(todayData) {
  const sessions = todayData.training_sessions || [];
  const container = $("lmTodaySessions");
  $("lmSessionsEmpty").classList.toggle("hidden", sessions.length > 0);
  $("lmDailyLoadBadge").style.display = sessions.length ? "flex" : "none";
  $("lmDailyLoadVal").textContent = Math.round(todayData.total_load_today || 0);
  container.querySelectorAll(".lm-session-row").forEach(function(el){ el.remove(); });
  const TC = { strength:"#4A7CF6", conditioning:"#22C55E", technical:"#EAB308", competition:"#EF4444", recovery:"#A78BFA" };
  const TL = { strength:"Guc", conditioning:"Kondisyon", technical:"Teknik", competition:"Yarisma", recovery:"Toparlanma" };
  sessions.forEach(function(s) {
    const row = document.createElement("div");
    row.className = "lm-session-row";
    row.innerHTML = '<div class="lm-session-type-dot" style="background:' + (TC[s.session_type]||"#9CA3AF") + '"></div>' +
      '<div class="lm-session-name">' + (s.session_name || TL[s.session_type] || "Antrenman") + '</div>' +
      '<div class="lm-session-meta">' + s.duration_minutes + ' dk RPE ' + s.rpe + '</div>' +
      '<div class="lm-session-load">' + Math.round(s.session_load) + ' AU</div>' +
      '<button class="lm-session-del" data-id="' + s.id + '" title="Sil"><i class="fa-solid fa-trash"></i></button>';
    row.querySelector(".lm-session-del").addEventListener("click", async function(e) {
      if (!confirm("Bu antrenman kaydini silmek istiyor musunuz?")) return;
      try { await apiFetch("/api/training-log/" + e.currentTarget.dataset.id, { method:"DELETE" }); showToast("Kayit silindi.", "success"); loadDashboard(lmState.athleteId); }
      catch(err) { showToast(err.message, "error"); }
    });
    container.appendChild(row);
  });
}

$("lmAddSessionBtn").addEventListener("click", function(){ openTrainingLogModal(); });

function openTrainingLogModal(logData) {
  lmState.editingLogId = (logData && logData.id) || null;
  $("lmTrainingModalTitle").textContent = logData ? "Seans Duzenle" : "Antrenman Seasi Kaydet";
  $("lmLogSessionName").value = (logData && logData.session_name) || "";
  $("lmLogDate").value        = (logData && logData.log_date) || new Date().toISOString().slice(0,10);
  $("lmLogDuration").value    = (logData && logData.duration_minutes) || "";
  $("lmLogNotes").value       = (logData && logData.notes) || "";
  lmState.selectedRpe = (logData && logData.rpe) || null;
  document.querySelectorAll(".lm-rpe-btn").forEach(function(b){ b.classList.toggle("selected", parseInt(b.dataset.val) === lmState.selectedRpe); });
  updateRpeDisplay();
  lmState.selectedSessionType = (logData && logData.session_type) || "strength";
  document.querySelectorAll("#lmSessionTypeChips .chip").forEach(function(c){ c.classList.toggle("active", c.dataset.val === lmState.selectedSessionType); });
  updateLoadPreview();
  $("lmTrainingModal").classList.remove("hidden");
}

function closeTrainingLogModal() { $("lmTrainingModal").classList.add("hidden"); lmState.selectedRpe = null; }
$("lmTrainingModalClose").addEventListener("click",  closeTrainingLogModal);
$("lmTrainingModalCancel").addEventListener("click", closeTrainingLogModal);

document.querySelectorAll(".lm-rpe-btn").forEach(function(btn) {
  btn.addEventListener("click", function() {
    lmState.selectedRpe = parseInt(btn.dataset.val);
    document.querySelectorAll(".lm-rpe-btn").forEach(function(b){ b.classList.remove("selected"); });
    btn.classList.add("selected");
    updateRpeDisplay(); updateLoadPreview();
  });
});

const RPE_LABELS = {1:"Cok Kolay",2:"Kolay",3:"Orta",4:"Biraz Zor",5:"Zor",6:"Zor+",7:"Cok Zor",8:"Agir",9:"Maks. Yakin",10:"Maksimal"};
function updateRpeDisplay() {
  $("lmRpeDisplay").textContent = lmState.selectedRpe ? ("RPE " + lmState.selectedRpe + " - " + RPE_LABELS[lmState.selectedRpe]) : "secilmedi";
}

$("lmSessionTypeChips").addEventListener("click", function(e) {
  const chip = e.target.closest(".chip"); if (!chip) return;
  $("lmSessionTypeChips").querySelectorAll(".chip").forEach(function(c){ c.classList.remove("active"); });
  chip.classList.add("active"); lmState.selectedSessionType = chip.dataset.val;
});

$("lmLogDuration").addEventListener("input", updateLoadPreview);
function updateLoadPreview() {
  const dur = parseInt($("lmLogDuration").value) || null;
  $("lmLoadVal").textContent = (lmState.selectedRpe && dur) ? Math.round(lmState.selectedRpe * dur) : "-";
}

$("lmSaveTrainingBtn").addEventListener("click", async function() {
  const dur = parseInt($("lmLogDuration").value);
  if (!dur || dur < 1) { showToast("Lutfen gecerli bir sure girin.", "error"); return; }
  if (!lmState.selectedRpe) { showToast("Lutfen RPE degeri secin.", "error"); return; }
  const payload = {
    athlete_id: lmState.athleteId,
    session_name: $("lmLogSessionName").value.trim() || null,
    log_date:     $("lmLogDate").value,
    duration_minutes: dur, rpe: lmState.selectedRpe,
    session_type: lmState.selectedSessionType,
    notes: $("lmLogNotes").value.trim() || null,
  };
  try {
    if (lmState.editingLogId) {
      await apiFetch("/api/training-log/" + lmState.editingLogId, { method:"PUT", body:JSON.stringify(payload) });
      showToast("Seans guncellendi!", "success");
    } else {
      await apiFetch("/api/training-log", { method:"POST", body:JSON.stringify(payload) });
      showToast("Seans kaydedildi!", "success");
    }
    closeTrainingLogModal(); loadDashboard(lmState.athleteId);
  } catch(e) { showToast(e.message, "error"); }
});

function renderACWRChart(timeline) {
  if (lmState.acwrChart) { lmState.acwrChart.destroy(); lmState.acwrChart = null; }
  if (!timeline || timeline.length === 0) return;
  const n = timeline.length;
  lmState.acwrChart = new Chart($("lmACWRChart"), {
    type:"line",
    data:{
      labels: timeline.map(function(d){ return d.date; }),
      datasets:[
        { label:"_u", data:Array(n).fill(0.8),  fill:{target:"origin",above:"rgba(59,130,246,0.07)"},  borderWidth:0, pointRadius:0, tension:0 },
        { label:"_o", data:Array(n).fill(1.3),  fill:{target:"-1",    above:"rgba(34,197,94,0.07)"},   borderWidth:0, pointRadius:0, tension:0 },
        { label:"_c", data:Array(n).fill(1.5),  fill:{target:"-1",    above:"rgba(234,179,8,0.09)"},   borderWidth:0, pointRadius:0, tension:0 },
        { label:"_h", data:Array(n).fill(2.0),  fill:{target:"-1",    above:"rgba(249,115,22,0.09)"},  borderWidth:0, pointRadius:0, tension:0 },
        { label:"_r", data:Array(n).fill(2.5),  fill:{target:"-1",    above:"rgba(239,68,68,0.09)"},   borderWidth:0, pointRadius:0, tension:0 },
        { label:"ACWR", data:timeline.map(function(d){ return d.acwr; }), borderColor:"#4A7CF6", backgroundColor:"rgba(74,124,246,0.1)", borderWidth:2.5, pointRadius:0, pointHoverRadius:5, tension:0.3, fill:false, spanGaps:true },
      ],
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      plugins:{ legend:{display:false}, tooltip:{ filter:function(i){ return i.dataset.label==="ACWR"; }, callbacks:{ label:function(ctx){ return "ACWR: " + (ctx.parsed.y!=null?ctx.parsed.y.toFixed(2):"-"); } } } },
      scales:{
        x:{ticks:{maxTicksLimit:8,font:{size:11},color:"#9CA3AF"},grid:{color:"#F1F5F9"}},
        y:{min:0,max:2.5,ticks:{stepSize:0.5,font:{size:11},color:"#9CA3AF"},grid:{color:"#F1F5F9"}},
      },
    },
  });
}

function renderWeeklyChart(weekly) {
  if (lmState.weeklyChart) { lmState.weeklyChart.destroy(); lmState.weeklyChart = null; }
  $("lmWeeklyTotal").textContent = "Toplam: " + Math.round(weekly.total_load) + " AU";
  const bd = weekly.daily_breakdown || [];
  lmState.weeklyChart = new Chart($("lmWeeklyChart"), {
    type:"bar",
    data:{
      labels: bd.map(function(d){ const dt=new Date(d.date+"T00:00:00"); return dt.toLocaleDateString("tr-TR",{weekday:"short",day:"numeric"}); }),
      datasets:[{ label:"Gunluk Yuk (AU)", data:bd.map(function(d){ return d.load; }), backgroundColor:bd.map(function(d){ return d.load>0?"rgba(74,124,246,0.7)":"rgba(74,124,246,0.15)"; }), borderRadius:6, borderSkipped:false }],
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(ctx){ return Math.round(ctx.parsed.y) + " AU"; }}} },
      scales:{ x:{ticks:{font:{size:10},color:"#9CA3AF"},grid:{display:false}}, y:{beginAtZero:true,ticks:{font:{size:10},color:"#9CA3AF"},grid:{color:"#F1F5F9"}} },
    },
  });
}

function renderHooperChart(trend) {
  if (lmState.hooperChart) { lmState.hooperChart.destroy(); lmState.hooperChart = null; }
  if (!trend || trend.length === 0) return;
  const ZC = { excellent:"#22C55E", normal:"#4A7CF6", caution:"#EAB308", critical:"#EF4444" };
  lmState.hooperChart = new Chart($("lmHooperChart"), {
    type:"line",
    data:{
      labels: trend.map(function(d){ const dt=new Date(d.date+"T00:00:00"); return dt.toLocaleDateString("tr-TR",{day:"numeric",month:"short"}); }),
      datasets:[{ label:"Hooper Index", data:trend.map(function(d){ return d.hooper_index; }), borderColor:"#4A7CF6", backgroundColor:"rgba(74,124,246,0.08)", borderWidth:2, pointRadius:4, pointBackgroundColor:trend.map(function(d){ return ZC[d.hooper_zone]||"#4A7CF6"; }), tension:0.3, fill:true }],
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(ctx){ return "Hooper: " + ctx.parsed.y + " / 20"; }}} },
      scales:{ x:{ticks:{maxTicksLimit:8,font:{size:10},color:"#9CA3AF"},grid:{display:false}}, y:{min:4,max:20,ticks:{stepSize:4,font:{size:10},color:"#9CA3AF"},grid:{color:"#F1F5F9"}} },
    },
  });
}

function renderMonthlyStats(monthly, acwr) {
  const avg = monthly.session_count > 0 ? Math.round(monthly.total_load / monthly.session_count) : "-";
  $("lmMonthlyStats").innerHTML =
    '<div class="lm-monthly-stat"><div class="lm-monthly-stat-val">' + Math.round(monthly.total_load) + '</div><div class="lm-monthly-stat-lbl">Aylik Toplam Yuk (AU)</div></div>' +
    '<div class="lm-monthly-stat"><div class="lm-monthly-stat-val">' + monthly.session_count + '</div><div class="lm-monthly-stat-lbl">Antrenman Seansi</div></div>' +
    '<div class="lm-monthly-stat"><div class="lm-monthly-stat-val">' + avg + '</div><div class="lm-monthly-stat-lbl">Ort. Seans Yuku (AU)</div></div>' +
    '<div class="lm-monthly-stat"><div class="lm-monthly-stat-val">' + acwr.data_days + '</div><div class="lm-monthly-stat-lbl">Toplam Veri Gunu</div></div>';
}

/* ── Toast notification ───────────────────────────────────────────────────── */
function showToast(message, type) {
  type = type || "info";
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  const colors = { success: "#22C55E", error: "#EF4444", info: "#4A7CF6", warning: "#F97316" };
  const icons  = { success: "fa-check-circle", error: "fa-circle-xmark", info: "fa-circle-info", warning: "fa-triangle-exclamation" };
  toast.style.cssText = "display:flex;align-items:center;gap:10px;padding:12px 18px;border-radius:12px;background:#1E293B;color:#F8FAFC;font-size:0.88rem;box-shadow:0 8px 24px rgba(0,0,0,0.25);pointer-events:auto;max-width:340px;animation:toastIn .25s ease";
  toast.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.info) + '" style="color:' + (colors[type] || colors.info) + ';font-size:1rem;flex-shrink:0"></i><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "opacity .3s,transform .3s";
    setTimeout(function() { toast.remove(); }, 320);
  }, 3000);
}

/* inject toast animation */
(function() {
  if (document.getElementById("toastKeyframes")) return;
  const s = document.createElement("style");
  s.id = "toastKeyframes";
  s.textContent = "@keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}";
  document.head.appendChild(s);
})();
