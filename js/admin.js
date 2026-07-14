/**
 * ADMIN PAGE - admin.js
 * Quản lý danh sách khách mời
 */

/* ── Config – phải khớp với invitation.js ─── */
const BASE_URL = window.location.origin + window.location.pathname.replace("admin.html", "index.html");

const SALUTATIONS = [
  { slug: "kinh-moi-thay",  label: "Kính mời Thầy",               icon: "👨‍🏫" },
  { slug: "kinh-moi-co",    label: "Kính mời Cô",                  icon: "👩‍🏫" },
  { slug: "kinh-moi-ong",   label: "Kính mời Ông",                 icon: "👴" },
  { slug: "kinh-moi-ba",    label: "Kính mời Bà",                  icon: "👵" },
  { slug: "kinh-moi-chu",   label: "Kính mời Chú",                 icon: "👨" },
  { slug: "kinh-moi-bac",   label: "Kính mời Bác",                 icon: "🧑" },
  { slug: "kinh-moi-anh",   label: "Kính mời Anh",                 icon: "👦" },
  { slug: "kinh-moi-chi",   label: "Kính mời Chị",                 icon: "👧" },
  { slug: "moi-ban",        label: "Mời bạn",                      icon: "🤝" },
  { slug: "moi-ban-than",   label: "Mời người bạn thân của mình",  icon: "💛" },
  { slug: "moi-anh-chi",    label: "Mời anh/chị",                  icon: "👫" },
  { slug: "custom",         label: "Tùy chỉnh...",                  icon: "✏️" },
];

/* ── State ────────────────────────────────── */
let guests = JSON.parse(localStorage.getItem("guest-list") || "[]");

/* ── DOM Ready ────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initSalutationSelect();
  initPresets();
  initForm();
  initSearch();
  renderGuests();
  updateStats();
  initExport();
  initCustomSalutation();
});

/* ── Salutation Select ────────────────────── */
function initSalutationSelect() {
  const select = document.getElementById("salutation-select");
  if (!select) return;
  select.innerHTML = SALUTATIONS.map(s =>
    `<option value="${s.slug}">${s.icon}  ${s.label}</option>`
  ).join("");
}

/* ── Preset Chips ─────────────────────────── */
function initPresets() {
  const container = document.getElementById("presets-container");
  if (!container) return;
  container.innerHTML = SALUTATIONS.slice(0, 8).map(s =>
    `<span class="preset-chip" data-slug="${s.slug}">${s.icon} ${s.label}</span>`
  ).join("");

  container.addEventListener("click", e => {
    const chip = e.target.closest(".preset-chip");
    if (!chip) return;
    document.getElementById("salutation-select").value = chip.dataset.slug;
    handleCustomToggle(chip.dataset.slug);
    document.getElementById("guest-name-input").focus();
  });
}

/* ── Custom salutation toggle ─────────────── */
function initCustomSalutation() {
  const select = document.getElementById("salutation-select");
  if (!select) return;
  select.addEventListener("change", () => handleCustomToggle(select.value));
}

function handleCustomToggle(slug) {
  const row = document.getElementById("custom-salutation-row");
  if (!row) return;
  row.style.display = slug === "custom" ? "block" : "none";
}

/* ── Form ─────────────────────────────────── */
function initForm() {
  const form = document.getElementById("add-guest-form");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const salutationSlug = document.getElementById("salutation-select").value;
    const customText     = document.getElementById("custom-salutation")?.value.trim();
    const name           = document.getElementById("guest-name-input").value.trim();
    const note           = document.getElementById("guest-note").value.trim();

    if (!name) { showToast("❗ Vui lòng nhập họ tên khách", "error"); return; }

    const guest = {
      id:            Date.now(),
      salutationSlug,
      customSalute:  salutationSlug === "custom" ? customText : "",
      name,
      note,
      status:        "pending",  // pending | attended | declined
      createdAt:     new Date().toISOString(),
    };

    guests.push(guest);
    save();
    renderGuests();
    updateStats();
    form.reset();
    document.getElementById("custom-salutation-row").style.display = "none";
    showToast("✅ Đã thêm khách mời: " + name);
  });
}

/* ── Build guest URL ──────────────────────── */
function buildGuestUrl(guest) {
  const encodedName = encodeURIComponent(guest.name);
  let url = `${BASE_URL}?guest=${encodedName}&salutation=${guest.salutationSlug}`;
  if (guest.customSalute) url += `&salute=${encodeURIComponent(guest.customSalute)}`;
  return url;
}

/* ── Render Guests ────────────────────────── */
function renderGuests(filter = "") {
  const container = document.getElementById("guest-list-container");
  if (!container) return;

  const filtered = guests.filter(g =>
    g.name.toLowerCase().includes(filter.toLowerCase()) ||
    g.note.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="icon">📋</span>
        <p>${filter ? "Không tìm thấy khách mời phù hợp" : "Chưa có khách mời nào. Thêm khách ở bên trái!"}</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(g => buildGuestCard(g)).join("");

  // Attach events
  container.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => handleAction(btn.dataset.action, +btn.dataset.id));
  });
}

