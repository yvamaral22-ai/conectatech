import { createClient } from "@supabase/supabase-js";
import { syncAdminNavigation } from "./admin-access.js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const workspace = document.querySelector("#profile-workspace");
const guard = document.querySelector("#auth-guard");
const status = document.querySelector("#page-status");
let user;
let profile;
let supportsCoverPath = true;

function notify(message) {
  status.textContent = message;
  status.style.display = "block";
  window.setTimeout(() => status.style.removeProperty("display"), 5000);
}

function escapeHtml(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

function formatDate(value) {
  if (!value) return "Data não registrada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function mediaUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

async function setAvatar(element, record) {
  const url = await mediaUrl(record.avatar_path);
  element.innerHTML = url
    ? `<img src="${url}" alt="" />`
    : escapeHtml(record.display_name.slice(0, 2).toUpperCase());
}

async function setCover(record) {
  const cover = document.querySelector("#profile-cover");
  if (!supportsCoverPath) {
    cover.style.backgroundImage = "";
    return;
  }
  const url = await mediaUrl(record.cover_path);
  cover.style.backgroundImage = url
    ? `linear-gradient(120deg, rgba(23, 63, 53, .18), rgba(23, 63, 53, .08)), url("${url}")`
    : "";
}

function defaultProfileRecord() {
  const fallbackName =
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Pessoa ConectaTech";
  return {
    id: user.id,
    username: `user_${user.id.replaceAll("-", "").slice(0, 12)}`,
    display_name: fallbackName.slice(0, 80),
    bio: "",
    city: "",
    avatar_path: null,
    cover_path: null,
    is_public: false,
  };
}

async function createMissingProfile() {
  const fallback = defaultProfileRecord();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: fallback.id,
      username: fallback.username,
      display_name: fallback.display_name,
      full_name: fallback.display_name,
      bio: fallback.bio,
      city: fallback.city,
      is_public: fallback.is_public,
    })
    .select("id,username,display_name,bio,city,avatar_path,is_public")
    .single();

  if (error) throw error;
  return { ...data, cover_path: null };
}

async function loadProfileRecord() {
  const withCover = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,city,avatar_path,cover_path,is_public")
    .eq("id", user.id)
    .maybeSingle();

  if (!withCover.error) {
    return withCover.data || (await createMissingProfile());
  }

  supportsCoverPath = false;
  const withoutCover = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,city,avatar_path,is_public")
    .eq("id", user.id)
    .maybeSingle();

  if (withoutCover.error) throw withoutCover.error;
  return withoutCover.data
    ? { ...withoutCover.data, cover_path: null }
    : await createMissingProfile();
}

async function render(record) {
  profile = record;
  document.querySelector("#summary-name").textContent = record.display_name;
  document.querySelector("#summary-username").textContent =
    `@${record.username}`;
  document.querySelector("#hero-profile-name").textContent =
    record.display_name;
  document.querySelector("#hero-profile-detail").textContent = record.is_public
    ? `@${record.username} aparece em buscas publicas.`
    : "Seu perfil esta privado.";
  document.querySelector("#profile-display-name").value = record.display_name;
  document.querySelector("#profile-username").value = record.username;
  document.querySelector("#profile-bio").value = record.bio || "";
  document.querySelector("#profile-city").value = record.city || "";
  document.querySelector("#profile-public").checked = record.is_public;
  await Promise.all([
    setAvatar(document.querySelector("#summary-avatar"), record),
    setAvatar(document.querySelector("#form-avatar"), record),
    setCover(record),
  ]);
}

function lessonCard(item, dateLabel) {
  const lesson = item.lessons || {};
  const track = lesson.tracks || {};
  return `<article class="learning-item"><div><strong>${escapeHtml(
    lesson.title || "Aula",
  )}</strong><span>${escapeHtml(track.title || "Trilha")}</span><small>${escapeHtml(
    dateLabel,
  )}</small></div><a class="text-link" href="/aula.html?id=${encodeURIComponent(
    item.lesson_id,
  )}">Abrir</a></article>`;
}

