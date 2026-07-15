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
    pending:  { cls: "st-pending",  label: "⏳ Chờ xác nhận" },
    attended: { cls: "st-attended", label: "✅ Tham dự" },
    declined: { cls: "st-declined", label: "❌ Vắng mặt" },
  };
  const st = statusMap[guest.status] || statusMap.pending;

  return `
  <div class="g-card ${guest.status !== "pending" ? guest.status : ""}" data-id="${guest.id}">
    <div class="g-top">
      <div class="g-info">
        <div class="g-sal">${salData.icon} ${salLabel}</div>
        <div class="g-name">${guest.name}</div>
        ${guest.note ? `<div class="g-note">📝 ${guest.note}</div>` : ""}
      </div>
      <div class="g-avatar">${avatar}</div>
    </div>
    <span class="g-status ${st.cls}">${st.label}</span>
    <div class="g-link">
      <span class="g-link-url" title="${url}">${shortUrl}</span>
      <button class="btn-copy" data-action="copy" data-id="${guest.id}" title="Sao chép link">
        <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copy
      </button>
    </div>
    <div class="g-actions">
      <button class="g-act att" data-action="attend" data-id="${guest.id}"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg> Tham dự</button>
      <button class="g-act del" data-action="decline" data-id="${guest.id}"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Vắng</button>
      <button class="g-act" data-action="preview" data-id="${guest.id}"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Xem</button>
      <button class="g-act del" data-action="delete" data-id="${guest.id}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
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

/* ── Export & Import ──────────────────────── */
function initExport() {
  const btn = document.getElementById("export-btn");
  if (btn) btn.addEventListener("click", exportCSV);

  const importBtn = document.getElementById("import-btn");
  const importInput = document.getElementById("excel-import-input");
  
  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => importInput.click());
    
    importInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        let count = 0;
        
        let startIndex = 0;
        if (rows.length > 0 && typeof rows[0][0] === 'string' && (rows[0][0].toLowerCase().includes("vai") || rows[0][0].toLowerCase().includes("họ"))) {
          startIndex = 1; // Skip header
        }

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;
          
          let salutationText = (row[0] || "").toString().trim();
          let guestName = (row[1] || "").toString().trim();
          
          if (!salutationText || !guestName) continue;
          
          let salutationSlug = "custom";
          let customSalute = salutationText;
          
          const matched = SALUTATIONS.find(s => s.label.toLowerCase() === salutationText.toLowerCase());
          if (matched && matched.slug !== "custom") {
            salutationSlug = matched.slug;
            customSalute = "";
          }
          
          guests.unshift({
            id: Date.now() + i,
            salutationSlug,
            customSalute,
            name: guestName,
            note: "Nhập từ Excel",
            status: "pending",
            createdAt: new Date().toISOString(),
          });
          count++;
        }
        
        if (count > 0) {
          save();
          renderGuests();
          updateStats();
          showToast(`✅ Đã nhập thành công ${count} khách!`);
        } else {
          showToast("❗ Không tìm thấy dữ liệu hợp lệ trong file.", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("❗ Lỗi khi đọc file Excel!", "error");
      }
      
      importInput.value = "";
    });
  }
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
