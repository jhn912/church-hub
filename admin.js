const loginView = document.getElementById("adminLoginView");
const dashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("adminLoginForm");
const adminMessage = document.getElementById("adminMessage");
const securityNote = document.getElementById("securityNote");
const passwordToggle = document.getElementById("passwordToggle");
const passwordInput = document.getElementById("adminPassword");
const emailInput = document.getElementById("adminEmail");
const signOutButton = document.getElementById("signOutButton");
const DRAFT_KEY = "ministerioShekinahNewsletterDraft";

let supabaseClient = null;
let authenticatedAdmin = null;

function configIsReady() {
  const cfg = window.SHEKINAH_SUPABASE;
  return Boolean(
    cfg &&
    cfg.url &&
    cfg.publishableKey &&
    !cfg.url.includes("PASTE_") &&
    !cfg.publishableKey.includes("PASTE_")
  );
}

function showLogin() {
  authenticatedAdmin = null;
  loginView.classList.remove("hidden");
  dashboard.classList.remove("visible");
}

function showDashboard(user) {
  authenticatedAdmin = user;
  loginView.classList.add("hidden");
  dashboard.classList.add("visible");
  loadDraft();
  updatePreview();
}

function setLoginBusy(isBusy) {
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = isBusy;
  emailInput.disabled = isBusy;
  passwordInput.disabled = isBusy;
  submitButton.textContent = isBusy ? "Signing In…" : "Sign In";
}

async function verifyAdmin(userId) {
  const { data, error } = await supabaseClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Admin verification failed:", error);
    return false;
  }

  return Boolean(data?.user_id);
}

async function restoreAuthenticatedAdmin() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data?.user) {
    showLogin();
    return;
  }

  const allowed = await verifyAdmin(data.user.id);

  if (!allowed) {
    await supabaseClient.auth.signOut();
    showLogin();
    adminMessage.textContent = "This account is not authorized for church administration.";
    return;
  }

  showDashboard(data.user);
}

async function initializeAuth() {
  if (!configIsReady()) {
    loginForm.querySelector('button[type="submit"]').disabled = true;
    emailInput.disabled = true;
    passwordInput.disabled = true;

    adminMessage.textContent =
      "Secure login setup is not finished yet. Add the Supabase Project URL and publishable key to supabase-config.js.";

    securityNote.innerHTML = `
      <span>🔧</span>
      <span>
        This admin page is locked until Supabase is configured. No preview bypass is available.
      </span>
    `;
    return;
  }

  supabaseClient = window.supabase.createClient(
    window.SHEKINAH_SUPABASE.url,
    window.SHEKINAH_SUPABASE.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  await restoreAuthenticatedAdmin();

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      showLogin();
    }
  });
}

passwordToggle.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  passwordToggle.textContent = showing ? "Show" : "Hide";
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    adminMessage.textContent = "Secure authentication has not been configured yet.";
    return;
  }

  setLoginBusy(true);
  adminMessage.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    passwordInput.value = "";

    if (error || !data?.user) {
      adminMessage.textContent = "Unable to sign in. Check the email and password.";
      return;
    }

    // getUser() performs a network validation against Supabase Auth.
    const { data: verified, error: verifyError } = await supabaseClient.auth.getUser();

    if (verifyError || !verified?.user) {
      await supabaseClient.auth.signOut();
      adminMessage.textContent = "Unable to verify this session.";
      return;
    }

    const allowed = await verifyAdmin(verified.user.id);

    if (!allowed) {
      await supabaseClient.auth.signOut();
      adminMessage.textContent = "This account is not authorized for church administration.";
      return;
    }

    showDashboard(verified.user);
  } catch (error) {
    console.error(error);
    adminMessage.textContent = "A secure sign-in error occurred. Please try again.";
  } finally {
    setLoginBusy(false);
  }
});

signOutButton.addEventListener("click", async () => {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  showLogin();
  adminMessage.textContent = "Signed out securely.";
});

