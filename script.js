const translations = {
  "en": {
    "nav_home": "Home",
    "nav_services": "Services",
    "nav_newsletter": "Newsletter",
    "nav_announcements": "Announcements",
    "nav_visit": "Visit",
    "hero_title": "A place to worship, grow, and belong.",
    "hero_copy": "Stay connected with Ministerio Shekinah through service information, church announcements, and our community newsletter.",
    "plan_visit": "Plan a Visit",
    "read_newsletter": "Read Newsletter",
    "sunday_service": "Sunday Service",
    "join_us": "Join Us",
    "everyone_welcome": "Everyone is welcome",
    "worship_with_us": "Worship with us",
    "service_time": "Service Time",
    "every_sunday": "Every Sunday",
    "stay_connected": "Stay connected",
    "church_newsletter": "Church Newsletter",
    "newsletter_preview_copy": "Read the latest church update and browse previous newsletter issues.",
    "latest_issue": "Latest Issue",
    "this_week_at": "This Week at Ministerio Shekinah",
    "newsletter_preview_details": "Sunday service, scripture, announcements, and community updates in one place.",
    "open_newsletter": "Open Newsletter →",
    "church_updates": "Church updates",
    "announcements": "Announcements",
    "loading_announcements": "Loading announcements…",
    "come_worship": "Come worship with us",
    "visit_ministerio": "Visit Ministerio Shekinah",
    "get_directions": "Get Directions",
    "sunday": "Sunday",
    "service_begins": "Service begins at",
    "welcome_message": "We look forward to welcoming you.",
    "newsletter_page_intro": "Read the latest issue and browse previous updates from Ministerio Shekinah.",
    "previous_issues": "Previous Issues",
    "loading_newsletter": "Loading newsletter…",
    "loading_archive": "Loading archive…",
    "newsletter_error": "We could not load the newsletter right now.",
    "announcement_error": "We could not load announcements right now."
  },
  "es": {
    "nav_home": "Inicio",
    "nav_services": "Servicios",
    "nav_newsletter": "Boletín",
    "nav_announcements": "Anuncios",
    "nav_visit": "Visítanos",
    "hero_title": "Un lugar para adorar, crecer y pertenecer.",
    "hero_copy": "Mantente conectado con Ministerio Shekinah por medio de la información de servicios, anuncios de la iglesia y nuestro boletín comunitario.",
    "plan_visit": "Planifica tu Visita",
    "read_newsletter": "Leer el Boletín",
    "sunday_service": "Servicio Dominical",
    "join_us": "Acompáñanos",
    "everyone_welcome": "Todos son bienvenidos",
    "worship_with_us": "Adora con nosotros",
    "service_time": "Horario del Servicio",
    "every_sunday": "Todos los domingos",
    "stay_connected": "Mantente conectado",
    "church_newsletter": "Boletín de la Iglesia",
    "newsletter_preview_copy": "Lee la actualización más reciente de la iglesia y consulta boletines anteriores.",
    "latest_issue": "Boletín más reciente",
    "this_week_at": "Esta Semana en Ministerio Shekinah",
    "newsletter_preview_details": "Servicio dominical, escritura, anuncios y actualizaciones de la comunidad en un solo lugar.",
    "open_newsletter": "Abrir Boletín →",
    "church_updates": "Actualizaciones de la iglesia",
    "announcements": "Anuncios",
    "loading_announcements": "Cargando anuncios…",
    "come_worship": "Ven a adorar con nosotros",
    "visit_ministerio": "Visita Ministerio Shekinah",
    "get_directions": "Cómo Llegar",
    "sunday": "Domingo",
    "service_begins": "El servicio comienza a las",
    "welcome_message": "Esperamos darte la bienvenida.",
    "newsletter_page_intro": "Lee el boletín más reciente y consulta actualizaciones anteriores de Ministerio Shekinah.",
    "previous_issues": "Boletines Anteriores",
    "loading_newsletter": "Cargando boletín…",
    "loading_archive": "Cargando archivo…",
    "newsletter_error": "No pudimos cargar el boletín en este momento.",
    "announcement_error": "No pudimos cargar los anuncios en este momento."
  }
};

let currentLanguage = localStorage.getItem("ministerioLanguage") || "en";
let publicSupabase = null;

function supabaseConfigReady() {
  const cfg = window.SHEKINAH_SUPABASE;
  return Boolean(
    window.supabase &&
    cfg?.url &&
    cfg?.publishableKey &&
    !cfg.url.includes("PASTE_") &&
    !cfg.publishableKey.includes("PASTE_")
  );
}

if (supabaseConfigReady()) {
  publicSupabase = window.supabase.createClient(
    window.SHEKINAH_SUPABASE.url,
    window.SHEKINAH_SUPABASE.publishableKey
  );
}

