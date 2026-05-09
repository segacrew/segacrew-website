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
    : "https://stupendous-paletas-199024.netlify.app/Sega Crew Database - Master Sheet.csv"
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

  const fullRanking = buildTotalRunsRankingData();
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

function buildMostUniqueGamesTable() {
  const data = buildUniqueGamesRankingData().slice(0, 5);

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
  const data = buildEventsRankingData().slice(0, 5);

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
  const data = buildTimeActiveRankingData().slice(0, 5);

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
  const data = buildMostRacesRankingData().slice(0, 5);

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
  const data = buildMostRaceWinsRankingData().slice(0, 5);

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
  const data = buildActiveMembersByYearData();

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
  const data = buildPlaytimeRankingData().slice(0, 5);

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

    card.appendChild(title);
    card.appendChild(statsGrid);
    card.appendChild(raceStatsGrid);
    card.appendChild(visualSection);
    
  } else if (activeStatsType === "game") {
    title.textContent = "Game Stats";

    const placeholder = document.createElement("p");
    placeholder.className = "sc-results-message";
    placeholder.textContent = "Stats will appear here.";

    card.appendChild(title);
    card.appendChild(placeholder);
  } else {
    title.textContent = "Sega Crew Stats";

    const placeholder = document.createElement("p");
    placeholder.className = "sc-results-message";
    placeholder.textContent = "Stats will appear here.";

    card.appendChild(title);
    card.appendChild(placeholder);
  }

  resultsWrap.appendChild(card);
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
    loadCsv(CSV_URLS.database)
  ]).then(([racesData, freeForAllData, databaseData]) => {
    racesRows = racesData;
    freeForAllRows = freeForAllData;
    databaseRows = databaseData;
    raceData = buildRaceDatabase(racesRows);

preloadAllVideoDurations().then(() => {
  renderStatsPanel();
});

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