// ------------------------------------
// Admin content navigation
// ------------------------------------
document.querySelectorAll(".admin-content-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const section = tab.dataset.adminSection;

    document.querySelectorAll(".admin-content-tab").forEach((item) => {
      item.classList.toggle("active", item === tab);
    });

    document.querySelectorAll(".admin-content-section").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.adminPanel === section);
    });
  });
});

// ------------------------------------
// Service settings editor
// ------------------------------------
const SERVICE_DRAFT_KEY = "ministerioShekinahServiceDraft";
const serviceFieldIds = [
  "serviceTimeInput",
  "serviceTimeDisplayInput",
  "serviceDayEn",
  "serviceDayEs",
  "serviceLabelEn",
  "serviceLabelEs",
  "serviceMessageEn",
  "serviceMessageEs"
];

serviceFieldIds.forEach((id) => {
  const element = document.getElementById(id);
  element.addEventListener("input", updateServicePreview);
  element.addEventListener("change", updateServicePreview);
});

function serviceDraftData() {
  return {
    time: document.getElementById("serviceTimeInput").value,
    time_display: document.getElementById("serviceTimeDisplayInput").value,
    day_en: document.getElementById("serviceDayEn").value,
    day_es: document.getElementById("serviceDayEs").value,
    service_label_en: document.getElementById("serviceLabelEn").value,
    service_label_es: document.getElementById("serviceLabelEs").value,
    special_message_en: document.getElementById("serviceMessageEn").value,
    special_message_es: document.getElementById("serviceMessageEs").value
  };
}

function updateServicePreview() {
  const data = serviceDraftData();
  document.getElementById("servicePreviewDay").textContent = data.day_en || "Sunday";
  document.getElementById("servicePreviewLabel").textContent =
    data.service_label_en || "Sunday Service";
  document.getElementById("servicePreviewTime").textContent =
    data.time_display || "3:00 PM";
  document.getElementById("servicePreviewMessage").textContent =
    data.special_message_en || "We look forward to welcoming you.";
}

async function loadServiceEditor() {
  const saved = localStorage.getItem(SERVICE_DRAFT_KEY);

  if (saved) {
    try {
      applyServiceEditorData(JSON.parse(saved));
      document.getElementById("serviceDraftStatus").textContent =
        "Saved service draft restored from this device.";
      return;
    } catch {
      localStorage.removeItem(SERVICE_DRAFT_KEY);
    }
  }

  try {
    const response = await fetch("service.json", { cache: "no-store" });
    const data = await response.json();
    applyServiceEditorData(data);
  } catch (error) {
    console.error("Unable to load service settings:", error);
  }
}

function applyServiceEditorData(data) {
  document.getElementById("serviceTimeInput").value = data.time || "15:00";
  document.getElementById("serviceTimeDisplayInput").value = data.time_display || "3:00 PM";
  document.getElementById("serviceDayEn").value = data.day_en || "Sunday";
  document.getElementById("serviceDayEs").value = data.day_es || "Domingo";
  document.getElementById("serviceLabelEn").value = data.service_label_en || "Sunday Service";
  document.getElementById("serviceLabelEs").value = data.service_label_es || "Servicio Dominical";
  document.getElementById("serviceMessageEn").value = data.special_message_en || "";
  document.getElementById("serviceMessageEs").value = data.special_message_es || "";
  updateServicePreview();
}

document.getElementById("saveServiceButton").addEventListener("click", () => {
  if (!authenticatedAdmin) return;
  localStorage.setItem(SERVICE_DRAFT_KEY, JSON.stringify(serviceDraftData()));
  document.getElementById("serviceDraftStatus").textContent =
    "Service draft saved on this device. Live publishing will be connected to Supabase.";
});

// ------------------------------------
// Announcement editor
// ------------------------------------
const ANNOUNCEMENT_DRAFT_KEY = "ministerioShekinahAnnouncementsDraft";
let adminAnnouncements = [];
let selectedAnnouncementIndex = null;

