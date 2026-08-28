const menuButton = document.querySelector(".menu-button");
menuButton?.addEventListener("click", () => {
  const navigation = document.querySelector("#main-nav");
  const open = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

export function escapeHtml(value = "") {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}
