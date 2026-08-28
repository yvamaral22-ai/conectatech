import { currentUserRole, syncAdminNavigation } from "./admin-access.js";
import { supabase } from "./data-client.js";

const content = document.querySelector("#admin-content");
const denied = document.querySelector("#admin-denied");
let tracks = [];
let lessons = [];
let currentRole = "student";

function escapeHtml(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function statusFrom(formData) {
  return formData.get("published") === "on" ? "published" : "draft";
}

function linesFrom(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const editorialCorrections = new Map([
  ["acessibilidade", "acessibilidade"],
  ["basica", "básica"],
  ["basico", "básico"],
  ["conteudo", "conteúdo"],
  ["conteudos", "conteúdos"],
  ["curriculo", "currículo"],
  ["digitalizacao", "digitalização"],
  ["educacao", "educação"],
  ["informatica", "informática"],
  ["introducao", "introdução"],
  ["logica", "lógica"],
  ["pagina", "página"],
  ["paginas", "páginas"],
  ["portfolio", "portfólio"],
  ["programacao", "programação"],
  ["proprio", "próprio"],
  ["propria", "própria"],
  ["seguranca", "segurança"],
  ["tecnologia", "tecnologia"],
  ["usuario", "usuário"],
  ["usuarios", "usuários"],
  ["video", "vídeo"],
  ["videos", "vídeos"],
]);

const brandCorrections = new Map([
  ["abnt2", "ABNT2"],
  ["css", "CSS"],
  ["github", "GitHub"],
  ["html", "HTML"],
  ["javascript", "JavaScript"],
  ["lgpd", "LGPD"],
  ["supabase", "Supabase"],
  ["wcag", "WCAG"],
  ["youtube", "YouTube"],
]);

function preserveInitialCase(original, corrected) {
  return original[0] === original[0]?.toUpperCase()
    ? corrected.charAt(0).toUpperCase() + corrected.slice(1)
    : corrected;
}

function applyWordCorrections(value) {
  return String(value || "").replace(/[A-Za-zÀ-ÿ0-9]+/g, (word) => {
    const lower = word.toLowerCase();
    if (brandCorrections.has(lower)) return brandCorrections.get(lower);
    if (editorialCorrections.has(lower)) {
      return preserveInitialCase(word, editorialCorrections.get(lower));
    }
    return word;
  });
}

function normalizeSpacing(value, multiline = false) {
  const text = String(value || "")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])(?=\S)/g, "$1 ");
  return multiline
    ? text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n\n")
    : text.replace(/\s+/g, " ").trim();
}

function capitalizeSentences(value) {
  return String(value || "").replace(/(^|[.!?]\s+)([a-zà-ÿ])/g, (match, prefix, letter) =>
    `${prefix}${letter.toUpperCase()}`,
  );
}

function ensureFinalPunctuation(value) {
  const text = String(value || "").trim();
  return text && !/[.!?:;]$/.test(text) ? `${text}.` : text;
}

function formatTitle(value) {
  return capitalizeSentences(applyWordCorrections(normalizeSpacing(value)));
}

function formatText(value, { multiline = false, finalPunctuation = true } = {}) {
  const corrected = capitalizeSentences(
    applyWordCorrections(normalizeSpacing(value, multiline)),
  );
  return finalPunctuation ? ensureFinalPunctuation(corrected) : corrected;
}

function formatObjectives(value) {
  return linesFrom(value).map((line) =>
    formatText(line, { finalPunctuation: false }),
  );
}

function fileExtension(file) {
  const name = file?.name || "";
  return name.includes(".") ? name.split(".").pop().toLowerCase() : "bin";
}

async function uploadLessonMedia(kind, file) {
  if (!file || !file.size) return null;
  const path = `${kind}/${crypto.randomUUID()}.${fileExtension(file)}`;
  const { error } = await supabase.storage
    .from("lesson-media")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (error) throw error;
  return path;
}

function renderEmpty(target, message) {
  target.innerHTML = `<p class="empty-state">${message}</p>`;
}

function adminItem(table, id, title, detail, status) {
  return `<article class="admin-item"><div><strong>${escapeHtml(
    title,
  )}</strong><span>${escapeHtml(detail || "")}</span><small>${escapeHtml(
    status,
  )}</small></div><button class="text-link danger" data-table="${table}" data-id="${id}" type="button">Excluir</button></article>`;
}

function roleLabel(role) {
  return {
    admin: "Administrador",
    teacher: "Professor",
    student: "Aluno",
  }[role] || "Aluno";
}

