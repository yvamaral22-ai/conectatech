import { supabase } from "./data-client.js";
import "./page-shell.js";

const lessonId = new URLSearchParams(location.search).get("id");

async function currentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

function escapeHtml(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

function youtubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const id =
      parsed.hostname.includes("youtu.be")
        ? parsed.pathname.slice(1)
        : parsed.searchParams.get("v");
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

async function signedLessonMediaUrl(path) {
  if (!path) return null;
  if (isExternalUrl(path)) return path;
  const { data, error } = await supabase.storage
    .from("lesson-media")
    .createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

function renderVideo(lesson) {
  if (!lesson.video_url || lesson.video_provider === "none") return "";
  if (lesson.video_provider === "youtube") {
    const embed = youtubeEmbedUrl(lesson.video_url);
    if (!embed) return "";
    return `<div class="lesson-video"><iframe src="${escapeHtml(
      embed,
    )}" title="Video da aula" allowfullscreen loading="lazy"></iframe></div>`;
  }
  if (lesson.video_provider === "supabase_storage" && lesson.playback_url) {
    return `<video class="lesson-video lesson-player" controls preload="metadata" src="${escapeHtml(
      lesson.playback_url,
    )}"></video>`;
  }
  return `<div class="lesson-video lesson-video-link"><a class="button" href="${escapeHtml(
    lesson.playback_url || lesson.video_url,
  )}" target="_blank" rel="noopener">Abrir video da aula</a></div>`;
}

function renderObjectives(objectives = []) {
  if (!objectives.length) return "";
  return `<section class="lesson-panel"><h2>Objetivos</h2><ul>${objectives
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul></section>`;
}

function renderSections(sections = [], fallbackBody = "") {
  if (!sections.length) {
    return `<section class="lesson-section"><h2>Conteudo</h2><p>${escapeHtml(
      fallbackBody,
    )}</p></section>`;
  }
  return sections
    .map(
      (section, index) =>
        `<section class="lesson-section"><span>Pagina ${index + 1}</span><h2>${escapeHtml(
          section.title,
        )}</h2><p>${escapeHtml(section.body)}</p></section>`,
    )
    .join("");
}

function renderMaterials(materials = []) {
  if (!materials.length) return "";
  return `<section class="lesson-panel"><h2>Materiais</h2><div class="learning-list">${materials
    .map(
      (material) =>
        `<article class="learning-item"><div><strong>${escapeHtml(
          material.title,
        )}</strong><span>${escapeHtml(
          material.file_type || "material",
        )}</span></div><a class="text-link" href="${escapeHtml(
          material.display_url || material.file_url,
        )}" target="_blank" rel="noopener">Abrir</a></article>`,
    )
    .join("")}</div></section>`;
}

function originLabel(lesson) {
  const labels = {
    own: "Aula propria",
    youtube: "YouTube",
    partner: "Parceiro",
    live: "Ao vivo",
    text: "Texto",
  };
  return labels[lesson.source_type] || "Aula";
}

async function saveLessonProgress(user, lesson) {
  const now = new Date().toISOString();
  const lessonProgress = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lesson.id,
      status: "completed",
      score: 100,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (lessonProgress.error) throw lessonProgress.error;

  const track = await supabase
    .from("tracks")
    .select("slug")
    .eq("id", lesson.track_id)
    .single();
  if (!track.error && track.data?.slug) {
    await supabase.from("course_progress").upsert(
      {
        user_id: user.id,
        course_id: track.data.slug,
        completed_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,course_id" },
    );
  }
}

async function initialize() {
  if (!lessonId || !supabase) throw new Error();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(
      "id,track_id,title,summary,body,estimated_minutes,source_type,video_provider,video_url,instructor_name,partner_name,content_format,page_count,learning_objectives,tracks(title,slug)",
    )
    .eq("id", lessonId)
    .single();
  if (error) throw error;

  const [sectionResult, materialResult] = await Promise.all([
    supabase
      .from("lesson_sections")
      .select("id,title,body,sort_order,estimated_minutes")
      .eq("lesson_id", lesson.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("materials")
      .select("id,title,file_url,file_type,is_downloadable")
      .eq("lesson_id", lesson.id)
      .order("created_at", { ascending: true }),
  ]);

  if (lesson.video_provider === "supabase_storage") {
    lesson.playback_url = await signedLessonMediaUrl(lesson.video_url);
  } else {
    lesson.playback_url = lesson.video_url;
  }

  const materials = await Promise.all(
    (materialResult.data || []).map(async (material) => ({
      ...material,
      display_url: await signedLessonMediaUrl(material.file_url),
    })),
  );

  document.title = `${lesson.title} - ConectaTech`;
  document.querySelector("#course-label").textContent =
    lesson.tracks?.title || "Trilha";
  document.querySelector("#lesson-title").textContent = lesson.title;
  document.querySelector("#lesson-summary").textContent = lesson.summary;
  document.querySelector("#lesson-content").innerHTML = `
    <div class="lesson-meta">
      <span>${escapeHtml(originLabel(lesson))}</span>
      <span>${escapeHtml(lesson.content_format || "text_video")}</span>
      <span>${escapeHtml(String(lesson.estimated_minutes || 0))} min</span>
      ${
        lesson.instructor_name
          ? `<span>Instrutor: ${escapeHtml(lesson.instructor_name)}</span>`
          : ""
      }
      ${
        lesson.partner_name
          ? `<span>Parceiro: ${escapeHtml(lesson.partner_name)}</span>`
          : ""
      }
    </div>
    ${renderVideo(lesson)}
    ${renderObjectives(lesson.learning_objectives || [])}
    ${renderSections(sectionResult.data || [], lesson.body)}
    ${renderMaterials(materials)}
  `;

  const article = document.querySelector(".lesson-page");
  const actions = document.createElement("div");
  actions.className = "lesson-actions";
  actions.innerHTML =
    '<button class="button button-secondary" id="save-lesson-button" type="button">Salvar conteudo</button><p id="save-lesson-result" role="status"></p>';
  document.querySelector("#lesson-content").before(actions);

  document
    .querySelector("#save-lesson-button")
    .addEventListener("click", async () => {
      const result = document.querySelector("#save-lesson-result");
      try {
        const user = await currentUser();
        if (!user) {
          result.textContent = "Entre na sua conta para salvar esta aula.";
          return;
        }
        const saved = await supabase.from("saved_lessons").upsert(
          {
            user_id: user.id,
            lesson_id: lesson.id,
          },
          { onConflict: "user_id,lesson_id" },
        );
        if (saved.error) throw saved.error;
        result.textContent = "Conteudo salvo no seu perfil.";
      } catch (error) {
        result.textContent = `Nao foi possivel salvar: ${error.message}`;
      }
    });

  const exercise = document.querySelector("#exercise-form");
  exercise.innerHTML =
    '<p>Terminou a leitura e a atividade proposta no conteudo?</p><p id="exercise-result" role="status"></p><button class="button" type="submit">Concluir aula</button>';
  exercise.hidden = false;
  exercise.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = document.querySelector("#exercise-result");
    try {
      const user = await currentUser();
      if (!user) {
        result.textContent = "Entre na sua conta para salvar o progresso.";
        return;
      }
      await saveLessonProgress(user, lesson);
      result.textContent = "Aula concluida. Seu progresso foi atualizado!";
    } catch (error) {
      result.textContent = `Nao foi possivel salvar agora: ${error.message}`;
    }
  });
  article.classList.add("lesson-ready");
}

initialize().catch(() => {
  document.querySelector("#lesson-title").textContent = "Aula nao encontrada";
  document.querySelector("#lesson-summary").textContent =
    "Volte ao catalogo e escolha uma aula disponivel.";
});
