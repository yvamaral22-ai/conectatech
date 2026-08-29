export async function currentUserRole(supabase, userId) {
  if (!supabase || !userId) return "student";

  const appRole = await supabase.rpc("current_app_role");
  if (
    !appRole.error &&
    ["admin", "teacher", "student"].includes(appRole.data)
  ) {
    return appRole.data;
  }

  const role = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "teacher", "student"])
    .maybeSingle();
  if (!role.error && role.data?.role) return role.data.role;

  const profile = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", userId)
    .maybeSingle();
  if (!profile.error && profile.data?.is_active !== false) {
    return profile.data?.role === "admin" || profile.data?.role === "teacher"
      ? profile.data.role
      : "student";
  }

  return "student";
}

export async function isCurrentUserAdmin(supabase, userId) {
  return (await currentUserRole(supabase, userId)) === "admin";
}

export async function canCurrentUserManageContent(supabase, userId) {
  return ["admin", "teacher"].includes(await currentUserRole(supabase, userId));
}

export async function syncAdminNavigation(supabase, knownUser) {
  const nav = document.querySelector("#main-nav");
  if (!nav) return;

  nav.querySelector('[data-admin-nav="true"]')?.remove();
  if (!supabase) return;

  const user =
    knownUser ||
    (await supabase.auth.getUser().then(({ data }) => data.user).catch(() => null));
  if (!user) return;

  const role = await currentUserRole(supabase, user.id).catch(() => "student");
  if (!["admin", "teacher"].includes(role)) return;

  const link = document.createElement("a");
  link.href = "/admin.html";
  link.textContent = role === "admin" ? "Administração" : "Estúdio";
  link.dataset.adminNav = "true";
  if (window.location.pathname.endsWith("/admin.html")) {
    link.setAttribute("aria-current", "page");
  }
  nav.append(link);
}
