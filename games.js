document.addEventListener("DOMContentLoaded", () => {
  const controls = document.getElementById("controls");
  const content = document.getElementById("game-directory-content");
  if (!controls || !content) return;

  const IS_LOCAL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  const CSV_URL = IS_LOCAL
    ? "sega crew database - master sheet.csv"
    : "https://stupendous-paletas-199024.netlify.app/sega crew database - master sheet.csv";

  let allRows = [];
  let currentGameRunRows = [];
  let currentGameRunIndex = -1;
  let selectedConsoleFilter = "";
  let currentGameOptions = [];
  
  const TRILOGY_MAP = {
  "Golden Axe Trilogy": [
    "Golden Axe",
    "Golden Axe II",
    "Golden Axe III",
    "Golden Axe 3"
  ],
  "Bare Knuckle Trilogy": [
    "Bare Knuckle",
    "Bare Knuckle 2",
    "Bare Knuckle 3"
  ],
  "Shinobi Trilogy Shuffler": [
    "The Revenge of Shinobi",
    "Shadow Dancer: The Secret of Shinobi",
    "Shinobi III: Return of the Ninja Master"
  ],
  "Shinobi Trilogy": [
    "The Revenge of Shinobi",
    "Shadow Dancer: The Secret of Shinobi",
    "Shinobi III: Return of the Ninja Master"
  ],
  "Ecco Trilogy": [
    "Ecco the Dolphin",
    "Ecco: The Tides of Time",
    "Ecco Jr."
  ],
  "Alex Kidd in Miracle World Trilogy Shuffler": [
    "Alex Kidd in Miracle World",
    "Alex Kidd 3: Curse in Miracle World",
    "Alex Kidd in Miracle World 2"
  ],
  "Sonic Rush Trilogy": [
    "Sonic Rush",
    "Sonic Rush Adventure",
    "Sonic Colors"
  ],
  "Classic Sonic Trilogy": [
    "Sonic the Hedgehog",
    "Sonic the Hedgehog 2",
    "Sonic 3 & Knuckles"
  ],
  "Valis Trilogy": [
    "Valis: The Fantasm Soldier",
    "Syd of Valis",
    "Valis III"
  ]
};

  const wrapper = document.createElement("div");
  wrapper.className = "sc-page-controls";
  
  const consoleLabel = document.createElement("div");
consoleLabel.className = "sc-label";
consoleLabel.textContent = "Filter by Console";

const consoleDropdown = document.createElement("div");
consoleDropdown.className = "sc-dropdown";
consoleDropdown.id = "consoleDropdown";

const consoleTrigger = document.createElement("button");
consoleTrigger.type = "button";
consoleTrigger.className = "sc-dropdown-trigger";
consoleTrigger.setAttribute("aria-haspopup", "listbox");
consoleTrigger.setAttribute("aria-expanded", "false");
consoleTrigger.textContent = "All Consoles";

const consoleMenu = document.createElement("div");
consoleMenu.className = "sc-dropdown-menu";
consoleMenu.setAttribute("role", "listbox");

consoleDropdown.appendChild(consoleTrigger);
consoleDropdown.appendChild(consoleMenu);

const gameLabel = document.createElement("div");
gameLabel.className = "sc-label";

const dropdown = document.createElement("div");
dropdown.className = "sc-dropdown";
dropdown.id = "gameDropdown";

const trigger = document.createElement("button");
trigger.type = "button";
trigger.className = "sc-dropdown-trigger";
trigger.setAttribute("aria-haspopup", "listbox");
trigger.setAttribute("aria-expanded", "false");
trigger.textContent = "Loading games...";

const menu = document.createElement("div");
menu.className = "sc-dropdown-menu";
menu.setAttribute("role", "listbox");

dropdown.appendChild(trigger);
dropdown.appendChild(menu);

wrapper.appendChild(consoleLabel);
wrapper.appendChild(consoleDropdown);
wrapper.appendChild(gameLabel);
wrapper.appendChild(dropdown);
controls.appendChild(wrapper);

  const label = document.createElement("div");
  label.className = "sc-label";


  dropdown.appendChild(trigger);
  dropdown.appendChild(menu);
  wrapper.appendChild(label);
  wrapper.appendChild(dropdown);
  controls.appendChild(wrapper);
  
  const modal = document.createElement("div");
modal.className = "sc-modal";
modal.id = "runModal";
modal.innerHTML = `
  <div class="sc-modal-content" role="dialog" aria-modal="true" aria-labelledby="scModalTitle">
    <button type="button" class="sc-modal-close" aria-label="Close">×</button>

    <div class="sc-modal-nav">
      <button type="button" class="sc-modal-prev">← Previous</button>
      <button type="button" class="sc-modal-next">Next →</button>
    </div>

    <h3 class="sc-modal-title" id="scModalTitle"></h3>
    <p class="sc-modal-subtitle" id="scModalSubtitle"></p>
    <div id="scModalBody"></div>
  </div>
`;

document.body.appendChild(modal);

const modalTitle = modal.querySelector("#scModalTitle");
const modalSubtitle = modal.querySelector("#scModalSubtitle");
const modalBody = modal.querySelector("#scModalBody");
const modalClose = modal.querySelector(".sc-modal-close");
const prevBtn = modal.querySelector(".sc-modal-prev");
const nextBtn = modal.querySelector(".sc-modal-next");

  function closeMenu() {
    dropdown.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    dropdown.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  }
  

  function normalizeName(value) {
    return String(value || "").trim();
  }
  
  function isTrilogyTitle(gameName) {
  return Object.prototype.hasOwnProperty.call(TRILOGY_MAP, gameName);
}

function getMatchingTrilogyTitles(gameName) {
  return Object.entries(TRILOGY_MAP)
    .filter(([, componentGames]) => componentGames.includes(gameName))
    .map(([trilogyTitle]) => trilogyTitle);
}

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
  
  function getNamesFromColumns(row, prefix, maxCount) {
  const names = [];
  for (let i = 1; i <= maxCount; i++) {
    const name = normalizeName(row[`${prefix}${i}`]);
    if (name) names.push(name);
  }
  return names;
}

function getRunnerNames(row) {
  return getNamesFromColumns(row, "RUNNER", 16);
}

function getRunnerLinksHtml(row) {
  const names = getRunnerNames(row);

  return names.map(name => {
    const safeName = encodeURIComponent(name);
    return `<a href="https://twitch.tv/${safeName}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`;
  }).join("<br>");
}

function buildTwitchLinksHtml(names) {
  return names.map(name => {
    const safeName = encodeURIComponent(name);
    return `<a href="https://twitch.tv/${safeName}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`;
  }).join(" / ");
}

function parseTimestampToSeconds(timestamp) {
  const raw = String(timestamp || "").trim();
  if (!raw) return 0;

  const parts = raw.split(":").map(part => parseInt(part, 10));
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (minutes * 60) + seconds;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return 0;
}

function getYouTubeEmbedUrl(url, timestamp) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    let videoId = "";

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      } else if (parsed.pathname.startsWith("/live/")) {
        videoId = parsed.pathname.split("/live/")[1]?.split("/")[0] || "";
      }
    }

    videoId = videoId.split("?")[0].split("&")[0].trim();
    if (!videoId) return "";

    const startSeconds = parseTimestampToSeconds(timestamp);
    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);

    if (startSeconds > 0) {
      embedUrl.searchParams.set("start", String(startSeconds));
    }

    return embedUrl.toString();
  } catch {
    return "";
  }
}

