const loginView = document.getElementById("adminLoginView");
const dashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("adminLoginForm");
const adminMessage = document.getElementById("adminMessage");
const securityNote = document.getElementById("securityNote");
const passwordToggle = document.getElementById("passwordToggle");
const passwordInput = document.getElementById("adminPassword");
const emailInput = document.getElementById("adminEmail");
const signOutButton = document.getElementById("signOutButton");

let supabaseClient = null;
let authenticatedAdmin = null;
let adminAnnouncements = [];
let selectedAnnouncementIndex = null;

function configIsReady() {
  const cfg = window.SHEKINAH_SUPABASE;
  return Boolean(
    window.supabase &&
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

async function showDashboard(user) {
  authenticatedAdmin = user;
  loginView.classList.add("hidden");
  dashboard.classList.add("visible");

  await Promise.all([
    loadServiceEditor(),
    loadAnnouncementEditor(),
    loadNewsletterEditor()
  ]);
}

function setLoginBusy(isBusy) {
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = isBusy;
  emailInput.disabled = isBusy;
  passwordInput.disabled = isBusy;
  submitButton.textContent = isBusy ? "Signing In…" : "Sign In";
}

function setButtonBusy(button, busy, busyText, normalText) {
  button.disabled = busy;
  button.textContent = busy ? busyText : normalText;
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
    adminMessage.textContent =
      "This account is not authorized for church administration.";
    return;
  }

  await showDashboard(data.user);
}

async function initializeAuth() {
  if (!configIsReady()) {
    loginForm.querySelector('button[type="submit"]').disabled = true;
    emailInput.disabled = true;
    passwordInput.disabled = true;

    adminMessage.textContent =
      "Secure login setup is not finished yet.";

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
    if (event === "SIGNED_OUT") showLogin();
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
    adminMessage.textContent = "Secure authentication is not available.";
    return;
  }

  setLoginBusy(true);
  adminMessage.textContent = "";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    passwordInput.value = "";

    if (error || !data?.user) {
      adminMessage.textContent =
        "Unable to sign in. Check the email and password.";
      return;
    }

    const { data: verified, error: verifyError } =
      await supabaseClient.auth.getUser();

    if (verifyError || !verified?.user) {
      await supabaseClient.auth.signOut();
      adminMessage.textContent = "Unable to verify this session.";
      return;
    }

    const allowed = await verifyAdmin(verified.user.id);

    if (!allowed) {
      await supabaseClient.auth.signOut();
      adminMessage.textContent =
        "This account is not authorized for church administration.";
      return;
    }

    await showDashboard(verified.user);
  } catch (error) {
    console.error(error);
    adminMessage.textContent =
      "A secure sign-in error occurred. Please try again.";
  } finally {
    setLoginBusy(false);
  }
});

signOutButton.addEventListener("click", async () => {
  if (supabaseClient) await supabaseClient.auth.signOut();
  showLogin();
  adminMessage.textContent = "Signed out securely.";
});

// ------------------------------------------------------------
// Admin section tabs
// ------------------------------------------------------------
document.querySelectorAll(".admin-content-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const section = tab.dataset.adminSection;

    document.querySelectorAll(".admin-content-tab").forEach((item) => {
      item.classList.toggle("active", item === tab);
    });

    document.querySelectorAll(".admin-content-section").forEach((panel) => {
      panel.classList.toggle(
        "active",
        panel.dataset.adminPanel === section
      );
    });
  });
});

// ------------------------------------------------------------
// SERVICE — save directly to live service_settings row
// ------------------------------------------------------------
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

function serviceFormData() {
  return {
    time: document.getElementById("serviceTimeInput").value,
    time_display:
      document.getElementById("serviceTimeDisplayInput").value.trim(),
    day_en: document.getElementById("serviceDayEn").value.trim(),
    day_es: document.getElementById("serviceDayEs").value.trim(),
    service_label_en:
      document.getElementById("serviceLabelEn").value.trim(),
    service_label_es:
      document.getElementById("serviceLabelEs").value.trim(),
    special_message_en:
      document.getElementById("serviceMessageEn").value.trim(),
    special_message_es:
      document.getElementById("serviceMessageEs").value.trim()
  };
}

