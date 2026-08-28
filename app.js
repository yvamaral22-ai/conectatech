import { createClient } from "@supabase/supabase-js";

document.documentElement.classList.add("js");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const privacyVersion = "2026-08-28";

async function supabaseUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function syncInitialConsents(user) {
  if (!supabase || !user) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || !user.user_metadata?.terms_accepted) return;
  const now = new Date().toISOString();
  const rows = [
    {
      user_id: user.id,
      purpose: "terms",
      version: user.user_metadata.terms_version || privacyVersion,
      granted: true,
      updated_at: now,
    },
    {
      user_id: user.id,
      purpose: "analytics",
      version: user.user_metadata.terms_version || privacyVersion,
      granted: Boolean(user.user_metadata.analytics_consent),
      updated_at: now,
    },
  ];
  const { error } = await supabase
    .from("consents")
    .upsert(rows, { onConflict: "user_id,purpose,version" });
  if (error && error.code !== "PGRST205") throw error;
}

let courses = [];
const catalogCacheKey = "conectatech-catalog-cache";

let currentUser = null;
let currentProfile = null;
function progressStorageKey() {
  return `conectatech-progress-${currentUser?.id || "guest"}`;
}
function readProgressState() {
  try {
    return JSON.parse(
      localStorage.getItem(progressStorageKey()) || '{"completed":[]}',
    );
  } catch (_) {
    return { completed: [] };
  }
}
let state = readProgressState();
const clientId =
  localStorage.getItem("conectatech-client-id") ||
  crypto.randomUUID?.() ||
  `client-${Date.now()}`;