function parseRaceTimeToSeconds(timeStr) {
  const raw = String(timeStr || "").trim();
  if (!raw) return null;

  const parts = raw.split(":").map(part => parseInt(part, 10));
  if (parts.some(Number.isNaN)) return null;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (minutes * 60) + seconds;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

function formatSecondsAsTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function getUniqueConsoles(rows) {
  const consoles = new Set();

  rows.forEach(row => {
    const consoleName = normalizeName(row.CONSOLE);
    if (consoleName) consoles.add(consoleName);
  });

  return [...consoles].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

function closeConsoleMenu() {
  consoleDropdown.classList.remove("open");
  consoleTrigger.setAttribute("aria-expanded", "false");
}

function openConsoleMenu() {
  consoleDropdown.classList.add("open");
  consoleTrigger.setAttribute("aria-expanded", "true");
}

function populateGameDropdown() {
  currentGameOptions = getGameDropdownOptions(allRows, selectedConsoleFilter);

  menu.innerHTML = "";
  trigger.textContent = "Select a game";

  if (!currentGameOptions.length) {
    trigger.textContent = "No games found";
    return;
  }

  const defaultItem = document.createElement("button");
  defaultItem.type = "button";
  defaultItem.className = "sc-dropdown-item";
  defaultItem.textContent = "Select a game";
  defaultItem.addEventListener("click", () => setSelected(null));
  menu.appendChild(defaultItem);

  currentGameOptions.forEach(option => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sc-dropdown-item";
    item.textContent = option.label;
    item.title = option.label;
    item.addEventListener("click", () => setSelected(option));
    menu.appendChild(item);
  });
}

function populateConsoleDropdown() {
  const consoles = getUniqueConsoles(allRows);

  consoleMenu.innerHTML = "";

  const allItem = document.createElement("button");
  allItem.type = "button";
  allItem.className = "sc-dropdown-item";
  allItem.textContent = "All Consoles";
  allItem.addEventListener("click", () => {
    selectedConsoleFilter = "";
    consoleTrigger.textContent = "All Consoles";
    closeConsoleMenu();
    setSelected(null);
    populateGameDropdown();
  });
  consoleMenu.appendChild(allItem);

  consoles.forEach(consoleName => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sc-dropdown-item";
    item.textContent = consoleName;
    item.title = consoleName;
    item.addEventListener("click", () => {
      selectedConsoleFilter = consoleName;
      consoleTrigger.textContent = consoleName;
      closeConsoleMenu();
      setSelected(null);
      populateGameDropdown();
    });
    consoleMenu.appendChild(item);
  });
}

