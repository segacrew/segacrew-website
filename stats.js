document.addEventListener("DOMContentLoaded", () => {
  const controls = document.getElementById("controls");
  if (!controls) return;

  let activeStatsType = "member";
  
  let racesRows = [];
  let freeForAllRows = [];
  let databaseRows = [];
  let raceData = [];
  let currentStatsCharts = [];
  let videoDurationMap = new Map();
  let activeConsoleStatsType = "Master System";
  let gameLibraryRows = [];
  let twitchChannelStats = null;
  
  let statsCache = {
  uniqueGamesRanking: [],
  eventsRanking: [],
  timeActiveRanking: [],
  totalRunsRanking: [],
  mostRacesRanking: [],
  raceWinsRanking: [],
  playtimeRanking: [],
  activeMembersByYear: []
};

  const wrapper = document.createElement("div");
  wrapper.className = "sc-page-controls sc-stats-controls";

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "sc-stats-button-group";

  const memberButton = createStatsButton("Member Stats", "member");
  const gameButton = createStatsButton("Game Stats", "game");
  const crewButton = createStatsButton("Sega Crew Stats", "crew");

  const resultsWrap = document.createElement("div");
  resultsWrap.className = "sc-results-wrap";
  resultsWrap.id = "resultsWrap";

  buttonGroup.appendChild(memberButton);
  buttonGroup.appendChild(gameButton);
  buttonGroup.appendChild(crewButton);

  wrapper.appendChild(buttonGroup);

  controls.appendChild(wrapper);
  controls.appendChild(resultsWrap);
  
  const IS_LOCAL =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

const CSV_URLS = {
  races: IS_LOCAL
    ? "SEGA CREW RACES - MASTER.csv"
    : "https://stupendous-paletas-199024.netlify.app/SEGA CREW RACES - MASTER.csv",

  freeForAll: IS_LOCAL
    ? "SEGA CREW FREE FOR ALL - MASTER.csv"
    : "https://stupendous-paletas-199024.netlify.app/SEGA CREW FREE FOR ALL - MASTER.csv",

  database: IS_LOCAL
    ? "Sega Crew Database - Master Sheet.csv"
    : "https://stupendous-paletas-199024.netlify.app/Sega Crew Database - Master Sheet.csv",

  gameLibrary: IS_LOCAL
    ? "GAME LIBRARY - MASTER.csv"
    : "https://stupendous-paletas-199024.netlify.app/GAME LIBRARY - MASTER.csv"
};

function loadCsv(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        resolve(results.data || []);
      },
      error: function(err) {
        reject(err);
      }
    });
  });
}

async function loadTwitchChannelStats() {
  try {
    const response = await fetch("/.netlify/functions/twitch-channel-stats");

    if (!response.ok) {
      throw new Error(`Twitch stats request failed: ${response.status}`);
    }

    twitchChannelStats = await response.json();
  } catch (err) {
    console.error("Twitch stats load error:", err);
    twitchChannelStats = null;
  }
}

  function createStatsButton(label, value) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sc-stats-button";
    button.textContent = label;
    button.dataset.value = value;

    if (value === activeStatsType) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      setActiveStatsType(value);
    });

    return button;
  }

  function setActiveStatsType(value) {
    activeStatsType = value;

    [...buttonGroup.querySelectorAll(".sc-stats-button")].forEach(button => {
      button.classList.toggle("active", button.dataset.value === activeStatsType);
    });

    renderStatsPanel();
  }

  function clearResults() {
    resultsWrap.innerHTML = "";
  }
  
  function normalizeName(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return normalizeName(value).toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildTwitchLinkHtml(name) {
  const cleanName = normalizeName(name);
  if (!cleanName) return "";

  const safeUrlName = encodeURIComponent(cleanName);

  return `<a href="https://twitch.tv/${safeUrlName}" target="_blank" rel="noopener noreferrer">${escapeHtml(cleanName)}</a>`;
}

function normalizeHandle(value) {
  return String(value || "").trim().toLowerCase();
}

function getNamesFromColumns(row, prefix, maxCount = 25) {
  const names = [];

  for (let i = 1; i <= maxCount; i++) {
    const name = normalizeName(row[`${prefix}${i}`]);
    if (name) names.push(name);
  }

  return names;
}

function rowIncludesRunner(row, memberName, maxCount = 25) {
  const target = normalizeHandle(memberName);

  for (let i = 1; i <= maxCount; i++) {
    const runner = normalizeHandle(row[`RUNNER${i}`]);
    if (runner === target) return true;
  }

  return false;
}

function extractYouTubeId(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v") || "";
      }

      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }

      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      }

      if (url.pathname.startsWith("/live/")) {
        return url.pathname.split("/live/")[1]?.split("/")[0] || "";
      }
    }
  } catch {
    const match = raw.match(
      /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/
    );

    return match ? match[1] : "";
  }

  return "";
}

function chunkArray(items, size) {
  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
}

async function preloadAllVideoDurations() {
  const ids = new Set();

  databaseRows.forEach(row => {
    const id1 = extractYouTubeId(row.VIDEOURL);
    const id2 = extractYouTubeId(row.VIDEOURL2);

    if (id1) ids.add(id1);
    if (id2) ids.add(id2);
  });

  raceData.forEach(race => {
    const raceId = extractYouTubeId(race.videoUrl);
    if (raceId) ids.add(raceId);
  });

  const chunks = chunkArray([...ids], 50);

  videoDurationMap = new Map();

  for (const chunk of chunks) {
    try {
      const response = await fetch(
        `/api/youtube-durations?ids=${encodeURIComponent(chunk.join(","))}`
      );

      if (!response.ok) continue;

      const data = await response.json();
      const videos = data.videos || {};

      Object.entries(videos).forEach(([id, info]) => {
        if (info && typeof info.duration_seconds === "number") {
          videoDurationMap.set(id, info.duration_seconds);
        }
      });
    } catch (err) {
      console.error("youtube-durations error:", err);
    }
  }
}

function formatSecondsAsTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function calculateCurrentActiveMembers() {
  const activeMembers = new Set();

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  function addRunnersIfRecent(dateValue, runnerNames) {
    const date = parseEventDate(dateValue);

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
    if (date < oneYearAgo || date > today) return;

    runnerNames.forEach(name => {
      const cleanName = normalizeName(name);
      if (cleanName) {
        activeMembers.add(normalizeHandle(cleanName));
      }
    });
  }

  // Main database
  databaseRows.forEach(row => {
    addRunnersIfRecent(
      row.DATE,
      getNamesFromColumns(row, "RUNNER", 25)
    );
  });

  // Free For All database
  freeForAllRows.forEach(row => {
    addRunnersIfRecent(
      row.DATE,
      getNamesFromColumns(row, "RUNNER", 25)
    );
  });

  // Races database
  raceData.forEach(race => {
    addRunnersIfRecent(
      race.date,
      race.runners.map(runner => runner.name)
    );
  });

  return activeMembers.size;
}

