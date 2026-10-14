const STORAGE_KEY = "prompt-library";
const form = document.querySelector("#prompt-form");
const titleInput = document.querySelector("#prompt-title");
const contentInput = document.querySelector("#prompt-content");
const promptList = document.querySelector("#prompt-list");
const promptCount = document.querySelector("#prompt-count");
const formMessage = document.querySelector("#form-message");

function loadPrompts() {
  const savedPrompts = localStorage.getItem(STORAGE_KEY);

  if (!savedPrompts) {
    return [];
  }

  const prompts = JSON.parse(savedPrompts);
  return Array.isArray(prompts) ? prompts : [];
}

function savePrompts(prompts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

function createPromptCard(prompt) {
  const card = document.createElement("article");
  card.className = "prompt-card";

  const title = document.createElement("h3");
  title.textContent = prompt.title;

  const preview = document.createElement("p");
  const words = prompt.content.trim().split(/\s+/);
  preview.textContent = words.slice(0, 18).join(" ") + (words.length > 18 ? "..." : "");

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${prompt.title}`);
  deleteButton.addEventListener("click", () => deletePrompt(prompt.id));

  footer.append(deleteButton);
  card.append(title, preview, footer);
  return card;
}

function renderPrompts() {
  const prompts = loadPrompts();
  promptCount.textContent = String(prompts.length);
  promptList.replaceChildren();

  if (prompts.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No prompts saved yet. Add one above to get started.";
    promptList.append(emptyState);
    return;
  }

  prompts.forEach((prompt) => {
    promptList.append(createPromptCard(prompt));
  });
}

function deletePrompt(id) {
  const prompts = loadPrompts().filter((prompt) => prompt.id !== id);
  savePrompts(prompts);
  renderPrompts();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    formMessage.textContent = "Enter a title and prompt content before saving.";
    return;
  }

  try {
    const prompts = loadPrompts();
    prompts.unshift({
      id: crypto.randomUUID(),
      title,
      content,
    });
    savePrompts(prompts);
    form.reset();
    renderPrompts();
    titleInput.focus();
  } catch (error) {
    formMessage.textContent = "Could not save the prompt. Check browser storage and try again.";
    console.error("Unable to save prompt:", error);
  }
});

renderPrompts();
