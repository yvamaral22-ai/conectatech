import { supabase } from "./data-client.js";

const menuButton = document.querySelector(".menu-button");
menuButton?.addEventListener("click", () => {
  const navigation = document.querySelector("#main-nav");
  const open = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

export function escapeHtml(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

async function hydrateMiniProfile() {
  const entry = document.querySelector(
    '.header-actions a[href="/perfil.html"]',
  );
  if (!entry || !supabase) return;
  const cacheKey = "conectatech-mini-profile";
  const render = (snapshot) => {
    entry.classList.add("account-button-profile");
    entry.innerHTML = `<span class="account-mini-avatar">${snapshot.imageUrl ? `<img src="${snapshot.imageUrl}" alt="">` : escapeHtml(snapshot.initials)}</span><span class="account-mini-copy"><strong>${escapeHtml(snapshot.name)}</strong><small>${snapshot.username ? `@${escapeHtml(snapshot.username)}` : "Minha conta"}</small></span>`;
  };
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached) render(cached);
  } catch {}
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    localStorage.removeItem(cacheKey);
    entry.classList.remove("account-button-profile");
    entry.textContent = "Entrar";
    entry.href = "/?entrar=1";
    return;
  }
  const profileResult = await supabase
    .from("profiles")
    .select("display_name,username,avatar_path")
    .eq("id", data.user.id)
    .maybeSingle();
  const profile = profileResult.data;
  const name =
    profile?.display_name ||
    data.user.user_metadata?.name ||
    data.user.email.split("@")[0];
  let imageUrl;
  if (profile?.avatar_path)
    imageUrl = (
      await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_path, 3600)
    ).data?.signedUrl;
  const snapshot = {
    name: name.split(" ")[0],
    username: profile?.username || "",
    initials: name.slice(0, 2).toUpperCase(),
    imageUrl: imageUrl || "",
  };
  localStorage.setItem(cacheKey, JSON.stringify(snapshot));
  render(snapshot);
}
hydrateMiniProfile();
