import { supabase } from "./data-client.js";
import { escapeHtml } from "./page-shell.js";
const lessonId = new URLSearchParams(location.search).get("id");
let lesson;
async function initialize() {
  if (!lessonId || !supabase) throw new Error();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      "id,course_id,title,summary,content,question,answer,options,courses(title)",
    )
    .eq("id", lessonId)
    .single();
  if (error) throw error;
  lesson = data;
  document.title = `${lesson.title} — ConectaTech`;
  document.querySelector("#course-label").textContent =
    lesson.courses?.title || "Trilha";
  document.querySelector("#lesson-title").textContent = lesson.title;
  document.querySelector("#lesson-summary").textContent = lesson.summary;
  document.querySelector("#lesson-content").textContent = lesson.content;
  document.querySelector("#lesson-question").textContent = lesson.question;
  document.querySelector("#lesson-options").innerHTML = lesson.options
    .map(
      (option) =>
        `<label class="lesson-option"><input type="radio" name="answer" value="${escapeHtml(option)}" required><span>${escapeHtml(option)}</span></label>`,
    )
    .join("");
  document.querySelector("#exercise-form").hidden = false;
}
document
  .querySelector("#exercise-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const answer = new FormData(event.currentTarget).get("answer");
    const result = document.querySelector("#exercise-result");
    if (answer !== lesson.answer) {
      result.textContent = "Ainda não. Revise o conteúdo e tente novamente.";
      result.className = "answer-wrong";
      return;
    }
    result.textContent = "Resposta correta! Seu progresso foi salvo.";
    result.className = "answer-correct";
    const { data } = await supabase.auth.getUser();
    if (data.user)
      await supabase
        .from("course_progress")
        .upsert(
          {
            user_id: data.user.id,
            course_id: lesson.course_id,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,course_id" },
        );
  });
initialize().catch(() => {
  document.querySelector("#lesson-title").textContent = "Aula não encontrada";
  document.querySelector("#lesson-summary").textContent =
    "Volte ao catálogo e escolha uma aula disponível.";
});