function buildPlaytimeRankingData() {
  const members = getUniqueMemberNames();

  return members.map(name => {
    let totalSeconds = 0;

    databaseRows.forEach(row => {
      if (!rowIncludesRunner(row, name, 25)) return;

      const id1 = extractYouTubeId(row.VIDEOURL);
      const id2 = extractYouTubeId(row.VIDEOURL2);

      if (id1 && typeof videoDurationMap.get(id1) === "number") {
        totalSeconds += videoDurationMap.get(id1);
      }

      if (id2 && typeof videoDurationMap.get(id2) === "number") {
        totalSeconds += videoDurationMap.get(id2);
      }
    });

    getRacesForRunner(name).forEach(race => {
      const raceId = extractYouTubeId(race.videoUrl);

      if (raceId && typeof videoDurationMap.get(raceId) === "number") {
        totalSeconds += videoDurationMap.get(raceId);
      }
    });

    return {
      name,
      value: totalSeconds,
      display: totalSeconds > 0 ? formatSecondsAsTime(totalSeconds) : "—"
    };
  })
  .filter(item => item.value > 0)
  .sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });
}

function parseRaceFinishTime(timeStr) {
  const raw = normalizeName(timeStr);
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

function normalizeRaceGameId(gameId) {
  const raw = normalizeName(gameId).toUpperCase();
  if (!raw) return "";

  return raw.replace(/[A-Z]+$/, "");
}

function getRaceGameDedupKey(row) {
  const gameId = normalizeName(row.GAMEID);
  const game = normalizeName(row.GAME);

  if (gameId) {
    const normalizedId = normalizeRaceGameId(gameId);
    if (normalizedId) return normalizedId;
  }

  return normalizeKey(game);
}

function buildRaceDatabase(rows) {
  const races = [];
  let currentRace = null;
  let currentRaceSeenGameKeys = new Set();

  rows.forEach(row => {
    const eventId = normalizeName(row.EVENTID);
    const key = normalizeName(row.KEY);
    const eventName = normalizeName(row.EVENT);
    const game = normalizeName(row.GAME);
    const videoUrl = normalizeName(row.VIDEOURL);
    const date = normalizeName(row.DATE);

    if (eventId && (!currentRace || currentRace.eventId !== eventId)) {
      if (currentRace) {
        races.push(currentRace);
      }

      const runners = [];

      for (let i = 1; i <= 21; i++) {
        const name = normalizeName(row[`RUNNER${i}`]);
        const rawTime = normalizeName(row[`RUNNER${i}TIME`]);

        if (!name) continue;

        const parsedSeconds = parseRaceFinishTime(rawTime);

        runners.push({
          name,
          time: rawTime || "",
          seconds: parsedSeconds,
          isDNF: parsedSeconds === null
        });
      }

      currentRace = {
        eventId,
        key,
        eventName,
        date,
        videoUrl,
        runners,
        games: []
      };

      currentRaceSeenGameKeys = new Set();
    }

    if (currentRace && game) {
      const dedupKey = getRaceGameDedupKey(row);

      if (!currentRaceSeenGameKeys.has(dedupKey)) {
        currentRace.games.push(game);
        currentRaceSeenGameKeys.add(dedupKey);
      }
    }
  });

  if (currentRace) {
    races.push(currentRace);
  }

  return races;
}

function runnerIsInRace(race, memberName) {
  const target = normalizeHandle(memberName);

  return race.runners.some(runner =>
    normalizeHandle(runner.name) === target
  );
}

function getRacesForRunner(memberName) {
  return raceData.filter(race => runnerIsInRace(race, memberName));
}

function getConsoleForRace(race) {
  const eventName = normalizeName(race.eventName).toLowerCase();

  if (eventName.includes("sega 8")) return "Genesis";
  if (eventName.includes("mega 16")) return "Genesis";
  if (eventName.includes("sega 16")) return "Genesis";
  if (eventName.includes("master 8")) return "Master System";
  if (eventName.includes("5g game gear")) return "Game Gear";
  if (eventName.includes("saturn8lia")) return "Saturn";
  if (eventName.includes("shinobi")) return "Genesis";

  return "";
}

function destroyStatsChart() {
  currentStatsCharts.forEach(chart => chart.destroy());
  currentStatsCharts = [];
}

function buildTotalRunsRankingData() {
  const members = getUniqueMemberNames();

  return members.map(name => {
    const normalRunCount = databaseRows.filter(row =>
      rowIncludesRunner(row, name, 25)
    ).length;

    const freeForAllRunCount = freeForAllRows.filter(row =>
      rowIncludesRunner(row, name, 25)
    ).length;

    const raceRunCount = getRacesForRunner(name)
      .reduce((sum, race) => sum + race.games.length, 0);

    return {
      name,
      value: normalRunCount + freeForAllRunCount + raceRunCount
    };
  })
  .filter(item => item.value > 0)
  .sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });
}

function renderTopRunsPieChart(canvas) {
  destroyStatsChart();

  const fullRanking = statsCache.totalRunsRanking;
  const ranking = fullRanking.slice(0, 10);

  const labels = ranking.map(item => item.name);
  const values = ranking.map(item => item.value);
  const totalRuns = fullRanking.reduce((sum, item) => sum + item.value, 0);

  const chart = new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#0072B2",
          "#E69F00",
          "#009E73",
          "#CC79A7",
          "#56B4E9",
          "#D55E00",
          "#F0E442",
          "#7A68A6",
          "#2A9D8F",
          "#F4A261"
        ],
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const percent = totalRuns
                ? ((value / totalRuns) * 100).toFixed(1)
                : "0.0";

              return `${label}: ${value} runs (${percent}% of all runs)`;
            }
          }
        }
      }
    }
  });
  
  currentStatsCharts.push(chart);  
}

