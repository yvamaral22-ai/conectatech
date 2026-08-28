import { supabase } from "./data-client.js";
import "./page-shell.js";

const lessonId = new URLSearchParams(location.search).get("id");

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
  document.title = `${lesson.title} — ConectaTech`;
  document.querySelector("#course-label").textContent =
    lesson.tracks?.title || "Trilha";
  document.querySelector("#lesson-title").textContent = lesson.title;
  document.querySelector("#lesson-summary").textContent = lesson.summary;
  document.querySelector("#lesson-content").textContent = lesson.body;
  const exercise = document.querySelector("#exercise-form");
  exercise.innerHTML =
    '<p>Terminou a leitura e a atividade proposta no conteúdo?</p><p id="exercise-result" role="status"></p><button class="button" type="submit">Concluir aula</button>';
  exercise.hidden = false;
  exercise.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = document.querySelector("#exercise-result");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      result.textContent = "Entre na sua conta para salvar o progresso.";
      return;
    }
    const track = await supabase
      .from("tracks")
      .select("slug")
      .eq("id", lesson.track_id)
      .single();
    if (track.error || !track.data?.slug) {
      result.textContent = "Não foi possível identificar esta trilha.";
      return;
    }
    const now = new Date().toISOString();
    const saved = await supabase.from("course_progress").upsert(
      {
        user_id: data.user.id,
        course_id: track.data.slug,
        completed_at: now,
        updated_at: now,
      },
      { onConflict: "user_id,course_id" },
    );
    result.textContent = saved.error
      ? `Não foi possível salvar agora: ${saved.error.message}`
      : "Aula concluída. Seu progresso foi atualizado!";
  });
}

initialize().catch(() => {
  document.querySelector("#lesson-title").textContent = "Aula não encontrada";
  document.querySelector("#lesson-summary").textContent =
    "Volte ao catálogo e escolha uma aula disponível.";
});
