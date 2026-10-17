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

function updatePromptNotes(promptId, update) {
  const prompts = loadPrompts();
  const prompt = prompts.find((item) => item.id === promptId);

  if (!prompt) {
    throw new Error(`Prompt not found: ${promptId}`);
  }

  if (!Array.isArray(prompt.notes)) {
    prompt.notes = [];
  }

  update(prompt, prompt.notes);
  savePrompts(prompts);
}

function createNotesSection(prompt) {
  const section = document.createElement("section");
  section.className = "notes-section";
  section.setAttribute("aria-label", `Notes for ${prompt.title}`);

  const heading = document.createElement("h4");
  heading.className = "notes-heading";
  heading.textContent = "Notes";

  const noteList = document.createElement("div");
  noteList.className = "note-list";

  const notes = Array.isArray(prompt.notes) ? prompt.notes : [];
  if (notes.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "notes-empty";
    emptyState.textContent = "No notes yet.";
    noteList.append(emptyState);
  }

  notes.forEach((note) => {
    const item = document.createElement("div");
    item.className = "note-item";

    const label = document.createElement("label");
    label.htmlFor = `note-${note.id}`;
    label.textContent = "Note";

    const input = document.createElement("textarea");
    input.id = `note-${note.id}`;
    input.rows = 3;
    input.value = note.content;
    input.setAttribute("aria-label", `Note for ${prompt.title}`);

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const saveButton = document.createElement("button");
    saveButton.className = "note-save-button";
    saveButton.type = "button";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => {
      const content = input.value.trim();
      if (!content) {
        setStatus("Enter some note text before saving.", true);
        input.focus();
        return;
      }

      try {
        updatePromptNotes(prompt.id, (_currentPrompt, currentNotes) => {
          const currentNote = currentNotes.find((itemNote) => itemNote.id === note.id);
          if (!currentNote) {
            throw new Error(`Note not found: ${note.id}`);
          }
          currentNote.content = content;
          currentNote.updatedAt = Date.now();
        });
        input.value = content;
        setStatus("Note saved.");
      } catch (error) {
        setStatus("Could not save the note. Check browser storage and try again.", true);
        console.error("Unable to save prompt note:", error);
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "note-delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", `Delete note for ${prompt.title}`);
    deleteButton.addEventListener("click", () => {
      try {
        updatePromptNotes(prompt.id, (currentPrompt, currentNotes) => {
          currentPrompt.notes = currentNotes.filter((itemNote) => itemNote.id !== note.id);
        });
        renderPrompts();
      } catch (error) {
        setStatus("Could not delete the note. Check browser storage and try again.", true);
        console.error("Unable to delete prompt note:", error);
      }
    });

    actions.append(saveButton, deleteButton);
    item.append(label, input, actions);
    noteList.append(item);
  });

  const addForm = document.createElement("form");
  addForm.className = "add-note-form";

  const addLabel = document.createElement("label");
  addLabel.htmlFor = `new-note-${prompt.id}`;
  addLabel.textContent = "Add a note";

  const addInput = document.createElement("textarea");
  addInput.id = `new-note-${prompt.id}`;
  addInput.rows = 3;
  addInput.placeholder = "Write a note for this prompt...";

  const addButton = document.createElement("button");
  addButton.className = "note-save-button";
  addButton.type = "submit";
  addButton.textContent = "Add note";

  const status = document.createElement("p");
  status.className = "note-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
  }

  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = addInput.value.trim();

    if (!content) {
      setStatus("Enter some note text before adding it.", true);
      addInput.focus();
      return;
    }

    try {
      updatePromptNotes(prompt.id, (_currentPrompt, currentNotes) => {
        currentNotes.push({
          id: crypto.randomUUID(),
          content,
          updatedAt: Date.now(),
        });
      });
      renderPrompts();
    } catch (error) {
      setStatus("Could not add the note. Check browser storage and try again.", true);
      console.error("Unable to add prompt note:", error);
    }
  });

  addForm.append(addLabel, addInput, addButton);
  section.append(heading, noteList, addForm, status);
  return section;
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

  const rating = Number.isInteger(prompt.rating) && prompt.rating >= 1 && prompt.rating <= 5
    ? prompt.rating
    : 0;
  const ratingControl = document.createElement("div");
  ratingControl.className = "rating-control";
  ratingControl.setAttribute("role", "group");
  ratingControl.setAttribute("aria-label", `Rate ${prompt.title} effectiveness`);

  const stars = document.createElement("div");
  stars.className = "rating-stars";

  for (let value = 1; value <= 5; value += 1) {
    const starButton = document.createElement("button");
    starButton.className = "star-button";
    starButton.type = "button";
    starButton.textContent = value <= rating ? "★" : "☆";
    starButton.setAttribute("aria-label", `${value} out of 5 stars`);
    starButton.setAttribute("aria-pressed", String(value === rating));
    starButton.addEventListener("click", () => updatePromptRating(prompt.id, value, ratingControl, feedback));
    stars.append(starButton);
  }

  const ratingSummary = document.createElement("span");
  ratingSummary.className = "rating-summary";
  ratingSummary.textContent = rating === 0 ? "Not rated" : `${rating} of 5`;

  const clearButton = document.createElement("button");
  clearButton.className = "clear-rating-button";
  clearButton.type = "button";
  clearButton.textContent = "Clear";
  clearButton.disabled = rating === 0;
  clearButton.setAttribute("aria-label", `Clear ${prompt.title} rating`);
  clearButton.addEventListener("click", () => updatePromptRating(prompt.id, 0, ratingControl, feedback));

  const feedback = document.createElement("span");
  feedback.className = "rating-feedback";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");

  ratingControl.append(stars, ratingSummary, clearButton, feedback);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${prompt.title}`);
  deleteButton.addEventListener("click", () => deletePrompt(prompt.id));

  footer.append(ratingControl, deleteButton);
  card.append(title, preview, createNotesSection(prompt), footer);
  return card;
}

function updatePromptRating(id, rating, ratingControl, feedback) {
  try {
    const prompts = loadPrompts();
    const prompt = prompts.find((item) => item.id === id);

    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    prompt.rating = rating;
    savePrompts(prompts);
    const stars = ratingControl.querySelectorAll(".star-button");
    stars.forEach((star, index) => {
      const selected = index + 1 === rating;
      star.textContent = index + 1 <= rating ? "★" : "☆";
      star.setAttribute("aria-pressed", String(selected));
    });
    ratingControl.querySelector(".rating-summary").textContent = rating === 0 ? "Not rated" : `${rating} of 5`;
    ratingControl.querySelector(".clear-rating-button").disabled = rating === 0;
    feedback.textContent = "";
  } catch (error) {
    feedback.textContent = "Could not save the rating. Check browser storage and try again.";
    console.error("Unable to save prompt rating:", error);
  }
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