function buildMostPlayedGamesRankingData() {
  const gameCounts = new Map();

  function addGame(gameName) {
    const game = normalizeName(gameName);
    if (!game) return;

    const gameKey = normalizeKey(game);

    if (!gameCounts.has(gameKey)) {
      gameCounts.set(gameKey, {
        name: game,
        value: 0
      });
    }

    gameCounts.get(gameKey).value++;
  }

  // Main database
  databaseRows.forEach(row => {
    addGame(row.GAME);
  });

  // Free For All database
  freeForAllRows.forEach(row => {
    addGame(row.GAME);
  });

  // Races database
  raceData.forEach(race => {
    race.games.forEach(game => {
      addGame(game);
    });
  });

  return [...gameCounts.values()]
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
}

function buildGamesByUniqueRunnersRankingData() {
  const gameRunnerMap = new Map();

  function addGameRunner(gameName, runnerName) {
    const game = normalizeName(gameName);
    const runner = normalizeName(runnerName);

    if (!game || !runner) return;

    const gameKey = normalizeKey(game);
    const runnerKey = normalizeHandle(runner);

    if (!gameRunnerMap.has(gameKey)) {
      gameRunnerMap.set(gameKey, {
        name: game,
        runners: new Set()
      });
    }

    gameRunnerMap.get(gameKey).runners.add(runnerKey);
  }

  // Main database
  databaseRows.forEach(row => {
    const game = normalizeName(row.GAME);
    if (!game) return;

    getNamesFromColumns(row, "RUNNER", 25).forEach(runner => {
      addGameRunner(game, runner);
    });
  });

  // Free For All database
  freeForAllRows.forEach(row => {
    const game = normalizeName(row.GAME);
    if (!game) return;

    getNamesFromColumns(row, "RUNNER", 25).forEach(runner => {
      addGameRunner(game, runner);
    });
  });

  // Races database
  raceData.forEach(race => {
    race.games.forEach(game => {
      race.runners.forEach(runner => {
        addGameRunner(game, runner.name);
      });
    });
  });

  return [...gameRunnerMap.values()]
    .map(item => ({
      name: item.name,
      value: item.runners.size
    }))
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
}

function getUniqueMemberNames() {
  const nameMap = new Map();

  function addName(name) {
    const clean = normalizeName(name);
    if (!clean) return;

    const key = normalizeHandle(clean);

    if (!nameMap.has(key)) {
      nameMap.set(key, clean);
    }
  }

  databaseRows.forEach(row => {
    getNamesFromColumns(row, "RUNNER", 25).forEach(addName);
  });

  freeForAllRows.forEach(row => {
    getNamesFromColumns(row, "RUNNER", 25).forEach(addName);
  });

  raceData.forEach(race => {
    race.runners.forEach(runner => {
      addName(runner.name);
    });
  });

  return [...nameMap.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

function buildUniqueGamesRankingData() {
  const members = getUniqueMemberNames();

  return members.map(name => {
    const games = new Set();

    // Main database
    databaseRows.forEach(row => {
      if (!rowIncludesRunner(row, name, 25)) return;

      const game = normalizeName(row.GAME);
      if (game) games.add(normalizeKey(game));
    });

    // Free For All database
    freeForAllRows.forEach(row => {
      if (!rowIncludesRunner(row, name, 25)) return;

      const game = normalizeName(row.GAME);
      if (game) games.add(normalizeKey(game));
    });

    // Races database
    getRacesForRunner(name).forEach(race => {
      race.games.forEach(game => {
        const cleanGame = normalizeName(game);
        if (cleanGame) games.add(normalizeKey(cleanGame));
      });
    });

    return {
      name,
      value: games.size
    };
  }).sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });
}

function buildEventsRankingData() {
  const members = getUniqueMemberNames();

  return members.map(name => {
    const events = new Set();

    // Main database only.
    databaseRows.forEach(row => {
      if (!rowIncludesRunner(row, name, 25)) return;

      const eventId = normalizeName(row.EVENTID);
      const eventName = normalizeName(row.EVENT);

      if (eventId) {
        events.add(`eventid-${eventId}`);
      } else if (eventName) {
        events.add(`event-${normalizeKey(eventName)}`);
      }
    });

    // Races database
    getRacesForRunner(name).forEach(race => {
      if (race.eventId) {
        events.add(`race-eventid-${race.eventId}`);
      } else if (race.eventName) {
        events.add(`race-event-${normalizeKey(race.eventName)}`);
      }
    });

    return {
      name,
      value: events.size
    };
  }).sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });
}

function buildActiveMembersByYearData() {
  const yearMembers = new Map();

  function addMemberForYear(dateValue, runnerName) {
    const date = parseEventDate(dateValue);
    const runner = normalizeName(runnerName);

    if (!date || !runner) return;

    const year = String(date.getFullYear());
    const runnerKey = normalizeHandle(runner);

    if (!yearMembers.has(year)) {
      yearMembers.set(year, new Set());
    }

    yearMembers.get(year).add(runnerKey);
  }

  // Main database
  databaseRows.forEach(row => {
    getNamesFromColumns(row, "RUNNER", 25).forEach(runner => {
      addMemberForYear(row.DATE, runner);
    });
  });

  // Free For All database
  freeForAllRows.forEach(row => {
    getNamesFromColumns(row, "RUNNER", 25).forEach(runner => {
      addMemberForYear(row.DATE, runner);
    });
  });

  // Races database
  raceData.forEach(race => {
    race.runners.forEach(runner => {
      addMemberForYear(race.date, runner.name);
    });
  });

  return [...yearMembers.entries()]
    .map(([year, members]) => ({
      year,
      count: members.size
    }))
    .sort((a, b) => Number(a.year) - Number(b.year));
}

function buildMostPlayedConsolesRankingData() {
  const consoleCounts = new Map();

  function addConsole(consoleName, count = 1) {
    const cleanConsole = normalizeName(consoleName);
    if (!cleanConsole) return;

    const consoleKey = normalizeKey(cleanConsole);

    if (!consoleCounts.has(consoleKey)) {
      consoleCounts.set(consoleKey, {
        name: cleanConsole,
        value: 0
      });
    }

    consoleCounts.get(consoleKey).value += count;
  }

  // Main database
  databaseRows.forEach(row => {
    addConsole(row.CONSOLE);
  });

  // Free For All database
  freeForAllRows.forEach(row => {
    addConsole(row.CONSOLE);
  });

  // Races database
  raceData.forEach(race => {
    const raceConsole = getConsoleForRace(race);
    if (!raceConsole) return;

    race.games.forEach(game => {
      if (normalizeName(game)) {
        addConsole(raceConsole);
      }
    });
  });

  return [...consoleCounts.values()]
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
}

