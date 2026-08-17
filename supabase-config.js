/*
  Supabase browser configuration for Ministerio Cristiano Shekinah.

  This file contains only the public Project URL and publishable key.
  Never place a Supabase secret key or service_role key in this file.
*/
window.SHEKINAH_SUPABASE = {
  url: "https://nhzxlsjwsvyimozubbho.supabase.co",
  publishableKey: "sb_publishable_afp59GoL5-3i0t_0h-0NwQ_Pl3FmZtT"
};

/* Admin-only extensions. They contain no secret credentials. */
if (/\/admin(?:\.html)?$/.test(window.location.pathname)) {
  [
    "admin-service-validation.js?v=1.0",
    "administrators.js?v=0.9"
  ].forEach((src) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  });
}
