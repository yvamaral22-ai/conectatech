import { supabase } from "./data-client.js";
import { escapeHtml } from "./page-shell.js";
const form = document.querySelector("#resume-form"),
  preview = document.querySelector("#resume-preview"),
  message = document.querySelector("#resume-message");
function values() {
  return Object.fromEntries(new FormData(form));
}
function render() {
  const data = values();
  Object.entries(data).forEach(([key, value]) => {
    const target = preview.querySelector(`[data-output="${key}"]`);
    if (target)
      target.textContent =
        value.trim() ||
        target.dataset.placeholder ||
        {
          name: "Seu nome",
          email: "seu@email.com",
          phone: "Telefone",
          city: "Cidade",
          objective: "Descreva seu objetivo profissional.",
          education: "Inclua sua formação.",
          experience: "Inclua suas experiências.",
          skills: "Inclua suas principais competências.",
        }[key];
  });
}
form.addEventListener("input", render);
document.querySelectorAll(".template-choice").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".template-choice")
      .forEach((item) => item.classList.toggle("active", item === button));
    preview.className = `resume-preview template-${button.dataset.template}`;
  }),
);
document.querySelector("#load-account").addEventListener("click", async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    message.textContent = "Entre na sua conta para preencher automaticamente.";
    return;
  }
  const [profile, career] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,city")
      .eq("id", data.user.id)
      .single(),
    supabase
      .from("career_profiles")
      .select("objective,education,experience,skills")
      .eq("user_id", data.user.id)
      .maybeSingle(),
  ]);
  form.elements.name.value = profile.data?.display_name || "";
  form.elements.email.value = data.user.email || "";
  form.elements.city.value = profile.data?.city || "";
  for (const key of ["objective", "education", "experience", "skills"])
    form.elements[key].value = career.data?.[key] || "";
  render();
  message.textContent = "Informações carregadas da sua conta.";
});
document.querySelector("#save-resume").addEventListener("click", async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    message.textContent = "Entre na conta para salvar.";
    return;
  }
  const value = values();
  const { error } = await supabase
    .from("career_profiles")
    .upsert({
      user_id: data.user.id,
      objective: value.objective,
      education: value.education,
      experience: value.experience,
      skills: value.skills,
      updated_at: new Date().toISOString(),
    });
  message.textContent = error ? error.message : "Informações salvas.";
});
document
  .querySelector("#print-resume")
  .addEventListener("click", () => window.print());
document.querySelector("#download-resume").addEventListener("click", () => {
  const data = values();
  const sections = Object.entries(data)
    .map(
      ([key, value]) =>
        `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join("");
  const blob = new Blob(
    [
      `<!doctype html><meta charset="utf-8"><title>Currículo</title><style>body{font:16px Arial;max-width:800px;margin:40px auto;line-height:1.5}h1{color:#173f35}</style><h1>${escapeHtml(data.name || "Currículo")}</h1>${sections}`,
    ],
    { type: "text/html" },
  );
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "curriculo-conectatech.html";
  link.click();
  URL.revokeObjectURL(link.href);
});
