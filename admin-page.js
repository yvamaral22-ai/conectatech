import { supabase } from "./data-client.js";

const content = document.querySelector("#admin-content");
const denied = document.querySelector("#admin-denied");
let tracks = [];

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

async function refreshAdminData() {
  const [trackResult, lessonResult, opportunityResult, auditResult] =
    await Promise.all([
    supabase
      .from("tracks")
      .select("id,slug,title,level,status,sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("lessons")
      .select("id,title,status,sort_order,tracks(title)")
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
  const lessons = lessonResult.data || [];
  const opportunities = opportunityResult.data || [];
  const auditItems = auditResult.error ? [] : auditResult.data || [];

  document.querySelector("#tracks-count").textContent = tracks.length;
  document.querySelector("#lessons-count").textContent = lessons.length;
  document.querySelector("#opportunities-count").textContent =
    opportunities.length;
  renderAudit(auditItems);

  const lessonTrack = document.querySelector("#lesson-track");
  lessonTrack.innerHTML = tracks
    .map((track) => `<option value="${track.id}">${escapeHtml(track.title)}</option>`)
    .join("");

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
            lesson.tracks?.title || "Sem trilha",
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

  const access = await supabase.rpc("is_admin");
  if (access.error) throw access.error;
  if (!access.data) throw new Error("Esta conta nao possui acesso administrativo.");

  document.querySelector("#admin-status").textContent =
    "Administrador conectado";
  content.hidden = false;
  await refreshAdminData();
}

document.querySelector("#track-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.querySelector("#track-message");
  message.textContent = "Salvando...";
  const form = new FormData(event.currentTarget);
  const title = String(form.get("title")).trim();
  const payload = {
    title,
    slug: slugify(form.get("slug") || title),
    level: form.get("level"),
    icon: String(form.get("icon") || "").trim() || "#",
    estimated_minutes: numberValue(form.get("estimated_minutes"), 30),
    lesson_count: 0,
    sort_order: numberValue(form.get("sort_order"), 1),
    description: String(form.get("description")).trim(),
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
    const title = String(form.get("title")).trim();
    const payload = {
      track_id: form.get("track_id"),
      title,
      slug: slugify(form.get("slug") || title),
      summary: String(form.get("summary") || "").trim(),
      body: String(form.get("body")).trim(),
      transcript: String(form.get("transcript") || "").trim(),
      audio_description: "",
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
  .querySelector("#opportunity-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#opportunity-message");
    message.textContent = "Salvando...";
    const form = new FormData(event.currentTarget);
    const payload = {
      type: form.get("type"),
      title: String(form.get("title")).trim(),
      organization: String(form.get("organization")).trim(),
      location: String(form.get("location") || "").trim(),
      deadline: form.get("deadline") || null,
      url: String(form.get("url")).trim(),
      description: String(form.get("description")).trim(),
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

initialize().catch((error) => {
  document.querySelector("#admin-status").textContent = "Acesso negado";
  denied.hidden = false;
  document.querySelector("#admin-denied-message").textContent = error.message;
});