function updateServicePreview() {
  const data = serviceFormData();

  document.getElementById("servicePreviewDay").textContent =
    data.day_en || "Sunday";
  document.getElementById("servicePreviewLabel").textContent =
    data.service_label_en || "Sunday Service";
  document.getElementById("servicePreviewTime").textContent =
    data.time_display || "3:00 PM";
  document.getElementById("servicePreviewMessage").textContent =
    data.special_message_en ||
    "We look forward to welcoming you.";
}

async function loadServiceEditor() {
  const { data, error } = await supabaseClient
    .from("service_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error(error);
    document.getElementById("serviceDraftStatus").textContent =
      "Could not load live service settings.";
    return;
  }

  if (!data) return;

  document.getElementById("serviceTimeInput").value =
    String(data.service_time || "15:00").slice(0, 5);
  document.getElementById("serviceTimeDisplayInput").value =
    data.time_display || "3:00 PM";
  document.getElementById("serviceDayEn").value =
    data.day_en || "Sunday";
  document.getElementById("serviceDayEs").value =
    data.day_es || "Domingo";
  document.getElementById("serviceLabelEn").value =
    data.service_label_en || "Sunday Service";
  document.getElementById("serviceLabelEs").value =
    data.service_label_es || "Servicio Dominical";
  document.getElementById("serviceMessageEn").value =
    data.special_message_en || "";
  document.getElementById("serviceMessageEs").value =
    data.special_message_es || "";

  updateServicePreview();
}

document.getElementById("saveServiceButton").addEventListener(
  "click",
  async () => {
    if (!authenticatedAdmin) return;

    const button = document.getElementById("saveServiceButton");
    const status = document.getElementById("serviceDraftStatus");
    const form = serviceFormData();

    setButtonBusy(button, true, "Saving…", "Save Service");
    status.textContent = "";

    const { error } = await supabaseClient
      .from("service_settings")
      .update({
        day_en: form.day_en,
        day_es: form.day_es,
        service_label_en: form.service_label_en,
        service_label_es: form.service_label_es,
        service_time: form.time,
        time_display: form.time_display,
        special_message_en: form.special_message_en,
        special_message_es: form.special_message_es,
        updated_at: new Date().toISOString(),
        updated_by: authenticatedAdmin.id
      })
      .eq("id", 1);

    setButtonBusy(button, false, "Saving…", "Save Service");

    if (error) {
      console.error(error);
      status.textContent = `Could not publish service changes: ${error.message}`;
      return;
    }

    status.textContent =
      "Published. The live website now uses these service settings.";
  }
);

// ------------------------------------------------------------
// ANNOUNCEMENTS — live CRUD
// ------------------------------------------------------------
async function loadAnnouncementEditor() {
  const { data, error } = await supabaseClient
    .from("announcements")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(error);
    adminAnnouncements = [];
    renderAdminAnnouncementList();
    return;
  }

  adminAnnouncements = data || [];
  renderAdminAnnouncementList();
}

function renderAdminAnnouncementList() {
  const list = document.getElementById("adminAnnouncementList");

  if (!adminAnnouncements.length) {
    list.innerHTML =
      `<div class="editor-panel"><p>No announcements yet.</p></div>`;
    return;
  }

  list.innerHTML = adminAnnouncements
    .map(
      (item, index) => `
      <button
        class="admin-announcement-item ${
          selectedAnnouncementIndex === index ? "selected" : ""
        }"
        type="button"
        data-announcement-index="${index}">
        <div class="admin-announcement-item-top">
          <span class="tag">${escapeAdminHtml(
            item.tag_en || "Update"
          )}</span>
          <span class="admin-announcement-status">${
            item.active === false ? "Hidden" : "Active"
          }</span>
        </div>
        <h3>${escapeAdminHtml(
          item.title_en || "Untitled announcement"
        )}</h3>
        <p>${escapeAdminHtml(item.description_en || "")}</p>
      </button>
    `
    )
    .join("");

  list
    .querySelectorAll("[data-announcement-index]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        selectAnnouncement(
          Number(button.dataset.announcementIndex)
        );
      });
    });
}

function selectAnnouncement(index) {
  selectedAnnouncementIndex = index;
  const item = adminAnnouncements[index];

  document.getElementById("announcementEmptyState").style.display =
    "none";
  document
    .getElementById("announcementEditorForm")
    .classList.remove("hidden");

  document.getElementById("announcementActive").value =
    item.active === false ? "false" : "true";
  document.getElementById("announcementId").value = item.id || "";
  document.getElementById("announcementTagEn").value =
    item.tag_en || "";
  document.getElementById("announcementTagEs").value =
    item.tag_es || "";
  document.getElementById("announcementTitleEn").value =
    item.title_en || "";
  document.getElementById("announcementTitleEs").value =
    item.title_es || "";
  document.getElementById("announcementDescriptionEn").value =
    item.description_en || "";
  document.getElementById("announcementDescriptionEs").value =
    item.description_es || "";

  renderAdminAnnouncementList();
}