function parseEventDate(dateStr) {
  const raw = normalizeName(dateStr);
  if (!raw) return null;

  const parts = raw.split("/");
  if (parts.length !== 3) return null;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(year)
  ) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatActiveDuration(firstDate, lastDate) {
  if (!firstDate || !lastDate) return "—";

  let years = lastDate.getFullYear() - firstDate.getFullYear();
  let months = lastDate.getMonth() - firstDate.getMonth();
  let days = lastDate.getDate() - firstDate.getDate();

  if (days < 0) {
    months--;

    const previousMonthLastDay = new Date(
      lastDate.getFullYear(),
      lastDate.getMonth(),
      0
    ).getDate();

    days += previousMonthLastDay;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0 && months === 0 && days === 0) {
    days = 1;
  }

  const parts = [];

  if (years > 0) {
    parts.push(`${years}y`);
  }

  if (months > 0) {
    parts.push(`${months}m`);
  }

  if (days > 0 || !parts.length) {
    parts.push(`${days}d`);
  }

  return parts.join(" ");
}

function getActiveDateRangeForRunner(memberName) {
  const dates = [];

  // Main database only. Free For All intentionally excluded.
  databaseRows.forEach(row => {
    if (!rowIncludesRunner(row, memberName, 25)) return;

    const date = parseEventDate(row.DATE);
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      dates.push(date);
    }
  });

  // Races database
  getRacesForRunner(memberName).forEach(race => {
    const date = parseEventDate(race.date);
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      dates.push(date);
    }
  });

  if (!dates.length) {
    return null;
  }

  dates.sort((a, b) => a - b);

  return {
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
    daysActive: Math.max(
      1,
      Math.floor((dates[dates.length - 1] - dates[0]) / 86400000)
    )
  };
}

function calculateTotalBroadcastSeconds() {
  const videoIds = new Set();

  // Main database only
  databaseRows.forEach(row => {
    const id1 = extractYouTubeId(row.VIDEOURL);
    const id2 = extractYouTubeId(row.VIDEOURL2);

    if (id1) videoIds.add(id1);
    if (id2) videoIds.add(id2);
  });

  // Races database only
  raceData.forEach(race => {
    const raceId = extractYouTubeId(race.videoUrl);
    if (raceId) videoIds.add(raceId);
  });

  let totalSeconds = 0;

  videoIds.forEach(id => {
    const seconds = videoDurationMap.get(id);

    if (typeof seconds === "number") {
      totalSeconds += seconds;
    }
  });

  return totalSeconds;
}

function formatBroadcastTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours.toLocaleString()}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m`;
}

function buildMostPlayedGamesForConsoleRankingData(consoleName) {
  const selectedConsole = normalizeConsoleForMatch(consoleName);
  const gameCounts = new Map();

  function addGame(gameName) {
    const game = normalizeName(gameName);
    if (!game) return;

    const gameKey = normalizeKey(game);

    if (!gameCounts.has(gameKey)) {
      gameCounts.set(gameKey, {
        name: game,
        value: 0
      });
    }

    gameCounts.get(gameKey).value++;
  }

  // Main database
  databaseRows.forEach(row => {
    if (normalizeConsoleForMatch(row.CONSOLE) !== selectedConsole) return;
    addGame(row.GAME);
  });

  // Free For All database
  freeForAllRows.forEach(row => {
    if (normalizeConsoleForMatch(row.CONSOLE) !== selectedConsole) return;
    addGame(row.GAME);
  });

  // Races database
  raceData.forEach(race => {
    if (normalizeConsoleForMatch(getConsoleForRace(race)) !== selectedConsole) return;

    race.games.forEach(game => {
      addGame(game);
    });
  });

  return [...gameCounts.values()]
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
}

function normalizeGameForLibraryMatch(value) {
  return normalizeName(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function normalizeConsoleForMatch(value) {
  const clean = normalizeName(value).toLowerCase();

  if (clean === "mega drive") return "genesis";
  if (clean === "genesis") return "genesis";

  if (clean === "mega cd") return "sega cd";
  if (clean === "sega cd") return "sega cd";

  return clean;
}

function getLibraryGamesForConsole(consoleName) {
  const games = [];

  gameLibraryRows.forEach(row => {
    const game = normalizeName(row[consoleName]);
    if (game) games.push(game);
  });

  return games;
}

function buildConsoleLibraryCoverageData(consoleName) {
  const selectedConsole = normalizeConsoleForMatch(consoleName);

  const libraryGames = getLibraryGamesForConsole(consoleName);

  const libraryMap = new Map();

  libraryGames.forEach(game => {
    const key = normalizeGameForLibraryMatch(game);
    if (!key) return;

    if (!libraryMap.has(key)) {
      libraryMap.set(key, game);
    }
  });

  const mainShowcased = new Set();
  const otherShowcased = new Set();

  // Main database = uniquely showcased
  databaseRows.forEach(row => {
    if (normalizeConsoleForMatch(row.CONSOLE) !== selectedConsole) return;

    const gameKey = normalizeGameForLibraryMatch(row.GAME);
    if (gameKey && libraryMap.has(gameKey)) {
      mainShowcased.add(gameKey);
    }
  });

  // Free For All = race / special event showcase
  freeForAllRows.forEach(row => {
    if (normalizeConsoleForMatch(row.CONSOLE) !== selectedConsole) return;

    const gameKey = normalizeGameForLibraryMatch(row.GAME);
    if (gameKey && libraryMap.has(gameKey) && !mainShowcased.has(gameKey)) {
      otherShowcased.add(gameKey);
    }
  });

  // Races = race / special event showcase
  raceData.forEach(race => {
    if (normalizeConsoleForMatch(getConsoleForRace(race)) !== selectedConsole) return;

    race.games.forEach(game => {
      const gameKey = normalizeGameForLibraryMatch(game);
      if (gameKey && libraryMap.has(gameKey) && !mainShowcased.has(gameKey)) {
        otherShowcased.add(gameKey);
      }
    });
  });

  const uniquelyShowcasedGames = [...mainShowcased]
    .map(key => libraryMap.get(key))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const raceSpecialGames = [...otherShowcased]
    .map(key => libraryMap.get(key))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const yetToBeShowcasedGames = [...libraryMap.entries()]
    .filter(([key]) => !mainShowcased.has(key) && !otherShowcased.has(key))
    .map(([, game]) => game)
    .sort((a, b) => a.localeCompare(b));

  const totalLibrary = libraryMap.size;

  return {
    labels: [
      "Uniquely Showcased",
      "Race / Special Event",
      "Yet to Be Showcased"
    ],
    values: [
      uniquelyShowcasedGames.length,
      raceSpecialGames.length,
      yetToBeShowcasedGames.length
    ],
    totalLibrary,
    uniquelyShowcasedGames,
    raceSpecialGames,
    yetToBeShowcasedGames
  };
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString();
}

function formatDateText(dateStr) {
  const date = new Date(dateStr);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatChannelAge(createdAt) {
  const startDate = createdAt
    ? new Date(createdAt)
    : new Date(2019, 3, 30); // April 30, 2019

  const today = new Date();

  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    return "—";
  }

  let years = today.getFullYear() - startDate.getFullYear();
  let months = today.getMonth() - startDate.getMonth();
  let days = today.getDate() - startDate.getDate();

  if (days < 0) {
    months--;

    const previousMonthLastDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    ).getDate();

    days += previousMonthLastDay;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];

  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }

  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }

  if (days > 0 || !parts.length) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  }

  return parts.join(", ");
}

function buildTwitchStatCard(label, value, subtext = "") {
  const card = document.createElement("div");
  card.className = "sc-twitch-stat-card";

  card.innerHTML = `
    <div class="sc-twitch-stat-label">${escapeHtml(label)}</div>
    <div class="sc-twitch-stat-value">${escapeHtml(value)}</div>
    ${subtext ? `<div class="sc-twitch-stat-sub">${escapeHtml(subtext)}</div>` : ""}
  `;

  return card;
}

function buildSegaCrewTwitchStatsPanel() {
  const wrap = document.createElement("div");
  wrap.className = "sc-twitch-stats-wrap";

  if (!twitchChannelStats || twitchChannelStats.error) {
    const msg = document.createElement("p");
    msg.className = "sc-results-message";
    msg.textContent = "Could not load Twitch channel stats.";
    wrap.appendChild(msg);
    return wrap;
  }

  const channel = twitchChannelStats.channel || {};
  const live = twitchChannelStats.live || {};
  const clips = twitchChannelStats.recentClips || [];

  const header = document.createElement("div");
  header.className = "sc-twitch-channel-header";

  header.innerHTML = `
    ${channel.profileImageUrl ? `
      <img class="sc-twitch-channel-avatar" src="${escapeHtml(channel.profileImageUrl)}" alt="">
    ` : ""}
    <div class="sc-twitch-channel-info">
      <h3>${escapeHtml(channel.displayName || "Sega Crew")}</h3>
      <p>${escapeHtml(channel.description || "Twitch channel statistics")}</p>
    </div>
  `;

  const statGrid = document.createElement("div");
  statGrid.className = "sc-twitch-stat-grid";

  statGrid.appendChild(
    buildTwitchStatCard(
      "Followers",
      formatNumber(channel.followers)
    )
  );

  const totalBroadcastSeconds = calculateTotalBroadcastSeconds();

statGrid.appendChild(
  buildTwitchStatCard(
    "Total Broadcast Time",
    formatBroadcastTime(totalBroadcastSeconds),
  )
);

  statGrid.appendChild(
    buildTwitchStatCard(
      "Account Created",
      formatDateText(channel.createdAt)
    )
  );

  statGrid.appendChild(
    buildTwitchStatCard(
      "Live Status",
      live.isLive ? "LIVE" : "Offline",
      live.isLive ? `${live.viewerCount || 0} viewers` : ""
    )
  );

  statGrid.appendChild(
  buildTwitchStatCard(
    "Current Active Members",
    formatNumber(calculateCurrentActiveMembers()),
  )
);


statGrid.appendChild(
  buildTwitchStatCard(
    "Channel Age",
    formatChannelAge(channel.createdAt),
  )
);

  wrap.appendChild(header);
  wrap.appendChild(statGrid);
  wrap.appendChild(buildSegaCrewEventStatsTables());
  wrap.appendChild(buildRecentTwitchClipsTable(clips));

  return wrap;
}

function buildRecentTwitchClipsTable(clips) {
  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box sc-twitch-clips-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "TOP TWITCH CLIPS";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>DATE</th>
      <th>TITLE</th>
      <th>CREATOR</th>
      <th>DURATION</th>
      <th>VIEWS</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  if (!clips.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">No recent clips found.</td>`;
    tbody.appendChild(tr);
  } else {
    clips.forEach(clip => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(formatDateText(clip.createdAt))}</td>
        <td>
          <a href="${escapeHtml(clip.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(clip.title)}
          </a>
        </td>
        <td>${escapeHtml(clip.creatorName || "—")}</td>
        <td>${escapeHtml(clip.duration ? `${Math.round(clip.duration)}s` : "—")}</td>
        <td>${escapeHtml(formatNumber(clip.viewCount))}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildSegaCrewEventStatsData() {
  const eventStats = new Map();

  function getOrCreateEvent(source, eventId, eventName) {
    const cleanEventName = normalizeName(eventName);
    const cleanEventId = normalizeName(eventId);

    if (!cleanEventName && !cleanEventId) return null;

    const key = cleanEventId
      ? `${source}-eventid-${cleanEventId}`
      : `${source}-event-${normalizeKey(cleanEventName)}`;

    if (!eventStats.has(key)) {
      eventStats.set(key, {
        key,
        name: cleanEventName || cleanEventId,
        runners: new Set(),
        games: 0,
        videoIds: new Set()
      });
    }

    return eventStats.get(key);
  }

  // Main database
  databaseRows.forEach(row => {
    const event = getOrCreateEvent("main", row.EVENTID, row.EVENT);
    if (!event) return;

    getNamesFromColumns(row, "RUNNER", 25).forEach(runner => {
      const cleanRunner = normalizeHandle(runner);
      if (cleanRunner) event.runners.add(cleanRunner);
    });

    if (normalizeName(row.GAME)) {
      event.games++;
    }

    const id1 = extractYouTubeId(row.VIDEOURL);
    const id2 = extractYouTubeId(row.VIDEOURL2);

    if (id1) event.videoIds.add(id1);
    if (id2) event.videoIds.add(id2);
  });

  // Races database
  raceData.forEach(race => {
    const event = getOrCreateEvent("race", race.eventId, race.eventName);
    if (!event) return;

    race.runners.forEach(runner => {
      const cleanRunner = normalizeHandle(runner.name);
      if (cleanRunner) event.runners.add(cleanRunner);
    });

    event.games += race.games.length;

    const raceId = extractYouTubeId(race.videoUrl);
    if (raceId) event.videoIds.add(raceId);
  });

  return [...eventStats.values()].map(event => {
    let totalSeconds = 0;

    event.videoIds.forEach(id => {
      const seconds = videoDurationMap.get(id);
      if (typeof seconds === "number") {
        totalSeconds += seconds;
      }
    });

    return {
      name: event.name,
      runnerCount: event.runners.size,
      gameCount: event.games,
      totalSeconds,
      totalTimeDisplay: formatBroadcastTime(totalSeconds)
    };
  });
}

function isShinobiMonthlyRace(race) {
  return normalizeName(race.eventName).toLowerCase().includes("shinobi iii monthly");
}

function buildTimeActiveRankingData() {
  const members = getUniqueMemberNames();

  return members.map(name => {
    const range = getActiveDateRangeForRunner(name);

    return {
      name,
      value: range ? range.daysActive : null,
      firstDate: range?.firstDate || null,
      lastDate: range?.lastDate || null,
      display: range
        ? formatActiveDuration(range.firstDate, range.lastDate)
        : "—"
    };
  })
  .filter(item => item.value !== null)
  .sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });
}