function renderUsers(items = []) {
  const section = document.querySelector("#users-admin-section");
  const overview = document.querySelector("#users-overview");
  if (currentRole !== "admin") {
    section.hidden = true;
    overview.hidden = true;
    return;
  }

  section.hidden = false;
  overview.hidden = false;
  document.querySelector("#users-count").textContent = items.length;
  const target = document.querySelector("#users-list");
  if (!items.length) {
    renderEmpty(target, "Nenhum usuario encontrado.");
    return;
  }

  target.innerHTML = items
    .map(
      (item) =>
        `<article class="admin-item user-admin-item"><div><strong>${escapeHtml(
          item.display_name || item.email || "Usuario",
        )}</strong><span>${escapeHtml(item.email || "Sem e-mail")}</span><small>${escapeHtml(
          `${roleLabel(item.role)} - ${item.is_active ? "ativo" : "inativo"}`,
        )}</small></div><div class="user-admin-actions"><select data-user-role="${
          item.user_id
        }" aria-label="Permissao"><option value="student" ${
          item.role === "student" ? "selected" : ""
        }>Aluno</option><option value="teacher" ${
          item.role === "teacher" ? "selected" : ""
        }>Professor</option><option value="admin" ${
          item.role === "admin" ? "selected" : ""
        }>Admin</option></select><button class="text-link" data-user-active="${
          item.user_id
        }" data-active="${item.is_active ? "false" : "true"}" type="button">${
          item.is_active ? "Desativar" : "Ativar"
        }</button><button class="text-link danger" data-user-delete="${
          item.user_id
        }" type="button">Remover</button></div></article>`,
    )
    .join("");
}

function formatDate(value) {
  if (!value) return "sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function auditLabel(action) {
  return {
    insert: "criou",
    update: "alterou",
    delete: "excluiu",
  }[action] || action;
}

function fillLessonSelect(target, placeholder = "Escolha uma aula") {
  target.innerHTML =
    `<option value="">${escapeHtml(placeholder)}</option>` +
    lessons
      .map(
        (lesson) =>
          `<option value="${lesson.id}">${escapeHtml(lesson.title)}</option>`,
      )
      .join("");
}

function renderAudit(items = []) {
  const target = document.querySelector("#audit-list");
  document.querySelector("#audit-count").textContent = items.length;
  if (!items.length) {
    renderEmpty(target, "Nenhuma alteracao registrada ainda.");
    return;
  }
  target.innerHTML = items
    .map(
      (item) =>
        `<article class="admin-item audit-item"><div><strong>${escapeHtml(
          auditLabel(item.action),
        )} ${escapeHtml(item.record_title || item.record_id || "registro")}</strong><span>${escapeHtml(
          item.table_name,
        )}</span><small>${escapeHtml(formatDate(item.created_at))}</small></div></article>`,
    )
    .join("");
}

async function hasAdminAccess(userId) {
  currentRole = await currentUserRole(supabase, userId);
  return ["admin", "teacher"].includes(currentRole);
}

