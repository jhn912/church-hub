const loginView = document.getElementById("adminLoginView");
const dashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("adminLoginForm");
const adminMessage = document.getElementById("adminMessage");
const previewDashboardButton = document.getElementById("previewDashboardButton");
const passwordToggle = document.getElementById("passwordToggle");
const passwordInput = document.getElementById("adminPassword");

const DRAFT_KEY = "ministerioShekinahNewsletterDraft";

passwordToggle.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  passwordToggle.textContent = showing ? "Show" : "Hide";
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // SECURITY NOTE:
  // We deliberately do NOT authenticate in frontend JavaScript.
  // A real auth provider/backend will be connected later.
  adminMessage.textContent =
    "Secure sign-in is not connected yet. Use “Preview the admin dashboard” while we build the interface.";

  document.getElementById("adminPassword").value = "";
});

previewDashboardButton.addEventListener("click", () => {
  loginView.classList.add("hidden");
  dashboard.classList.add("visible");
  loadDraft();
  updatePreview();
});

document.querySelectorAll(".editor-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const lang = tab.dataset.editorLang;

    document.querySelectorAll(".editor-tab").forEach((item) => {
      item.classList.toggle("active", item === tab);
    });

    document.querySelectorAll(".editor-language-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.editorPanel === lang);
    });

    updatePreview();
  });
});

const fieldIds = [
  "issueDate",
  "issueStatus",
  "titleEn",
  "gatheringEn",
  "scriptureEn",
  "communityEn",
  "titleEs",
  "gatheringEs",
  "scriptureEs",
  "communityEs"
];

fieldIds.forEach((id) => {
  document.getElementById(id).addEventListener("input", updatePreview);
  document.getElementById(id).addEventListener("change", updatePreview);
});

function activeEditorLanguage() {
  return document.querySelector(".editor-tab.active")?.dataset.editorLang || "en";
}

function draftData() {
  return Object.fromEntries(
    fieldIds.map((id) => [id, document.getElementById(id).value])
  );
}

function updatePreview() {
  const lang = activeEditorLanguage();
  const isSpanish = lang === "es";

  document.getElementById("previewTitle").textContent =
    document.getElementById(isSpanish ? "titleEs" : "titleEn").value ||
    (isSpanish ? "Boletín de Ministerio Shekinah" : "Ministerio Shekinah Newsletter");

  document.getElementById("previewGatheringHeading").textContent =
    isSpanish ? "Reunión del Domingo" : "Sunday Gathering";
  document.getElementById("previewScriptureHeading").textContent =
    isSpanish ? "Escritura de la Semana" : "Weekly Scripture";
  document.getElementById("previewCommunityHeading").textContent =
    isSpanish ? "Actualización de la Comunidad" : "Community Update";

  document.getElementById("previewGathering").textContent =
    document.getElementById(isSpanish ? "gatheringEs" : "gatheringEn").value ||
    (isSpanish ? "El contenido aparecerá aquí." : "Your content will appear here.");

  document.getElementById("previewScripture").textContent =
    document.getElementById(isSpanish ? "scriptureEs" : "scriptureEn").value ||
    (isSpanish ? "La escritura aparecerá aquí." : "Your scripture will appear here.");

  document.getElementById("previewCommunity").textContent =
    document.getElementById(isSpanish ? "communityEs" : "communityEn").value ||
    (isSpanish ? "La actualización aparecerá aquí." : "Your community update will appear here.");

  const dateValue = document.getElementById("issueDate").value;
  document.getElementById("previewDate").textContent =
    dateValue ? formatDate(dateValue, lang) : (isSpanish ? "Boletín en borrador" : "Draft issue");
}

function formatDate(dateString, language) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

document.getElementById("saveDraftButton").addEventListener("click", saveDraft);
document.getElementById("clearDraftButton").addEventListener("click", clearDraft);

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData()));
  document.getElementById("draftStatus").textContent =
    "Draft saved on this device.";
}

function loadDraft() {
  const saved = localStorage.getItem(DRAFT_KEY);
  if (!saved) return;

  try {
    const values = JSON.parse(saved);
    fieldIds.forEach((id) => {
      if (values[id] !== undefined) {
        document.getElementById(id).value = values[id];
      }
    });

    document.getElementById("draftStatus").textContent =
      "Saved draft restored from this device.";
  } catch {
    localStorage.removeItem(DRAFT_KEY);
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  document.getElementById("draftStatus").textContent =
    "Saved draft cleared. The form itself was left unchanged.";
}

document.getElementById("publishButton").addEventListener("click", () => {
  saveDraft();
  document.getElementById("draftStatus").textContent =
    "Draft saved. Live publishing will be enabled after we connect secure authentication and a backend.";
});

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");

if (!document.getElementById("issueDate").value) {
  document.getElementById("issueDate").value = `${yyyy}-${mm}-${dd}`;
}

updatePreview();
