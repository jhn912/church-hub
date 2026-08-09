/*
  Supabase browser configuration for Ministerio Shekinah.

  This file contains only the public Project URL and publishable key.
  Never place a Supabase secret key or service_role key in this file.
*/
window.SHEKINAH_SUPABASE = {
  url: "https://nhzxlsjwsvyimozubbho.supabase.co",
  publishableKey: "sb_publishable_afp59GoL5-3i0t_0h-0NwQ_Pl3FmZtT"
};

/*
  The administrators extension is loaded only on the private admin page. It uses
  the same public browser configuration; privileged administrator changes are
  performed by the protected Supabase Edge Function, never with a secret key in
  the browser.
*/
if (/\/admin(?:\.html)?$/.test(window.location.pathname)) {
  const ownerAdminScript = document.createElement("script");
  ownerAdminScript.src = "administrators.js?v=0.9";
  ownerAdminScript.async = true;
  document.head.appendChild(ownerAdminScript);
}