document
  .getElementById("addAnnouncementButton")
  .addEventListener("click", () => {
    const newAnnouncement = {
      id: `announcement-${Date.now()}`,
      active: true,
      tag_en: "Update",
      tag_es: "Actualización",
      title_en: "New Announcement",
      title_es: "Nuevo Anuncio",
      description_en: "",
      description_es: "",
      sort_order:
        adminAnnouncements.length > 0
          ? Math.max(
              ...adminAnnouncements.map(
                (item) => Number(item.sort_order) || 0
              )
            ) + 10
          : 10,
      isNew: true
    };

    adminAnnouncements.push(newAnnouncement);
    selectAnnouncement(adminAnnouncements.length - 1);
  });

document
  .querySelectorAll(".announcement-lang-tab")
  .forEach((tab) => {
    tab.addEventListener("click", () => {
      const lang = tab.dataset.announcementLang;

      document
        .querySelectorAll(".announcement-lang-tab")
        .forEach((item) => {
          item.classList.toggle("active", item === tab);
        });

      document
        .querySelectorAll(".announcement-lang-panel")
        .forEach((panel) => {
          panel.classList.toggle(
            "active",
            panel.dataset.announcementPanel === lang
          );
        });
    });
  });

document
  .getElementById("saveAnnouncementButton")
  .addEventListener("click", async () => {
    if (
      !authenticatedAdmin ||
      selectedAnnouncementIndex === null
    )
      return;

    const button =
      document.getElementById("saveAnnouncementButton");
    const status =
      document.getElementById("announcementDraftStatus");
    const existing =
      adminAnnouncements[selectedAnnouncementIndex];

    const payload = {
      id:
        document.getElementById("announcementId").value ||
        `announcement-${Date.now()}`,
      active:
        document.getElementById("announcementActive").value ===
        "true",
      tag_en:
        document.getElementById("announcementTagEn").value.trim(),
      tag_es:
        document.getElementById("announcementTagEs").value.trim(),
      title_en:
        document.getElementById("announcementTitleEn").value.trim(),
      title_es:
        document.getElementById("announcementTitleEs").value.trim(),
      description_en:
        document
          .getElementById("announcementDescriptionEn")
          .value.trim(),
      description_es:
        document
          .getElementById("announcementDescriptionEs")
          .value.trim(),
      sort_order: Number(existing.sort_order) || 10,
      updated_at: new Date().toISOString(),
      updated_by: authenticatedAdmin.id
    };

    if (existing.isNew) {
      payload.created_by = authenticatedAdmin.id;
    }

    setButtonBusy(
      button,
      true,
      "Saving…",
      "Save Announcement"
    );
    status.textContent = "";

    const { data, error } = await supabaseClient
      .from("announcements")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    setButtonBusy(
      button,
      false,
      "Saving…",
      "Save Announcement"
    );

    if (error) {
      console.error(error);
      status.textContent =
        `Could not publish announcement: ${error.message}`;
      return;
    }

    adminAnnouncements[selectedAnnouncementIndex] = data;
    renderAdminAnnouncementList();
    status.textContent =
      data.active
        ? "Published. This announcement is live."
        : "Saved. This announcement is hidden from the public site.";
  });

document
  .getElementById("deleteAnnouncementButton")
  .addEventListener("click", async () => {
    if (
      !authenticatedAdmin ||
      selectedAnnouncementIndex === null
    )
      return;

    const status =
      document.getElementById("announcementDraftStatus");
    const item =
      adminAnnouncements[selectedAnnouncementIndex];

    // Unsaved new item can simply be removed locally.
    if (item.isNew) {
      adminAnnouncements.splice(selectedAnnouncementIndex, 1);
      selectedAnnouncementIndex = null;
      resetAnnouncementEditor();
      renderAdminAnnouncementList();
      return;
    }

    const confirmed = window.confirm(
      `Delete "${item.title_en}" from the live website?`
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
      .from("announcements")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.error(error);
      status.textContent =
        `Could not delete announcement: ${error.message}`;
      return;
    }

    adminAnnouncements.splice(selectedAnnouncementIndex, 1);
    selectedAnnouncementIndex = null;
    resetAnnouncementEditor();
    renderAdminAnnouncementList();
  });

