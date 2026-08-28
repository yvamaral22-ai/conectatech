import { supabase } from "./data-client.js";
import { escapeHtml, safeExternalUrl } from "./page-shell.js";

const list = document.querySelector("#opportunity-list");
const status = document.querySelector("#opportunity-status");

async function initialize() {
  if (!supabase) throw new Error();
  const { data, error } = await supabase
    .from("opportunities")
    .select("id,title,organization,url,description,status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  status.textContent = `${data.length} ${data.length === 1 ? "oportunidade publicada" : "oportunidades publicadas"}`;
  if (!data.length) {
    list.innerHTML =
      '<p class="empty-state">Nenhuma oportunidade verificada está publicada agora.</p>';
    return;
  }
  list.innerHTML = data
    .map(
      (item) =>
        `<article><span class="tag">Oportunidade</span><div><h2>${escapeHtml(item.title)}</h2><strong>${escapeHtml(item.organization)}</strong><p>${escapeHtml(item.description)}</p></div><a class="button button-secondary" href="${safeExternalUrl(item.url)}" target="_blank" rel="noopener noreferrer">Acessar fonte</a></article>`,
    )
    .join("");
}
initialize().catch(() => {
  status.textContent = "Consulta indisponível";
  list.innerHTML =
    '<p class="empty-state">Não foi possível consultar as oportunidades agora.</p>';
});
