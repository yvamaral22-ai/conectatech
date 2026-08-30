import { supabase } from "./data-client.js";
import "./page-shell.js";

const status = document.querySelector("#page-status");

document.querySelectorAll(".resource-action").forEach((button) =>
  button.addEventListener("click", () => {
    if (button.dataset.feature === "currículo") {
      window.location.href = "/curriculo.html";
    } else if (button.dataset.feature === "portfólio") {
      window.location.href = "/portfolio.html";
    } else {
      status.textContent =
        "Consulte as trilhas de processos seletivos para iniciar sua preparação.";
      status.style.display = "block";
    }
  }),
);

document
  .querySelectorAll("[data-close]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      document.querySelector(`#${button.dataset.close}`).close(),
    ),
  );

async function requireUser() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("Entre na sua conta para salvar estas informações.");
  }
  return data.user;
}

document
  .querySelector("#career-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.querySelector("#career-message");

    try {
      const user = await requireUser();
      const values = Object.fromEntries(new FormData(form));
      const { error } = await supabase.from("career_profiles").upsert({
        user_id: user.id,
        ...values,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      message.textContent = "Informações profissionais salvas.";
    } catch (error) {
      message.textContent = error.message;
    }
  });

document
  .querySelector("#portfolio-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.querySelector("#portfolio-message");

    try {
      const user = await requireUser();
      const values = Object.fromEntries(new FormData(form));
      const { error } = await supabase
        .from("portfolio_projects")
        .insert({ user_id: user.id, ...values });
      if (error) throw error;
      message.textContent = "Projeto adicionado ao portfólio.";
      form.reset();
    } catch (error) {
      message.textContent = error.message;
    }
  });