function resetAnnouncementEditor() {
  document
    .getElementById("announcementEditorForm")
    .classList.add("hidden");
  document.getElementById("announcementEmptyState").style.display =
    "grid";
}

// ------------------------------------------------------------
// NEWSLETTER — DB drafts + explicit publishing
// ------------------------------------------------------------
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

document
  .querySelectorAll("[data-editor-lang]")
  .forEach((tab) => {
    tab.addEventListener("click", () => {
      const lang = tab.dataset.editorLang;

      document
        .querySelectorAll("[data-editor-lang]")
        .forEach((item) => {
          item.classList.toggle("active", item === tab);
        });

      document
        .querySelectorAll(".editor-language-panel")
        .forEach((panel) => {
          panel.classList.toggle(
            "active",
            panel.dataset.editorPanel === lang
          );
        });

      updateNewsletterPreview();
    });
  });

newsletterFieldIds.forEach((id) => {
  document
    .getElementById(id)
    .addEventListener("input", updateNewsletterPreview);
  document
    .getElementById(id)
    .addEventListener("change", updateNewsletterPreview);
});

function activeEditorLanguage() {
  return (
    document.querySelector("[data-editor-lang].active")
      ?.dataset.editorLang || "en"
  );
}

function newsletterFormData() {
  return {
    id: document.getElementById("issueDate").value,
    issue_date: document.getElementById("issueDate").value,
    status: document.getElementById("issueStatus").value,
    title_en: document.getElementById("titleEn").value.trim(),
    title_es: document.getElementById("titleEs").value.trim(),
    gathering_en:
      document.getElementById("gatheringEn").value.trim(),
    gathering_es:
      document.getElementById("gatheringEs").value.trim(),
    scripture_en:
      document.getElementById("scriptureEn").value.trim(),
    scripture_es:
      document.getElementById("scriptureEs").value.trim(),
    community_en:
      document.getElementById("communityEn").value.trim(),
    community_es:
      document.getElementById("communityEs").value.trim()
  };
}

function updateNewsletterPreview() {
  const lang = activeEditorLanguage();
  const isSpanish = lang === "es";
  const data = newsletterFormData();

  document.getElementById("previewTitle").textContent =
    (isSpanish ? data.title_es : data.title_en) ||
    (isSpanish
      ? "Boletín de Ministerio Shekinah"
      : "Ministerio Shekinah Newsletter");

  document.getElementById("previewGatheringHeading").textContent =
    isSpanish ? "Reunión del Domingo" : "Sunday Gathering";
  document.getElementById("previewScriptureHeading").textContent =
    isSpanish
      ? "Escritura de la Semana"
      : "Weekly Scripture";
  document.getElementById("previewCommunityHeading").textContent =
    isSpanish
      ? "Actualización de la Comunidad"
      : "Community Update";

  document.getElementById("previewGathering").textContent =
    (isSpanish ? data.gathering_es : data.gathering_en) ||
    (isSpanish
      ? "El contenido aparecerá aquí."
      : "Your content will appear here.");

  document.getElementById("previewScripture").textContent =
    (isSpanish ? data.scripture_es : data.scripture_en) ||
    (isSpanish
      ? "La escritura aparecerá aquí."
      : "Your scripture will appear here.");

  document.getElementById("previewCommunity").textContent =
    (isSpanish ? data.community_es : data.community_en) ||
    (isSpanish
      ? "La actualización aparecerá aquí."
      : "Your community update will appear here.");

  document.getElementById("previewDate").textContent =
    data.issue_date
      ? formatDate(data.issue_date, lang)
      : isSpanish
      ? "Boletín en borrador"
      : "Draft issue";
}

function formatDate(dateString, language) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(
    language === "es" ? "es-US" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  ).format(date);
}

function setDefaultNewsletterForm() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  document.getElementById("issueDate").value =
    `${yyyy}-${mm}-${dd}`;
  document.getElementById("issueStatus").value = "draft";
}

