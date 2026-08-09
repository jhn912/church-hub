const menuButton = document.getElementById("menuButton");
const navMenu = document.getElementById("navMenu");
const navLinks = navMenu.querySelectorAll("a");

menuButton.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

const contactForm = document.getElementById("contactForm");
const formNote = document.getElementById("formNote");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();

  formNote.textContent =
    `Thanks, ${name || "friend"}! This demo form works visually, but we'll connect it to email later.`;

  contactForm.reset();
});