async function loadAnnouncementEditor() {
  const saved = localStorage.getItem(ANNOUNCEMENT_DRAFT_KEY);

  if (saved) {
    try {
      adminAnnouncements = JSON.parse(saved);
      renderAdminAnnouncementList();
      return;
    } catch {
      localStorage.removeItem(ANNOUNCEMENT_DRAFT_KEY);
    }
  }

  try {
    const response = await fetch("announcements.json", { cache: "no-store" });
    adminAnnouncements = await response.json();
    renderAdminAnnouncementList();
  } catch (error) {
    console.error("Unable to load announcements:", error);
    adminAnnouncements = [];
    renderAdminAnnouncementList();
  }
}

function renderAdminAnnouncementList() {
  const list = document.getElementById("adminAnnouncementList");

  if (!adminAnnouncements.length) {
    list.innerHTML = `<div class="editor-panel"><p>No announcements yet.</p></div>`;
    return;
  }

  list.innerHTML = adminAnnouncements.map((item, index) => `
    <button class="admin-announcement-item ${selectedAnnouncementIndex === index ? "selected" : ""}"
            type="button"
            data-announcement-index="${index}">
      <div class="admin-announcement-item-top">
        <span class="tag">${escapeAdminHtml(item.tag_en || "Update")}</span>
        <span class="admin-announcement-status">${item.active === false ? "Hidden" : "Active"}</span>
      </div>
      <h3>${escapeAdminHtml(item.title_en || "Untitled announcement")}</h3>
      <p>${escapeAdminHtml(item.description_en || "")}</p>
    </button>
  `).join("");

  list.querySelectorAll("[data-announcement-index]").forEach((button) => {
    button.addEventListener("click", () => {
      selectAnnouncement(Number(button.dataset.announcementIndex));
    });
  });
}

function selectAnnouncement(index) {
  selectedAnnouncementIndex = index;
  const item = adminAnnouncements[index];

  document.getElementById("announcementEmptyState").style.display = "none";
  document.getElementById("announcementEditorForm").classList.remove("hidden");

  document.getElementById("announcementActive").value =
    item.active === false ? "false" : "true";
  document.getElementById("announcementId").value = item.id || "";
  document.getElementById("announcementTagEn").value = item.tag_en || "";
  document.getElementById("announcementTagEs").value = item.tag_es || "";
  document.getElementById("announcementTitleEn").value = item.title_en || "";
  document.getElementById("announcementTitleEs").value = item.title_es || "";
  document.getElementById("announcementDescriptionEn").value = item.description_en || "";
  document.getElementById("announcementDescriptionEs").value = item.description_es || "";

  renderAdminAnnouncementList();
}

document.getElementById("addAnnouncementButton").addEventListener("click", () => {
  const newAnnouncement = {
    id: `announcement-${Date.now()}`,
    active: true,
    tag_en: "Update",
    tag_es: "Actualización",
    title_en: "New Announcement",
    title_es: "Nuevo Anuncio",
    description_en: "",
    description_es: ""
  };

  adminAnnouncements.unshift(newAnnouncement);
  selectAnnouncement(0);
});

document.querySelectorAll(".announcement-lang-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const lang = tab.dataset.announcementLang;

    document.querySelectorAll(".announcement-lang-tab").forEach((item) => {
      item.classList.toggle("active", item === tab);
    });

    document.querySelectorAll(".announcement-lang-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.announcementPanel === lang);
    });
  });
});

document.getElementById("saveAnnouncementButton").addEventListener("click", () => {
  if (!authenticatedAdmin || selectedAnnouncementIndex === null) return;

  adminAnnouncements[selectedAnnouncementIndex] = {
    id: document.getElementById("announcementId").value.trim() || `announcement-${Date.now()}`,
    active: document.getElementById("announcementActive").value === "true",
    tag_en: document.getElementById("announcementTagEn").value,
    tag_es: document.getElementById("announcementTagEs").value,
    title_en: document.getElementById("announcementTitleEn").value,
    title_es: document.getElementById("announcementTitleEs").value,
    description_en: document.getElementById("announcementDescriptionEn").value,
    description_es: document.getElementById("announcementDescriptionEs").value
  };

  localStorage.setItem(ANNOUNCEMENT_DRAFT_KEY, JSON.stringify(adminAnnouncements));
  renderAdminAnnouncementList();
  document.getElementById("announcementDraftStatus").textContent =
    "Announcement draft saved on this device. Live publishing will be connected to Supabase.";
});

