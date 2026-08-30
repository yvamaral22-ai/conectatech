import { supabase } from "./data-client.js";
import { escapeHtml, safeExternalUrl } from "./page-shell.js";

const grid = document.querySelector("#portfolio-grid");
const dialog = document.querySelector("#project-dialog");
const form = document.querySelector("#project-form");
let user;
let projects = [];

function render() {
  document.querySelector("#project-count").textContent = projects.length;

  if (!projects.length) {
    grid.innerHTML =
      '<div class="portfolio-empty"><h2>Seu próximo projeto começa aqui</h2><p>Adicione um trabalho de estudo, voluntariado ou experiência profissional.</p><button class="button button-secondary" type="button" data-create>Adicionar primeiro projeto</button></div>';
    return;
  }

  grid.innerHTML = projects
    .map(
      (project) =>
        `<article class="project-card"><div class="project-card-top"><span>Projeto</span><div><button type="button" data-edit="${
          project.id
        }">Editar</button><button type="button" data-delete="${
          project.id
        }">Excluir</button></div></div><h2>${escapeHtml(
          project.title,
        )}</h2><p>${escapeHtml(project.description)}</p>${
          project.project_url
            ? `<a class="text-link" href="${safeExternalUrl(
                project.project_url,
              )}" target="_blank" rel="noopener">Abrir projeto →</a>`
            : ""
        }</article>`,
    )
    .join("");
}

async function load() {
  const auth = await supabase.auth.getUser();
  user = auth.data.user;

  if (!user) {
    grid.innerHTML =
      '<p class="empty-state">Entre na sua conta para acessar o portfólio.</p>';
    return;
  }

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("id,title,description,project_url,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    return;
  }

  projects = data || [];
  render();
}

function openProject(project) {
  form.reset();
  form.elements.id.value = project?.id || "";
  form.elements.title.value = project?.title || "";
  form.elements.description.value = project?.description || "";
  form.elements.project_url.value = project?.project_url || "";
  document.querySelector("#project-form-title").textContent = project
    ? "Editar projeto"
    : "Novo projeto";
  document.querySelector("#project-message").textContent = "";
  dialog.showModal();
}

document
  .querySelector("#new-project")
  .addEventListener("click", () => openProject());

document
  .querySelector("[data-close]")
  .addEventListener("click", () => dialog.close());

grid.addEventListener("click", async (event) => {
  if (event.target.closest("[data-create]")) {
    openProject();
    return;
  }

  const edit = event.target.closest("[data-edit]");
  const remove = event.target.closest("[data-delete]");

  if (edit) {
    openProject(projects.find((item) => item.id === edit.dataset.edit));
    return;
  }

  if (remove && confirm("Deseja excluir este projeto?")) {
    const { error } = await supabase
      .from("portfolio_projects")
      .delete()
      .eq("id", remove.dataset.delete);

    if (!error) {
      projects = projects.filter((item) => item.id !== remove.dataset.delete);
      render();
    }
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentForm = event.currentTarget;
  const message = document.querySelector("#project-message");
  const values = Object.fromEntries(new FormData(currentForm));
  const id = values.id;
  delete values.id;

  const operation = id
    ? supabase
        .from("portfolio_projects")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id)
    : supabase
        .from("portfolio_projects")
        .insert({ user_id: user.id, ...values });

  const { error } = await operation;

  if (error) {
    message.textContent = error.message;
    return;
  }

  dialog.close();
  await load();
});

load();
