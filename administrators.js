/* Owner-only administrator management for Ministerio Shekinah. */
(function () {
  const FUNCTION_NAME = "admin-users";
  let ownerClient = null;
  let currentUser = null;
  let adminRows = [];

  function injectStyles() {
    if (document.getElementById("administratorManagementStyles")) return;

    const style = document.createElement("style");
    style.id = "administratorManagementStyles";
    style.textContent = `
      .owner-only-tab[hidden], .owner-only-panel[hidden] { display: none !important; }
      .administrator-layout { display: grid; grid-template-columns: minmax(280px, .72fr) minmax(0, 1.28fr); gap: 24px; align-items: start; }
      .administrator-card { background: #fffdf8; border: 1px solid rgba(31,41,51,.08); border-radius: 24px; padding: 24px; }
      .administrator-card h3 { margin: 0 0 8px; font-family: "Playfair Display", serif; font-size: 1.55rem; }
      .administrator-card p { color: #59636d; }
      .administrator-form { display: grid; gap: 14px; margin-top: 18px; }
      .administrator-form label { display: grid; gap: 7px; font-size: .86rem; font-weight: 700; color: #43505c; }
      .administrator-form input { width: 100%; border: 1px solid #cbd2d9; border-radius: 12px; padding: 12px 13px; background: white; font: inherit; }
      .administrator-list { display: grid; gap: 12px; margin-top: 18px; }
      .administrator-item { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding: 17px 18px; border: 1px solid rgba(31,41,51,.09); border-radius: 18px; background: #fffdf8; }
      .administrator-identity { min-width: 0; }
      .administrator-identity strong { display: block; overflow-wrap: anywhere; }
      .administrator-meta { margin-top: 4px; color: #7b8490; font-size: .8rem; }
      .administrator-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
      .administrator-actions select { border: 1px solid #cbd2d9; border-radius: 999px; padding: 8px 30px 8px 12px; background: white; font: inherit; font-weight: 700; }
      .administrator-role { display: inline-flex; width: fit-content; margin-top: 7px; border-radius: 999px; padding: 5px 9px; background: #ecefe2; color: #43512f; font-size: .7rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      .administrator-role.owner { background: #e5edc3; color: #304017; }
      .administrator-status { min-height: 22px; margin-top: 13px; color: #6b705c; font-size: .84rem; font-weight: 700; }
      .administrator-empty { padding: 22px; border: 1px dashed rgba(31,41,51,.16); border-radius: 18px; color: #78828c; text-align: center; }
      .administrator-warning { padding: 14px 16px; border-radius: 14px; background: #f5efe5; color: #725f42; font-size: .85rem; }
      @media (max-width: 800px) { .administrator-layout { grid-template-columns: 1fr; } .administrator-item { align-items: flex-start; flex-direction: column; } .administrator-actions { width: 100%; justify-content: flex-start; } }
    `;
    document.head.appendChild(style);
  }

  function injectInterface() {
    const nav = document.querySelector(".admin-content-tabs");
    const dashboard = document.getElementById("adminDashboard");
    const backendNote = dashboard?.querySelector(".admin-backend-note");
    if (!nav || !dashboard || document.getElementById("administratorsTab")) return;

    const tab = document.createElement("button");
    tab.className = "admin-content-tab owner-only-tab";
    tab.id = "administratorsTab";
    tab.type = "button";
    tab.dataset.adminSection = "administrators";
    tab.hidden = true;
    tab.textContent = "Administrators";
    nav.appendChild(tab);

    const panel = document.createElement("section");
    panel.className = "admin-content-section owner-only-panel";
    panel.id = "administratorsPanel";
    panel.dataset.adminPanel = "administrators";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="section-admin-heading">
        <div>
          <p class="eyebrow">Owner controls</p>
          <h2>Administrators</h2>
          <p>Manage who can sign in to the Ministerio Shekinah admin portal.</p>
        </div>
        <button class="button admin-button-secondary" id="refreshAdministratorsButton" type="button">Refresh</button>
      </div>

      <div class="administrator-layout">
        <div class="administrator-card">
          <h3>Add Administrator</h3>
          <p>Invite someone by email. New people are added as content administrators by default.</p>
          <form class="administrator-form" id="inviteAdministratorForm">
            <label>
              Email address
              <input id="newAdministratorEmail" type="email" autocomplete="email" placeholder="name@example.com" required />
            </label>
            <button class="button button-primary" type="submit">Send Invitation</button>
          </form>
          <p class="administrator-status" id="administratorInviteStatus"></p>
          <div class="administrator-warning">
            Owner controls run through a protected Supabase Edge Function. Secret database credentials are never stored in this website.
          </div>
        </div>

        <div class="administrator-card">
          <h3>Administrator Access</h3>
          <p>Owners can manage access. Admins can edit church content but cannot manage administrators.</p>
          <p class="administrator-status" id="administratorListStatus"></p>
          <div class="administrator-list" id="administratorList"></div>
        </div>
      </div>
    `;

    if (backendNote) dashboard.insertBefore(panel, backendNote);
    else dashboard.appendChild(panel);

    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-content-tab").forEach((item) => {
        item.classList.toggle("active", item === tab);
      });
      document.querySelectorAll(".admin-content-section").forEach((item) => {
        item.classList.toggle("active", item === panel);
      });
      loadAdministrators();
    });

    document.getElementById("refreshAdministratorsButton").addEventListener("click", loadAdministrators);
    document.getElementById("inviteAdministratorForm").addEventListener("submit", inviteAdministrator);
  }

  async function invokeAdminFunction(body) {
    const { data, error } = await ownerClient.functions.invoke(FUNCTION_NAME, { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function loadAdministrators() {
    const list = document.getElementById("administratorList");
    const status = document.getElementById("administratorListStatus");
    if (!list || !status) return;

    status.textContent = "Loading administrators…";
    try {
      const data = await invokeAdminFunction({ action: "list" });
      adminRows = data?.admins || [];
      status.textContent = `${adminRows.length} ${adminRows.length === 1 ? "administrator" : "administrators"}`;
      renderAdministrators();
    } catch (error) {
      console.error("Administrator list failed:", error);
      list.innerHTML = "";
      status.textContent = "Administrator management is not available yet. Deploy the admin-users Edge Function after applying the role migration.";
    }
  }

  function renderAdministrators() {
    const list = document.getElementById("administratorList");
    if (!list) return;

    if (!adminRows.length) {
      list.innerHTML = '<div class="administrator-empty">No administrators found.</div>';
      return;
    }

    list.innerHTML = "";
    adminRows.forEach((admin) => {
      const isCurrentUser = admin.id === currentUser?.id;
      const item = document.createElement("div");
      item.className = "administrator-item";

      const identity = document.createElement("div");
      identity.className = "administrator-identity";
      const email = document.createElement("strong");
      email.textContent = admin.email || admin.id;
      const meta = document.createElement("div");
      meta.className = "administrator-meta";
      meta.textContent = isCurrentUser ? "You · Full portal access" : "Authorized portal account";
      const role = document.createElement("span");
      role.className = `administrator-role ${admin.role === "owner" ? "owner" : ""}`;
      role.textContent = admin.role === "owner" ? "Owner" : "Admin";
      identity.append(email, meta, role);

      const actions = document.createElement("div");
      actions.className = "administrator-actions";

      const select = document.createElement("select");
      select.setAttribute("aria-label", `Role for ${admin.email || admin.id}`);
      ["admin", "owner"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value === "owner" ? "Owner" : "Admin";
        option.selected = admin.role === value;
        select.appendChild(option);
      });
      select.addEventListener("change", async () => {
        const previousRole = admin.role;
        select.disabled = true;
        try {
          await invokeAdminFunction({ action: "set-role", userId: admin.id, role: select.value });
          await loadAdministrators();
        } catch (error) {
          console.error(error);
          select.value = previousRole;
          window.alert(error.message || "Could not change this administrator's role.");
        } finally {
          select.disabled = false;
        }
      });

      const remove = document.createElement("button");
      remove.className = "button danger-button";
      remove.type = "button";
      remove.textContent = "Remove";
      remove.disabled = isCurrentUser;
      remove.title = isCurrentUser ? "You cannot remove your own owner access here." : "Remove administrator access";
      remove.addEventListener("click", async () => {
        if (!window.confirm(`Remove administrator access for ${admin.email || "this account"}?`)) return;
        remove.disabled = true;
        try {
          await invokeAdminFunction({ action: "remove", userId: admin.id });
          await loadAdministrators();
        } catch (error) {
          console.error(error);
          window.alert(error.message || "Could not remove this administrator.");
          remove.disabled = false;
        }
      });

      actions.append(select, remove);
      item.append(identity, actions);
      list.appendChild(item);
    });
  }

  async function inviteAdministrator(event) {
    event.preventDefault();
    const emailInput = document.getElementById("newAdministratorEmail");
    const status = document.getElementById("administratorInviteStatus");
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const email = emailInput.value.trim().toLowerCase();
    if (!email) return;

    button.disabled = true;
    button.textContent = "Sending…";
    status.textContent = "";

    try {
      const result = await invokeAdminFunction({ action: "invite", email });
      emailInput.value = "";
      status.textContent = result?.invited
        ? "Invitation sent. The account has been added as an Admin."
        : "Existing Supabase account authorized as an Admin.";
      await loadAdministrators();
    } catch (error) {
      console.error(error);
      status.textContent = error.message || "Could not add this administrator.";
    } finally {
      button.disabled = false;
      button.textContent = "Send Invitation";
    }
  }

  async function initializeOwnerManagement() {
    injectStyles();
    injectInterface();

    if (!window.supabase || !window.SHEKINAH_SUPABASE) return;
    ownerClient = window.supabase.createClient(
      window.SHEKINAH_SUPABASE.url,
      window.SHEKINAH_SUPABASE.publishableKey,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );

    const { data: userData } = await ownerClient.auth.getUser();
    currentUser = userData?.user || null;
    if (!currentUser) return;

    const { data: membership, error } = await ownerClient
      .from("admin_users")
      .select("user_id, role")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.info("Owner role is not configured yet.");
      return;
    }

    if (membership?.role !== "owner") return;

    document.getElementById("administratorsTab").hidden = false;
    document.getElementById("administratorsPanel").hidden = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOwnerManagement, { once: true });
  } else {
    initializeOwnerManagement();
  }
})();
