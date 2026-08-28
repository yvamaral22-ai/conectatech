import { supabase } from "./data-client.js";
import { escapeHtml } from "./page-shell.js";

const grid = document.querySelector("#course-grid");
const status = document.querySelector("#catalog-status");
let courses = [];
let completed = [];

function render(filter = "todas") {
  const visible = courses.filter(
    (course) => filter === "todas" || course.level === filter,
  );
  if (!visible.length) {
    grid.innerHTML =
      '<p class="empty-state">Nenhuma trilha está disponível neste filtro.</p>';
    return;
  }
  grid.innerHTML = visible
    .map(
      (course) =>
        `<article class="course-card"><span class="course-icon" aria-hidden="true">${escapeHtml(course.icon)}</span><p class="card-kicker">${escapeHtml(course.level)}</p><h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(course.description)}</p><div class="course-meta"><span>${course.lessons?.[0]?.count || 0} aulas</span><span>${course.duration_minutes} min</span></div><button class="text-link course-start" data-course="${course.id}" type="button">${completed.includes(course.id) ? "Revisar trilha" : "Começar trilha"} →</button></article>`,
    )
    .join("");
}

async function initialize() {
  if (!supabase) throw new Error("Serviço indisponível.");
  const [{ data, error }, session] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id,icon,title,level,description,duration_minutes,position,lessons(count)",
      )
      .order("position"),
    supabase.auth.getUser(),
  ]);
  if (error) throw error;
  courses = data || [];
  if (session.data.user) {
    const progress = await supabase.from("course_progress").select("course_id");
    completed = progress.data?.map((item) => item.course_id) || [];
  }
  status.textContent = `${courses.length} ${courses.length === 1 ? "trilha disponível" : "trilhas disponíveis"}`;
  render();
}

document.querySelectorAll(".filter").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    render(button.dataset.filter);
  }),
);

grid.addEventListener("click", (event) => {
  const button = event.target.closest(".course-start");
  if (button)
    window.location.href = `/?trilha=${encodeURIComponent(button.dataset.course)}#trilhas`;
});

initialize().catch(() => {
  status.textContent = "Catálogo indisponível";
  grid.innerHTML =
    '<p class="empty-state">Não foi possível carregar as trilhas agora.</p>';
});