function applyLanguage(language) {
  currentLanguage = language;
  localStorage.setItem("ministerioLanguage", language);
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[language][key]) {
      element.textContent = translations[language][key];
    }
  });

  document.querySelectorAll(".lang-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === language);
  });

  if (document.body.dataset.page === "home") {
    loadAnnouncements();
    loadServiceSettings();
  }

  if (document.body.dataset.page === "newsletter") {
    loadNewsletters();
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
    menuButton.setAttribute("aria-expanded", isOpen);
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const year = document.getElementById("year");
if (year) {
  year.textContent = new Date().getFullYear();
}

// ------------------------------------------------------------
// Service settings: Supabase first, service.json fallback
// ------------------------------------------------------------
async function loadServiceSettings() {
  if (document.body.dataset.page !== "home") return;

  let service = null;

  if (publicSupabase) {
    const { data, error } = await publicSupabase
      .from("service_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) service = data;
    if (error) console.error("Supabase service read failed:", error);
  }

  if (!service) {
    try {
      const response = await fetch("service.json", { cache: "no-store" });
      service = await response.json();
    } catch (error) {
      console.error("Unable to load service settings:", error);
      return;
    }
  }

  renderServiceSettings(service);
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
    "3:00 PM";

  const heroLabel = document.getElementById("heroServiceLabel");
  const heroTime = document.getElementById("heroServiceTime");
  const dayLabel = document.getElementById("serviceDayLabel");
  const sectionLabel = document.getElementById("serviceSectionLabel");
  const sectionTime = document.getElementById("serviceSectionTime");
  const visitDay = document.getElementById("visitServiceDay");
  const visitTime = document.getElementById("visitServiceTime");
  const message = document.getElementById("specialServiceMessage");

  if (heroLabel) heroLabel.textContent = serviceLabel;
  if (heroTime) heroTime.textContent = displayTime;
  if (dayLabel) {
    dayLabel.textContent = isSpanish
      ? `Todos los ${day.toLowerCase()}s`
      : `Every ${day}`;
  }
  if (sectionLabel) sectionLabel.textContent = serviceLabel;
  if (sectionTime) sectionTime.textContent = displayTime;
  if (visitDay) visitDay.textContent = day;
  if (visitTime) visitTime.textContent = displayTime;

  if (message) {
    message.textContent =
      specialMessage ||
      (isSpanish
        ? "Esperamos darte la bienvenida."
        : "We look forward to welcoming you.");
  }
}

// ------------------------------------------------------------
// Announcements: Supabase first, announcements.json fallback
// Explicit active=true filter prevents hidden admin rows from
// appearing even when the visitor is signed in as an admin.
// ------------------------------------------------------------
async function loadAnnouncements() {
  const list = document.getElementById("announcementList");
  if (!list) return;

  try {
    let announcements = null;

    if (publicSupabase) {
      const { data, error } = await publicSupabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (!error) announcements = data;
      if (error) console.error("Supabase announcements read failed:", error);
    }

    if (!announcements) {
      const response = await fetch("announcements.json", { cache: "no-store" });
      announcements = await response.json();
      announcements = announcements.filter((item) => item.active !== false);
    }

    renderAnnouncements(announcements);
  } catch (error) {
    list.innerHTML =
      `<article class="announcement-card"><p>${translations[currentLanguage].announcement_error}</p></article>`;
  }
}

function renderAnnouncements(announcements) {
  const list = document.getElementById("announcementList");
  if (!list) return;

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
// Newsletter: published Supabase issues first.
// Only rows with published_at set by the admin Publish button
// are shown. Static JSON remains as a fallback until the first
// real newsletter is published through the portal.
// ------------------------------------------------------------
async function loadNewsletters() {
  const latestContainer = document.getElementById("latestNewsletter");
  const archiveContainer = document.getElementById("newsletterArchive");
  if (!latestContainer || !archiveContainer) return;

  try {
    let issues = null;

    if (publicSupabase) {
      const { data, error } = await publicSupabase
        .from("newsletters")
        .select("*")
        .eq("status", "published")
        .not("published_at", "is", null)
        .order("issue_date", { ascending: false });

      if (!error && data?.length) {
        issues = data.map(databaseNewsletterToDisplayIssue);
      }

      if (error) console.error("Supabase newsletter read failed:", error);
    }

    if (!issues) {
      const response = await fetch("newsletters.json", { cache: "no-store" });
      issues = await response.json();
    }

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get("issue");
    const selectedIssue =
      issues.find((issue) => issue.id === requestedId) || issues[0];

    if (!selectedIssue) throw new Error("No newsletter issues found.");

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
  } catch (error) {
    latestContainer.innerHTML =
      `<p>${translations[currentLanguage].newsletter_error}</p>`;
    archiveContainer.innerHTML = "";
  }
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
    <span class="tag">${translations[currentLanguage].latest_issue}</span>
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

applyLanguage(currentLanguage);
