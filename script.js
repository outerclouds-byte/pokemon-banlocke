// Nombre maximum de Pokémon sélectionnables
const MAX_SELECTION = 10;

const selectorsContainer = document.getElementById("selectors");
const pseudoInput = document.getElementById("pseudo");
const submitBtn = document.getElementById("submit-btn");

// Sprite officiel via PokeAPI (id = numéro de Pokédex national)
function spriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Normalise une chaîne pour une recherche insensible à la casse et aux accents
function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Tableau contenant l'id sélectionné pour chaque ligne (null = aucune sélection)
const selectedIds = new Array(MAX_SELECTION).fill(null);

// Texte de recherche courant pour chaque combobox
const searchTerms = new Array(MAX_SELECTION).fill("");

// Référence des éléments DOM de chaque combobox personnalisée, indexés par ligne
const rows = [];

function buildRows() {
  for (let i = 0; i < MAX_SELECTION; i++) {
    const row = document.createElement("div");
    row.className = "selector-row";

    const label = document.createElement("span");
    label.className = "row-number";
    label.textContent = `#${i + 1}`;

    const combo = document.createElement("div");
    combo.className = "combo";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "combo-trigger";

    const triggerSprite = document.createElement("img");
    triggerSprite.className = "combo-sprite";
    triggerSprite.alt = "";
    triggerSprite.hidden = true;

    const triggerLabel = document.createElement("span");
    triggerLabel.className = "combo-label";
    triggerLabel.textContent = "-- Choisir un Pokémon --";

    trigger.appendChild(triggerSprite);
    trigger.appendChild(triggerLabel);

    const panel = document.createElement("div");
    panel.className = "combo-panel";
    panel.hidden = true;

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "combo-search";
    searchInput.placeholder = "Rechercher un Pokémon...";
    searchInput.addEventListener("click", (event) => event.stopPropagation());
    searchInput.addEventListener("input", () => {
      searchTerms[i] = searchInput.value;
      renderOptionsList(i);
    });

    const optionsList = document.createElement("div");
    optionsList.className = "combo-options";

    panel.appendChild(searchInput);
    panel.appendChild(optionsList);

    trigger.addEventListener("click", () => toggleCombo(i));

    combo.appendChild(trigger);
    combo.appendChild(panel);

    row.appendChild(label);
    row.appendChild(combo);
    selectorsContainer.appendChild(row);

    rows.push({ trigger, triggerSprite, triggerLabel, panel, searchInput, optionsList });
  }

  document.addEventListener("click", (event) => {
    rows.forEach((r, i) => {
      if (!r.panel.contains(event.target) && event.target !== r.trigger && !r.trigger.contains(event.target)) {
        closeCombo(i);
      }
    });
  });

  refreshAllOptions();
}

function toggleCombo(index) {
  const isOpen = !rows[index].panel.hidden;
  rows.forEach((_, i) => closeCombo(i));
  if (!isOpen) {
    rows[index].panel.hidden = false;
    rows[index].trigger.classList.add("open");
    searchTerms[index] = "";
    rows[index].searchInput.value = "";
    renderOptionsList(index);
    rows[index].searchInput.focus();
  }
}

function closeCombo(index) {
  rows[index].panel.hidden = true;
  rows[index].trigger.classList.remove("open");
}

function selectPokemon(index, pokemonId) {
  selectedIds[index] = pokemonId;
  closeCombo(index);
  refreshAllOptions();
}

function clearSelection(index) {
  selectedIds[index] = null;
  closeCombo(index);
  refreshAllOptions();
}

// Reconstruit uniquement la liste d'options d'une combobox (en tenant compte du filtre de recherche)
function renderOptionsList(index) {
  const r = rows[index];
  const currentValue = selectedIds[index];
  const filter = normalize(searchTerms[index] || "");

  r.optionsList.innerHTML = "";

  const emptyOption = document.createElement("div");
  emptyOption.className = "combo-option combo-option-empty";
  emptyOption.textContent = "-- Aucun --";
  emptyOption.addEventListener("click", () => clearSelection(index));
  r.optionsList.appendChild(emptyOption);

  POKEMON_LIST.forEach((pokemon) => {
    const isTakenElsewhere = selectedIds.some(
      (id, i) => id === pokemon.id && i !== index
    );
    if (isTakenElsewhere) return;

    if (filter && !normalize(pokemon.name).includes(filter)) return;

    const option = document.createElement("div");
    option.className = "combo-option";
    if (currentValue === pokemon.id) option.classList.add("selected");

    const sprite = document.createElement("img");
    sprite.className = "combo-sprite";
    sprite.alt = "";
    sprite.src = spriteUrl(pokemon.id);

    const name = document.createElement("span");
    name.textContent = pokemon.name;

    option.appendChild(sprite);
    option.appendChild(name);
    option.addEventListener("click", () => selectPokemon(index, pokemon.id));

    r.optionsList.appendChild(option);
  });
}

// Met à jour le bouton déclencheur de chaque ligne et reconstruit toutes les listes d'options
// (utilisé après un changement de sélection, qui peut retirer un Pokémon des autres listes).
function refreshAllOptions() {
  rows.forEach((r, index) => {
    const currentValue = selectedIds[index];

    if (currentValue) {
      const pokemon = POKEMON_LIST.find((p) => p.id === currentValue);
      r.triggerSprite.src = spriteUrl(currentValue);
      r.triggerSprite.hidden = false;
      r.triggerLabel.textContent = pokemon.name;
    } else {
      r.triggerSprite.hidden = true;
      r.triggerSprite.src = "";
      r.triggerLabel.textContent = "-- Choisir un Pokémon --";
    }

    renderOptionsList(index);
  });
}