document.getElementById("deleteAnnouncementButton").addEventListener("click", () => {
  if (!authenticatedAdmin || selectedAnnouncementIndex === null) return;

  adminAnnouncements.splice(selectedAnnouncementIndex, 1);
  selectedAnnouncementIndex = null;
  localStorage.setItem(ANNOUNCEMENT_DRAFT_KEY, JSON.stringify(adminAnnouncements));

  document.getElementById("announcementEditorForm").classList.add("hidden");
  document.getElementById("announcementEmptyState").style.display = "grid";
  renderAdminAnnouncementList();
});

// ------------------------------------
// Newsletter editor
// ------------------------------------
const NEWSLETTER_DRAFT_KEY = "ministerioShekinahNewsletterDraft";

document.querySelectorAll("[data-editor-lang]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const lang = tab.dataset.editorLang;

    document.querySelectorAll("[data-editor-lang]").forEach((item) => {
      item.classList.toggle("active", item === tab);
    });

    document.querySelectorAll(".editor-language-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.editorPanel === lang);
    });

    updateNewsletterPreview();
  });
});

const newsletterFieldIds = [
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

newsletterFieldIds.forEach((id) => {
  document.getElementById(id).addEventListener("input", updateNewsletterPreview);
  document.getElementById(id).addEventListener("change", updateNewsletterPreview);
});

function activeEditorLanguage() {
  return document.querySelector("[data-editor-lang].active")?.dataset.editorLang || "en";
}

function newsletterDraftData() {
  return Object.fromEntries(
    newsletterFieldIds.map((id) => [id, document.getElementById(id).value])
  );
}

function updateNewsletterPreview() {
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

function saveNewsletterDraft() {
  if (!authenticatedAdmin) return;
  localStorage.setItem(NEWSLETTER_DRAFT_KEY, JSON.stringify(newsletterDraftData()));
  document.getElementById("draftStatus").textContent =
    "Newsletter draft saved on this device.";
}

function loadNewsletterDraft() {
  const saved = localStorage.getItem(NEWSLETTER_DRAFT_KEY);
  if (!saved) return;

  try {
    const values = JSON.parse(saved);
    newsletterFieldIds.forEach((id) => {
      if (values[id] !== undefined) {
        document.getElementById(id).value = values[id];
      }
    });
    document.getElementById("draftStatus").textContent =
      "Saved newsletter draft restored from this device.";
  } catch {
    localStorage.removeItem(NEWSLETTER_DRAFT_KEY);
  }
}

document.getElementById("saveDraftButton").addEventListener("click", saveNewsletterDraft);

document.getElementById("clearDraftButton").addEventListener("click", () => {
  localStorage.removeItem(NEWSLETTER_DRAFT_KEY);
  document.getElementById("draftStatus").textContent =
    "Saved newsletter draft cleared. The form itself was left unchanged.";
});

document.getElementById("publishButton").addEventListener("click", () => {
  if (!authenticatedAdmin) return;
  saveNewsletterDraft();
  document.getElementById("draftStatus").textContent =
    "Draft saved. Live newsletter publishing will be connected to Supabase.";
});

function escapeAdminHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Set today's newsletter date
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");

if (!document.getElementById("issueDate").value) {
  document.getElementById("issueDate").value = `${yyyy}-${mm}-${dd}`;
}

updateServicePreview();
updateNewsletterPreview();

// Extend showDashboard so all content loads after secure auth
const originalShowDashboard = showDashboard;
showDashboard = function(user) {
  originalShowDashboard(user);
  loadServiceEditor();
  loadAnnouncementEditor();
  loadNewsletterDraft();
  updateNewsletterPreview();
};

initializeAuth();
