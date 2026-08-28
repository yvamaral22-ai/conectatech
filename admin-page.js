import { supabase } from "./data-client.js";
async function initialize() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Entre na conta de administrador.");
  const role = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (role.data?.role !== "admin")
    throw new Error("Esta conta não possui acesso administrativo.");
  document.querySelector("#admin-status").textContent =
    "Administrador conectado";
  document.querySelector("#admin-content").hidden = false;
}
document
  .querySelector("#opportunity-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#admin-message");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.published = values.published === "on";
    values.verified_at = new Date().toISOString();
    values.closes_at = values.closes_at || null;
    const { error } = await supabase.from("opportunities").insert(values);
    message.textContent = error
      ? error.message
      : "Oportunidade salva com sucesso.";
    if (!error) event.currentTarget.reset();
  });
initialize().catch((error) => {
  document.querySelector("#admin-status").textContent = "Acesso negado";
  document
    .querySelector(".account-shell")
    .insertAdjacentHTML(
      "beforeend",
      `<p class="empty-state">${error.message}</p>`,
    );
});
