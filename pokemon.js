// app.js
const API_BASE = "https://pokeapi.co/api/v2/pokemon/";
const STORAGE_CACHE_KEY = "pokeapi_cache_v1";   // cached API responses
const STORAGE_TEAM_KEY = "pokemon_team_v1";     // saved team

// In-memory cache (fast)
const memCache = new Map();

// DOM
const inputEl = document.getElementById("poke-input");
const findBtn = document.getElementById("find-btn");
const statusEl = document.getElementById("status");

const imgEl = document.getElementById("pokemon-img");
const audioEl = document.getElementById("pokemon-audio");
const typesEl = document.getElementById("pokemon-types");

const moveSelects = [
  document.getElementById("move-1"),
  document.getElementById("move-2"),
  document.getElementById("move-3"),
  document.getElementById("move-4"),
];

const addBtn = document.getElementById("add-btn");
const teamListEl = document.getElementById("team-list");
const clearTeamBtn = document.getElementById("clear-team");

// State
let currentPokemon = null;

window.onload = () => {
  // load team from storage and render
  renderTeam(loadTeam());

  // events
  findBtn.addEventListener("click", onFind);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onFind();
  });

  addBtn.addEventListener("click", onAddToTeam);
  clearTeamBtn.addEventListener("click", () => {
    saveTeam([]);
    renderTeam([]);
  });

  // initial UI
  resetPokemonUI();
};

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function normalizeQuery(q) {
  return (q || "").trim().toLowerCase();
}

function resetPokemonUI() {
  currentPokemon = null;

  imgEl.src = "";
  imgEl.alt = "";

  audioEl.src = "";
  audioEl.load();
  audioEl.style.opacity = "0.3";

  typesEl.innerHTML = "";

  for (const sel of moveSelects) {
    sel.innerHTML = `<option value="">(moves will load here)</option>`;
    sel.disabled = true;
  }

  addBtn.disabled = true;
  setStatus("Enter a Pokémon name or ID and click Find.");
}

async function onFind() {
  const q = normalizeQuery(inputEl.value);

  if (!q) {
    setStatus("Please enter a Pokémon name or ID.");
    return;
  }

  setStatus("Loading...");
  addBtn.disabled = true;

  try {
    const pokemon = await getPokemon(q);
    currentPokemon = pokemon;
    populatePokemonUI(pokemon);
    setStatus(`Loaded #${pokemon.id} ${pokemon.name}.`);
    addBtn.disabled = false;
  } catch (err) {
    console.error(err);
    resetPokemonUI();
    setStatus("Could not find that Pokémon. Try a name like 'snorlax' or an ID 1–151.");
  }
}

// Fetch with caching (localStorage + memory)
async function getPokemon(nameOrId) {
  const key = normalizeQuery(nameOrId);

  // 1) in-memory
  if (memCache.has(key)) return memCache.get(key);

  // 2) localStorage cache
  const storedCache = loadCache();
  if (storedCache[key]) {
    memCache.set(key, storedCache[key]);
    return storedCache[key];
  }

  // 3) fetch
  const url = API_BASE + encodeURIComponent(key);
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

  const data = await res.json();

  // store under both id and name so later requests are cache hits either way
  const byName = normalizeQuery(data.name);
  const byId = String(data.id);

  storedCache[byName] = data;
  storedCache[byId] = data;
  saveCache(storedCache);

  memCache.set(byName, data);
  memCache.set(byId, data);

  return data;
}

// UI population
function populatePokemonUI(pokemon) {
  // Image (sprite)
  const sprite =
    pokemon.sprites?.front_default ||
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    "";
  imgEl.src = sprite;
  imgEl.alt = pokemon.name;

  // Types
  typesEl.innerHTML = "";
  const types = (pokemon.types || [])
    .map((t) => t.type?.name)
    .filter(Boolean);

  for (const t of types) {
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = t;
    typesEl.appendChild(badge);
  }

  // Audio (cries)
  const cryUrl = pokemon.cries?.latest || pokemon.cries?.legacy || "";
  if (cryUrl) {
    audioEl.src = cryUrl;
    audioEl.load();
    audioEl.style.opacity = "1";
  } else {
    audioEl.src = "";
    audioEl.load();
    audioEl.style.opacity = "0.3";
  }

  // Moves dropdowns
  const moves = (pokemon.moves || [])
    .map((m) => m.move?.name)
    .filter(Boolean);

  fillMoveSelects(moves);
}

function fillMoveSelects(moves) {
  // fallback if API ever returns empty
  const safeMoves = moves.length ? moves : ["(no moves found)"];

  // Build one options HTML string (fast)
  const optionsHtml = safeMoves
    .map((m) => `<option value="${escapeHtml(m)}">${m}</option>`)
    .join("");

  for (let i = 0; i < moveSelects.length; i++) {
    const sel = moveSelects[i];
    sel.disabled = false;
    sel.innerHTML = optionsHtml;

    // pick first 4 unique moves as defaults (if possible)
    const defaultIndex = Math.min(i, safeMoves.length - 1);
    sel.selectedIndex = defaultIndex;
  }
}

// Team saving + rendering
function onAddToTeam() {
  if (!currentPokemon) return;

  const chosenMoves = moveSelects.map((sel) => sel.value).filter(Boolean);

  const entry = {
    id: currentPokemon.id,
    name: currentPokemon.name,
    sprite:
      currentPokemon.sprites?.front_default ||
      currentPokemon.sprites?.other?.["official-artwork"]?.front_default ||
      "",
    types: (currentPokemon.types || []).map((t) => t.type?.name).filter(Boolean),
    moves: chosenMoves,
  };

  const team = loadTeam();
  team.push(entry);
  saveTeam(team);
  renderTeam(team);
}

function renderTeam(team) {
  teamListEl.innerHTML = "";

  if (!team.length) {
    teamListEl.innerHTML = `<div class="team-row"><div></div><div class="team-meta"><div class="team-name">No Pokémon yet.</div><div class="muted">Add some to your team.</div></div></div>`;
    return;
  }

  for (const member of team) {
    const row = document.createElement("div");
    row.className = "team-row";

    const img = document.createElement("img");
    img.className = "team-sprite";
    img.src = member.sprite || "";
    img.alt = member.name || "pokemon";

    const meta = document.createElement("div");
    meta.className = "team-meta";

    const title = document.createElement("div");
    title.className = "team-title";

    const name = document.createElement("span");
    name.className = "team-name";
    name.textContent = `${member.name} (#${member.id})`;

    const typesWrap = document.createElement("div");
    typesWrap.className = "team-types";
    for (const t of member.types || []) {
      const badge = document.createElement("span");
      badge.className = "type-badge";
      badge.textContent = t;
      typesWrap.appendChild(badge);
    }

    title.appendChild(name);
    title.appendChild(typesWrap);

    const movesUl = document.createElement("ul");
    movesUl.className = "team-moves";
    for (const m of member.moves || []) {
      const li = document.createElement("li");
      li.textContent = m;
      movesUl.appendChild(li);
    }

    meta.appendChild(title);
    meta.appendChild(movesUl);

    row.appendChild(img);
    row.appendChild(meta);

    teamListEl.appendChild(row);
  }
}

// localStorage helpers
function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCache(cacheObj) {
  try {
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cacheObj));
  } catch {
    // If storage is full or blocked, just skip caching.
  }
}

function loadTeam() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_TEAM_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTeam(teamArr) {
  try {
    localStorage.setItem(STORAGE_TEAM_KEY, JSON.stringify(teamArr));
  } catch {
    // ignore
  }
}

// tiny helper to keep option values safe
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}