async function refreshAdminData() {
  const [
    trackResult,
    lessonResult,
    opportunityResult,
    auditResult,
    usersResult,
  ] =
    await Promise.all([
      supabase
        .from("tracks")
        .select("id,slug,title,level,status,sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("lessons")
        .select(
          "id,title,status,sort_order,source_type,video_provider,page_count,tracks(title)",
        )
        .order("sort_order", { ascending: true })
        .limit(40),
      supabase
        .from("opportunities")
        .select("id,type,title,organization,status,created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("audit_logs")
        .select("id,action,table_name,record_id,record_title,created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      currentRole === "admin"
        ? supabase.rpc("admin_list_users")
        : Promise.resolve({ data: [], error: null }),
    ]);

  const error = trackResult.error || lessonResult.error || opportunityResult.error;
  if (error) throw error;
  if (auditResult.error) {
    document.querySelector("#audit-message").textContent =
      "Auditoria indisponivel. Rode a migracao admin_audit_logs.";
  } else {
    document.querySelector("#audit-message").textContent = "";
  }

  tracks = trackResult.data || [];
  lessons = lessonResult.data || [];
  const opportunities = opportunityResult.data || [];
  const auditItems = auditResult.error ? [] : auditResult.data || [];
  const users = usersResult.error ? [] : usersResult.data || [];

  document.querySelector("#tracks-count").textContent = tracks.length;
  document.querySelector("#lessons-count").textContent = lessons.length;
  document.querySelector("#opportunities-count").textContent =
    opportunities.length;
  renderAudit(auditItems);
  renderUsers(users);
  document.querySelector("#users-message").textContent =
    usersResult.error && currentRole === "admin"
      ? "Gestao de usuarios indisponivel. Rode a migracao de papeis."
      : "";

  const lessonTrack = document.querySelector("#lesson-track");
  lessonTrack.innerHTML = tracks
    .map((track) => `<option value="${track.id}">${escapeHtml(track.title)}</option>`)
    .join("");
  fillLessonSelect(document.querySelector("#section-lesson"));
  fillLessonSelect(document.querySelector("#material-lesson"));

  const tracksList = document.querySelector("#tracks-list");
  const lessonsList = document.querySelector("#lessons-list");
  const opportunitiesList = document.querySelector("#opportunities-list");

  tracksList.innerHTML = tracks.length
    ? tracks
        .map((track) =>
          adminItem("tracks", track.id, track.title, track.level, track.status),
        )
        .join("")
    : "";
  lessonsList.innerHTML = lessons.length
    ? lessons
        .map((lesson) =>
          adminItem(
            "lessons",
            lesson.id,
            lesson.title,
            `${lesson.tracks?.title || "Sem trilha"} - ${lesson.source_type || "own"} - ${lesson.page_count || 1} pagina(s)`,
            lesson.status,
          ),
        )
        .join("")
    : "";
  opportunitiesList.innerHTML = opportunities.length
    ? opportunities
        .map((item) =>
          adminItem(
            "opportunities",
            item.id,
            item.title,
            `${item.type} - ${item.organization || "Sem organizacao"}`,
            item.status,
          ),
        )
        .join("")
    : "";

  if (!tracks.length) renderEmpty(tracksList, "Nenhuma trilha cadastrada.");
  if (!lessons.length) renderEmpty(lessonsList, "Nenhuma aula cadastrada.");
  if (!opportunities.length)
    renderEmpty(opportunitiesList, "Nenhuma oportunidade cadastrada.");
}

async function initialize() {
  if (!supabase) throw new Error("Supabase nao configurado.");
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Entre na conta de administrador.");

  const access = await hasAdminAccess(data.user.id);
  if (!access) throw new Error("Esta conta nao possui acesso ao painel.");

  await syncAdminNavigation(supabase, data.user);
  document.querySelector(".page-heading h1").textContent =
    currentRole === "admin" ? "Administracao" : "Estudio de conteudo";
  document.querySelector("#admin-status").textContent =
    currentRole === "admin" ? "Administrador conectado" : "Professor conectado";
  content.hidden = false;
  await refreshAdminData();
}

document.querySelector("#track-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.querySelector("#track-message");
  message.textContent = "Salvando...";
  const form = new FormData(event.currentTarget);
  const title = formatTitle(form.get("title"));
  const payload = {
    title,
    slug: slugify(form.get("slug") || title),
    level: form.get("level"),
    icon: String(form.get("icon") || "").trim() || "#",
    estimated_minutes: numberValue(form.get("estimated_minutes"), 30),
    lesson_count: 0,
    sort_order: numberValue(form.get("sort_order"), 1),
    description: formatText(form.get("description"), { multiline: true }),
    status: statusFrom(form),
  };
  const { error } = await supabase.from("tracks").insert(payload);
  message.textContent = error ? error.message : "Trilha salva.";
  if (!error) {
    event.currentTarget.reset();
    await refreshAdminData();
  }
});

document
  .querySelector("#lesson-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#lesson-message");
    message.textContent = "Salvando...";
    const form = new FormData(event.currentTarget);
    const title = formatTitle(form.get("title"));
    const uploadedVideo = await uploadLessonMedia(
      "videos",
      form.get("video_file"),
    );
    const payload = {
      track_id: form.get("track_id"),
      title,
      slug: slugify(form.get("slug") || title),
      summary: formatText(form.get("summary")),
      body: formatText(form.get("body"), { multiline: true }),
      transcript: formatText(form.get("transcript"), { multiline: true }),
      audio_description: "",
      source_type: form.get("source_type"),
      video_provider: uploadedVideo ? "supabase_storage" : form.get("video_provider"),
      video_url: uploadedVideo || String(form.get("video_url") || "").trim() || null,
      instructor_name: formatTitle(form.get("instructor_name")) || null,
      partner_name: formatTitle(form.get("partner_name")) || null,
      content_format: form.get("content_format"),
      page_count: numberValue(form.get("page_count"), 1),
      learning_objectives: formatObjectives(form.get("learning_objectives")),
      estimated_minutes: numberValue(form.get("estimated_minutes"), 15),
      sort_order: numberValue(form.get("sort_order"), 1),
      status: statusFrom(form),
    };
    const { error } = await supabase.from("lessons").insert(payload);
    message.textContent = error ? error.message : "Aula salva.";
    if (!error) {
      event.currentTarget.reset();
      await refreshAdminData();
    }
  });

