import { supabase } from "./data-client.js";
import "./page-shell.js";

const lessonId = new URLSearchParams(location.search).get("id");

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
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
      "id,track_id,title,summary,body,estimated_minutes,tracks(title,slug)",
    )
    .eq("id", lessonId)
    .single();
  if (error) throw error;

  document.title = `${lesson.title} - ConectaTech`;
  document.querySelector("#course-label").textContent =
    lesson.tracks?.title || "Trilha";
  document.querySelector("#lesson-title").textContent = lesson.title;
  document.querySelector("#lesson-summary").textContent = lesson.summary;
  document.querySelector("#lesson-content").textContent = lesson.body;

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
