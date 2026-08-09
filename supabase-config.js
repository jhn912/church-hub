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
  Admin-only extensions use the same public browser configuration. Privileged
  administrator changes are performed by the protected Supabase Edge Function;
  secret credentials are never stored in browser-served code.
*/
if (/\/admin(?:\.html)?$/.test(window.location.pathname)) {
  const serviceValidationScript = document.createElement("script");
  serviceValidationScript.src = "admin-service-validation.js?v=1.0";
  serviceValidationScript.async = true;
  document.head.appendChild(serviceValidationScript);

  const ownerAdminScript = document.createElement("script");
  ownerAdminScript.src = "administrators.js?v=0.9";
  ownerAdminScript.async = true;
  document.head.appendChild(ownerAdminScript);
}