async function loadNewsletterEditor() {
  // Load the newest unpublished issue. Published newsletters
  // stay untouched unless deliberately republished.
  const { data, error } = await supabaseClient
    .from("newsletters")
    .select("*")
    .in("status", ["draft", "ready"])
    .order("issue_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    setDefaultNewsletterForm();
    updateNewsletterPreview();
    return;
  }

  if (!data) {
    setDefaultNewsletterForm();
    updateNewsletterPreview();
    return;
  }

  document.getElementById("issueDate").value = data.issue_date;
  document.getElementById("issueStatus").value = data.status;
  document.getElementById("titleEn").value = data.title_en || "";
  document.getElementById("titleEs").value = data.title_es || "";
  document.getElementById("gatheringEn").value =
    data.gathering_en || "";
  document.getElementById("gatheringEs").value =
    data.gathering_es || "";
  document.getElementById("scriptureEn").value =
    data.scripture_en || "";
  document.getElementById("scriptureEs").value =
    data.scripture_es || "";
  document.getElementById("communityEn").value =
    data.community_en || "";
  document.getElementById("communityEs").value =
    data.community_es || "";

  document.getElementById("draftStatus").textContent =
    "Private Supabase draft loaded.";
  updateNewsletterPreview();
}

async function saveNewsletter(statusOverride = null) {
  if (!authenticatedAdmin) return null;

  const data = newsletterFormData();
  const status = statusOverride || data.status;

  if (!data.issue_date) {
    document.getElementById("draftStatus").textContent =
      "Choose an issue date first.";
    return null;
  }

  const payload = {
    ...data,
    status,
    updated_at: new Date().toISOString(),
    updated_by: authenticatedAdmin.id
  };

  if (status === "published") {
    payload.published_at = new Date().toISOString();
  } else {
    payload.published_at = null;
  }

  // created_by is harmless on a new row; on an existing row,
  // upsert would overwrite it, so first check whether the row exists.
  const { data: existing } = await supabaseClient
    .from("newsletters")
    .select("id, created_by")
    .eq("id", data.id)
    .maybeSingle();

  payload.created_by =
    existing?.created_by || authenticatedAdmin.id;

  const { data: saved, error } = await supabaseClient
    .from("newsletters")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error(error);
    document.getElementById("draftStatus").textContent =
      `Could not save newsletter: ${error.message}`;
    return null;
  }

  return saved;
}

document
  .getElementById("saveDraftButton")
  .addEventListener("click", async () => {
    const button =
      document.getElementById("saveDraftButton");

    setButtonBusy(
      button,
      true,
      "Saving…",
      "Save Newsletter Draft"
    );

    const saved = await saveNewsletter();

    setButtonBusy(
      button,
      false,
      "Saving…",
      "Save Newsletter Draft"
    );

    if (saved) {
      document.getElementById("draftStatus").textContent =
        saved.status === "ready"
          ? "Saved in Supabase as Ready to publish. It is still private."
          : "Draft saved privately in Supabase.";
    }
  });

document
  .getElementById("publishButton")
  .addEventListener("click", async () => {
    const button =
      document.getElementById("publishButton");

    const confirmed = window.confirm(
      "Publish this newsletter to the live Ministerio Shekinah website?"
    );

    if (!confirmed) return;

    setButtonBusy(
      button,
      true,
      "Publishing…",
      "Publish Newsletter"
    );

    const saved = await saveNewsletter("published");

    setButtonBusy(
      button,
      false,
      "Publishing…",
      "Publish Newsletter"
    );

    if (saved) {
      document.getElementById("draftStatus").textContent =
        "Published. This newsletter is now live on the website.";
      document.getElementById("issueStatus").value = "ready";
    }
  });

document
  .getElementById("clearDraftButton")
  .addEventListener("click", async () => {
    const data = newsletterFormData();

    if (!data.id) return;

    const confirmed = window.confirm(
      "Delete this private draft? Published newsletters are not affected."
    );

    if (!confirmed) return;

    const { error } = await supabaseClient
      .from("newsletters")
      .delete()
      .eq("id", data.id)
      .in("status", ["draft", "ready"]);

    if (error) {
      document.getElementById("draftStatus").textContent =
        `Could not delete draft: ${error.message}`;
      return;
    }

    setDefaultNewsletterForm();
    document.getElementById("scriptureEn").value = "";
    document.getElementById("scriptureEs").value = "";
    document.getElementById("communityEn").value = "";
    document.getElementById("communityEs").value = "";
    document.getElementById("draftStatus").textContent =
      "Private draft deleted.";
    updateNewsletterPreview();
  });

function escapeAdminHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

updateServicePreview();
updateNewsletterPreview();
initializeAuth();
