import { supabase } from "./data-client.js";
import { escapeHtml, safeExternalUrl } from "./page-shell.js";

const list = document.querySelector("#opportunity-list");
const status = document.querySelector("#opportunity-status");
const searchInput = document.querySelector("#opportunity-search");

let opportunities = [];
let activeFilter = "todas";
let searchTerm = "";

function matchesFilter(item) {
  const text = [item.title, item.organization, item.description]
    .join(" ")
    .toLowerCase();
  const search = searchTerm.trim().toLowerCase();

  return (
    (activeFilter === "todas" || text.includes(activeFilter)) &&
    (!search || text.includes(search))
  );
}

function render() {
  const visible = opportunities.filter(matchesFilter);

  if (!visible.length) {
    list.innerHTML =
      '<p class="empty-state">Nenhuma oportunidade publicada corresponde aos filtros atuais.</p>';
    return;
  }

  list.innerHTML = visible
    .map(
      (item) =>
        `<article><span class="tag">Oportunidade</span><div><h2>${escapeHtml(
          item.title,
        )}</h2><strong>${escapeHtml(item.organization)}</strong><p>${escapeHtml(
          item.description,
        )}</p></div><a class="button button-secondary" href="${safeExternalUrl(
          item.url,
        )}" target="_blank" rel="noopener noreferrer">Acessar fonte</a></article>`,
    )
    .join("");
}

async function initialize() {
  if (!supabase) throw new Error("Serviço indisponível.");

  const { data, error } = await supabase
    .from("opportunities")
    .select("id,title,organization,url,description,status,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw error;

  opportunities = data || [];
  status.textContent = `${opportunities.length} ${
    opportunities.length === 1
      ? "oportunidade publicada"
      : "oportunidades publicadas"
  }`;
  render();
}

document.querySelectorAll(".filter").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    activeFilter = button.dataset.filter || "todas";
    render();
  }),
);

searchInput?.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  render();
});

initialize().catch(() => {
  status.textContent = "Consulta indisponível";
  list.innerHTML =
    '<p class="empty-state">Não foi possível consultar as oportunidades agora.</p>';
});
