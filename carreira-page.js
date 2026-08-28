import "./page-shell.js";
const status = document.querySelector("#page-status");
document.querySelectorAll(".resource-action").forEach((button) =>
  button.addEventListener("click", () => {
    status.textContent = `A ferramenta de ${button.dataset.feature} está em preparação e será liberada quando o fluxo estiver completo.`;
    status.style.display = "block";
    window.setTimeout(() => status.style.removeProperty("display"), 5500);
  }),
);
