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

// Newsletter editor
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
  if (!authenticatedAdmin) return;

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
  if (!authenticatedAdmin) return;
  saveDraft();
  document.getElementById("draftStatus").textContent =
    "Draft saved. Secure live publishing is the next backend step.";
});

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");

if (!document.getElementById("issueDate").value) {
  document.getElementById("issueDate").value = `${yyyy}-${mm}-${dd}`;
}

updatePreview();
initializeAuth();