async function loadProgress() {
  const history = document.querySelector("#history-list");
  const [{ data: progress, error }, { count }] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select(
        "lesson_id,status,score,started_at,completed_at,updated_at,lessons(title,slug,tracks(title,slug))",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  if (error) {
    history.innerHTML =
      '<p class="empty-state">Histórico indisponível. Confira a migração de progresso.</p>';
    return;
  }

  const completed = (progress || []).filter(
    (item) => item.status === "completed",
  );
  document.querySelector("#completed-count").textContent = completed.length;
  document.querySelector("#progress-percent").textContent =
    `${count ? Math.round((completed.length / count) * 100) : 0}%`;

  history.innerHTML = progress?.length
    ? progress
        .map((item) =>
          lessonCard(
            item,
            `${item.status === "completed" ? "Concluida" : "Iniciada"} em ${formatDate(
              item.completed_at || item.updated_at || item.started_at,
            )}`,
          ),
        )
        .join("")
    : '<p class="empty-state">Nenhuma aula concluida ainda.</p>';
}

async function loadSavedLessons() {
  const target = document.querySelector("#saved-list");
  const { data, error } = await supabase
    .from("saved_lessons")
    .select("lesson_id,created_at,lessons(title,slug,tracks(title,slug))")
    .order("created_at", { ascending: false });

  if (error) {
    target.innerHTML =
      '<p class="empty-state">Salvos indisponíveis. Rode a migração da experiência do perfil.</p>';
    return;
  }

  target.innerHTML = data?.length
    ? data
        .map((item) => lessonCard(item, `Salvo em ${formatDate(item.created_at)}`))
        .join("")
    : '<p class="empty-state">Nenhum conteúdo salvo ainda.</p>';
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
    document.querySelector("#account-state").textContent = "Sessão não iniciada";
    await syncAdminNavigation(supabase, null);
    return;
  }

  try {
    await syncAdminNavigation(supabase, user);
    const record = await loadProfileRecord();
    workspace.hidden = false;
    document.querySelector("#account-state").textContent = "Conta conectada";
    await Promise.all([render(record), loadProgress(), loadSavedLessons()]);
  } catch (error) {
    guard.hidden = false;
    guard.querySelector("h2").textContent =
      "Não foi possível carregar seu perfil";
    guard.querySelector("p").textContent =
      "Confirme se a estrutura de perfis foi instalada no projeto.";
    document.querySelector("#account-state").textContent =
      "Perfil indisponível";
    return;
  }
}

async function uploadProfileMedia(file, name) {
  if (!file) return null;
  if (
    file.size > 2097152 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  ) {
    throw new Error("Use uma imagem JPG, PNG ou WebP, com ate 2 MB.");
  }
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${user.id}/${name}.${extension}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

document
  .querySelector("#profile-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const saveState = document.querySelector("#save-state");
    saveState.textContent = "Salvando...";
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

      const avatarPath = await uploadProfileMedia(
        document.querySelector("#profile-avatar-file").files[0],
        "avatar",
      );
      const coverPath = await uploadProfileMedia(
        supportsCoverPath
          ? document.querySelector("#profile-cover-file").files[0]
          : null,
        "cover",
      );
      if (avatarPath) update.avatar_path = avatarPath;
      if (coverPath && supportsCoverPath) update.cover_path = coverPath;

      const { data, error } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", user.id)
        .select(
          supportsCoverPath
            ? "id,username,display_name,bio,city,avatar_path,cover_path,is_public"
            : "id,username,display_name,bio,city,avatar_path,is_public",
        )
        .single();
      if (error) throw error;
      await supabase.auth.updateUser({ data: { name: update.display_name } });
      await render({ ...data, cover_path: data.cover_path || profile.cover_path });
      localStorage.removeItem("conectatech-mini-profile");
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
      : "Senha alterada com seguranca.";
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
    target.innerHTML = '<p class="empty-state">Buscando perfil...</p>';
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
    const image = await mediaUrl(data.avatar_path);
    target.innerHTML = `<article class="public-profile-result"><div class="avatar avatar-large">${image ? `<img src="${image}" alt="" />` : escapeHtml(data.display_name.slice(0, 2).toUpperCase())}</div><div><h3>${escapeHtml(data.display_name)}</h3><p>@${escapeHtml(data.username)}</p><p>${escapeHtml(data.bio || "")}</p><p>${escapeHtml(data.city || "")}</p></div></article>`;
  });

document.querySelector("#logout-button").addEventListener("click", async () => {
  if (!window.confirm("Deseja sair da sua conta?")) return;
  await supabase.auth.signOut();
  localStorage.removeItem("conectatech-mini-profile");
  window.location.href = "/";
});

const menuButton = document.querySelector(".menu-button");
menuButton.addEventListener("click", () => {
  const open = document.querySelector("#main-nav").classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

initialize().catch(() => notify("Não foi possível carregar a área pessoal."));
