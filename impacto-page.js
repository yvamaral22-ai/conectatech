import { supabase } from "./data-client.js";
import "./page-shell.js";
async function initialize() {
  if (!supabase) throw new Error();
  const [{ data, error }, tracks] = await Promise.all([
    supabase.rpc("platform_metrics"),
    supabase
      .from("tracks")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
  ]);
  if (error) throw error;
  const metrics = Array.isArray(data) ? data[0] : data;
  document.querySelector("#registered-stat").textContent = Number(
    metrics.registered_people || 0,
  ).toLocaleString("pt-BR");
  document.querySelector("#active-stat").textContent = Number(
    metrics.active_learners || 0,
  ).toLocaleString("pt-BR");
  document.querySelector("#courses-stat").textContent = Number(
    tracks.count || 0,
  ).toLocaleString("pt-BR");
  document.querySelector("#completion-stat").textContent = "Sem dados";
  document.querySelector("#metrics-status").textContent =
    "Indicadores atualizados";
}
initialize().catch(() => {
  document.querySelector("#metrics-status").textContent =
    "Indicadores indisponíveis";
});