function onSubmit() {
  const pseudo = pseudoInput.value.trim();

  if (!pseudo) {
    alert("Merci d'indiquer un pseudo avant d'envoyer ton choix.");
    return;
  }

  const chosenIds = selectedIds.filter((id) => id !== null);

  if (chosenIds.length === 0) {
    alert("Sélectionne au moins un Pokémon avant d'envoyer.");
    return;
  }

  recordVote(pseudo, chosenIds);
  showThanksModal(pseudo, chosenIds);
}

const thanksModal = document.getElementById("thanks-modal");
const modalPseudo = document.getElementById("modal-pseudo");
const modalSprites = document.getElementById("modal-sprites");
const modalCloseBtn = document.getElementById("modal-close-btn");

function showThanksModal(pseudo, chosenIds) {
  modalPseudo.textContent = `Pseudo : ${pseudo}`;
  modalSprites.innerHTML = "";

  chosenIds.forEach((id) => {
    const pokemon = POKEMON_LIST.find((p) => p.id === id);
    if (!pokemon) return;

    const item = document.createElement("div");
    item.className = "modal-sprite-item";

    const sprite = document.createElement("img");
    sprite.className = "modal-sprite";
    sprite.alt = pokemon.name;
    sprite.src = spriteUrl(id);

    const name = document.createElement("span");
    name.textContent = pokemon.name;

    item.appendChild(sprite);
    item.appendChild(name);
    modalSprites.appendChild(item);
  });

  thanksModal.hidden = false;
}

function hideThanksModal() {
  thanksModal.hidden = true;
}

modalCloseBtn.addEventListener("click", hideThanksModal);
thanksModal.addEventListener("click", (event) => {
  if (event.target === thanksModal) hideThanksModal();
});


submitBtn.addEventListener("click", onSubmit);

buildRows();

// ---------------------------------------------------------------------------
// Stockage des choix envoyés (Realtime Database, partagé entre tous les
// visiteurs) et statistiques des Pokémon les plus choisis.
// ---------------------------------------------------------------------------

const statsStatus = document.getElementById("stats-status");
const statsList = document.getElementById("stats-list");

let votes = []; // tableau de votes, chaque vote = { pseudo, ids, date }

function setStatsStatus(message) {
  statsStatus.textContent = message;
}

// Écoute en temps réel le nœud "votes" sur Realtime Database : dès qu'un
// visiteur envoie son équipe, tous les autres visiteurs voient les
// statistiques se mettre à jour automatiquement.
db.ref("votes").on(
  "value",
  (snapshot) => {
    const data = snapshot.val() || {};
    votes = Object.values(data);
    setStatsStatus(`Connecté aux votes partagés (${votes.length} envoi${votes.length > 1 ? "s" : ""}).`);
    renderStats();
  },
  (error) => {
    console.error("Erreur de connexion à Realtime Database :", error);
    setStatsStatus("Impossible de charger les votes partagés (vérifie ta connexion).");
  }
);

async function recordVote(pseudo, chosenIds) {
  try {
    await db.ref("votes").push({
      pseudo,
      ids: chosenIds,
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi du vote :", error);
    alert("Impossible d'enregistrer ton choix en ligne pour le moment. Réessaie plus tard.");
  }
}

function computeAllPokemonStats(voteList) {
  const counts = new Map();

  voteList.forEach((vote) => {
    const ids = Array.isArray(vote) ? vote : vote.ids || [];
    ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
  });

  const total = voteList.length;

  return POKEMON_LIST.map((pokemon) => {
    const count = counts.get(pokemon.id) || 0;
    return {
      id: pokemon.id,
      count,
      pct: total ? Math.round((count / total) * 100) : 0
    };
  }).sort((a, b) => b.count - a.count);
}

function renderStats() {
  statsList.innerHTML = "";

  if (votes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "stats-empty";
    empty.textContent = "Aucun choix envoyé pour l'instant (tous les Pokémon sont à 0%).";
    statsList.appendChild(empty);
  }

  const all = computeAllPokemonStats(votes);

  all.forEach((entry, index) => {
    const pokemon = POKEMON_LIST.find((p) => p.id === entry.id);
    if (!pokemon) return;

    const row = document.createElement("div");
    row.className = "stats-row";

    const rank = document.createElement("span");
    rank.className = "stats-rank";
    rank.textContent = `${index + 1}.`;

    const sprite = document.createElement("img");
    sprite.className = "combo-sprite";
    sprite.alt = "";
    sprite.src = spriteUrl(entry.id);

    const name = document.createElement("span");
    name.className = "stats-name";
    name.textContent = pokemon.name;

    const barTrack = document.createElement("div");
    barTrack.className = "stats-bar-track";
    const barFill = document.createElement("div");
    barFill.className = "stats-bar-fill";
    barFill.style.width = `${entry.pct}%`;
    barTrack.appendChild(barFill);

    const pct = document.createElement("span");
    pct.className = "stats-pct";
    pct.textContent = entry.count > 0 ? `${entry.pct}% (${entry.count})` : `${entry.pct}%`;

    row.appendChild(rank);
    row.appendChild(sprite);
    row.appendChild(name);
    row.appendChild(barTrack);
    row.appendChild(pct);

    statsList.appendChild(row);
  });
}

renderStats();

