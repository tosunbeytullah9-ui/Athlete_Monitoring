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

  const isCoachOrStaff = ["coach", "staff"].includes(state.currentUser?.role);
  $("addExerciseBtn").classList.toggle("hidden", !isLib);
  $("newProgramBtn").classList.toggle("hidden", !isProg);
  $("addOneRMBtn").classList.toggle("hidden", !isORM || !isCoachOrStaff);

  $("tabLibrary").classList.toggle("active", isLib);
  $("tabPrograms").classList.toggle("active", isProg);
  $("tabOneRM").classList.toggle("active", isORM);
  $("tabAthletes").classList.toggle("active", isAthletes || isAthDet);
  $("tabTeams").classList.toggle("active", isTeams || isTeamDet);
  $("tabStats").classList.toggle("active", isStats);

  if (isProg) loadPrograms();
  if (isORM)  loadOneRM();
  if (isAthletes) loadAthletes();
  if (isTeams) loadTeams();
  if (isStats) loadStats();
}

$("tabLibrary").addEventListener("click",  () => switchView("library"));
$("tabPrograms").addEventListener("click", () => switchView("programs"));
$("tabOneRM").addEventListener("click",    () => switchView("one-rm"));
$("tabAthletes").addEventListener("click", () => switchView("athletes"));
$("tabTeams").addEventListener("click",    () => switchView("teams"));
$("tabStats").addEventListener("click",    () => switchView("stats"));
$("newProgramBtn").addEventListener("click", openNewProgramModal);
$("addOneRMBtn").addEventListener("click", () => openOneRMModal());

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
      <div class="week-block-phase">${label}</div>
    `;
    block.title = `Week ${w.week_number}: ${w.phase || "no phase"}`;
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

  const phaseLabel = week.phase
    ? ` <span style="color:${PHASE_COLORS[week.phase]};font-weight:600">(${week.phase})</span>` : "";
  title.innerHTML = `Week ${week.week_number} Sessions${phaseLabel}`;

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

function openSessionExModal(sessionId, exData) {
  pState.sexSessionId = sessionId;
  pState.sexEditId    = exData ? exData.id : null;
  pState.sexSelectedEx = exData ? { id: exData.exercise_id, name: exData.exercise_name } : null;

  $("sessionExTitle").textContent = exData ? "Edit Exercise" : "Add Exercise";
  $("sex-search").value = "";
  $("sexSearchResults").innerHTML = "";

  if (pState.sexSelectedEx && pState.sexSelectedEx.name) {
    $("sexSelectedDisplay").classList.remove("hidden");
    $("sexSelectedName").textContent = pState.sexSelectedEx.name;
  } else {
    $("sexSelectedDisplay").classList.add("hidden");
    $("sexSelectedName").textContent = "—";
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

$("sex-search").addEventListener("input", e => {
  clearTimeout(sexSearchTimer);
  const val = e.target.value.trim();
  if (!val) { $("sexSearchResults").innerHTML = ""; return; }
  sexSearchTimer = setTimeout(async () => {
    const results = await apiFetch(`/api/exercises?search=${encodeURIComponent(val)}`);
    renderSexResults(results.slice(0, 10));
  }, 250);
});

function renderSexResults(exercises) {
  const container = $("sexSearchResults");
  container.innerHTML = "";
  if (exercises.length === 0) {
    container.innerHTML = `<div style="padding:10px 12px;font-size:.8rem;color:#9CA3AF">No exercises found</div>`;
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
      $("sexSelectedDisplay").classList.remove("hidden");
      $("sexSelectedName").textContent = ex.name;
      $("sexSearchResults").innerHTML = "";
      $("sex-search").value = "";
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

$("sessionExClose").addEventListener("click",  () => closeModal("sessionExModal"));
$("sessionExCancel").addEventListener("click", () => closeModal("sessionExModal"));
$("sessionExModal").addEventListener("click", e => { if (e.target === $("sessionExModal")) closeModal("sessionExModal"); });

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

/* ── Helper functions ─────────────────────────────────────────────────────── */
function resetChips(containerId) {
  const chips = $(containerId).querySelectorAll(".chip");
  chips.forEach((c, i) => c.classList.toggle("active", i === 0));
}

function setChip(containerId, value) {
  $(containerId).querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("active", c.dataset.val === value);
  });
}

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
  $("statsTabGymnastics").classList.remove("active");
  $("statsIndividualPanel").classList.remove("hidden");
  $("statsTeamPanel").classList.add("hidden");
  $("statsComparePanel").classList.add("hidden");
  $("statsGymPanel").classList.add("hidden");
});

$("statsTabTeam").addEventListener("click", () => {
  statsState.activeTab = "team";
  $("statsTabTeam").classList.add("active");
  $("statsTabIndividual").classList.remove("active");
  $("statsTabCompare").classList.remove("active");
  $("statsTabGymnastics").classList.remove("active");
  $("statsTeamPanel").classList.remove("hidden");
  $("statsIndividualPanel").classList.add("hidden");
  $("statsComparePanel").classList.add("hidden");
  $("statsGymPanel").classList.add("hidden");
});

$("statsTabCompare").addEventListener("click", () => {
  statsState.activeTab = "compare";
  $("statsTabCompare").classList.add("active");
  $("statsTabIndividual").classList.remove("active");
  $("statsTabTeam").classList.remove("active");
  $("statsTabGymnastics").classList.remove("active");
  $("statsComparePanel").classList.remove("hidden");
  $("statsIndividualPanel").classList.add("hidden");
  $("statsTeamPanel").classList.add("hidden");
  $("statsGymPanel").classList.add("hidden");
});

$("statsTabGymnastics").addEventListener("click", () => {
  statsState.activeTab = "gymnastics";
  $("statsTabGymnastics").classList.add("active");
  $("statsTabIndividual").classList.remove("active");
  $("statsTabTeam").classList.remove("active");
  $("statsTabCompare").classList.remove("active");
  $("statsGymPanel").classList.remove("hidden");
  $("statsIndividualPanel").classList.add("hidden");
  $("statsTeamPanel").classList.add("hidden");
  $("statsComparePanel").classList.add("hidden");
  loadGymPanel();
});

/* ── Gymnastics inner sub-tab switching ───────────────────────────────────── */
$("gymTabIndividual").addEventListener("click", function() {
  $("gymTabIndividual").classList.add("active");
  $("gymTabCompare").classList.remove("active");
  $("gymIndividualPanel").classList.remove("hidden");
  $("gymComparePanel").classList.add("hidden");
});

$("gymTabCompare").addEventListener("click", function() {
  $("gymTabCompare").classList.add("active");
  $("gymTabIndividual").classList.remove("active");
  $("gymComparePanel").classList.remove("hidden");
  $("gymIndividualPanel").classList.add("hidden");
  initGymCompare();
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

/* =================================================================
   GYMNASTICS COMPETITION STATISTICS
   ================================================================= */

/* Apparatus definitions (FIG Artistic Gymnastics) */
const APPARATUS_MALE = [
  { code: "FX", label: "Floor Exercise"  },
  { code: "PH", label: "Pommel Horse"    },
  { code: "SR", label: "Still Rings"     },
  { code: "VT", label: "Vault"           },
  { code: "PB", label: "Parallel Bars"   },
  { code: "HB", label: "Horizontal Bar"  },
];
const APPARATUS_FEMALE = [
  { code: "VT", label: "Vault"           },
  { code: "UB", label: "Uneven Bars"     },
  { code: "BB", label: "Balance Beam"    },
  { code: "FX", label: "Floor Exercise"  },
];

function getApparatus(gender) {
  return gender === "male" ? APPARATUS_MALE : APPARATUS_FEMALE;
}

/* Gym stats state */
const gymState = {
  progressionChart:  null,
  radarChart:        null,
  comparisonChart:   null,
  currentAthleteId:  null,
  currentIsGuest:    false,
  currentGender:     "female",
  lastResults:       [],
  allAthletes:       [],
  allGuestAthletes:  [],
  editingResultId:   null,
  editingEventId:    null,
};

/* Load dropdowns */
async function loadGymAthleteDropdowns() {
  const [athletes, guests] = await Promise.all([
    apiFetch("/api/athletes"),
    apiFetch("/api/guest-athletes"),
  ]);
  gymState.allAthletes      = athletes;
  gymState.allGuestAthletes = guests;
  rebuildGymAthleteSelect();
}

function rebuildGymAthleteSelect() {
  const type    = $("gymAthleteTypeSelect").value;
  const sel     = $("gymAthleteSelect");
  const prevVal = sel.value;
  sel.innerHTML = '<option value="">— Choose an athlete —</option>';
  const list    = type === "system"
    ? gymState.allAthletes.filter(function(a) { return a.sport && a.sport.toLowerCase() === "gymnastics"; })
    : gymState.allGuestAthletes;
  list.forEach(function(a) {
    const opt = document.createElement("option");
    opt.value = a.id;
    const country = a.country ? " (" + a.country + ")" : "";
    const sport   = a.sport   ? " · " + a.sport   : "";
    opt.textContent = a.name + country + sport;
    sel.appendChild(opt);
  });
  if (prevVal) sel.value = prevVal;
}

async function loadGymPanel() {
  await loadGymAthleteDropdowns();
  const isCoach = state.currentUser && ["coach", "staff"].indexOf(state.currentUser.role) !== -1;
  $("gymCoachActions").classList.toggle("hidden", !isCoach);
  $("gymOpenAddResultBtn").style.display = "none";
  $("gymCoachButtons").style.display = isCoach ? "flex" : "none";
}

/* Selector event listeners */
$("gymAthleteTypeSelect").addEventListener("change", function() {
  rebuildGymAthleteSelect();
  resetGymCharts();
});

$("gymAthleteSelect").addEventListener("change", async function(e) {
  const id = parseInt(e.target.value);
  if (!id) { resetGymCharts(); return; }
  const isGuest = $("gymAthleteTypeSelect").value === "guest";
  await renderGymAthleteStats(id, isGuest);
});

$("gymProgressionApparatusSelect").addEventListener("change", function(e) {
  if (!gymState.currentAthleteId) return;
  renderGymProgressionChart(gymState.lastResults, e.target.value || null);
});

/* Main render function */
async function renderGymAthleteStats(athleteId, isGuest) {
  gymState.currentAthleteId = athleteId;
  gymState.currentIsGuest   = isGuest;

  let gender = "female";
  if (isGuest) {
    const g = gymState.allGuestAthletes.find(function(x) { return x.id === athleteId; });
    if (g) gender = g.gender || "female";
  } else {
    const a = gymState.allAthletes.find(function(x) { return x.id === athleteId; });
    if (a) gender = a.gender || "female";
  }
  gymState.currentGender = gender;

  const qs      = isGuest ? "?guest_athlete_id=" + athleteId : "?athlete_id=" + athleteId;
  const results = await apiFetch("/api/competition-results" + qs);
  gymState.lastResults = results;

  $("gymEmpty").classList.add("hidden");
  $("gymChartsArea").classList.remove("hidden");

  const isCoach = state.currentUser && ["coach", "staff"].indexOf(state.currentUser.role) !== -1;
  if (isCoach) $("gymOpenAddResultBtn").style.display = "";

  const apparatus  = getApparatus(gender);
  const compIds    = [];
  const compSeen   = {};
  results.forEach(function(r) { if (!compSeen[r.competition_event_id]) { compSeen[r.competition_event_id] = true; compIds.push(r.competition_event_id); } });
  const totalComps = compIds.length;
  const scores     = results.filter(function(r) { return r.final_score != null; }).map(function(r) { return r.final_score; });
  const bestScore  = scores.length ? Math.max.apply(null, scores).toFixed(3) : "—";

  $("gymSummaryRow").innerHTML =
    '<div class="stats-summary-card">' +
      '<div class="stats-summary-icon" style="color:#4A7CF6"><i class="fa-solid fa-medal"></i></div>' +
      '<div class="stats-summary-value">' + totalComps + '</div>' +
      '<div class="stats-summary-label">Competitions</div>' +
    '</div>' +
    '<div class="stats-summary-card">' +
      '<div class="stats-summary-icon" style="color:#10B981"><i class="fa-solid fa-list-ol"></i></div>' +
      '<div class="stats-summary-value">' + results.length + '</div>' +
      '<div class="stats-summary-label">Results Logged</div>' +
    '</div>' +
    '<div class="stats-summary-card">' +
      '<div class="stats-summary-icon" style="color:#F97316"><i class="fa-solid fa-trophy"></i></div>' +
      '<div class="stats-summary-value">' + bestScore + '</div>' +
      '<div class="stats-summary-label">Best Score</div>' +
    '</div>' +
    '<div class="stats-summary-card">' +
      '<div class="stats-summary-icon" style="color:#A855F7"><i class="fa-solid fa-person-running"></i></div>' +
      '<div class="stats-summary-value" style="font-size:1rem">' + (gender === "male" ? "Men" : "Women") + '</div>' +
      '<div class="stats-summary-label">Category &middot; ' + apparatus.length + ' Apparatus</div>' +
    '</div>';

  const appSel = $("gymProgressionApparatusSelect");
  const prevApp = appSel.value;
  appSel.innerHTML = '<option value="">All apparatuses</option>';
  apparatus.forEach(function(ap) {
    const opt = document.createElement("option");
    opt.value = ap.code;
    opt.textContent = ap.code + " — " + ap.label;
    appSel.appendChild(opt);
  });
  if (prevApp) appSel.value = prevApp;

  renderGymProgressionChart(results, appSel.value || null);
  renderGymRadarChart(results, apparatus);
  renderGymComparisonChart(results, apparatus);
  renderGymResultsTable(results);
}

/* Score Progression — Line chart */
function renderGymProgressionChart(results, filterApparatus) {
  if (gymState.progressionChart) { gymState.progressionChart.destroy(); gymState.progressionChart = null; }
  const wrap = $("gymProgressionWrap");
  if (!$("gymProgressionChart")) wrap.innerHTML = '<canvas id="gymProgressionChart"></canvas>';

  const apparatus = getApparatus(gymState.currentGender);
  const filtered  = filterApparatus
    ? apparatus.filter(function(ap) { return ap.code === filterApparatus; })
    : apparatus;

  const sorted = results.slice().sort(function(a, b) {
    const da = a.competition_event_date || a.created_at;
    const db2 = b.competition_event_date || b.created_at;
    return da < db2 ? -1 : da > db2 ? 1 : 0;
  });

  const seenEvts = {};
  const events = [];
  sorted.forEach(function(r) {
    if (!seenEvts[r.competition_event_id]) {
      seenEvts[r.competition_event_id] = true;
      events.push({ id: r.competition_event_id, name: r.competition_event_name || ("Event #" + r.competition_event_id), date: r.competition_event_date });
    }
  });
  const allLabels = events.map(function(e) { return e.date ? e.name + " (" + e.date + ")" : e.name; });

  if (allLabels.length === 0) {
    wrap.innerHTML = '<div class="stats-no-data"><i class="fa-solid fa-chart-line"></i><p>No competition results yet.</p></div>';
    return;
  }

  const datasets = filtered.map(function(ap, i) {
    const color = ATHLETE_PALETTE[i % ATHLETE_PALETTE.length];
    return {
      label: ap.code + " – " + ap.label,
      data: events.map(function(ev) {
        const match = sorted.find(function(r) { return r.apparatus === ap.code && r.competition_event_id === ev.id; });
        return match ? match.final_score : null;
      }),
      borderColor: color,
      backgroundColor: color + "22",
      fill: false,
      tension: 0.3,
      pointRadius: 5,
      pointHoverRadius: 7,
      spanGaps: true,
    };
  });

  gymState.progressionChart = new Chart($("gymProgressionChart"), {
    type: "line",
    data: { labels: allLabels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom" },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const ev = events[ctx.dataIndex];
              const ap = filtered[ctx.datasetIndex];
              if (!ev || !ap) return "";
              const r = sorted.find(function(x) { return x.apparatus === ap.code && x.competition_event_id === ev.id; });
              if (!r) return ap.code + ": —";
              const lines = [ap.code + ": " + (r.final_score != null ? r.final_score.toFixed(3) : "—")];
              lines.push("  D=" + r.d_score + "  E=" + r.e_score + "  P=" + r.penalty);
              if (r.rank) lines.push("  Rank: #" + r.rank);
              return lines;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: false, title: { display: true, text: "Final Score" }, grid: { color: "#F1F5F9" } },
        x: { title: { display: true, text: "Competition" }, ticks: { maxRotation: 30 } },
      }
    }
  });
}

/* Apparatus Radar — best score per apparatus */
function renderGymRadarChart(results, apparatus) {
  if (gymState.radarChart) { gymState.radarChart.destroy(); gymState.radarChart = null; }
  const wrap = $("gymRadarWrap");
  if (!$("gymRadarChart")) wrap.innerHTML = '<canvas id="gymRadarChart"></canvas>';

  if (results.length === 0) {
    wrap.innerHTML = '<div class="stats-no-data"><i class="fa-solid fa-chart-pie"></i><p>No results to display.</p></div>';
    return;
  }

  const labels = apparatus.map(function(ap) { return ap.code + " – " + ap.label; });
  const data   = apparatus.map(function(ap) {
    const apR = results.filter(function(r) { return r.apparatus === ap.code && r.final_score != null; });
    if (!apR.length) return 0;
    return parseFloat(Math.max.apply(null, apR.map(function(r) { return r.final_score; })).toFixed(3));
  });

  gymState.radarChart = new Chart($("gymRadarChart"), {
    type: "radar",
    data: {
      labels: labels,
      datasets: [{
        label: "Best Final Score",
        data: data,
        backgroundColor: "#4A7CF622",
        borderColor: "#4A7CF6",
        borderWidth: 2.5,
        pointBackgroundColor: "#4A7CF6",
        pointBorderColor: "#fff",
        pointRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          ticks: { stepSize: 2, font: { size: 10 } },
          pointLabels: { font: { size: 11 } },
          grid: { color: "#E5E7EB" },
          angleLines: { color: "#E5E7EB" },
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return "Best: " + ctx.parsed.r.toFixed(3); } } }
      }
    }
  });
}

/* Competition Comparison — grouped bar chart */
function renderGymComparisonChart(results, apparatus) {
  if (gymState.comparisonChart) { gymState.comparisonChart.destroy(); gymState.comparisonChart = null; }
  const wrap = $("gymComparisonWrap");
  if (!$("gymComparisonChart")) wrap.innerHTML = '<canvas id="gymComparisonChart"></canvas>';

  const seenC = {};
  const events = [];
  results.slice().sort(function(a, b) {
    const da = a.competition_event_date || a.created_at;
    const db2 = b.competition_event_date || b.created_at;
    return da < db2 ? -1 : da > db2 ? 1 : 0;
  }).forEach(function(r) {
    if (!seenC[r.competition_event_id]) {
      seenC[r.competition_event_id] = true;
      events.push({ id: r.competition_event_id, name: r.competition_event_name || ("Event #" + r.competition_event_id), date: r.competition_event_date });
    }
  });

  if (events.length === 0) {
    wrap.innerHTML = '<div class="stats-no-data"><i class="fa-solid fa-chart-column"></i><p>No competition results yet.</p></div>';
    return;
  }

  const datasets = events.map(function(ev, i) {
    const color = ATHLETE_PALETTE[i % ATHLETE_PALETTE.length];
    return {
      label: ev.name + (ev.date ? " (" + ev.date + ")" : ""),
      data: apparatus.map(function(ap) {
        const r = results.find(function(x) { return x.competition_event_id === ev.id && x.apparatus === ap.code; });
        return (r && r.final_score != null) ? r.final_score : null;
      }),
      backgroundColor: color + "BB",
      borderColor: color,
      borderWidth: 1.5,
      borderRadius: 4,
      borderSkipped: false,
    };
  });

  gymState.comparisonChart = new Chart($("gymComparisonChart"), {
    type: "bar",
    data: { labels: apparatus.map(function(ap) { return ap.code; }), datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom" },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const ev = events[ctx.datasetIndex];
              const ap = apparatus[ctx.dataIndex];
              if (!ev || !ap) return "";
              const r = results.find(function(x) { return x.competition_event_id === ev.id && x.apparatus === ap.code; });
              if (!r) return ev.name + ": —";
              return [ev.name + ": " + (r.final_score != null ? r.final_score.toFixed(3) : "—"),
                      "  D=" + r.d_score + "  E=" + r.e_score + "  P=" + r.penalty];
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Final Score" }, grid: { color: "#F1F5F9" } },
        x: { title: { display: true, text: "Apparatus" } }
      }
    }
  });
}

/* Results table */
function renderGymResultsTable(results) {
  const container = $("gymResultsTable");
  if (results.length === 0) {
    container.innerHTML = '<div class="stats-no-data" style="padding:24px"><i class="fa-solid fa-table-list"></i><p>No results logged yet.</p></div>';
    return;
  }
  const isCoach = state.currentUser && ["coach", "staff"].indexOf(state.currentUser.role) !== -1;
  const sorted = results.slice().sort(function(a, b) {
    const da = a.competition_event_date || a.created_at;
    const db2 = b.competition_event_date || b.created_at;
    if (da !== db2) return db2 < da ? -1 : 1;
    return a.apparatus < b.apparatus ? -1 : 1;
  });

  let rows = "";
  sorted.forEach(function(r) {
    const delBtn = isCoach
      ? '<button class="btn-ghost btn-sm gym-del-result" data-id="' + r.id + '" style="color:#EF4444;padding:2px 8px"><i class="fa-solid fa-trash"></i></button>'
      : "";
    var hasJump2 = r.apparatus === "VT" && r.d_score_2 != null;
    var dCell = '<span class="gym-score-chip d-score">D ' + r.d_score + '</span>';
    var eCell = '<span class="gym-score-chip e-score">E ' + r.e_score + '</span>';
    var penCell = r.penalty > 0
      ? '<span class="gym-score-chip penalty">&#8722;' + r.penalty + '</span>'
      : '<span style="color:#9CA3AF">&#8212;</span>';
    var bonusCell = r.bonus_point > 0
      ? '<span class="gym-score-chip" style="background:#D1FAE5;color:#065F46">+' + r.bonus_point + '</span>'
      : '<span style="color:#9CA3AF">&#8212;</span>';
    if (hasJump2) {
      dCell += '<br><span class="gym-score-chip d-score" style="opacity:0.7;font-size:0.75rem;margin-top:2px">D2 ' + r.d_score_2 + '</span>';
      eCell += '<br><span class="gym-score-chip e-score" style="opacity:0.7;font-size:0.75rem;margin-top:2px">E2 ' + r.e_score_2 + '</span>';
      if (r.penalty_2 > 0) {
        penCell += '<br><span class="gym-score-chip penalty" style="opacity:0.7;font-size:0.75rem;margin-top:2px">&#8722;' + r.penalty_2 + '</span>';
      }
      if (r.bonus_point_2 > 0) {
        bonusCell += '<br><span class="gym-score-chip" style="background:#D1FAE5;color:#065F46;opacity:0.7;font-size:0.75rem;margin-top:2px">+' + r.bonus_point_2 + '</span>';
      }
    }
    const finalVal = r.final_score != null ? r.final_score.toFixed(3) : "—";
    const finalLabel = hasJump2 ? '<span style="font-size:0.65rem;color:#9CA3AF;display:block">ort.</span>' : '';
    rows +=
      '<tr style="border-bottom:1px solid #F3F4F6">' +
        '<td style="padding:7px 10px">' + esc(r.competition_event_name || ("Event #" + r.competition_event_id)) + '</td>' +
        '<td style="padding:7px 10px;color:#6B7280;font-size:0.82rem">' + (r.competition_event_date || "—") + '</td>' +
        '<td style="padding:7px 10px"><span class="gym-apparatus-badge">' + esc(r.apparatus) + '</span></td>' +
        '<td style="padding:7px 10px">' + dCell + '</td>' +
        '<td style="padding:7px 10px">' + eCell + '</td>' +
        '<td style="padding:7px 10px">' + penCell + '</td>' +
        '<td style="padding:7px 10px">' + bonusCell + '</td>' +
        '<td style="padding:7px 10px"><strong style="color:#F97316">' + finalVal + '</strong>' + finalLabel + '</td>' +
        '<td style="padding:7px 10px">' + (r.rank ? ('<span style="color:#6B7280">#' + r.rank + '</span>') : '<span style="color:#9CA3AF">&#8212;</span>') + '</td>' +
        '<td style="padding:7px 6px">' + delBtn + '</td>' +
      '</tr>';
  });

  container.innerHTML =
    '<table style="width:100%;border-collapse:collapse;font-size:0.84rem">' +
      '<thead><tr style="border-bottom:2px solid #E5E7EB;background:#F9FAFB">' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">Competition</th>' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">Date</th>' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">App.</th>' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">D Score</th>' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">E Score</th>' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">Penalty</th>' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">Bonus</th>' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">Final</th>' +
        '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">Rank</th>' +
        '<th style="padding:8px 10px"></th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';

  container.querySelectorAll(".gym-del-result").forEach(function(btn) {
    btn.addEventListener("click", async function() {
      if (!confirm("Delete this result?")) return;
      await apiFetch("/api/competition-results/" + btn.dataset.id, { method: "DELETE" });
      await renderGymAthleteStats(gymState.currentAthleteId, gymState.currentIsGuest);
    });
  });
}

/* Reset charts */
function resetGymCharts() {
  ["progressionChart", "radarChart", "comparisonChart"].forEach(function(k) {
    if (gymState[k]) { gymState[k].destroy(); gymState[k] = null; }
  });
  $("gymChartsArea").classList.add("hidden");
  $("gymSummaryRow").innerHTML = "";
  $("gymEmpty").classList.remove("hidden");
  $("gymOpenAddResultBtn").style.display = "none";
  gymState.currentAthleteId = null;
  gymState.lastResults = [];
}

/* Guest Athlete form */
$("gymSaveGuestBtn").addEventListener("click", async function() {
  const name   = $("gymGuestName").value.trim();
  const gender = $("gymGuestGender").value;
  if (!name) { alert("Guest athlete name is required."); return; }
  const payload = {
    name:       name,
    country:    $("gymGuestCountry").value.trim()      || null,
    gender:     gender,
    birth_year: parseInt($("gymGuestBirthYear").value) || null,
    notes:      $("gymGuestNotes").value.trim()        || null,
  };
  try {
    await apiFetch("/api/guest-athletes", { method: "POST", body: JSON.stringify(payload) });
    $("gymGuestName").value = "";
    $("gymGuestCountry").value = "";
    $("gymGuestBirthYear").value = "";
    $("gymGuestNotes").value = "";
    await loadGymAthleteDropdowns();
    alert("Guest athlete \"" + name + "\" saved. Select Guest Athlete from the type dropdown to view them.");
  } catch (e) { alert(e.message); }
});

/* Competition Event modal */
function openGymEventModal(editId) {
  gymState.editingEventId = editId || null;
  $("gymEventModalTitle").textContent = editId ? "Edit Competition" : "Add Competition";
  if (!editId) {
    $("gem-name").value = ""; $("gem-date").value = "";
    $("gem-level").value = ""; $("gem-location").value = ""; $("gem-notes").value = "";
  }
  $("gymEventModal").classList.remove("hidden");
}

$("gymOpenAddEventBtn").addEventListener("click", function() { openGymEventModal(null); });
$("gymEventModalClose").addEventListener("click",  function() { $("gymEventModal").classList.add("hidden"); });
$("gymEventModalCancel").addEventListener("click", function() { $("gymEventModal").classList.add("hidden"); });

$("gymEventModalSave").addEventListener("click", async function() {
  const name = $("gem-name").value.trim();
  const date = $("gem-date").value;
  if (!name || !date) { alert("Name and date are required."); return; }
  const payload = {
    name:     name,
    date:     date,
    location: $("gem-location").value.trim() || null,
    level:    $("gem-level").value           || null,
    notes:    $("gem-notes").value.trim()    || null,
  };
  try {
    const method = gymState.editingEventId ? "PUT" : "POST";
    const url    = gymState.editingEventId
      ? "/api/competition-events/" + gymState.editingEventId
      : "/api/competition-events";
    await apiFetch(url, { method: method, body: JSON.stringify(payload) });
    $("gymEventModal").classList.add("hidden");
    gymState.editingEventId = null;
  } catch (err) { alert(err.message); }
});

/* Competition Result modal */
async function openGymResultModal(editId) {
  gymState.editingResultId = editId || null;
  $("gymResultModalTitle").textContent = editId ? "Edit Result" : "Add Competition Result";

  const events = await apiFetch("/api/competition-events");
  const evSel  = $("grm-event");
  evSel.innerHTML = '<option value="">— Select competition —</option>';
  events.forEach(function(ev) {
    const opt = document.createElement("option");
    opt.value = ev.id;
    opt.textContent = ev.name + " — " + ev.date + (ev.level ? " · " + ev.level : "");
    evSel.appendChild(opt);
  });

  const appList = getApparatus(gymState.currentGender);
  const appSel  = $("grm-apparatus");
  appSel.innerHTML = '<option value="">— Select apparatus —</option>';
  appList.forEach(function(ap) {
    const opt = document.createElement("option");
    opt.value = ap.code;
    opt.textContent = ap.code + " — " + ap.label;
    appSel.appendChild(opt);
  });

  $("grm-dscore").value = ""; $("grm-escore").value = "";
  $("grm-penalty").value = "0"; $("grm-bonus").value = "0"; $("grm-final").value = "";
  $("grm-dscore2").value = ""; $("grm-escore2").value = "";
  $("grm-penalty2").value = "0"; $("grm-bonus2").value = "0";
  $("grm-vault-jump2").style.display = "none";
  $("grm-rank").value = ""; $("grm-notes").value = "";

  $("gymResultModal").classList.remove("hidden");
}

$("grm-apparatus").addEventListener("change", function() {
  var isVT = this.value === "VT";
  $("grm-vault-jump2").style.display = isVT ? "" : "none";
  if (!isVT) {
    $("grm-dscore2").value = "";
    $("grm-escore2").value = "";
    $("grm-penalty2").value = "0";
    $("grm-bonus2").value = "0";
  }
  recalcGymFinal();
});

function recalcGymFinal() {
  var d1 = parseFloat($("grm-dscore").value)  || 0;
  var e1 = parseFloat($("grm-escore").value)  || 0;
  var p1 = parseFloat($("grm-penalty").value) || 0;
  var b1 = parseFloat($("grm-bonus").value)   || 0;
  var jump1 = d1 + e1 - p1 + b1;

  var isVT = $("grm-apparatus").value === "VT";
  var d2 = parseFloat($("grm-dscore2").value) || 0;

  if (isVT && d2 > 0) {
    var e2 = parseFloat($("grm-escore2").value)  || 0;
    var p2 = parseFloat($("grm-penalty2").value) || 0;
    var b2 = parseFloat($("grm-bonus2").value)   || 0;
    var jump2 = d2 + e2 - p2 + b2;
    $("grm-final").value = ((jump1 + jump2) / 2).toFixed(3);
    $("grm-final-label").innerHTML = 'Final Score <span style="font-size:0.75rem;color:#9CA3AF">(2 atlayışın ortalaması)</span>';
  } else {
    $("grm-final").value = jump1.toFixed(3);
    $("grm-final-label").innerHTML = 'Final Score <span style="font-size:0.75rem;color:#9CA3AF">(D + E − Penalty + Bonus)</span>';
  }
}

["grm-dscore", "grm-escore", "grm-penalty", "grm-bonus",
 "grm-dscore2", "grm-escore2", "grm-penalty2", "grm-bonus2"].forEach(function(id) {
  $(id).addEventListener("input", recalcGymFinal);
});

$("gymOpenAddResultBtn").addEventListener("click", function() { openGymResultModal(null); });
$("gymResultModalClose").addEventListener("click",  function() { $("gymResultModal").classList.add("hidden"); });
$("gymResultModalCancel").addEventListener("click", function() { $("gymResultModal").classList.add("hidden"); });

$("gymResultModalSave").addEventListener("click", async function() {
  const evId  = parseInt($("grm-event").value);
  const appar = $("grm-apparatus").value;
  if (!evId)  { alert("Please select a competition."); return; }
  if (!appar) { alert("Please select an apparatus.");  return; }

  const athleteId      = gymState.currentIsGuest ? null : gymState.currentAthleteId;
  const guestAthleteId = gymState.currentIsGuest ? gymState.currentAthleteId : null;

  var isVT = appar === "VT";
  var hasJump2 = isVT && parseFloat($("grm-dscore2").value) > 0;

  const payload = {
    competition_event_id: evId,
    athlete_id:           athleteId,
    guest_athlete_id:     guestAthleteId,
    apparatus:            appar,
    d_score:              parseFloat($("grm-dscore").value)  || 0,
    e_score:              parseFloat($("grm-escore").value)  || 0,
    penalty:              parseFloat($("grm-penalty").value) || 0,
    bonus_point:          parseFloat($("grm-bonus").value)   || 0,
    d_score_2:            hasJump2 ? (parseFloat($("grm-dscore2").value)  || 0) : null,
    e_score_2:            hasJump2 ? (parseFloat($("grm-escore2").value)  || 0) : null,
    penalty_2:            hasJump2 ? (parseFloat($("grm-penalty2").value) || 0) : null,
    bonus_point_2:        hasJump2 ? (parseFloat($("grm-bonus2").value)   || 0) : null,
    rank:                 parseInt($("grm-rank").value)      || null,
    notes:                $("grm-notes").value.trim()        || null,
  };

  try {
    const method = gymState.editingResultId ? "PUT" : "POST";
    const url    = gymState.editingResultId
      ? "/api/competition-results/" + gymState.editingResultId
      : "/api/competition-results";
    await apiFetch(url, { method: method, body: JSON.stringify(payload) });
    $("gymResultModal").classList.add("hidden");
    gymState.editingResultId = null;
    await renderGymAthleteStats(gymState.currentAthleteId, gymState.currentIsGuest);
  } catch (err) { alert(err.message); }
});

/* =================================================================
   GYMNASTICS — COMPARE ATHLETES
   Supports mixing System athletes (sport=gymnastics) + Guest athletes
   ================================================================= */

/* Extend gymState with compare properties */
gymState.cmpAthletes   = [];   // [{ id, name, isGuest, gender, country, color, results: null|[] }]
gymState.cmpBarChart   = null;
gymState.cmpRadarChart = null;
gymState.cmpInitialized = false;

/* ── Init (called once when Compare tab is first opened) ──────────────── */
function initGymCompare() {
  rebuildGymCmpDropdowns();

  if (gymState.cmpInitialized) return;
  gymState.cmpInitialized = true;

  /* Gender selector changes apparatus list & re-renders */
  $("gymCmpGender").addEventListener("change", function() {
    maybeRenderGymCompare();
  });

  /* Add system athlete */
  $("gymCmpSystemSelect").addEventListener("change", function() {
    const id = parseInt(this.value);
    if (!id) return;
    this.value = "";
    const a = gymState.allAthletes.find(function(x) { return x.id === id; });
    if (!a) return;
    addGymCmpAthlete(id, a.name, false, a.gender, null);
  });

  /* Add guest athlete */
  $("gymCmpGuestSelect").addEventListener("change", function() {
    const id = parseInt(this.value);
    if (!id) return;
    this.value = "";
    const g = gymState.allGuestAthletes.find(function(x) { return x.id === id; });
    if (!g) return;
    addGymCmpAthlete(id, g.name, true, g.gender, g.country);
  });

  /* Remove chip clicks */
  $("gymCmpChips").addEventListener("click", function(e) {
    const btn = e.target.closest(".gym-cmp-chip-remove");
    if (!btn) return;
    removeGymCmpAthlete(parseInt(btn.dataset.id), btn.dataset.guest === "true");
  });
}

/* ── Populate compare dropdowns ───────────────────────────────────────── */
function rebuildGymCmpDropdowns() {
  /* System athletes (gymnastics only) */
  const sysSel = $("gymCmpSystemSelect");
  sysSel.innerHTML = '<option value="">— Add system athlete —</option>';
  const gymAthletes = gymState.allAthletes.filter(function(a) {
    return a.sport && a.sport.toLowerCase() === "gymnastics";
  });
  gymAthletes.forEach(function(a) {
    const already = gymState.cmpAthletes.some(function(c) { return !c.isGuest && c.id === a.id; });
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.name + (a.gender ? " (" + a.gender + ")" : "");
    if (already) { opt.disabled = true; opt.style.color = "#9CA3AF"; }
    sysSel.appendChild(opt);
  });

  /* Guest athletes */
  const gstSel = $("gymCmpGuestSelect");
  gstSel.innerHTML = '<option value="">— Add guest athlete —</option>';
  gymState.allGuestAthletes.forEach(function(g) {
    const already = gymState.cmpAthletes.some(function(c) { return c.isGuest && c.id === g.id; });
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name + (g.country ? " (" + g.country + ")" : "") + (g.gender ? " · " + g.gender : "");
    if (already) { opt.disabled = true; opt.style.color = "#9CA3AF"; }
    gstSel.appendChild(opt);
  });
}

/* ── Add athlete to comparison ────────────────────────────────────────── */
function addGymCmpAthlete(id, name, isGuest, gender, country) {
  /* Prevent duplicates */
  if (gymState.cmpAthletes.some(function(c) { return c.id === id && c.isGuest === isGuest; })) return;

  const color = ATHLETE_PALETTE[gymState.cmpAthletes.length % ATHLETE_PALETTE.length];
  gymState.cmpAthletes.push({ id: id, name: name, isGuest: isGuest, gender: gender || "female", country: country, color: color, results: null });

  renderGymCmpChips();
  rebuildGymCmpDropdowns();

  /* Fetch results for this athlete, then re-render */
  const qs = isGuest ? "?guest_athlete_id=" + id : "?athlete_id=" + id;
  apiFetch("/api/competition-results" + qs).then(function(results) {
    const entry = gymState.cmpAthletes.find(function(c) { return c.id === id && c.isGuest === isGuest; });
    if (entry) {
      entry.results = results;
      maybeRenderGymCompare();
    }
  });
}

/* ── Remove athlete from comparison ───────────────────────────────────── */
function removeGymCmpAthlete(id, isGuest) {
  gymState.cmpAthletes = gymState.cmpAthletes.filter(function(c) {
    return !(c.id === id && c.isGuest === isGuest);
  });
  /* Re-assign colors to keep them sequential */
  gymState.cmpAthletes.forEach(function(c, i) { c.color = ATHLETE_PALETTE[i % ATHLETE_PALETTE.length]; });
  renderGymCmpChips();
  rebuildGymCmpDropdowns();
  maybeRenderGymCompare();
}

/* ── Render athlete chips ─────────────────────────────────────────────── */
function renderGymCmpChips() {
  const container = $("gymCmpChips");
  if (gymState.cmpAthletes.length === 0) {
    container.innerHTML = '<span style="color:#9CA3AF;font-size:0.82rem">No athletes selected yet.</span>';
    return;
  }
  container.innerHTML = gymState.cmpAthletes.map(function(c) {
    const tag = c.isGuest
      ? '<span class="gym-guest-tag"><i class="fa-solid fa-globe"></i>' + (c.country || "Guest") + '</span>'
      : '<span class="gym-guest-tag"><i class="fa-solid fa-user"></i>System</span>';
    return '<span class="stats-compare-chip" style="border-left:3px solid ' + c.color + ';padding-left:8px">' +
      '<span style="color:' + c.color + ';font-weight:700">' + esc(c.name) + '</span>' + tag +
      '<button class="compare-chip-remove gym-cmp-chip-remove" data-id="' + c.id + '" data-guest="' + c.isGuest + '" title="Remove">&#215;</button>' +
    '</span>';
  }).join("");
}

/* ── Decide whether to render or show empty state ─────────────────────── */
function maybeRenderGymCompare() {
  const ready = gymState.cmpAthletes.filter(function(c) { return c.results !== null; });
  const total = gymState.cmpAthletes.length;

  if (total < 2) {
    $("gymCmpChartsArea").classList.add("hidden");
    $("gymCmpEmpty").classList.remove("hidden");
    $("gymCmpEmptyMsg").textContent = total === 0
      ? "Add at least 2 athletes to compare. You can mix system athletes and international guests."
      : "Add at least one more athlete to start comparing.";
    destroyGymCmpCharts();
    return;
  }
  if (ready.length < total) {
    /* Still loading some results — show a loading hint */
    $("gymCmpEmpty").classList.remove("hidden");
    $("gymCmpEmptyMsg").textContent = "Loading results\u2026";
    return;
  }

  $("gymCmpEmpty").classList.add("hidden");
  $("gymCmpChartsArea").classList.remove("hidden");

  const gender    = $("gymCmpGender").value;
  const apparatus = getApparatus(gender);

  renderGymCmpSummary(ready);
  renderGymCmpBarChart(ready, apparatus);
  renderGymCmpRadarChart(ready, apparatus);
  renderGymCmpTable(ready, apparatus);
}

/* ── Summary cards ────────────────────────────────────────────────────── */
function renderGymCmpSummary(athletes) {
  const allResults = athletes.reduce(function(acc, c) { return acc.concat(c.results); }, []);
  const allScores  = allResults.filter(function(r) { return r.final_score != null; }).map(function(r) { return r.final_score; });
  const topScore   = allScores.length ? Math.max.apply(null, allScores).toFixed(3) : "—";
  const topAthlete = allScores.length
    ? athletes.reduce(function(best, c) {
        const s = c.results.filter(function(r) { return r.final_score != null; }).map(function(r) { return r.final_score; });
        const m = s.length ? Math.max.apply(null, s) : -1;
        return m > best.score ? { name: c.name, score: m } : best;
      }, { name: "—", score: -1 }).name
    : "—";

  $("gymCmpSummaryRow").innerHTML =
    '<div class="stats-summary-card">' +
      '<div class="stats-summary-icon" style="color:#4A7CF6"><i class="fa-solid fa-users"></i></div>' +
      '<div class="stats-summary-value">' + athletes.length + '</div>' +
      '<div class="stats-summary-label">Athletes</div>' +
    '</div>' +
    '<div class="stats-summary-card">' +
      '<div class="stats-summary-icon" style="color:#10B981"><i class="fa-solid fa-list-ol"></i></div>' +
      '<div class="stats-summary-value">' + allResults.length + '</div>' +
      '<div class="stats-summary-label">Total Results</div>' +
    '</div>' +
    '<div class="stats-summary-card">' +
      '<div class="stats-summary-icon" style="color:#F97316"><i class="fa-solid fa-trophy"></i></div>' +
      '<div class="stats-summary-value">' + topScore + '</div>' +
      '<div class="stats-summary-label">Highest Score</div>' +
    '</div>' +
    '<div class="stats-summary-card">' +
      '<div class="stats-summary-icon" style="color:#A855F7"><i class="fa-solid fa-medal"></i></div>' +
      '<div class="stats-summary-value" style="font-size:0.95rem">' + esc(topAthlete) + '</div>' +
      '<div class="stats-summary-label">Leading Athlete</div>' +
    '</div>';
}

/* ── Grouped bar chart: best score per apparatus per athlete ──────────── */
function renderGymCmpBarChart(athletes, apparatus) {
  destroyGymCmpCharts();
  const wrap = $("gymCmpBarWrap");
  if (!$("gymCmpBarChart")) wrap.innerHTML = '<canvas id="gymCmpBarChart"></canvas>';

  const datasets = athletes.map(function(c) {
    return {
      label: c.name + (c.isGuest && c.country ? " (" + c.country + ")" : ""),
      data: apparatus.map(function(ap) {
        const apR = (c.results || []).filter(function(r) { return r.apparatus === ap.code && r.final_score != null; });
        return apR.length ? parseFloat(Math.max.apply(null, apR.map(function(r) { return r.final_score; })).toFixed(3)) : null;
      }),
      backgroundColor: c.color + "BB",
      borderColor: c.color,
      borderWidth: 1.5,
      borderRadius: 4,
      borderSkipped: false,
    };
  });

  gymState.cmpBarChart = new Chart($("gymCmpBarChart"), {
    type: "bar",
    data: { labels: apparatus.map(function(ap) { return ap.code + "\n" + ap.label; }), datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom", labels: { usePointStyle: true, padding: 14 } },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const val = ctx.parsed.y;
              return "  " + ctx.dataset.label + ": " + (val != null ? val.toFixed(3) : "—");
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Best Final Score" }, grid: { color: "#F1F5F9" } },
        x: { title: { display: true, text: "Apparatus" }, ticks: { maxRotation: 0 } }
      }
    }
  });
}

/* ── Multi-athlete radar chart ────────────────────────────────────────── */
function renderGymCmpRadarChart(athletes, apparatus) {
  const wrap = $("gymCmpRadarWrap");
  if (!$("gymCmpRadarChart")) wrap.innerHTML = '<canvas id="gymCmpRadarChart"></canvas>';

  const labels = apparatus.map(function(ap) { return ap.code + " – " + ap.label; });

  const datasets = athletes.map(function(c) {
    const data = apparatus.map(function(ap) {
      const apR = (c.results || []).filter(function(r) { return r.apparatus === ap.code && r.final_score != null; });
      return apR.length ? parseFloat(Math.max.apply(null, apR.map(function(r) { return r.final_score; })).toFixed(3)) : 0;
    });
    return {
      label: c.name + (c.isGuest && c.country ? " (" + c.country + ")" : ""),
      data: data,
      backgroundColor: c.color + "22",
      borderColor: c.color,
      borderWidth: 2,
      pointBackgroundColor: c.color,
      pointBorderColor: "#fff",
      pointRadius: 4,
    };
  });

  gymState.cmpRadarChart = new Chart($("gymCmpRadarChart"), {
    type: "radar",
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          ticks: { stepSize: 2, font: { size: 10 } },
          pointLabels: { font: { size: 11 } },
          grid: { color: "#E5E7EB" },
          angleLines: { color: "#E5E7EB" },
        }
      },
      plugins: {
        legend: { display: true, position: "bottom", labels: { usePointStyle: true, padding: 14 } },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return "  " + ctx.dataset.label + ": " + ctx.parsed.r.toFixed(3);
            }
          }
        }
      }
    }
  });
}

/* ── Score summary table ──────────────────────────────────────────────── */
function renderGymCmpTable(athletes, apparatus) {
  const container = $("gymCmpTable");

  /* Header: athlete names */
  let headCells = '<th style="padding:8px 10px;color:#6B7280;font-weight:600;text-align:left">Apparatus</th>';
  athletes.forEach(function(c) {
    const tag = c.isGuest
      ? ' <span style="font-size:0.68rem;color:#9CA3AF;font-weight:400">&#127757;</span>'
      : ' <span style="font-size:0.68rem;color:#9CA3AF;font-weight:400">&#128100;</span>';
    headCells += '<th style="padding:8px 10px;text-align:center;color:' + c.color + ';font-weight:700">' +
      esc(c.name) + tag + (c.country ? '<br><span style="font-size:0.69rem;color:#9CA3AF;font-weight:400">' + esc(c.country) + '</span>' : '') +
    '</th>';
  });

  /* Rows: one per apparatus */
  let bodyRows = "";
  apparatus.forEach(function(ap) {
    let row = '<tr style="border-bottom:1px solid #F3F4F6">' +
      '<td style="padding:7px 10px"><span class="gym-apparatus-badge">' + ap.code + '</span> ' +
      '<span style="font-size:0.8rem;color:#6B7280">' + ap.label + '</span></td>';

    athletes.forEach(function(c) {
      const apR = (c.results || []).filter(function(r) { return r.apparatus === ap.code && r.final_score != null; });
      if (!apR.length) {
        row += '<td style="padding:7px 10px;text-align:center;color:#D1D5DB">—</td>';
        return;
      }
      const best = apR.reduce(function(b, r) { return r.final_score > b.final_score ? r : b; });
      row += '<td style="padding:7px 10px;text-align:center">' +
        '<strong style="color:#374151">' + best.final_score.toFixed(3) + '</strong>' +
        '<div style="font-size:0.7rem;color:#9CA3AF;margin-top:1px">' +
          '<span class="gym-score-chip d-score" style="padding:1px 5px;font-size:0.65rem">D ' + best.d_score + '</span> ' +
          '<span class="gym-score-chip e-score" style="padding:1px 5px;font-size:0.65rem">E ' + best.e_score + '</span>' +
        '</div>' +
      '</td>';
    });

    row += '</tr>';
    bodyRows += row;
  });

  container.innerHTML =
    '<table style="width:100%;border-collapse:collapse;font-size:0.84rem">' +
      '<thead><tr style="border-bottom:2px solid #E5E7EB;background:#F9FAFB">' + headCells + '</tr></thead>' +
      '<tbody>' + bodyRows + '</tbody>' +
    '</table>';
}

/* ── Destroy compare charts ───────────────────────────────────────────── */
function destroyGymCmpCharts() {
  if (gymState.cmpBarChart)   { gymState.cmpBarChart.destroy();   gymState.cmpBarChart   = null; }
  if (gymState.cmpRadarChart) { gymState.cmpRadarChart.destroy(); gymState.cmpRadarChart = null; }
}