localStorage.setItem("conectatech-client-id", clientId);
const grid = document.querySelector("#course-grid");

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "X-Client-Id": clientId,
      "X-ConectaTech-Request": "1",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `API indisponível (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function renderCourses(filter = "todas") {
  const visible = courses.filter(
    (course) => filter === "todas" || course.level === filter,
  );
  if (!visible.length) {
    grid.innerHTML =
      '<p class="empty-state">Nenhuma trilha publicada está disponível agora.</p>';
    return;
  }
  grid.innerHTML = visible
    .map((course) => {
      const done = state.completed.includes(course.id);
      return `<article class="course-card">
      <span class="course-icon" aria-hidden="true">${escapeHtml(course.icon)}</span>
      <h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description)}</p>
      <div class="course-meta"><span>${course.level === "iniciante" ? "Iniciante" : "Intermediário"}</span><span>${course.lessons} aulas</span><span>${course.time}</span></div>
      <button class="text-link course-action" data-course="${course.id}" type="button">${done ? "Revisar trilha" : "Começar trilha"} →</button>
    </article>`;
    })
    .join("");
}

function saveState() {
  localStorage.setItem(progressStorageKey(), JSON.stringify(state));
}
function updateProgress() {
  const percent = courses.length
    ? Math.round(
        (state.completed.filter((id) =>
          courses.some((course) => course.id === id),
        ).length /
          courses.length) *
          100,
      )
    : 0;
  document.querySelector("#progress-number").textContent = `${percent}%`;
  document.querySelector("#progress-fill").style.width = `${percent}%`;
  document
    .querySelector(".progress-bar")
    .setAttribute("aria-valuenow", percent);
  document.querySelector("#progress-message").textContent = percent
    ? `${state.completed.length} de ${courses.length} trilhas iniciadas. Continue avançando!`
    : "Comece uma trilha para acompanhar sua evolução.";
  document.querySelector("#hero-progress-fill").style.width = `${percent}%`;
  document.querySelector("#hero-progress-value").textContent = currentUser
    ? `${percent}% concluído`
    : percent
      ? `${percent}% neste aparelho`
      : "Entre para sincronizar";
  document.querySelector("#user-progress-stat").textContent = currentUser
    ? `${percent}%`
    : "—";
  document.querySelector("#user-progress-caption").textContent = currentUser
    ? `${state.completed.length} de ${courses.length} trilhas`
    : "Entre para visualizar";
  document.querySelector("#hero-session-label").textContent = currentUser
    ? "Progresso sincronizado"
    : "Modo visitante";
  document.querySelector("#progress-storage-copy").textContent = currentUser
    ? "Seu progresso é carregado e sincronizado com segurança na sua conta."
    : "No modo visitante, o progresso fica somente neste aparelho. Entre para sincronizá-lo com sua conta.";
}

async function loadPlatformMetrics() {
  if (!supabase) return;
  const { data, error } = await supabase.rpc("platform_metrics");
  if (error || !data?.length) return;
  const metrics = data[0];
  document.querySelector("#registered-stat").textContent = Number(
    metrics.registered_people,
  ).toLocaleString("pt-BR");
  document.querySelector("#active-stat").textContent = Number(
    metrics.active_learners,
  ).toLocaleString("pt-BR");
  document.querySelector("#courses-stat").textContent = Number(
    metrics.available_courses,
  ).toLocaleString("pt-BR");
  document.querySelector("#completion-rate-stat").textContent =
    `${Number(metrics.completion_rate).toLocaleString("pt-BR")}%`;
}

async function loadCatalog() {
  if (!supabase) throw new Error("Serviço temporariamente indisponível.");
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id,icon,title,level,description,duration_minutes,position,lessons(count)",
    )
    .order("position");
  if (error) throw error;
  courses = data.map((course) => ({
    ...course,
    lessons: course.lessons?.[0]?.count || 0,
    time: `${course.duration_minutes}min`,
  }));
  localStorage.setItem(catalogCacheKey, JSON.stringify(courses));
  renderCourses();
  updateProgress();
}

function loadCachedCatalog() {
  try {
    courses = JSON.parse(localStorage.getItem(catalogCacheKey) || "[]");
  } catch (_) {
    courses = [];
  }
  renderCourses();
  updateProgress();
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}
function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "#";
  } catch (_) {
    return "#";
  }
}

async function loadOpportunities() {
  const list = document.querySelector("#opportunity-list");
  if (!supabase) {
    list.innerHTML =
      '<p class="empty-state">Oportunidades temporariamente indisponíveis.</p>';
    return;
  }
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id,kind,title,organization,source_url,description,closes_at,verified_at",
    )
    .order("verified_at", { ascending: false });
  if (error || !data?.length) {
    list.innerHTML =
      '<p class="empty-state">Nenhuma oportunidade verificada e vigente está publicada agora.</p>';
    return;
  }
  list.innerHTML = data
    .map(
      (item) =>
        `<article><span class="tag">${escapeHtml(item.kind)}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.organization)} • ${escapeHtml(item.description)}${item.closes_at ? ` • Até ${new Date(item.closes_at).toLocaleDateString("pt-BR")}` : ""}</p></div><a href="${safeExternalUrl(item.source_url)}" target="_blank" rel="noopener noreferrer">Fonte oficial →</a></article>`,
    )
    .join("");
}

function openDialog(
  title,
  copy,
  label = "Conte para nós (opcional)",
  category = "geral",
) {
  document.querySelector("#dialog-title").textContent = title;
  document.querySelector("#dialog-copy").textContent = copy;
  document.querySelector('label[for="dialog-input"]').textContent = label;
  document.querySelector("#dialog-input").value = "";
  document.querySelector("#dialog").dataset.category = category;
  document.querySelector("#dialog").showModal();
}

renderCourses();
updateProgress();

document.querySelectorAll(".filter").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-pressed", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    renderCourses(button.dataset.filter);
  }),
);

grid.addEventListener("click", (event) => {
  const button = event.target.closest(".course-action");
  if (!button) return;
  openLesson(`${button.dataset.course}-1`);
});

document
  .querySelector("#continue-button")
  .addEventListener("click", () =>
    document.querySelector(".course-action")?.click(),
  );
document
  .querySelectorAll(".resource-action")
  .forEach((button) =>
    button.addEventListener("click", () =>
      openDialog(
        `Seu ${button.dataset.resource}`,
        "Este protótipo apresenta o ponto de entrada do recurso. O fluxo completo será conectado ao perfil do usuário.",
      ),
    ),
  );
document
  .querySelector("#feedback-button")
  .addEventListener("click", () =>
    openDialog(
      "Relatar uma barreira",
      "Descreva a dificuldade encontrada. O relato será analisado pela equipe de acessibilidade.",
      "Qual barreira você encontrou?",
      "barreira",
    ),
  );

document
  .querySelector("#dialog form")
  .addEventListener("submit", async (event) => {
    const message = document.querySelector("#dialog-input").value.trim();
    if (event.submitter?.value !== "confirm" || !message) return;
    const category = document.querySelector("#dialog").dataset.category;
    try {
      const user = await supabaseUser();
      if (!user) throw new Error("offline");
      const { data, error } = await supabase
        .from("feedback")
        .insert({ user_id: user.id, category, message })
        .select("id")
        .single();
      if (error) throw error;
      document.querySelector("#offline-status").textContent =
        `Mensagem registrada. Protocolo ${data.id.slice(0, 8)}.`;
      document.querySelector("#offline-status").style.display = "block";
      setTimeout(
        () =>
          document
            .querySelector("#offline-status")
            .style.removeProperty("display"),
        5000,
      );
    } catch (_) {
      localStorage.setItem(
        `conectatech-feedback-${Date.now()}`,
        JSON.stringify({ message, category }),
      );
    }
  });

let activeLesson;
async function openLesson(lessonId) {
  try {
    if (!supabase) throw new Error("Serviço temporariamente indisponível");
    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("id,course_id,title,summary,content,question,answer,options")
      .eq("id", lessonId)
      .single();
    if (error) throw error;
    activeLesson = { ...lesson, courseId: lesson.course_id };
    document.querySelector("#lesson-title").textContent = activeLesson.title;
    document.querySelector("#lesson-summary").textContent =
      activeLesson.summary;
    document.querySelector("#lesson-content").innerHTML =
      `<p>${activeLesson.content}</p>`;
    document.querySelector("#lesson-question").textContent =
      activeLesson.question;
    document.querySelector("#lesson-options").innerHTML = activeLesson.options
      .map(
        (option, index) =>
          `<label class="lesson-option"><input type="radio" name="answer" value="${option}" ${index === 0 ? "required" : ""}> <span>${option}</span></label>`,
      )
      .join("");
    document.querySelector("#exercise-result").textContent = "";
    document.querySelector("#lesson-dialog").showModal();
  } catch (_) {
    openDialog(
      "Aula indisponível",
      "Não foi possível carregar esta aula. Tente novamente quando estiver online.",
    );
  }
}

document.querySelector("#exercise-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = new FormData(event.currentTarget).get("answer");
  const result = document.querySelector("#exercise-result");
  if (selected !== activeLesson.answer) {
    result.className = "answer-wrong";
    result.textContent = "Ainda não. Releia o conteúdo e tente outra opção.";
    return;
  }
  result.className = "answer-correct";
  result.textContent = "Resposta correta! Seu progresso foi salvo.";
  if (!state.completed.includes(activeLesson.courseId))
    state.completed.push(activeLesson.courseId);
  saveState();
  updateProgress();
  renderCourses(document.querySelector(".filter.active").dataset.filter);
  saveRemoteProgress(activeLesson.courseId);
});

document
  .querySelectorAll("[data-close]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      document.querySelector(`#${button.dataset.close}`).close(),
    ),
  );