function getRacePlacements(race) {
  const results = race.runners
    .filter(runner => normalizeName(runner.name))
    .map(runner => ({
      name: runner.name,
      time: runner.time,
      seconds: runner.seconds,
      isDNF: runner.isDNF
    }));

  results.sort((a, b) => {
    if (a.isDNF && b.isDNF) return 0;
    if (a.isDNF) return 1;
    if (b.isDNF) return -1;
    return a.seconds - b.seconds;
  });

  return results.map((runner, index) => ({
    ...runner,
    place: index + 1
  }));
}

function buildMostRacesRankingData() {
  return getUniqueMemberNames()
    .map(name => ({
      name,
      value: getRacesForRunner(name)
        .filter(race => !isShinobiMonthlyRace(race))
        .length
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
}

function buildMostRaceWinsRankingData() {
  return getUniqueMemberNames()
    .map(name => {
      let wins = 0;

      getRacesForRunner(name)
        .filter(race => !isShinobiMonthlyRace(race))
        .forEach(race => {
          const placements = getRacePlacements(race);
          const runnerResult = placements.find(
            item => normalizeHandle(item.name) === normalizeHandle(name)
          );

          if (runnerResult && runnerResult.place === 1 && !runnerResult.isDNF) {
            wins++;
          }
        });

      return {
        name,
        value: wins
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      return a.name.localeCompare(b.name);
    });
}

function addGameForRunner(runnerStats, runnerName, gameName) {
  const runner = normalizeName(runnerName);
  const game = normalizeName(gameName);

  if (!runner || !game) return;

  const runnerKey = normalizeKey(runner);
  const gameKey = normalizeKey(game);

  if (!runnerStats.has(runnerKey)) {
    runnerStats.set(runnerKey, {
      name: runner,
      games: new Set()
    });
  }

  runnerStats.get(runnerKey).games.add(gameKey);
}

function renderConsoleLibraryCoverageChart(canvas, consoleName) {
  const coverage = buildConsoleLibraryCoverageData(consoleName);

  const chart = new Chart(canvas, {
    type: "pie",
    data: {
      labels: coverage.labels,
      datasets: [{
        data: coverage.values,
        backgroundColor: [
          "#0072B2",
          "#E69F00",
          "#D9D9D9"
        ],
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom"
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const percent = coverage.totalLibrary
                ? ((value / coverage.totalLibrary) * 100).toFixed(1)
                : "0.0";

              return `${label}: ${value} games (${percent}% of library)`;
            }
          }
        }
      }
    }
  });

  currentStatsCharts.push(chart);
}

function buildMostUniqueGamesTable() {
  const data = statsCache.uniqueGamesRanking.slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "MOST UNIQUE GAMES PLAYED";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>RUNNER</th>
      <th>GAMES</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${index + 1}</td>
    <td>${buildTwitchLinkHtml(item.name)}</td>
    <td>${escapeHtml(item.value)}</td>
  `;

  tbody.appendChild(tr);
});

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildMostEventsTable() {
  const data = statsCache.eventsRanking.slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "MOST EVENTS";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>RUNNER</th>
      <th>EVENTS</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${index + 1}</td>
    <td>${buildTwitchLinkHtml(item.name)}</td>
    <td>${escapeHtml(item.value)}</td>
  `;

  tbody.appendChild(tr);
});

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildLongestActiveMembersTable() {
  const data = statsCache.timeActiveRanking.slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "LONGEST ACTIVE MEMBERS";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>RUNNER</th>
      <th>TIME</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${buildTwitchLinkHtml(item.name)}</td>
      <td>${escapeHtml(item.display)}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildTopRunsPieChartCard() {
  const wrap = document.createElement("div");
  wrap.className = "sc-stats-visual-card";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "TOP 10 MEMBERS BY TOTAL GAMES PLAYED";

  const chartWrap = document.createElement("div");
  chartWrap.className = "sc-stats-chart-wrap";

  const canvas = document.createElement("canvas");
  canvas.className = "sc-stats-chart-canvas";

  chartWrap.appendChild(canvas);
  wrap.appendChild(title);
  wrap.appendChild(chartWrap);

  requestAnimationFrame(() => {
    renderTopRunsPieChart(canvas);
  });

  return wrap;
}

function buildMostRacesTable() {
  const data = statsCache.mostRacesRanking.slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "MOST RACES";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>RUNNER</th>
      <th>RACES</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${buildTwitchLinkHtml(item.name)}</td>
      <td>${escapeHtml(item.value)}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildMostRaceWinsTable() {
  const data = statsCache.raceWinsRanking.slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "MOST RACE WINS";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>RUNNER</th>
      <th>WINS</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${buildTwitchLinkHtml(item.name)}</td>
      <td>${escapeHtml(item.value)}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function renderActiveMembersByYearBarChart(canvas) {
  const data = statsCache.activeMembersByYear;

  const labels = data.map(item => item.year);
  const values = data.map(item => item.count);

  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Active Members",
        data: values,
        backgroundColor: "#0072B2",
        borderColor: "#083a8c",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y || 0;
              return `${value} unique active member${value === 1 ? "" : "s"}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });

  currentStatsCharts.push(chart);
}

function buildActiveMembersByYearChartCard() {
  const wrap = document.createElement("div");
  wrap.className = "sc-stats-visual-card";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "ACTIVE MEMBERS BY YEAR";

  const chartWrap = document.createElement("div");
  chartWrap.className = "sc-stats-chart-wrap";

  const canvas = document.createElement("canvas");
  canvas.className = "sc-stats-chart-canvas";

  chartWrap.appendChild(canvas);
  wrap.appendChild(title);
  wrap.appendChild(chartWrap);

  requestAnimationFrame(() => {
    renderActiveMembersByYearBarChart(canvas);
  });

  return wrap;
}

function buildTotalPlaytimeTable() {
  const data = statsCache.playtimeRanking.slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "TOTAL PLAYTIME";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>RUNNER</th>
      <th>TIME</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${buildTwitchLinkHtml(item.name)}</td>
      <td>${escapeHtml(item.display)}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildMostPlayedGamesTable() {
  const data = buildMostPlayedGamesRankingData().slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "MOST PLAYED GAMES";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>GAME</th>
      <th>RUNS</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.value)}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildMostPlayedConsolesTable() {
  const data = buildMostPlayedConsolesRankingData().slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "MOST PLAYED CONSOLES";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>CONSOLE</th>
      <th>RUNS</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.value)}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildGamesByUniqueRunnersTable() {
  const data = buildGamesByUniqueRunnersRankingData().slice(0, 5);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = "GAMES WITH MOST RUNNERS";

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>GAME</th>
      <th>RUNNERS</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  data.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.value)}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}


function buildConsoleStatsCard() {
  const card = document.createElement("div");
  card.className = "sc-console-stats-card";

  const title = document.createElement("div");
  title.className = "sc-console-stats-title";
  title.textContent = "CONSOLE SPECIFIC STATISTICS";

  const controls = document.createElement("div");
  controls.className = "sc-console-stats-controls";

  const dropdown = document.createElement("div");
  dropdown.className = "sc-dropdown sc-console-dropdown";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "sc-dropdown-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.textContent = activeConsoleStatsType;

  const menu = document.createElement("div");
  menu.className = "sc-dropdown-menu";
  menu.setAttribute("role", "listbox");

  const consoles = [
    "Master System",
    "Genesis",
    "Game Gear",
    "Sega CD",
    "Sega 32X",
    "Saturn",
    "Dreamcast"
  ];

  consoles.forEach(consoleName => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sc-dropdown-item";
    item.textContent = consoleName;
    item.dataset.value = consoleName;

    item.addEventListener("click", () => {
      activeConsoleStatsType = consoleName;
      trigger.textContent = consoleName;
      closeConsoleStatsMenu(dropdown, trigger);
      renderConsoleStatsBody(body);
    });

    menu.appendChild(item);
  });

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();

    if (dropdown.classList.contains("open")) {
      closeConsoleStatsMenu(dropdown, trigger);
    } else {
      openConsoleStatsMenu(dropdown, trigger, menu);
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      closeConsoleStatsMenu(dropdown, trigger);
    }
  });

  const body = document.createElement("div");
  body.className = "sc-console-stats-body";

  dropdown.appendChild(trigger);
  dropdown.appendChild(menu);

  controls.appendChild(dropdown);

  card.appendChild(title);
  card.appendChild(controls);
  card.appendChild(body);

  renderConsoleStatsBody(body);

  return card;
}

function openConsoleStatsMenu(dropdown, trigger, menu) {
  dropdown.classList.add("open");
  trigger.setAttribute("aria-expanded", "true");

  requestAnimationFrame(() => {
    const selectedItem = [...menu.querySelectorAll(".sc-dropdown-item")].find(
      item => normalizeName(item.dataset.value) === activeConsoleStatsType
    );

    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "center" });
    }
  });
}

function closeConsoleStatsMenu(dropdown, trigger) {
  dropdown.classList.remove("open");
  trigger.setAttribute("aria-expanded", "false");
}

function renderConsoleStatsBody(container) {
  container.innerHTML = "";

  const consoleStatsGrid = document.createElement("div");
  consoleStatsGrid.className = "sc-console-specific-layout";

  consoleStatsGrid.appendChild(
    buildConsoleMostPlayedGamesTable(activeConsoleStatsType)
  );

  consoleStatsGrid.appendChild(
    buildConsoleLibraryCoverageChart(activeConsoleStatsType)
  );

  const libraryTables = buildConsoleLibraryTables(activeConsoleStatsType);

  container.appendChild(consoleStatsGrid);
  container.appendChild(libraryTables);
}

function renderStatsPanel() {
  clearResults();
  destroyStatsChart();

  const card = document.createElement("div");
  card.className = "sc-stats-panel";

  const title = document.createElement("h3");
  title.className = "sc-results-title";

  if (activeStatsType === "member") {
    title.textContent = "Member Stats";

    const statsGrid = document.createElement("div");
    statsGrid.className = "sc-stats-table-grid";

    statsGrid.appendChild(buildMostUniqueGamesTable());
    statsGrid.appendChild(buildMostEventsTable());
    statsGrid.appendChild(buildLongestActiveMembersTable());
    
    const visualSection = document.createElement("div");
    visualSection.className = "sc-stats-visual-section";
    visualSection.appendChild(buildTopRunsPieChartCard());
    visualSection.appendChild(buildActiveMembersByYearChartCard());

    const raceStatsGrid = document.createElement("div");
    raceStatsGrid.className = "sc-stats-table-grid sc-stats-table-grid-secondary";

    raceStatsGrid.appendChild(buildMostRacesTable());
    raceStatsGrid.appendChild(buildMostRaceWinsTable());
    raceStatsGrid.appendChild(buildTotalPlaytimeTable());

    card.appendChild(statsGrid);
    card.appendChild(raceStatsGrid);
    card.appendChild(visualSection);
    
  } else if (activeStatsType === "game") {
  title.textContent = "Game Stats";

  const statsGrid = document.createElement("div");
  statsGrid.className = "sc-stats-table-grid";

  statsGrid.appendChild(buildMostPlayedGamesTable());
  statsGrid.appendChild(buildMostPlayedConsolesTable());
  statsGrid.appendChild(buildGamesByUniqueRunnersTable());

  const consoleStatsCard = buildConsoleStatsCard();

  card.appendChild(statsGrid);
  card.appendChild(consoleStatsCard);

  }  else {
  title.textContent = "Sega Crew Stats";

  card.appendChild(buildSegaCrewTwitchStatsPanel());
}

  resultsWrap.appendChild(card);
}

function buildConsoleMostPlayedGamesTable(consoleName) {
  const data = buildMostPlayedGamesForConsoleRankingData(consoleName).slice(0, 10);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box sc-console-specific-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = `MOST PLAYED ${consoleName.toUpperCase()} GAMES`;

  const table = document.createElement("table");
  table.className = "sc-stats-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>GAME</th>
      <th>RUNS</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  if (!data.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3">No games found.</td>`;
    tbody.appendChild(tr);
  } else {
    data.forEach((item, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.value)}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildConsoleLibraryCoverageChart(consoleName) {
  const chartWrap = document.createElement("div");
  chartWrap.className = "sc-console-library-chart-wrap";

  const canvas = document.createElement("canvas");
  canvas.className = "sc-console-library-chart-canvas";

  chartWrap.appendChild(canvas);

  requestAnimationFrame(() => {
    renderConsoleLibraryCoverageChart(canvas, consoleName);
  });

  return chartWrap;
}

function buildConsoleLibraryListTable(titleText, games) {
  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box sc-console-library-list-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = `${titleText} (${games.length})`;

  const tableWrap = document.createElement("div");
  tableWrap.className = "sc-console-library-list-scroll";

  const table = document.createElement("table");
  table.className = "sc-stats-table sc-console-library-list-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>GAME</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  if (!games.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="2">No games found.</td>`;
    tbody.appendChild(tr);
  } else {
    games.forEach((game, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(game)}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  tableWrap.appendChild(table);
  tableBox.appendChild(title);
  tableBox.appendChild(tableWrap);

  return tableBox;
}

function buildConsoleLibraryTables(consoleName) {
  const coverage = buildConsoleLibraryCoverageData(consoleName);

  const tablesWrap = document.createElement("div");
  tablesWrap.className = "sc-stats-table-grid sc-console-library-tables-grid";

  tablesWrap.appendChild(
    buildConsoleLibraryListTable(
      "UNIQUELY SHOWCASED",
      coverage.uniquelyShowcasedGames
    )
  );

  tablesWrap.appendChild(
    buildConsoleLibraryListTable(
      "RACE / SPECIAL EVENT",
      coverage.raceSpecialGames
    )
  );

  tablesWrap.appendChild(
    buildConsoleLibraryListTable(
      "YET TO BE SHOWCASED",
      coverage.yetToBeShowcasedGames
    )
  );

  return tablesWrap;
}

function buildTopEventsByRunnersTable() {
  const data = buildSegaCrewEventStatsData()
    .filter(item => item.runnerCount > 0)
    .sort((a, b) => {
      if (b.runnerCount !== a.runnerCount) return b.runnerCount - a.runnerCount;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5);

  return buildSegaCrewEventStatsTable(
    "TOP EVENTS BY RUNNERS",
    "RUNNERS",
    data,
    item => item.runnerCount
  );
}

function buildTopEventsByGamesTable() {
  const data = buildSegaCrewEventStatsData()
    .filter(item => item.gameCount > 0)
    .sort((a, b) => {
      if (b.gameCount !== a.gameCount) return b.gameCount - a.gameCount;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5);

  return buildSegaCrewEventStatsTable(
    "TOP EVENTS BY GAMES",
    "GAMES",
    data,
    item => item.gameCount
  );
}

function buildLongestEventsTable() {
  const data = buildSegaCrewEventStatsData()
    .filter(item => item.totalSeconds > 0)
    .sort((a, b) => {
      if (b.totalSeconds !== a.totalSeconds) return b.totalSeconds - a.totalSeconds;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 5);

  return buildSegaCrewEventStatsTable(
    "LONGEST EVENTS",
    "TIME",
    data,
    item => item.totalTimeDisplay
  );
}

function buildSegaCrewEventStatsTable(titleText, valueHeader, data, getValue) {
  const tableBox = document.createElement("div");
  tableBox.className = "sc-stats-table-box sc-sega-crew-event-table-box";

  const title = document.createElement("div");
  title.className = "sc-stats-table-title";
  title.textContent = titleText;

  const table = document.createElement("table");
  table.className = "sc-stats-table sc-sega-crew-event-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>EVENT</th>
      <th>${escapeHtml(valueHeader)}</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  if (!data.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3">No event data found.</td>`;
    tbody.appendChild(tr);
  } else {
    data.forEach((item, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(getValue(item))}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildSegaCrewEventStatsTables() {
  const grid = document.createElement("div");
  grid.className = "sc-stats-table-grid sc-sega-crew-event-stats-grid";

  grid.appendChild(buildTopEventsByRunnersTable());
  grid.appendChild(buildTopEventsByGamesTable());
  grid.appendChild(buildLongestEventsTable());

  return grid;
}

function buildStatsCache() {
  statsCache.uniqueGamesRanking = buildUniqueGamesRankingData();
  statsCache.eventsRanking = buildEventsRankingData();
  statsCache.timeActiveRanking = buildTimeActiveRankingData();
  statsCache.totalRunsRanking = buildTotalRunsRankingData();
  statsCache.mostRacesRanking = buildMostRacesRankingData();
  statsCache.raceWinsRanking = buildMostRaceWinsRankingData();
  statsCache.playtimeRanking = buildPlaytimeRankingData();
  statsCache.activeMembersByYear = buildActiveMembersByYearData();
}

function loadAllStatsCsvs() {
  resultsWrap.innerHTML = "";

  const loading = document.createElement("p");
  loading.className = "sc-results-message";
  loading.textContent = "Loading stats...";
  resultsWrap.appendChild(loading);

Promise.all([
  loadCsv(CSV_URLS.races),
  loadCsv(CSV_URLS.freeForAll),
  loadCsv(CSV_URLS.database),
  loadCsv(CSV_URLS.gameLibrary)
]).then(async ([racesData, freeForAllData, databaseData, gameLibraryData]) => {
  racesRows = racesData;
  freeForAllRows = freeForAllData;
  databaseRows = databaseData;
  gameLibraryRows = gameLibraryData;
  raceData = buildRaceDatabase(racesRows);

  await preloadAllVideoDurations();
  await loadTwitchChannelStats();
  
  buildStatsCache();

  renderStatsPanel();
}).catch(err => {
  console.error("Stats CSV load error:", err);

  resultsWrap.innerHTML = "";

  const errorMsg = document.createElement("p");
  errorMsg.className = "sc-results-message";
  errorMsg.textContent = "Could not load stats CSV data.";
  resultsWrap.appendChild(errorMsg);
});
  
}

loadAllStatsCsvs();
});



