window.SHEKINAH_PUBLIC_READY = true;

const translations = {
  en: {
    nav_home: "Home",
    nav_services: "Services",
    nav_newsletter: "Newsletter",
    nav_announcements: "Announcements",
    nav_visit: "Visit",
    hero_title: "A place to worship, grow, and belong.",
    hero_copy: "Stay connected with Ministerio Shekinah through service information, church announcements, and our community newsletter.",
    plan_visit: "Plan a Visit",
    read_newsletter: "Read Newsletter",
    sunday_service: "Sunday Service",
    join_us: "Join Us",
    everyone_welcome: "Everyone is welcome",
    worship_with_us: "Worship with us",
    service_time: "Service Time",
    stay_connected: "Stay connected",
    church_newsletter: "Church Newsletter",
    newsletter_preview_copy: "Read the latest church update and browse previous newsletter issues.",
    latest_issue: "Latest Issue",
    this_week_at: "This Week at Ministerio Shekinah",
    newsletter_preview_details: "Sunday service, scripture, announcements, and community updates in one place.",
    open_newsletter: "Open Newsletter →",
    church_updates: "Church updates",
    announcements: "Announcements",
    loading_announcements: "Loading announcements…",
    no_announcements: "No announcements right now.",
    come_worship: "Come worship with us",
    visit_ministerio: "Visit Ministerio Shekinah",
    sunday: "Sunday",
    service_begins: "Service begins at",
    welcome_message: "We look forward to welcoming you.",
    service_error: "Service information is temporarily unavailable.",
    newsletter_page_intro: "Read the latest issue and browse previous updates from Ministerio Shekinah.",
    previous_issues: "Previous Issues",
    loading_newsletter: "Loading newsletter…",
    loading_archive: "Loading archive…",
    newsletter_error: "We could not load the newsletter right now.",
    announcement_error: "We could not load announcements right now."
  },
  es: {
    nav_home: "Inicio",
    nav_services: "Servicios",
    nav_newsletter: "Boletín",
    nav_announcements: "Anuncios",
    nav_visit: "Visítanos",
    hero_title: "Un lugar para adorar, crecer y pertenecer.",
    hero_copy: "Mantente conectado con Ministerio Shekinah por medio de la información de servicios, anuncios de la iglesia y nuestro boletín comunitario.",
    plan_visit: "Planifica tu Visita",
    read_newsletter: "Leer el Boletín",
    sunday_service: "Servicio Dominical",
    join_us: "Acompáñanos",
    everyone_welcome: "Todos son bienvenidos",
    worship_with_us: "Adora con nosotros",
    service_time: "Horario del Servicio",
    stay_connected: "Mantente conectado",
    church_newsletter: "Boletín de la Iglesia",
    newsletter_preview_copy: "Lee la actualización más reciente de la iglesia y consulta boletines anteriores.",
    latest_issue: "Boletín más reciente",
    this_week_at: "Esta Semana en Ministerio Shekinah",
    newsletter_preview_details: "Servicio dominical, escritura, anuncios y actualizaciones de la comunidad en un solo lugar.",
    open_newsletter: "Abrir Boletín →",
    church_updates: "Actualizaciones de la iglesia",
    announcements: "Anuncios",
    loading_announcements: "Cargando anuncios…",
    no_announcements: "No hay anuncios en este momento.",
    come_worship: "Ven a adorar con nosotros",
    visit_ministerio: "Visita Ministerio Shekinah",
    sunday: "Domingo",
    service_begins: "El servicio comienza a las",
    welcome_message: "Esperamos darte la bienvenida.",
    service_error: "La información del servicio no está disponible temporalmente.",
    newsletter_page_intro: "Lee el boletín más reciente y consulta actualizaciones anteriores de Ministerio Shekinah.",
    previous_issues: "Boletines Anteriores",
    loading_newsletter: "Cargando boletín…",
    loading_archive: "Cargando archivo…",
    newsletter_error: "No pudimos cargar el boletín en este momento.",
    announcement_error: "No pudimos cargar los anuncios en este momento."
  }
};

const storedLanguage = localStorage.getItem("ministerioLanguage");
let currentLanguage = storedLanguage === "es" ? "es" : "en";

let cachedService = null;
let cachedAnnouncements = null;
let cachedNewsletterIssues = null;

function publicConfigReady() {
  const cfg = window.SHEKINAH_SUPABASE;
  return Boolean(
    cfg?.url &&
    cfg?.publishableKey &&
    !cfg.url.includes("PASTE_") &&
    !cfg.publishableKey.includes("PASTE_")
  );
}