let registerMode = false;
const authDialog = document.querySelector("#auth-dialog");
const accountButton = document.querySelector("#account-button");
function setAuthMode(register) {
  registerMode = register;
  document.querySelector("#auth-title").textContent = register
    ? "Criar conta"
    : "Entrar";
  document.querySelector("#name-field").hidden = !register;
  document.querySelector("#consent-fields").hidden = !register;
  document.querySelector("#auth-name").required = register;
  document.querySelector('[name="termsAccepted"]').required = register;
  document.querySelector("#auth-password").autocomplete = register
    ? "new-password"
    : "current-password";
  document.querySelector("#auth-mode").textContent = register
    ? "Já tenho uma conta"
    : "Ainda não tenho conta";
  document.querySelector("#auth-message").textContent = "";
}
accountButton.addEventListener("click", async () => {
  if (accountButton.dataset.authenticated === "true") {
    window.location.href = "/perfil.html";
    return;
  }
  setAuthMode(false);
  authDialog.showModal();
});
document
  .querySelector("#auth-mode")
  .addEventListener("click", () => setAuthMode(!registerMode));
document
  .querySelector("#auth-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.termsAccepted = data.termsAccepted === "on";
    data.analyticsConsent = data.analyticsConsent === "on";
    try {
      let user;
      if (supabase) {
        const operation = registerMode
          ? supabase.auth.signUp({
              email: data.email,
              password: data.password,
              options: {
                data: {
                  name: data.name,
                  terms_version: "2026-08-28",
                  terms_accepted: true,
                  analytics_consent: data.analyticsConsent,
                },
              },
            })
          : supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password,
            });
        const { data: result, error } = await operation;
        if (error) throw error;
        user = result.user;
        if (!result.session && registerMode) {
          authDialog.close();
          accountButton.dataset.authenticated = "false";
          accountButton.textContent = "Entrar";
          document.querySelector("#offline-status").textContent =
            "Confira seu e-mail para confirmar a conta e depois entre.";
          document.querySelector("#offline-status").style.display = "block";
          return;
        }
        await syncInitialConsents(user);
      } else {
        const result = await api(
          registerMode ? "/auth/register" : "/auth/login",
          { method: "POST", body: JSON.stringify(data) },
        );
        user = result.user;
      }
      currentUser = user;
      accountButton.textContent = (
        user.user_metadata?.name ||
        user.name ||
        user.email
      ).split(" ")[0];
      accountButton.dataset.authenticated = "true";
      authDialog.close();
      await loadUserProgress();
      await loadMyProfile();
    } catch (error) {
      document.querySelector("#auth-message").textContent = error.message;
    }
  });

