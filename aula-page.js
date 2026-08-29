import { supabase } from "./data-client.js";
import "./page-shell.js";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

function formatBytes(bytes = 0) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
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
  )}" target="_blank" rel="noopener">Abrir vídeo da aula</a></div>`;
}

function renderPdfReader(lesson) {
  if (!lesson.pdf_display_url) return "";
  return `<section class="pdf-reader" id="pdf-reader" aria-label="Leitor de PDF">
    <div class="pdf-reader-toolbar">
      <div class="pdf-reader-controls">
        <button class="button button-small button-secondary" id="pdf-prev" type="button">Anterior</button>
        <span class="pdf-reader-status" id="pdf-page-status">Página 1</span>
        <button class="button button-small button-secondary" id="pdf-next" type="button">Próxima</button>
      </div>
      <a class="text-link" href="${escapeHtml(
        lesson.pdf_display_url,
      )}" target="_blank" rel="noopener">Abrir PDF</a>
    </div>
    <div class="pdf-reader-page">
      <canvas id="pdf-canvas"></canvas>
      <p class="pdf-reader-message" id="pdf-reader-message" role="status">Carregando PDF...</p>
    </div>
  </section>`;
}

async function mountPdfReader(url) {
  const reader = document.querySelector("#pdf-reader");
  if (!reader || !url) return;

  const canvas = reader.querySelector("#pdf-canvas");
  const message = reader.querySelector("#pdf-reader-message");
  const status = reader.querySelector("#pdf-page-status");
  const previous = reader.querySelector("#pdf-prev");
  const next = reader.querySelector("#pdf-next");
  const pageWrap = reader.querySelector(".pdf-reader-page");
  const context = canvas.getContext("2d");
  let pdf = null;
  let pageNumber = 1;
  let renderToken = 0;

  async function renderPage() {
    if (!pdf) return;
    const token = ++renderToken;
    message.textContent = "Carregando página...";
    const page = await pdf.getPage(pageNumber);
    if (token !== renderToken) return;

    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(280, Math.min(pageWrap.clientWidth - 28, 920));
    const scale = availableWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
    context.clearRect(0, 0, viewport.width, viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;

    status.textContent = `Página ${pageNumber} de ${pdf.numPages}`;
    previous.disabled = pageNumber <= 1;
    next.disabled = pageNumber >= pdf.numPages;
    message.textContent = "";
  }

  try {
    pdf = await pdfjsLib.getDocument(url).promise;
    await renderPage();
  } catch {
    canvas.hidden = true;
    message.textContent = "Não foi possível carregar o PDF nesta tela.";
    return;
  }

  previous.addEventListener("click", () => {
    if (pageNumber <= 1) return;
    pageNumber -= 1;
    renderPage();
  });
  next.addEventListener("click", () => {
    if (!pdf || pageNumber >= pdf.numPages) return;
    pageNumber += 1;
    renderPage();
  });

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderPage, 150);
  });
}

function renderObjectives(objectives = []) {
  if (!objectives.length) return "";
  return `<section class="lesson-panel"><h2>Objetivos</h2><ul>${objectives
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul></section>`;
}

function renderSections(sections = [], fallbackBody = "") {
  if (!sections.length) {
    return `<section class="lesson-section"><h2>Conteúdo</h2><p>${escapeHtml(
      fallbackBody,
    )}</p></section>`;
  }
  return sections
    .map(
      (section, index) =>
        `<section class="lesson-section"><span>Página ${index + 1}</span><h2>${escapeHtml(
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
    own: "Aula própria",
    youtube: "YouTube",
    partner: "Parceiro",
    live: "Ao vivo",
    text: "Texto",
  };
  return labels[lesson.source_type] || "Aula";
}

function formatLabel(value) {
  return {
    pdf: "PDF",
    text: "Texto",
    video: "Vídeo",
    text_video: "Texto e vídeo",
    activity: "Atividade guiada",
    project: "Projeto prático",
  }[value] || value || "Aula";
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
      "id,track_id,title,summary,body,estimated_minutes,source_type,video_provider,video_url,pdf_url,pdf_file_name,pdf_file_size,pdf_mime_type,instructor_name,partner_name,content_format,page_count,learning_objectives,tracks(title,slug)",
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
  lesson.pdf_display_url = await signedLessonMediaUrl(lesson.pdf_url);

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
      <span>${escapeHtml(formatLabel(lesson.content_format))}</span>
      <span>${escapeHtml(String(lesson.estimated_minutes || 0))} min</span>
      ${
        lesson.pdf_file_name
          ? `<span>Arquivo: ${escapeHtml(lesson.pdf_file_name)}</span>`
          : ""
      }
      ${
        lesson.pdf_file_size
          ? `<span>${escapeHtml(formatBytes(lesson.pdf_file_size))}</span>`
          : ""
      }
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
    ${renderPdfReader(lesson)}
    ${renderObjectives(lesson.learning_objectives || [])}
    ${renderSections(sectionResult.data || [], lesson.body)}
    ${renderMaterials(materials)}
  `;
  mountPdfReader(lesson.pdf_display_url);

  const article = document.querySelector(".lesson-page");
  const actions = document.createElement("div");
  actions.className = "lesson-actions";
  actions.innerHTML =
    '<button class="button button-secondary" id="save-lesson-button" type="button">Salvar conteúdo</button><p id="save-lesson-result" role="status"></p>';
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
        result.textContent = "Conteúdo salvo no seu perfil.";
      } catch (error) {
        result.textContent = `Não foi possível salvar: ${error.message}`;
      }
    });

  const exercise = document.querySelector("#exercise-form");
  exercise.innerHTML =
    '<p>Terminou a leitura e a atividade proposta no conteúdo?</p><p id="exercise-result" role="status"></p><button class="button" type="submit">Concluir aula</button>';
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
      result.textContent = `Não foi possível salvar agora: ${error.message}`;
    }
  });
  article.classList.add("lesson-ready");
}

initialize().catch(() => {
  document.querySelector("#lesson-title").textContent = "Aula não encontrada";
  document.querySelector("#lesson-summary").textContent =
    "Volte ao catálogo e escolha uma aula disponível.";
});
