import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const workspace = document.querySelector("#profile-workspace");
const guard = document.querySelector("#auth-guard");
const status = document.querySelector("#page-status");
let user;
let profile;

function notify(message) {
  status.textContent = message;
  status.style.display = "block";
  window.setTimeout(() => status.style.removeProperty("display"), 5000);
}

function escapeHtml(value = "") {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
}

async function avatarUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

async function setAvatar(element, record) {
  const url = await avatarUrl(record.avatar_path);
  element.innerHTML = url
    ? `<img src="${url}" alt="" />`
    : escapeHtml(record.display_name.slice(0, 2).toUpperCase());
}

async function render(record) {
  profile = record;
  document.querySelector("#summary-name").textContent = record.display_name;
  document.querySelector("#summary-username").textContent =
    `@${record.username}`;
  document.querySelector("#profile-display-name").value = record.display_name;
  document.querySelector("#profile-username").value = record.username;
  document.querySelector("#profile-bio").value = record.bio || "";
  document.querySelector("#profile-city").value = record.city || "";
  document.querySelector("#profile-public").checked = record.is_public;
  document.querySelector("#account-email").value = user.email || "";
  await Promise.all([
    setAvatar(document.querySelector("#summary-avatar"), record),
    setAvatar(document.querySelector("#form-avatar"), record),
  ]);
}

async function loadProgress() {
  const [{ data: progress }, { count }] = await Promise.all([
    supabase.from("course_progress").select("course_id"),
    supabase
      .from("courses")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
  ]);
  const completed = progress?.length || 0;
  document.querySelector("#completed-count").textContent = completed;
  document.querySelector("#progress-percent").textContent =
    `${count ? Math.round((completed / count) * 100) : 0}%`;
}

async function initialize() {
  if (!supabase) {
    guard.hidden = false;
    document.querySelector("#account-state").textContent =
      "Serviço indisponível";
    return;
  }
  const { data } = await supabase.auth.getUser();
  user = data.user;
  if (!user) {
    guard.hidden = false;
    document.querySelector("#account-state").textContent =
      "Sessão não iniciada";
    return;
  }
  const { data: record, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,city,avatar_path,is_public")
    .eq("id", user.id)
    .single();
  if (error) {
    guard.hidden = false;
    guard.querySelector("h2").textContent =
      "Não foi possível carregar seu perfil";
    guard.querySelector("p:last-child").textContent =
      "Confirme se a estrutura de perfis foi instalada no projeto.";
    document.querySelector("#account-state").textContent =
      "Perfil indisponível";
    return;
  }
  workspace.hidden = false;
  document.querySelector("#account-state").textContent = "Conta conectada";
  await Promise.all([render(record), loadProgress()]);
}

document
  .querySelector("#profile-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const saveState = document.querySelector("#save-state");
    saveState.textContent = "Salvando…";
    try {
      const form = new FormData(event.currentTarget);
      const displayName = String(form.get("display_name")).trim();
      const username = String(form.get("username")).trim().toLowerCase();
      const update = {
        display_name: displayName || profile.display_name,
        username: username || profile.username,
        bio: String(form.get("bio")).trim() || profile.bio || "",
        city: String(form.get("city")).trim() || profile.city || "",
        is_public: document.querySelector("#profile-public").checked,
        updated_at: new Date().toISOString(),
      };
      const file = document.querySelector("#profile-avatar-file").files[0];
      if (file) {
        if (
          file.size > 2097152 ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        )
          throw new Error("Use uma imagem JPG, PNG ou WebP, com até 2 MB.");
        const extension = file.type.split("/")[1].replace("jpeg", "jpg");
        const path = `${user.id}/avatar.${extension}`;
        const { error } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (error) throw error;
        update.avatar_path = path;
      }
      const { data, error } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", user.id)
        .select("id,username,display_name,bio,city,avatar_path,is_public")
        .single();
      if (error) throw error;
      await supabase.auth.updateUser({ data: { name: update.display_name } });
      await render(data);
      saveState.textContent = "Alterações salvas.";
    } catch (error) {
      saveState.textContent =
        error.code === "23505"
          ? "Esse nome de usuário já está em uso."
          : error.message;
    }
  });

document.querySelector("#profile-public").addEventListener("change", () => {
  document.querySelector("#save-state").textContent =
    "Salve para aplicar a nova visibilidade.";
});

document
  .querySelector("#password-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#password-message");
    const password = document.querySelector("#new-password").value;
    const { error } = await supabase.auth.updateUser({ password });
    message.textContent = error
      ? error.message
      : "Senha alterada com segurança.";
    if (!error) event.currentTarget.reset();
  });

document.querySelector("#change-email").addEventListener("click", async () => {
  const message = document.querySelector("#password-message");
  const email = document.querySelector("#new-email").value.trim();
  if (!email) {
    message.textContent = "Informe o novo e-mail.";
    return;
  }
  const { error } = await supabase.auth.updateUser({ email });
  message.textContent = error
    ? error.message
    : "Confirme a alteração pelos links enviados aos endereços de e-mail.";
});

document
  .querySelector("#profile-search-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const target = document.querySelector("#profile-search-result");
    const username = document
      .querySelector("#profile-search")
      .value.trim()
      .toLowerCase();
    target.innerHTML = '<p class="empty-state">Buscando perfil…</p>';
    const { data, error } = await supabase
      .from("profiles")
      .select("username,display_name,bio,city,avatar_path")
      .eq("username", username)
      .eq("is_public", true)
      .maybeSingle();
    if (error || !data) {
      target.innerHTML =
        '<p class="empty-state">Perfil público não encontrado.</p>';
      return;
    }
    const image = await avatarUrl(data.avatar_path);
    target.innerHTML = `<article class="public-profile-result"><div class="avatar avatar-large">${image ? `<img src="${image}" alt="" />` : escapeHtml(data.display_name.slice(0, 2).toUpperCase())}</div><div><h3>${escapeHtml(data.display_name)}</h3><p>@${escapeHtml(data.username)}</p><p>${escapeHtml(data.bio || "")}</p><p>${escapeHtml(data.city || "")}</p></div></article>`;
  });

document.querySelector("#logout-button").addEventListener("click", async () => {
  if (!window.confirm("Deseja sair da sua conta?")) return;
  await supabase.auth.signOut();
  window.location.href = "/";
});

const menuButton = document.querySelector(".menu-button");
menuButton.addEventListener("click", () => {
  const open = document.querySelector("#main-nav").classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

initialize().catch(() => notify("Não foi possível carregar a área pessoal."));