async function profileAvatarUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

async function renderProfile(profile, targetPrefix = "my") {
  const avatar = document.querySelector(`#${targetPrefix}-avatar`);
  if (avatar) {
    const url = await profileAvatarUrl(profile.avatar_path);
    avatar.innerHTML = url
      ? `<img src="${url}" alt="">`
      : escapeHtml(profile.display_name.slice(0, 2).toUpperCase());
  }
  if (targetPrefix === "my") {
    document.querySelector("#profile-name").textContent = profile.display_name;
    document.querySelector("#profile-username").textContent =
      `@${profile.username}`;
    document.querySelector("#profile-bio").textContent =
      profile.bio || "Nenhuma apresentação adicionada.";
    document.querySelector("#profile-city").textContent = profile.city || "";
    document.querySelector("#profile-visibility").textContent =
      profile.is_public ? "Perfil público" : "Perfil privado";
  }
}

async function loadMyProfile() {
  if (!currentUser || !supabase) return;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,city,avatar_path,is_public")
    .eq("id", currentUser.id)
    .single();
  if (error) return;
  currentProfile = data;
  await renderProfile(data);
}

document
  .querySelector("#profile-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#profile-message");
    try {
      const form = new FormData(event.currentTarget);
      const displayName = String(form.get("display_name")).trim();
      const username = String(form.get("username")).trim().toLowerCase();
      const update = {
        display_name: displayName || currentProfile.display_name,
        username: username || currentProfile.username,
        bio: String(form.get("bio")).trim() || currentProfile.bio || "",
        city: String(form.get("city")).trim() || currentProfile.city || "",
        is_public: form.get("is_public") === "on",
        updated_at: new Date().toISOString(),
      };
      const file = document.querySelector("#profile-avatar-file").files[0];
      if (file) {
        if (
          file.size > 2097152 ||
          !["image/jpeg", "image/png", "image/webp"].includes(file.type)
        )
          throw new Error("Use uma imagem JPG, PNG ou WebP de até 2 MB.");
        const extension = file.type.split("/")[1].replace("jpeg", "jpg");
        const path = `${currentUser.id}/avatar.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        update.avatar_path = path;
      }
      const { data, error } = await supabase
        .from("profiles")
        .update(update)
        .eq("id", currentUser.id)
        .select("id,username,display_name,bio,city,avatar_path,is_public")
        .single();
      if (error) throw error;
      await supabase.auth.updateUser({ data: { name: update.display_name } });
      currentProfile = data;
      await renderProfile(data);
      document.querySelector("#profile-dialog").close();
    } catch (error) {
      message.textContent =
        error.code === "23505"
          ? "Esse nome de usuário já está em uso."
          : error.message;
    }
  });

document
  .querySelector("#profile-search-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = document.querySelector("#profile-search-result");
    const username = document
      .querySelector("#profile-search")
      .value.trim()
      .toLowerCase();
    const { data, error } = await supabase
      .from("profiles")
      .select("username,display_name,bio,city,avatar_path")
      .eq("username", username)
      .eq("is_public", true)
      .maybeSingle();
    if (error || !data) {
      result.innerHTML =
        '<p class="empty-state">Perfil público não encontrado.</p>';
      return;
    }
    const avatarUrl = await profileAvatarUrl(data.avatar_path);
    result.innerHTML = `<article class="public-profile-result"><div class="avatar">${avatarUrl ? `<img src="${avatarUrl}" alt="">` : escapeHtml(data.display_name.slice(0, 2).toUpperCase())}</div><div><h3>${escapeHtml(data.display_name)}</h3><p>@${escapeHtml(data.username)}</p><p>${escapeHtml(data.bio || "")}</p><p>${escapeHtml(data.city || "")}</p></div></article>`;
  });

document.querySelector("#logout-button").addEventListener("click", async () => {
  if (!currentUser || !confirm("Deseja sair da sua conta?")) return;
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  state = readProgressState();
  accountButton.dataset.authenticated = "false";
  accountButton.textContent = "Entrar";
  updateProgress();
  renderCourses(document.querySelector(".filter.active").dataset.filter);
  document.querySelector("#profile-name").textContent = "Seu perfil";
  document.querySelector("#profile-username").textContent = "";
  document.querySelector("#profile-bio").textContent =
    "Seu perfil permanece vinculado à sua conta com segurança.";
  document.querySelector("#profile-visibility").textContent =
    "Entre para criar seu perfil";
});

const privacyDialog = document.querySelector("#privacy-dialog");
async function exportPersonalData() {
  if (!supabase) return api("/privacy/export");
  const user = await supabaseUser();
  if (!user) throw new Error("Entre na conta para continuar.");
  const [progress, consents, feedback] = await Promise.all([
    supabase
      .from("course_progress")
      .select("course_id, completed_at, updated_at"),
    supabase
      .from("consents")
      .select("purpose, version, granted, created_at, updated_at"),
    supabase.from("feedback").select("category, message, created_at"),
  ]);
  const error = progress.error || consents.error || feedback.error;
  if (error) throw error;
  return {
    account: { id: user.id, email: user.email, name: user.user_metadata?.name },
    progress: progress.data,
    consents: consents.data,
    feedback: feedback.data,
  };
}
document
  .querySelector("#privacy-button")
  .addEventListener("click", async () => {
    if (accountButton.dataset.authenticated !== "true") {
      setAuthMode(false);
      authDialog.showModal();
      return;
    }
    const exported = await exportPersonalData().catch((error) => {
      document.querySelector("#offline-status").textContent = error.message;
      return null;
    });
    if (!exported) return;
    const analytics = exported.consents.find(
      (item) => item.purpose === "analytics",
    );
    document.querySelector("#analytics-consent").checked = Boolean(
      analytics?.granted,
    );
    document.querySelector("#privacy-message").textContent = "";
    privacyDialog.showModal();
  });
document
  .querySelector("#analytics-consent")
  .addEventListener("change", async (event) => {
    try {
      if (supabase) {
        const user = await supabaseUser();
        const { error } = await supabase.from("consents").upsert(
          {
            user_id: user.id,
            purpose: "analytics",
            version: privacyVersion,
            granted: event.target.checked,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,purpose,version" },
        );
        if (error) throw error;
      } else
        await api("/privacy/consent", {
          method: "POST",
          body: JSON.stringify({
            purpose: "analytics",
            granted: event.target.checked,
          }),
        });
      document.querySelector("#privacy-message").textContent =
        "Preferência de consentimento salva.";
    } catch (error) {
      event.target.checked = !event.target.checked;
      document.querySelector("#privacy-message").textContent = error.message;
    }
  });
document.querySelector("#export-data").addEventListener("click", async () => {
  try {
    const data = await exportPersonalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "conectatech-meus-dados.json";
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    document.querySelector("#privacy-message").textContent = error.message;
  }
});
document
  .querySelector("#delete-account")
  .addEventListener("click", async () => {
    const password = document.querySelector("#delete-password").value;
    const confirmation = document.querySelector("#delete-confirmation").value;
    try {
      await api("/privacy/delete", {
        method: "POST",
        body: JSON.stringify({ password, confirmation }),
      });
      localStorage.removeItem("conectatech-state");
      accountButton.dataset.authenticated = "false";
      accountButton.textContent = "Entrar";
      privacyDialog.close();
      location.reload();
    } catch (error) {
      document.querySelector("#privacy-message").textContent = error.message;
    }
  });

const menuButton = document.querySelector(".menu-button");
menuButton.addEventListener("click", () => {
  const open = document.querySelector("#main-nav").classList.toggle("open");
  menuButton.setAttribute("aria-expanded", open);
});
document.querySelectorAll("#main-nav a").forEach((link) =>
  link.addEventListener("click", () => {
    document.querySelector("#main-nav").classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }),
);

document.querySelector("#text-size").addEventListener("click", () => {
  document.body.classList.toggle("large-text");
  localStorage.setItem(
    "conectatech-large-text",
    document.body.classList.contains("large-text"),
  );
});
const contrast = document.querySelector("#contrast");
contrast.addEventListener("click", () => {
  const active = document.body.classList.toggle("high-contrast");
  contrast.setAttribute("aria-pressed", active);
  localStorage.setItem("conectatech-contrast", active);
});
if (localStorage.getItem("conectatech-large-text") === "true")
  document.body.classList.add("large-text");
if (localStorage.getItem("conectatech-contrast") === "true") {
  document.body.classList.add("high-contrast");
  contrast.setAttribute("aria-pressed", "true");
}

function connectionStatus() {
  document.body.classList.toggle("offline", !navigator.onLine);
  document.querySelector("#offline-status").textContent = navigator.onLine
    ? ""
    : "Você está offline. O conteúdo salvo continua disponível.";
}
addEventListener("online", connectionStatus);
addEventListener("offline", connectionStatus);
connectionStatus();

async function loadUserProgress() {
  try {
    if (supabase) {
      if (!currentUser) return;
      const { data, error } = await supabase
        .from("course_progress")
        .select("course_id");
      if (error) throw error;
      state = { completed: data.map((item) => item.course_id) };
    } else state = { completed: (await api("/progress")).completed };
    saveState();
    updateProgress();
    renderCourses(document.querySelector(".filter.active").dataset.filter);
  } catch (_) {
    state = readProgressState();
    updateProgress();
    renderCourses(document.querySelector(".filter.active").dataset.filter);
  }
}
async function saveRemoteProgress(courseId) {
  try {
    if (supabase) {
      if (!currentUser) return;
      const now = new Date().toISOString();
      const { error } = await supabase.from("course_progress").upsert(
        {
          user_id: currentUser.id,
          course_id: courseId,
          completed_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,course_id" },
      );
      if (error) throw error;
    } else
      await api("/progress", {
        method: "POST",
        body: JSON.stringify({ courseId }),
      });
  } catch (_) {
    /* O progresso local será preservado até a próxima sincronização. */
  }
}
async function initializeFromServer() {
  try {
    await loadCatalog();
  } catch (_) {
    loadCachedCatalog();
  }
  try {
    const user = supabase
      ? (await supabase.auth.getUser()).data.user
      : (await api("/me")).user;
    if (user) {
      currentUser = user;
      await syncInitialConsents(user);
      accountButton.textContent = (
        user.user_metadata?.name ||
        user.name ||
        user.email
      ).split(" ")[0];
      accountButton.dataset.authenticated = "true";
      await loadUserProgress();
      await loadMyProfile();
    }
  } catch (_) {
    /* O uso sem conta permanece disponível. */
  }
  updateProgress();
  loadPlatformMetrics();
  loadOpportunities();
}
initializeFromServer();

if (new URLSearchParams(window.location.search).get("entrar") === "1") {
  setAuthMode(false);
  authDialog.showModal();
  history.replaceState({}, "", window.location.pathname);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8%" },
);
document
  .querySelectorAll(".reveal")
  .forEach((element) => revealObserver.observe(element));

const depthScene = document.querySelector(".depth-scene");
if (
  depthScene &&
  matchMedia("(pointer:fine)").matches &&
  !matchMedia("(prefers-reduced-motion:reduce)").matches
) {
  depthScene.addEventListener("pointermove", (event) => {
    const bounds = depthScene.getBoundingClientRect();
    depthScene.style.setProperty(
      "--rotate-y",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 8}deg`,
    );
    depthScene.style.setProperty(
      "--rotate-x",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * -8}deg`,
    );
  });
  depthScene.addEventListener("pointerleave", () => {
    depthScene.style.setProperty("--rotate-x", "0deg");
    depthScene.style.setProperty("--rotate-y", "0deg");
  });
}

if ("serviceWorker" in navigator)
  addEventListener("load", async () => {
    await navigator.serviceWorker.register("./service-worker.js");
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  });
