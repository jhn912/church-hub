/*
  Defense-in-depth fix for service publishing.
  This capture-phase handler runs before the legacy admin.js click handler and
  reports success only when Supabase confirms service_settings.id = 1 was updated.
*/
(function () {
  const button = document.getElementById("saveServiceButton");
  const status = document.getElementById("serviceDraftStatus");

  if (!button || !status || !window.supabase || !window.SHEKINAH_SUPABASE) return;

  const client = window.supabase.createClient(
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

  function formatServiceTime(timeValue) {
    if (!timeValue) return "3:00 PM";

    const [hoursString, minutesString] = timeValue.split(":");
    const hours24 = Number(hoursString);
    const minutes = Number(minutesString || "0");

    if (Number.isNaN(hours24) || Number.isNaN(minutes)) return timeValue;

    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  }

  button.addEventListener(
    "click",
    async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      button.disabled = true;
      button.textContent = "Saving…";
      status.textContent = "";

      try {
        const { data: userData, error: userError } = await client.auth.getUser();
        const user = userData?.user;

        if (userError || !user) {
          throw new Error("Your admin session could not be verified. Please sign in again.");
        }

        const serviceTime = document.getElementById("serviceTimeInput").value;
        const payload = {
          day_en: document.getElementById("serviceDayEn").value.trim(),
          day_es: document.getElementById("serviceDayEs").value.trim(),
          service_label_en: document.getElementById("serviceLabelEn").value.trim(),
          service_label_es: document.getElementById("serviceLabelEs").value.trim(),
          service_time: serviceTime,
          time_display: formatServiceTime(serviceTime),
          special_message_en: document.getElementById("serviceMessageEn").value.trim(),
          special_message_es: document.getElementById("serviceMessageEs").value.trim(),
          updated_at: new Date().toISOString(),
          updated_by: user.id
        };

        const { data: savedService, error } = await client
          .from("service_settings")
          .update(payload)
          .eq("id", 1)
          .select("id")
          .maybeSingle();

        if (error) throw error;
        if (savedService?.id !== 1) {
          throw new Error("The service row was not updated.");
        }

        status.textContent =
          "Published. The live website now uses these service settings.";
      } catch (error) {
        console.error("Service publish verification failed:", error);
        status.textContent = `Could not publish service changes: ${
          error instanceof Error ? error.message : "unknown error"
        }`;
      } finally {
        button.disabled = false;
        button.textContent = "Save Service";
      }
    },
    { capture: true }
  );
})();