function formatDifferenceFromLeader(diffSeconds) {
  if (diffSeconds === null || diffSeconds <= 0) return "—";
  return `+${formatSecondsAsTime(diffSeconds)}`;
}

function buildRaceResultsData(row, timePrefix) {
  const results = [];

  for (let i = 1; i <= 6; i++) {
    const runnerName = normalizeName(row[`RUNNER${i}`]);
    const timeValue = normalizeName(row[`${timePrefix}${i}`]);

    if (!runnerName || !timeValue) continue;

    const seconds = parseRaceTimeToSeconds(timeValue);

    results.push({
      runner: runnerName,
      time: timeValue,
      seconds,
      isDNF: seconds === null
    });
  }

  if (!results.length) return [];

  results.sort((a, b) => {
    if (a.isDNF && b.isDNF) return 0;
    if (a.isDNF) return 1;
    if (b.isDNF) return -1;
    return a.seconds - b.seconds;
  });

  const fastestEntry = results.find(r => !r.isDNF);
  const fastest = fastestEntry ? fastestEntry.seconds : null;

  return results.map(item => ({
    runner: item.runner,
    time: item.time,
    difference: item.isDNF || fastest === null ? null : item.seconds - fastest
  }));
}

function createRaceTable(title, data) {
  if (!data.length) return null;

  const wrap = document.createElement("div");
  wrap.className = "sc-race-box";

  const heading = document.createElement("div");
  heading.className = "sc-race-title";
  heading.textContent = title;

  const table = document.createElement("table");
  table.className = "sc-race-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>RUNNER</th>
        <th>TIME</th>
        <th>DIFFERENCE</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(item => `
        <tr>
          <td>${escapeHtml(item.runner)}</td>
          <td>${escapeHtml(item.time)}</td>
          <td>${escapeHtml(formatDifferenceFromLeader(item.difference))}</td>
        </tr>
      `).join("")}
    </tbody>
  `;

  wrap.appendChild(heading);
  wrap.appendChild(table);
  return wrap;
}

function closeRunModal() {
  modal.classList.remove("open");
  modalBody.innerHTML = "";
  document.body.style.overflow = "";
}

function openRunModal(row) {
  const game = normalizeName(row.GAME) || "Untitled Run";
  const speedrunType = normalizeName(row.SPEEDRUNTYPE);
  const runType = normalizeName(row.RUNTYPE);
  const typeText = speedrunType || runType || "Run";

  const runnerNames = getRunnerNames(row);
  const runnerLinksHtml = runnerNames.length ? buildTwitchLinksHtml(runnerNames) : "";

  const commentaryNames = getNamesFromColumns(row, "COMMENTARY", 16);
  const commentaryLinksHtml = commentaryNames.length ? buildTwitchLinksHtml(commentaryNames) : "";

  const embedUrl = getYouTubeEmbedUrl(row.VIDEOURL, row.TIMESTAMP);
  const embedUrl2 = getYouTubeEmbedUrl(row.VIDEOURL2, row.TIMESTAMP2);

  const race1Data = buildRaceResultsData(row, "TIMERUNNER");
  const race2Data = buildRaceResultsData(row, "RACE2TIMERUNNER");

  const eventName = normalizeName(row.EVENT);

  modalTitle.textContent = game;

  modalSubtitle.innerHTML = `
    ${eventName ? `<div class="sc-modal-event">${escapeHtml(eventName)}</div>` : ""}
    <div class="sc-modal-meta-line">
      <span class="sc-modal-type">${escapeHtml(typeText)}</span>
      ${runnerLinksHtml ? `<span> by ${runnerLinksHtml}</span>` : ""}
    </div>
    ${commentaryLinksHtml ? `
      <div class="sc-modal-meta-line sc-modal-commentary">
        Commentary by: ${commentaryLinksHtml}
      </div>
    ` : ""}
  `;

  modalBody.innerHTML = "";

  if (race1Data.length || race2Data.length) {
    const raceTablesWrap = document.createElement("div");
    raceTablesWrap.className = "sc-race-tables-wrap";

    if (race1Data.length) {
      const race1Table = createRaceTable("RACE #1", race1Data);
      if (race1Table) raceTablesWrap.appendChild(race1Table);
    }

    if (race2Data.length) {
      const race2Table = createRaceTable("RACE #2", race2Data);
      if (race2Table) raceTablesWrap.appendChild(race2Table);
    }

    modalBody.appendChild(raceTablesWrap);
  }

  function createVideoEmbed(url, titleText) {
    const iframe = document.createElement("iframe");
    iframe.className = "sc-modal-video";
    iframe.src = url;
    iframe.title = titleText;
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    return iframe;
  }

  if (embedUrl) {
    modalBody.appendChild(createVideoEmbed(embedUrl, game));
  }

  if (embedUrl2) {
    modalBody.appendChild(createVideoEmbed(embedUrl2, `${game} - Video 2`));
  }

  if (!embedUrl && !embedUrl2) {
    const msg = document.createElement("p");
    msg.className = "sc-modal-message";
    msg.textContent = "No valid YouTube video is available for this run.";
    modalBody.appendChild(msg);
  }

  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  prevBtn.disabled = currentGameRunIndex <= 0;
  nextBtn.disabled = currentGameRunIndex >= currentGameRunRows.length - 1;
}

modalClose.addEventListener("click", closeRunModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeRunModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeRunModal();
    closeMenu();
  }
});

prevBtn.addEventListener("click", () => {
  if (currentGameRunIndex > 0) {
    currentGameRunIndex--;
    openRunModal(currentGameRunRows[currentGameRunIndex]);
  }
});

nextBtn.addEventListener("click", () => {
  if (currentGameRunIndex < currentGameRunRows.length - 1) {
    currentGameRunIndex++;
    openRunModal(currentGameRunRows[currentGameRunIndex]);
  }
});

  function getGameDropdownOptions(rows, consoleFilter = "") {
  const gameToConsoles = new Map();

  rows.forEach(row => {
    const game = normalizeName(row.GAME);
    const consoleName = normalizeName(row.CONSOLE);

    if (!game) return;
    if (isTrilogyTitle(game)) return;

    if (consoleFilter && consoleName !== consoleFilter) return;

    if (!gameToConsoles.has(game)) {
      gameToConsoles.set(game, new Set());
    }

    if (consoleName) {
      gameToConsoles.get(game).add(consoleName);
    }
  });

  const options = [];

  for (const [game, consoleSet] of gameToConsoles.entries()) {
    const consoles = [...consoleSet].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );

    if (consoles.length <= 1) {
      options.push({
        label: game,
        game,
        console: consoles[0] || ""
      });
    } else {
      consoles.forEach(consoleName => {
        options.push({
          label: `${game} (${consoleName})`,
          game,
          console: consoleName
        });
      });
    }
  }

  return options.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
  );
}

  function makeGamePlaceholder(gameName) {
    const div = document.createElement("div");
    div.className = "sc-game-art-placeholder";
    div.textContent = (gameName || "?").charAt(0).toUpperCase();
    return div;
  }

  async function getIGDBBoxArt(gameName, gameRows) {
  try {
    const consoleName = normalizeName(gameRows?.[0]?.CONSOLE || "");
    const response = await fetch(
      `/api/igdb-cover?game=${encodeURIComponent(gameName)}&console=${encodeURIComponent(consoleName)}`
    );

    if (!response.ok) return "";

    const data = await response.json();
    return data.cover_url || "";
  } catch {
    return "";
  }
}

  function getGameRows(selectedOption) {
  const matchingTrilogies = getMatchingTrilogyTitles(selectedOption.game);

  return allRows.filter(row => {
    const rowGame = normalizeName(row.GAME);
    const rowConsole = normalizeName(row.CONSOLE);

    const matchesBaseGame = rowGame === selectedOption.game;
    const matchesRelatedTrilogy = matchingTrilogies.includes(rowGame);

    if (!matchesBaseGame && !matchesRelatedTrilogy) {
      return false;
    }

    if (selectedOption.console) {
      return rowConsole === selectedOption.console;
    }

    return true;
  });
}

  function getRunnerNamesPlain(row) {
    const names = [];

    for (let i = 1; i <= 16; i++) {
      const runner = normalizeName(row[`RUNNER${i}`]);
      if (runner) names.push(runner);
    }

    return names.join(", ");
  }

  function buildGameSummary(gameRows) {
  const eventSet = new Set();
  const runnerCounts = new Map();

  gameRows.forEach(row => {
    const eventName = normalizeName(row.EVENT);
    if (eventName) eventSet.add(eventName);

    for (let i = 1; i <= 16; i++) {
      const runner = normalizeName(row[`RUNNER${i}`]);
      if (runner) {
        runnerCounts.set(runner, (runnerCounts.get(runner) || 0) + 1);
      }
    }
  });

  let topCount = 0;
  let topRunners = [];

  for (const [runner, count] of runnerCounts.entries()) {
    if (count > topCount) {
      topCount = count;
      topRunners = [runner];
    } else if (count === topCount) {
      topRunners.push(runner);
    }
  }

  let mostCommonRunnerDisplay = "—";

if (topRunners.length === 1) {
  mostCommonRunnerDisplay = topRunners[0];
} else if (topRunners.length === 2) {
  mostCommonRunnerDisplay = `Tie between ${topRunners[0]} and ${topRunners[1]}`;
} else if (topRunners.length > 2) {
  mostCommonRunnerDisplay = `${topRunners.length}-way tie`;
}

  return {
    runCount: gameRows.length,
    eventCount: eventSet.size,
    mostCommonRunnerDisplay
  };
}

  function renderGameRunsTable(selectedOption, gameRows) {
  currentGameRunRows = gameRows;

  const wrap = document.createElement("div");
  wrap.className = "sc-game-runs-wrap";

  const card = document.createElement("div");
  card.className = "sc-game-runs-card";

  const title = document.createElement("h3");
  title.className = "sc-game-runs-title";
  title.textContent = `${selectedOption.game} RUNS`;

  const tableWrap = document.createElement("div");
  tableWrap.className = "sc-game-runs-table-wrap";

  const table = document.createElement("table");
  table.className = "sc-game-runs-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>GAME</th>
      <th>EVENT</th>
      <th>DATE</th>
      <th>RUN TYPE</th>
      <th>SPEEDRUN CATEGORY</th>
      <th>RUNNER(S)</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  gameRows.forEach((row, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><button type="button" class="sc-game-link">${escapeHtml(normalizeName(row.GAME) || "—")}</button></td>
      <td>${escapeHtml(normalizeName(row.EVENT) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.DATE) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.RUNTYPE) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.SPEEDRUNTYPE) || "—")}</td>
      <td>${getRunnerLinksHtml(row) || "—"}</td>
    `;

    const gameButton = tr.querySelector(".sc-game-link");
    gameButton.addEventListener("click", () => {
      currentGameRunIndex = index;
      openRunModal(row);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  card.appendChild(title);
  card.appendChild(tableWrap);
  wrap.appendChild(card);
  content.appendChild(wrap);
}

  async function renderGame(selectedOption) {
    content.innerHTML = "";

    if (!selectedOption) return;

    const gameRows = getGameRows(selectedOption);
    const summary = buildGameSummary(gameRows);

    const wrap = document.createElement("div");
    wrap.className = "sc-game-wrap";

    const card = document.createElement("div");
    card.className = "sc-game-card";

    const left = document.createElement("div");
    left.className = "sc-game-left";

    const artWrap = document.createElement("div");
    artWrap.className = "sc-game-art-wrap";
    artWrap.appendChild(makeGamePlaceholder(selectedOption.game));

    const info = document.createElement("div");
    info.className = "sc-game-info";

    const nameEl = document.createElement("h3");
    nameEl.className = "sc-game-name";
    nameEl.textContent = selectedOption.game;

    info.appendChild(nameEl);

    if (selectedOption.console) {
      const consoleEl = document.createElement("p");
      consoleEl.className = "sc-game-console";
      consoleEl.textContent = `Console: ${selectedOption.console}`;
      info.appendChild(consoleEl);
    }

    const noteEl = document.createElement("p");
    noteEl.className = "sc-game-note";
    info.appendChild(noteEl);

    left.appendChild(artWrap);
    left.appendChild(info);

    const right = document.createElement("div");
    right.className = "sc-game-right";
    right.innerHTML = `
      <div class="sc-game-quickstats">
        <div><strong>Total Runs:</strong> ${escapeHtml(String(summary.runCount))}</div>
        <div><strong>Total Events:</strong> ${escapeHtml(String(summary.eventCount))}</div>
        <div><strong>Most Common Runner:</strong> ${escapeHtml(summary.mostCommonRunnerDisplay)}</div>
      </div>
    `;

    card.appendChild(left);
    card.appendChild(right);
    wrap.appendChild(card);
    content.appendChild(wrap);

    renderGameRunsTable(selectedOption, gameRows);

    const boxArtUrl = await getIGDBBoxArt(selectedOption.game, gameRows);
    if (boxArtUrl) {
      const img = document.createElement("img");
      img.className = "sc-game-art";
      img.src = boxArtUrl;
      img.alt = `${selectedOption.game} box art`;
      artWrap.innerHTML = "";
      artWrap.appendChild(img);
      noteEl.remove();
    }
  }

  function setSelected(selectedOption) {
    trigger.textContent = selectedOption ? selectedOption.label : "Select a game";
    trigger.dataset.value = selectedOption ? selectedOption.label : "";
    closeMenu();
    renderGame(selectedOption);
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });
  
  consoleTrigger.addEventListener("click", (e) => {
  e.stopPropagation();
  if (consoleDropdown.classList.contains("open")) {
    closeConsoleMenu();
  } else {
    openConsoleMenu();
  }
});

  document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) {
    closeMenu();
  }
  if (!consoleDropdown.contains(e.target)) {
    closeConsoleMenu();
  }
});

  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allRows = results.data || [];
      populateConsoleDropdown();
populateGameDropdown();

if (!currentGameOptions.length) {
  trigger.textContent = "No games found";
  content.innerHTML = `<p class="sc-results-message">No games were found in the CSV.</p>`;
  return;
}

      const defaultItem = document.createElement("button");
      defaultItem.type = "button";
      defaultItem.className = "sc-dropdown-item";
      defaultItem.textContent = "Select a game";
      defaultItem.addEventListener("click", () => setSelected(null));
      menu.appendChild(defaultItem);

      gameOptions.forEach(option => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "sc-dropdown-item";
        item.textContent = option.label;
        item.title = option.label;
        item.addEventListener("click", () => setSelected(option));
        menu.appendChild(item);
      });
    },
    error: function(err) {
      console.error("Papa Parse load error:", err);
      trigger.textContent = "Failed to load games";
      content.innerHTML = `<p class="sc-results-message">Could not load CSV data.</p>`;
    }
  });
});
