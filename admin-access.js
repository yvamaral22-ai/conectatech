export async function isCurrentUserAdmin(supabase, userId) {
  if (!supabase || !userId) return false;

  const access = await supabase.rpc("is_admin");
  if (!access.error && access.data) return true;

  const role = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role.error && role.data?.role === "admin") return true;

  const profile = await supabase
    .from("profiles")
    .select("role,is_active")
    .eq("id", userId)
    .maybeSingle();
  return (
    !profile.error &&
    profile.data?.role === "admin" &&
    profile.data?.is_active !== false
  );
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

  const isAdmin = await isCurrentUserAdmin(supabase, user.id).catch(() => false);
  if (!isAdmin) return;

  const link = document.createElement("a");
  link.href = "/admin.html";
  link.textContent = "Administracao";
  link.dataset.adminNav = "true";
  if (window.location.pathname.endsWith("/admin.html")) {
    link.setAttribute("aria-current", "page");
  }
  nav.append(link);
}