async function publicSupabaseRequest(path, query = "") {
  if (!publicConfigReady()) {
    throw new Error("Supabase public configuration is unavailable.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${window.SHEKINAH_SUPABASE.url}/rest/v1/${path}${query}`,
      {
        headers: {
          apikey: window.SHEKINAH_SUPABASE.publishableKey,
          Accept: "application/json"
        },
        signal: controller.signal,
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase request failed with ${response.status}.`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function applyLanguage(language) {
  const safeLanguage = language === "es" ? "es" : "en";
  currentLanguage = safeLanguage;
  localStorage.setItem("ministerioLanguage", safeLanguage);
  document.documentElement.lang = safeLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const translated = translations[safeLanguage]?.[key];
    if (translated) element.textContent = translated;
  });

  document.querySelectorAll(".lang-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === safeLanguage);
  });

  if (cachedService) renderServiceSettings(cachedService);
  if (cachedAnnouncements) renderAnnouncements(cachedAnnouncements);

  if (cachedNewsletterIssues && document.body.dataset.page === "newsletter") {
    renderNewsletterPage(cachedNewsletterIssues);
  }
}

document.querySelectorAll(".lang-button").forEach((button) => {
  button.addEventListener("click", () => applyLanguage(button.dataset.lang));
});

const menuButton = document.getElementById("menuButton");
const navMenu = document.getElementById("navMenu");

if (menuButton && navMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// ------------------------------------------------------------
// Service settings
// Production fails closed rather than resurrecting stale JSON.
// Static JSON is used only when Supabase has not been configured.
// ------------------------------------------------------------
async function loadServiceSettings() {
  if (document.body.dataset.page !== "home") return;

  try {
    if (publicConfigReady()) {
      const rows = await publicSupabaseRequest(
        "service_settings",
        "?select=id,day_en,day_es,service_label_en,service_label_es,service_time,time_display,special_message_en,special_message_es,address&id=eq.1&limit=1"
      );

      if (!rows?.[0]) throw new Error("The service settings row is missing.");
      cachedService = rows[0];
    } else {
      const response = await fetch("service.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Static service fallback failed.");
      cachedService = await response.json();
    }

    renderServiceSettings(cachedService);
  } catch (error) {
    console.error("Unable to load service settings:", error);
    renderServiceUnavailable();
  }
}

function formatPublicServiceTime(timeValue) {
  if (!timeValue) return "";

  const normalized = String(timeValue).slice(0, 5);
  const [hoursString, minutesString] = normalized.split(":");
  const hours24 = Number(hoursString);
  const minutes = Number(minutesString || "0");

  if (Number.isNaN(hours24) || Number.isNaN(minutes)) return "";

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function renderServiceSettings(service) {
  const isSpanish = currentLanguage === "es";
  const serviceLabel =
    service[isSpanish ? "service_label_es" : "service_label_en"] ||
    (isSpanish ? "Servicio Dominical" : "Sunday Service");
  const day =
    service[isSpanish ? "day_es" : "day_en"] ||
    (isSpanish ? "Domingo" : "Sunday");
  const specialMessage =
    service[isSpanish ? "special_message_es" : "special_message_en"];

  const displayTime =
    formatPublicServiceTime(service.service_time) ||
    service.time_display ||
    "—";

  const heroLabel = document.getElementById("heroServiceLabel");
  const heroTime = document.getElementById("heroServiceTime");
  const sectionLabel = document.getElementById("serviceSectionLabel");
  const sectionTime = document.getElementById("serviceSectionTime");
  const visitDay = document.getElementById("visitServiceDay");
  const visitTime = document.getElementById("visitServiceTime");
  const message = document.getElementById("specialServiceMessage");

  if (heroLabel) heroLabel.textContent = serviceLabel;
  if (heroTime) heroTime.textContent = displayTime;
  if (sectionLabel) sectionLabel.textContent = serviceLabel;
  if (sectionTime) sectionTime.textContent = displayTime;
  if (visitDay) visitDay.textContent = day;
  if (visitTime) visitTime.textContent = displayTime;

  if (message) {
    message.textContent =
      specialMessage || translations[currentLanguage].welcome_message;
  }
}

function renderServiceUnavailable() {
  ["heroServiceTime", "serviceSectionTime", "visitServiceTime"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.textContent = "—";
  });

  const message = document.getElementById("specialServiceMessage");
  if (message) message.textContent = translations[currentLanguage].service_error;
}

// ------------------------------------------------------------
// Announcements
// Fetch only public fields, cache them for language changes, and fail closed on
// production backend errors so hidden/deleted static content cannot reappear.
// ------------------------------------------------------------
async function loadAnnouncements() {
  const list = document.getElementById("announcementList");
  if (!list) return;

  try {
    if (publicConfigReady()) {
      cachedAnnouncements = await publicSupabaseRequest(
        "announcements",
        "?select=id,tag_en,tag_es,title_en,title_es,description_en,description_es,sort_order&active=eq.true&order=sort_order.asc&limit=20"
      );
    } else {
      const response = await fetch("announcements.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Static announcement fallback failed.");
      const rows = await response.json();
      cachedAnnouncements = rows.filter((item) => item.active !== false);
    }

    renderAnnouncements(cachedAnnouncements || []);
  } catch (error) {
    console.error("Unable to load announcements:", error);
    list.innerHTML =
      `<article class="announcement-card"><p>${escapeHtml(translations[currentLanguage].announcement_error)}</p></article>`;
  }
}

function renderAnnouncements(announcements) {
  const list = document.getElementById("announcementList");
  if (!list) return;

  if (!announcements.length) {
    list.innerHTML =
      `<article class="announcement-card"><p>${escapeHtml(translations[currentLanguage].no_announcements)}</p></article>`;
    return;
  }

  list.innerHTML = announcements
    .map((announcement) => {
      const title =
        announcement[`title_${currentLanguage}`] || announcement.title_en;
      const description =
        announcement[`description_${currentLanguage}`] ||
        announcement.description_en;
      const tag =
        announcement[`tag_${currentLanguage}`] || announcement.tag_en;

      return `
        <article class="announcement-card">
          <span class="tag">${escapeHtml(tag)}</span>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description)}</p>
        </article>
      `;
    })
    .join("");
}

// ------------------------------------------------------------
// Newsletter
// Production fails closed rather than reverting to repository JSON after an
// outage. Static JSON remains only for unconfigured/local development.
// ------------------------------------------------------------
async function loadNewsletters() {
  const latestContainer = document.getElementById("latestNewsletter");
  const archiveContainer = document.getElementById("newsletterArchive");
  if (!latestContainer || !archiveContainer) return;

  try {
    let issues;

    if (publicConfigReady()) {
      const rows = await publicSupabaseRequest(
        "newsletters",
        "?select=id,issue_date,title_en,title_es,gathering_en,gathering_es,scripture_en,scripture_es,community_en,community_es,published_at&status=eq.published&published_at=not.is.null&order=issue_date.desc&limit=100"
      );
      issues = (rows || []).map(databaseNewsletterToDisplayIssue);
    } else {
      const response = await fetch("newsletters.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Static newsletter fallback failed.");
      issues = await response.json();
    }

    cachedNewsletterIssues = issues;
    renderNewsletterPage(issues);
  } catch (error) {
    console.error("Unable to load newsletters:", error);
    latestContainer.innerHTML =
      `<p>${escapeHtml(translations[currentLanguage].newsletter_error)}</p>`;
    archiveContainer.innerHTML = "";
  }
}

function renderNewsletterPage(issues) {
  const latestContainer = document.getElementById("latestNewsletter");
  const archiveContainer = document.getElementById("newsletterArchive");
  if (!latestContainer || !archiveContainer) return;

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("issue");
  const selectedIssue =
    issues.find((issue) => issue.id === requestedId) || issues[0];

  if (!selectedIssue) {
    latestContainer.innerHTML =
      `<div class="newsletter-empty-public"><h2>No published newsletter yet</h2><p>Check back for the next Ministerio Shekinah update.</p></div>`;
    archiveContainer.innerHTML = `<p>—</p>`;
    return;
  }

  renderNewsletter(selectedIssue, latestContainer);

  archiveContainer.innerHTML =
    issues
      .filter((issue) => issue.id !== selectedIssue.id)
      .map((issue) => {
        const title =
          issue[`title_${currentLanguage}`] || issue.title_en;
        const date =
          issue[`date_${currentLanguage}`] || issue.date_en;

        return `
          <a class="archive-item" href="newsletter.html?issue=${encodeURIComponent(issue.id)}">
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(date)}</span>
          </a>
        `;
      })
      .join("") || `<p>—</p>`;
}

function databaseNewsletterToDisplayIssue(row) {
  const date = new Date(`${row.issue_date}T12:00:00`);

  const dateEn = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);

  const dateEs = new Intl.DateTimeFormat("es-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);

  return {
    id: row.id,
    date_en: dateEn,
    date_es: dateEs,
    title_en: row.title_en,
    title_es: row.title_es,
    sections: [
      {
        heading_en: "Sunday Gathering",
        heading_es: "Reunión del Domingo",
        body_en: row.gathering_en || "",
        body_es: row.gathering_es || ""
      },
      {
        heading_en: "Weekly Scripture",
        heading_es: "Escritura de la Semana",
        body_en: row.scripture_en || "",
        body_es: row.scripture_es || ""
      },
      {
        heading_en: "Community Update",
        heading_es: "Actualización de la Comunidad",
        body_en: row.community_en || "",
        body_es: row.community_es || ""
      }
    ]
  };
}

function renderNewsletter(issue, container) {
  const title =
    issue[`title_${currentLanguage}`] || issue.title_en;
  const date =
    issue[`date_${currentLanguage}`] || issue.date_en;
  const sections = issue.sections || [];

  container.innerHTML = `
    <span class="tag">${escapeHtml(translations[currentLanguage].latest_issue)}</span>
    <h2>${escapeHtml(title)}</h2>
    <p class="issue-date">${escapeHtml(date)}</p>
    ${sections
      .map((section) => {
        const heading =
          section[`heading_${currentLanguage}`] || section.heading_en;
        const body =
          section[`body_${currentLanguage}`] || section.body_en;

        return `
          <section class="newsletter-section">
            <h3>${escapeHtml(heading)}</h3>
            <p>${escapeHtml(body)}</p>
          </section>
        `;
      })
      .join("")}
  `;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function initializePublicPage() {
  applyLanguage(currentLanguage);

  if (document.body.dataset.page === "home") {
    await Promise.all([loadAnnouncements(), loadServiceSettings()]);
  }

  if (document.body.dataset.page === "newsletter") {
    await loadNewsletters();
  }
}

initializePublicPage();
