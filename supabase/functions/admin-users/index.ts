import { withSupabase } from "npm:@supabase/server@^1";

type AdminAction =
  | { action: "list" }
  | { action: "invite"; email?: string }
  | { action: "set-role"; userId?: string; role?: "owner" | "admin" }
  | { action: "remove"; userId?: string };

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function assertOwner(ctx: any) {
  const callerId = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;
  if (!callerId) return { error: jsonError("Authentication required.", 401) };

  const { data, error } = await ctx.supabaseAdmin
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", callerId)
    .maybeSingle();

  if (error) {
    console.error("Owner lookup failed:", error);
    return { error: jsonError("Could not verify owner access.", 500) };
  }

  if (data?.role !== "owner") {
    return { error: jsonError("Owner access is required.", 403) };
  }

  return { callerId };
}

async function listAuthUsers(ctx: any) {
  const { data, error } = await ctx.supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  return data.users ?? [];
}

async function listAdministrators(ctx: any) {
  const [{ data: rows, error: rowsError }, users] = await Promise.all([
    ctx.supabaseAdmin
      .from("admin_users")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: true }),
    listAuthUsers(ctx),
  ]);

  if (rowsError) throw rowsError;
  const userMap = new Map(users.map((user: any) => [user.id, user]));

  return (rows ?? []).map((row: any) => {
    const user = userMap.get(row.user_id) as any;
    return {
      id: row.user_id,
      email: user?.email ?? null,
      role: row.role,
      createdAt: row.created_at,
      confirmedAt: user?.confirmed_at ?? null,
      lastSignInAt: user?.last_sign_in_at ?? null,
    };
  });
}

async function ensureAnotherOwner(ctx: any, targetUserId: string) {
  const { data: target, error: targetError } = await ctx.supabaseAdmin
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (targetError) throw targetError;
  if (!target) throw new Error("Administrator not found.");
  if (target.role !== "owner") return;

  const { count, error: countError } = await ctx.supabaseAdmin
    .from("admin_users")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "owner");

  if (countError) throw countError;
  if ((count ?? 0) <= 1) {
    throw new Error("At least one Owner must remain.");
  }
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req: Request, ctx: any) => {
    const owner = await assertOwner(ctx);
    if (owner.error) return owner.error;

    let body: AdminAction;
    try {
      body = (await req.json()) as AdminAction;
    } catch {
      return jsonError("Invalid request body.");
    }

    try {
      if (body.action === "list") {
        return Response.json({ admins: await listAdministrators(ctx) });
      }

      if (body.action === "invite") {
        const email = String(body.email ?? "").trim().toLowerCase();
        if (!email || !email.includes("@")) return jsonError("Enter a valid email address.");

        const users = await listAuthUsers(ctx);
        let user = users.find((candidate: any) => candidate.email?.toLowerCase() === email);
        let invited = false;

        if (!user) {
          const { data, error } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: "https://mcshekinah.org/admin",
          });
          if (error) throw error;
          user = data.user;
          invited = true;
        }

        if (!user?.id) throw new Error("Supabase did not return a user ID.");

        const { data: existingMembership, error: membershipError } = await ctx.supabaseAdmin
          .from("admin_users")
          .select("user_id, role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (membershipError) throw membershipError;

        if (existingMembership) {
          return Response.json({
            ok: true,
            invited,
            alreadyAuthorized: true,
            userId: user.id,
            email,
            role: existingMembership.role,
          });
        }

        const { error: allowError } = await ctx.supabaseAdmin
          .from("admin_users")
          .insert({ user_id: user.id, role: "admin" });
        if (allowError) throw allowError;

        return Response.json({ ok: true, invited, alreadyAuthorized: false, userId: user.id, email, role: "admin" });
      }

      if (body.action === "set-role") {
        const userId = String(body.userId ?? "");
        const role = body.role;
        if (!userId || (role !== "owner" && role !== "admin")) {
          return jsonError("A valid administrator and role are required.");
        }

        if (userId === owner.callerId && role !== "owner") {
          return jsonError("You cannot demote your own Owner account from this page.", 409);
        }

        if (role === "admin") await ensureAnotherOwner(ctx, userId);

        const { data, error } = await ctx.supabaseAdmin
          .from("admin_users")
          .update({ role })
          .eq("user_id", userId)
          .select("user_id, role")
          .single();
        if (error) throw error;

        return Response.json({ ok: true, admin: data });
      }

      if (body.action === "remove") {
        const userId = String(body.userId ?? "");
        if (!userId) return jsonError("Administrator ID is required.");
        if (userId === owner.callerId) {
          return jsonError("You cannot remove your own Owner access from this page.", 409);
        }

        await ensureAnotherOwner(ctx, userId);

        const { error } = await ctx.supabaseAdmin
          .from("admin_users")
          .delete()
          .eq("user_id", userId);
        if (error) throw error;

        return Response.json({ ok: true });
      }

      return jsonError("Unknown administrator action.");
    } catch (error) {
      console.error("admin-users error:", error);
      return jsonError(error instanceof Error ? error.message : "Administrator request failed.", 500);
    }
  }),
};