document
  .querySelector("#section-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#section-message");
    message.textContent = "Salvando pagina...";
    const form = new FormData(event.currentTarget);
    const payload = {
      lesson_id: form.get("lesson_id"),
      title: formatTitle(form.get("title")),
      body: formatText(form.get("body"), { multiline: true }),
      sort_order: numberValue(form.get("sort_order"), 1),
      estimated_minutes: numberValue(form.get("estimated_minutes"), 5),
    };
    const { error } = await supabase.from("lesson_sections").insert(payload);
    message.textContent = error ? error.message : "Pagina salva.";
    if (!error) event.currentTarget.reset();
  });

document
  .querySelector("#material-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#section-message");
    message.textContent = "Adicionando material...";
    const form = new FormData(event.currentTarget);
    const uploadedMaterial = await uploadLessonMedia(
      "materials",
      form.get("material_file"),
    );
    const externalUrl = String(form.get("file_url") || "").trim();
    const payload = {
      lesson_id: form.get("lesson_id"),
      title: formatTitle(form.get("title")),
      file_url: uploadedMaterial || externalUrl,
      file_type: String(form.get("file_type")),
      is_downloadable: true,
    };
    if (!payload.file_url) {
      message.textContent = "Informe uma URL ou envie um arquivo.";
      return;
    }
    const { error } = await supabase.from("materials").insert(payload);
    message.textContent = error ? error.message : "Material adicionado.";
    if (!error) event.currentTarget.reset();
  });

document
  .querySelector("#opportunity-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#opportunity-message");
    message.textContent = "Salvando...";
    const form = new FormData(event.currentTarget);
    const payload = {
      type: form.get("type"),
      title: formatTitle(form.get("title")),
      organization: formatTitle(form.get("organization")),
      location: formatText(form.get("location"), {
        finalPunctuation: false,
      }),
      deadline: form.get("deadline") || null,
      url: String(form.get("url")).trim(),
      description: formatText(form.get("description"), { multiline: true }),
      status: statusFrom(form),
    };
    const { error } = await supabase.from("opportunities").insert(payload);
    message.textContent = error ? error.message : "Oportunidade salva.";
    if (!error) {
      event.currentTarget.reset();
      await refreshAdminData();
    }
  });

document.querySelector("#refresh-admin").addEventListener("click", () => {
  refreshAdminData().catch((error) => {
    document.querySelector("#admin-status").textContent = error.message;
  });
});

document.querySelector("#admin-content").addEventListener("click", async (event) => {
  const activeButton = event.target.closest("[data-user-active]");
  if (activeButton) {
    const { error } = await supabase.rpc("admin_set_user_active", {
      target_user_id: activeButton.dataset.userActive,
      active: activeButton.dataset.active === "true",
    });
    document.querySelector("#users-message").textContent = error
      ? error.message
      : "Usuario atualizado.";
    if (!error) await refreshAdminData();
    return;
  }

  const deleteUserButton = event.target.closest("[data-user-delete]");
  if (deleteUserButton) {
    const confirmation = window.prompt(
      'Digite "EXCLUIR" para remover esta conta.',
    );
    if (confirmation !== "EXCLUIR") return;
    const { error } = await supabase.rpc("admin_delete_user", {
      target_user_id: deleteUserButton.dataset.userDelete,
      confirmation,
    });
    document.querySelector("#users-message").textContent = error
      ? error.message
      : "Usuario removido.";
    if (!error) await refreshAdminData();
    return;
  }

  const button = event.target.closest("[data-table][data-id]");
  if (!button) return;
  if (!window.confirm("Excluir este item?")) return;
  const { error } = await supabase
    .from(button.dataset.table)
    .delete()
    .eq("id", button.dataset.id);
  if (error) {
    document.querySelector("#admin-status").textContent = error.message;
    return;
  }
  await refreshAdminData();
});

document
  .querySelector("#admin-content")
  .addEventListener("change", async (event) => {
    const select = event.target.closest("[data-user-role]");
    if (!select) return;
    const { error } = await supabase.rpc("admin_set_user_role", {
      target_user_id: select.dataset.userRole,
      target_role: select.value,
    });
    document.querySelector("#users-message").textContent = error
      ? error.message
      : "Permissao atualizada.";
    if (!error) await refreshAdminData();
  });

initialize().catch((error) => {
  document.querySelector("#admin-status").textContent = "Acesso negado";
  denied.hidden = false;
  document.querySelector("#admin-denied-message").textContent = error.message;
});