function buildGuestCard(guest) {
  const salData = SALUTATIONS.find(s => s.slug === guest.salutationSlug) || { label: "", icon: "👤" };
  const salLabel = guest.salutationSlug === "custom"
    ? (guest.customSalute || "Tùy chỉnh")
    : salData.label;
  const url = buildGuestUrl(guest);
  const shortUrl = url.length > 55 ? url.slice(0, 55) + "..." : url;
  const avatar = getInitials(guest.name);
  const statusMap = {
    pending:  { cls: "status-pending",  label: "⏳ Chờ xác nhận" },
    attended: { cls: "status-attended", label: "✅ Tham dự" },
    declined: { cls: "status-declined", label: "❌ Vắng mặt" },
  };
  const st = statusMap[guest.status] || statusMap.pending;

  return `
  <div class="guest-card ${guest.status !== "pending" ? guest.status : ""}" data-id="${guest.id}">
    <div class="guest-card-top">
      <div class="guest-info">
        <div class="guest-salutation">${salData.icon} ${salLabel}</div>
        <div class="guest-fullname">${guest.name}</div>
        ${guest.note ? `<div class="guest-note">📝 ${guest.note}</div>` : ""}
      </div>
      <div class="guest-avatar">${avatar}</div>
    </div>
    <span class="guest-status ${st.cls}">${st.label}</span>
    <div class="guest-link-row">
      <span class="guest-link-text" title="${url}">${shortUrl}</span>
      <button class="copy-btn" data-action="copy" data-id="${guest.id}" title="Sao chép link">
        📋 Copy
      </button>
    </div>
    <div class="guest-actions">
      <button class="action-btn attend" data-action="attend" data-id="${guest.id}">✅ Tham dự</button>
      <button class="action-btn" data-action="decline" data-id="${guest.id}">❌ Vắng</button>
      <button class="action-btn" data-action="preview" data-id="${guest.id}">👁 Xem</button>
      <button class="action-btn delete" data-action="delete" data-id="${guest.id}">🗑</button>
    </div>
  </div>`;
}

function getInitials(name) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/* ── Actions ──────────────────────────────── */
function handleAction(action, id) {
  const guest = guests.find(g => g.id === id);
  if (!guest) return;

  switch (action) {
    case "copy": {
      const url = buildGuestUrl(guest);
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector(`[data-action="copy"][data-id="${id}"]`);
        if (btn) { btn.textContent = "✅ Đã copy!"; btn.classList.add("copied"); setTimeout(() => { btn.textContent = "📋 Copy"; btn.classList.remove("copied"); }, 2000); }
        showToast("📋 Đã sao chép link cho " + guest.name);
      });
      break;
    }
    case "attend":
      guest.status = guest.status === "attended" ? "pending" : "attended";
      save(); renderGuests(document.getElementById("search-input")?.value || ""); updateStats();
      break;
    case "decline":
      guest.status = guest.status === "declined" ? "pending" : "declined";
      save(); renderGuests(document.getElementById("search-input")?.value || ""); updateStats();
      break;
    case "preview": {
      const url = buildGuestUrl(guest);
      window.open(url, "_blank");
      break;
    }
    case "delete":
      if (confirm(`Xoá khách "${guest.name}" khỏi danh sách?`)) {
        guests = guests.filter(g => g.id !== id);
        save(); renderGuests(document.getElementById("search-input")?.value || ""); updateStats();
        showToast("🗑 Đã xoá " + guest.name);
      }
      break;
  }
}

/* ── Search ───────────────────────────────── */
function initSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;
  input.addEventListener("input", () => renderGuests(input.value));
}

/* ── Stats ────────────────────────────────── */
function updateStats() {
  const total    = guests.length;
  const attended = guests.filter(g => g.status === "attended").length;
  const pending  = guests.filter(g => g.status === "pending").length;
  const declined = guests.filter(g => g.status === "declined").length;

  setHTML("stat-total",    total);
  setHTML("stat-attended", attended);
  setHTML("stat-pending",  pending);
  setHTML("stat-declined", declined);
}

function setHTML(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Export ───────────────────────────────── */
function initExport() {
  const btn = document.getElementById("export-btn");
  if (!btn) return;
  btn.addEventListener("click", exportCSV);
}

function exportCSV() {
  if (guests.length === 0) { showToast("❗ Chưa có khách mời nào để xuất", "error"); return; }

  const headers = ["STT","Vai vế","Họ tên","Ghi chú","Trạng thái","Link thiệp","Ngày thêm"];
  const rows = guests.map((g, i) => {
    const salData = SALUTATIONS.find(s => s.slug === g.salutationSlug);
    const salLabel = g.salutationSlug === "custom" ? g.customSalute : (salData?.label || "");
    const statusMap = { pending:"Chờ xác nhận", attended:"Tham dự", declined:"Vắng mặt" };
    return [
      i + 1,
      salLabel,
      g.name,
      g.note || "",
      statusMap[g.status] || "Chờ xác nhận",
      buildGuestUrl(g),
      new Date(g.createdAt).toLocaleDateString("vi-VN"),
    ].map(v => `"${v}"`).join(",");
  });

  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `khach-moi-tot-nghiep-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("📥 Đã xuất file CSV!");
}

/* ── Copy All Links ───────────────────────── */
function copyAllLinks() {
  if (guests.length === 0) { showToast("❗ Chưa có khách mời", "error"); return; }
  const text = guests.map(g => `${g.name}: ${buildGuestUrl(g)}`).join("\n");
  navigator.clipboard.writeText(text).then(() => showToast("📋 Đã sao chép tất cả link!"));
}
window.copyAllLinks = copyAllLinks;

/* ── Save ─────────────────────────────────── */
function save() {
  localStorage.setItem("guest-list", JSON.stringify(guests));
}

/* ── Toast ────────────────────────────────── */
function showToast(msg, type = "success") {
  let toast = document.querySelector(".toast");
  if (!toast) { toast = document.createElement("div"); toast.className = "toast"; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 3000);
}
