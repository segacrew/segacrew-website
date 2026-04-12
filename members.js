document.addEventListener("DOMContentLoaded", () => {
  const controls = document.getElementById("controls");
  const content = document.getElementById("member-directory-content");
  if (!controls || !content) return;

  let allRows = [];
  let extraRows = [];
  let socialsRows = [];
  let raceData = [];
  let currentMemberRunRows = [];
  let currentMemberRunIndex = -1;

  const IS_LOCAL =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";

const CSV_URL = IS_LOCAL
  ? "sega crew database - master sheet.csv"
  : "https://stupendous-paletas-199024.netlify.app/sega crew database - master sheet.csv";

const SOCIALS_CSV_URL = IS_LOCAL
  ? "SEGA CREW MEMBER LINKS - MASTER.csv"
  : "https://stupendous-paletas-199024.netlify.app/SEGA CREW MEMBER LINKS - MASTER.csv";
  
const EXTRA_CSV_URL = IS_LOCAL
  ? "SEGA CREW RACES - MASTER.csv"
  : "https://stupendous-paletas-199024.netlify.app/SEGA CREW RACES - MASTER.csv";  

  const ICONS = {
    twitch: "images/twitch.png",
    youtube: "images/youtube.png",
    x: "images/x_logo.png",
    bluesky: "images/bluesky.png",
    src: "images/srclogo.png"
  };
  
  const EXCLUDED_RACE_KEYS = new Set([
  "4_1",
  "5_1",
  "6_1",
  "7_1",
  "11_1"
]);

  const wrapper = document.createElement("div");
  wrapper.className = "sc-page-controls";

  const label = document.createElement("div");
  label.className = "sc-label";
  

  const dropdown = document.createElement("div");
  dropdown.className = "sc-dropdown";
  dropdown.id = "memberDropdown";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "sc-dropdown-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.textContent = "Loading members...";

  const menu = document.createElement("div");
  menu.className = "sc-dropdown-menu";
  menu.setAttribute("role", "listbox");

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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeName(name) {
    return String(name || "").trim();
  }

  function normalizeHandle(value) {
    return String(value || "").trim().toLowerCase();
  }

function getUniqueMemberNames() {
  const nameMap = new Map(); // key = normalized, value = display name

  function addName(name) {
    const clean = normalizeName(name);
    if (!clean) return;

    const key = clean.toLowerCase();

    if (!nameMap.has(key)) {
      nameMap.set(key, clean);
    }
  }

  // --- main database ---
  allRows.forEach(row => {
    for (let i = 1; i <= 16; i++) {
      addName(row[`RUNNER${i}`]);
      addName(row[`COMMENTARY${i}`]);
    }
  });

  // --- race database ---
  raceData.forEach(race => {
    race.runners.forEach(runner => {
      addName(runner.name);
    });
  });

  return [...nameMap.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

  function makePlaceholder(name) {
    const div = document.createElement("div");
    div.className = "sc-member-photo-placeholder";
    div.textContent = (name || "?").charAt(0).toUpperCase();
    return div;
  }
  
  function rowIncludesRunner(row, memberName) {
  const target = normalizeHandle(memberName);

  for (let i = 1; i <= 16; i++) {
    const runner = normalizeHandle(row[`RUNNER${i}`]);
    if (runner === target) return true;
  }

  return false;
}

function parseEventDate(dateStr) {
  const raw = String(dateStr || "").trim();
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
  
function buildMemberSummary(memberName) {
  const memberRows = allRows.filter(row => rowIncludesRunner(row, memberName));
  const memberRaces = getRacesForRunner(memberName);

  const eventSet = new Set();
  const gameSet = new Set();
  const consoleSet = new Set();

  const runCount = memberRows.length + memberRaces.reduce((sum, race) => sum + race.games.length, 0);

  let firstSeenDate = "—";
  let firstEvent = "—";
  let lastEvent = "—";

  const datedRows = memberRows
    .map(row => ({
      event: normalizeName(row.EVENT),
      rawDate: normalizeName(row.DATE),
      date: parseEventDate(row.DATE)
    }))
    .filter(item => item.date instanceof Date && !Number.isNaN(item.date.getTime()));

  const datedRaces = memberRaces
    .map(race => ({
      event: normalizeName(race.eventName),
      rawDate: normalizeName(race.date),
      date: parseEventDate(race.date)
    }))
    .filter(item => item.date instanceof Date && !Number.isNaN(item.date.getTime()));

  const combinedDates = [...datedRows, ...datedRaces];

  if (combinedDates.length) {
    combinedDates.sort((a, b) => a.date - b.date);
    firstSeenDate = combinedDates[0].rawDate || "—";
    firstEvent = combinedDates[0].event || "—";
    lastEvent = combinedDates[combinedDates.length - 1].event || "—";
  }

  const gameCounts = new Map();
  const consoleCounts = new Map();

  memberRows.forEach(row => {
    const eventName = normalizeName(row.EVENT);
    const game = normalizeName(row.GAME);
    const consoleName = normalizeName(row.CONSOLE);

    if (eventName) eventSet.add(eventName);
    if (game) gameSet.add(game);
    if (consoleName) consoleSet.add(consoleName);

    if (game) {
      gameCounts.set(game, (gameCounts.get(game) || 0) + 1);
    }

    if (consoleName) {
      consoleCounts.set(consoleName, (consoleCounts.get(consoleName) || 0) + 1);
    }
  });

  memberRaces.forEach(race => {
    if (race.eventName) eventSet.add(race.eventName);

    race.games.forEach(game => {
      const cleanGame = normalizeName(game);
      if (!cleanGame) return;

      gameSet.add(cleanGame);
      gameCounts.set(cleanGame, (gameCounts.get(cleanGame) || 0) + 1);
    });
  });

  let mostPlayedGame = "—";
  let mostPlayedGameCount = 0;
  let mostPlayedGameTie = false;

  if (gameCounts.size > 0) {
    mostPlayedGameCount = Math.max(...gameCounts.values());

    const topGames = [...gameCounts.entries()]
      .filter(([, count]) => count === mostPlayedGameCount)
      .map(([game]) => game);

    if (topGames.length === 1) {
      mostPlayedGame = topGames[0];
      mostPlayedGameTie = false;
    } else if (topGames.length > 1) {
      mostPlayedGame = topGames[0];
      mostPlayedGameTie = true;
    }
  }

  let mostPlayedConsole = "—";
  let mostPlayedConsoleCount = 0;

  for (const [consoleName, count] of consoleCounts.entries()) {
    if (count > mostPlayedConsoleCount) {
      mostPlayedConsole = consoleName;
      mostPlayedConsoleCount = count;
    }
  }

  let mostPlayedGameDisplay = "—";

  if (mostPlayedGame !== "—") {
    if (mostPlayedGameTie) {
      mostPlayedGameDisplay = `<em>multiple - see advanced stats</em>`;
    } else {
      mostPlayedGameDisplay = `${mostPlayedGame} (${mostPlayedGameCount} ${mostPlayedGameCount === 1 ? "time" : "times"})`;
    }
  }

  return {
    runCount,
    eventCount: eventSet.size,
    gameCount: gameSet.size,
    consoleShowcaseCount: consoleSet.size,
    totalRaces: memberRaces.length,
    firstSeenDate,
    firstEvent,
    lastEvent,
    mostPlayedConsole,
    mostPlayedGameDisplay
  };
}

function getMemberRows(memberName) {
  return allRows.filter(row => rowIncludesRunner(row, memberName));
}

function getMostPopularGamesData(memberName) {
  const memberRows = getMemberRows(memberName);
  const memberRaces = getRacesForRunner(memberName);
  const gameCounts = new Map();

  memberRows.forEach(row => {
    const game = normalizeName(row.GAME);
    if (!game) return;
    gameCounts.set(game, (gameCounts.get(game) || 0) + 1);
  });

  memberRaces.forEach(race => {
    race.games.forEach(game => {
      const cleanGame = normalizeName(game);
      if (!cleanGame) return;
      gameCounts.set(cleanGame, (gameCounts.get(cleanGame) || 0) + 1);
    });
  });

  const sortedGames = [...gameCounts.entries()]
    .sort((a, b) => b[1] - a[1]);

  const topFive = sortedGames.slice(0, 5);
  const other = sortedGames.slice(5);

  const labels = topFive.map(([game]) => game);
  const values = topFive.map(([, count]) => count);

  const otherCount = other.reduce((sum, [, count]) => sum + count, 0);
  if (otherCount > 0) {
    labels.push("Other");
    values.push(otherCount);
  }

  return { labels, values };
}

function getMostPlayedConsolesData(memberName) {
  const memberRows = getMemberRows(memberName);
  const memberRaces = getRacesForRunner(memberName);
  const consoleCounts = new Map();

  memberRows.forEach(row => {
    const consoleName = normalizeName(row.CONSOLE);
    if (!consoleName) return;
    consoleCounts.set(consoleName, (consoleCounts.get(consoleName) || 0) + 1);
  });

  memberRaces.forEach(race => {
    const raceConsole = getConsoleForRace(race);
    if (!raceConsole) return;

    race.games.forEach(game => {
      const cleanGame = normalizeName(game);
      if (!cleanGame) return;
      consoleCounts.set(raceConsole, (consoleCounts.get(raceConsole) || 0) + 1);
    });
  });

  const sortedConsoles = [...consoleCounts.entries()]
    .sort((a, b) => b[1] - a[1]);

  return {
    labels: sortedConsoles.map(([consoleName]) => consoleName),
    values: sortedConsoles.map(([, count]) => count)
  };
}

let currentMemberChart = null;

function destroyMemberChart() {
  if (currentMemberChart) {
    currentMemberChart.destroy();
    currentMemberChart = null;
  }
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

function getRacePlacements(race) {
  const results = race.runners.map(runner => ({
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
    place: index + 1,
    fieldSize: results.length
  }));
}

function getRaceStatsForRunner(memberName) {
  const memberRaces = getRacesForRunner(memberName);

  let racesWon = 0;
  let podiumFinishes = 0;
  let totalPlace = 0;
  let countedRaces = 0;
  let totalRaceSeconds = 0;
  let completedRaces = 0;

  memberRaces.forEach(race => {
	if (EXCLUDED_RACE_KEYS.has(race.key)) return; 
    const placements = getRacePlacements(race);
    const runnerResult = placements.find(
      p => normalizeHandle(p.name) === normalizeHandle(memberName)
    );

    if (!runnerResult) return;

    countedRaces++;
    totalPlace += runnerResult.place;

    if (runnerResult.place === 1) racesWon++;
    if (runnerResult.place <= 3) podiumFinishes++;

    if (!runnerResult.isDNF && runnerResult.seconds !== null) {
  totalRaceSeconds += runnerResult.seconds;
  completedRaces++;
}
  });

  return {
  racesWon,
  podiumFinishes,
  averageFinishText:
    countedRaces > 0
      ? `${(totalPlace / countedRaces).toFixed(2)}`
      : "—",
  averageFinishValue:
    countedRaces > 0 ? totalPlace / countedRaces : null,
  totalRaces: countedRaces,
  averageRaceTimeSeconds:
    completedRaces > 0 ? totalRaceSeconds / completedRaces : null,
  averageRaceTimeDisplay:
    completedRaces > 0
      ? formatSecondsAsTime(totalRaceSeconds / completedRaces)
      : "—",
  completedRaces
};
}

function getRaceGroupKey(race) {
  const eventName = normalizeName(race.eventName).toLowerCase();

  if (eventName.includes("master 8")) {
    return "master8";
  }

  if (eventName.includes("sega 8") || eventName.includes("sega 16")) {
    return "sega8sega16";
  }

  if (eventName.includes("5g game gear")) {
    return "5ggamegear";
  }

  return "";
}

function getRaceGroupLabel(groupKey) {
  if (groupKey === "master8") return "MASTER 8";
  if (groupKey === "sega8sega16") return "SEGA 8 / SEGA 16";
  if (groupKey === "5ggamegear") return "5G GAME GEAR";
  return "";
}

function getGroupedRaceTimeStatsForRunner(memberName, groupKey) {
  const memberRaces = getRacesForRunner(memberName).filter(race => {
    if (EXCLUDED_RACE_KEYS.has(race.key)) return false;
    return getRaceGroupKey(race) === groupKey;
  });

  let totalRaceSeconds = 0;
  let completedRaces = 0;

  memberRaces.forEach(race => {
    const placements = getRacePlacements(race);
    const runnerResult = placements.find(
      p => normalizeHandle(p.name) === normalizeHandle(memberName)
    );

    if (!runnerResult) return;

    if (!runnerResult.isDNF && runnerResult.seconds !== null) {
      totalRaceSeconds += runnerResult.seconds;
      completedRaces++;
    }
  });

  return {
    completedRaces,
    averageRaceTimeSeconds:
      completedRaces > 0 ? totalRaceSeconds / completedRaces : null,
    averageRaceTimeDisplay:
      completedRaces > 0
        ? formatSecondsAsTime(totalRaceSeconds / completedRaces)
        : "—"
  };
}

function buildGroupedAverageRaceTimeRankingData(groupKey) {
  return getAllRaceRunners().map(name => {
    const stats = getGroupedRaceTimeStatsForRunner(name, groupKey);

    return {
      name,
      value: stats.averageRaceTimeSeconds,
      completedRaces: stats.completedRaces
    };
  })
  .filter(item => item.value !== null && item.completedRaces >= 2)
  .sort((a, b) => a.value - b.value);
}

function getAllRaceRunners() {
  const names = new Set();

  raceData.forEach(race => {
    race.runners.forEach(runner => {
      const name = normalizeName(runner.name);
      if (name) names.add(name);
    });
  });

  return [...names];
}

function buildRaceWinsRankingData() {
  return getAllRaceRunners().map(name => ({
    name,
    value: getRaceStatsForRunner(name).racesWon
  })).sort((a, b) => b.value - a.value);
}

function buildRacePodiumRankingData() {
  return getAllRaceRunners().map(name => ({
    name,
    value: getRaceStatsForRunner(name).podiumFinishes
  })).sort((a, b) => b.value - a.value);
}

function buildAverageFinishRankingData() {
  return getAllRaceRunners().map(name => {
    const stats = getRaceStatsForRunner(name);

    return {
      name,
      value: stats.averageFinishValue,
      raceCount: stats.totalRaces
    };
  })
  .filter(item => item.value !== null && item.raceCount >= 2)
  .sort((a, b) => a.value - b.value);
}


function getMedalCircle(rank) {
  if (rank === 1) return `<span class="sc-race-medal sc-race-medal-gold"></span>`;
  if (rank === 2) return `<span class="sc-race-medal sc-race-medal-silver"></span>`;
  if (rank === 3) return `<span class="sc-race-medal sc-race-medal-bronze"></span>`;
  return "";
}

function renderRaceStatsView(container, memberName) {
  const stats = getRaceStatsForRunner(memberName);

  const winsRanking = buildRaceWinsRankingData();
  const podiumRanking = buildRacePodiumRankingData();
  const avgFinishRanking = buildAverageFinishRankingData();

  const master8Ranking = buildGroupedAverageRaceTimeRankingData("master8");
  const sega8sega16Ranking = buildGroupedAverageRaceTimeRankingData("sega8sega16");
  const gameGearRanking = buildGroupedAverageRaceTimeRankingData("5ggamegear");

  const master8Stats = getGroupedRaceTimeStatsForRunner(memberName, "master8");
  const sega8sega16Stats = getGroupedRaceTimeStatsForRunner(memberName, "sega8sega16");
  const gameGearStats = getGroupedRaceTimeStatsForRunner(memberName, "5ggamegear");

  const winsRankInfo = getTieAwareRank(winsRanking, memberName);
  const podiumRankInfo = getTieAwareRank(podiumRanking, memberName);
  const avgFinishRank = getRankForMember(avgFinishRanking, memberName);

  const master8Rank = getRankForMember(master8Ranking, memberName);
  const sega8sega16Rank = getRankForMember(sega8sega16Ranking, memberName);
  const gameGearRank = getRankForMember(gameGearRanking, memberName);

  function renderRaceTimeBox(label, statsObj, rank) {
  return `
    <div class="sc-member-ranking-box">
      <div class="sc-member-ranking-label">${escapeHtml(label)}</div>
      <div class="sc-member-ranking-value">
        ${rank ? getMedalCircle(rank) : ""}
        ${escapeHtml(statsObj.averageRaceTimeDisplay)}
      </div>
      <div class="sc-member-ranking-sub">
        ${
  statsObj.completedRaces >= 2
    ? `${rank ? `${escapeHtml(getOrdinal(rank))} fastest average` : "Rank unavailable"} (${escapeHtml(String(statsObj.completedRaces))} races)`
    : "Minimum 2 races required"
}
      </div>
    </div>
  `;
}

  container.innerHTML = `
    <div class="sc-member-rankings-grid">
      <div class="sc-member-ranking-box">
        <div class="sc-member-ranking-label">RACES WON</div>
        <div class="sc-member-ranking-value">
			${winsRankInfo ? getMedalCircle(winsRankInfo.rank) : ""}
			${escapeHtml(String(stats.racesWon))}</div>
        <div class="sc-member-ranking-sub">
          ${winsRankInfo ? `${winsRankInfo.tied ? "Tied for " : ""}${escapeHtml(getOrdinal(winsRankInfo.rank))} most` : "—"}
        </div>
      </div>

      <div class="sc-member-ranking-box">
        <div class="sc-member-ranking-label">PODIUM FINISHES</div>
        <div class="sc-member-ranking-value">
			${podiumRankInfo ? getMedalCircle(podiumRankInfo.rank) : ""}
			${escapeHtml(String(stats.podiumFinishes))}</div>
        <div class="sc-member-ranking-sub">
          ${podiumRankInfo ? `${podiumRankInfo.tied ? "Tied for " : ""}${escapeHtml(getOrdinal(podiumRankInfo.rank))} most` : "—"}
        </div>
      </div>

      <div class="sc-member-ranking-box">
  <div class="sc-member-ranking-label">AVERAGE RACE FINISH</div>
  <div class="sc-member-ranking-value">
    ${avgFinishRank ? getMedalCircle(avgFinishRank) : ""}
    ${escapeHtml(stats.averageFinishText)}
  </div>
  <div class="sc-member-ranking-sub">
    ${
      stats.totalRaces >= 2
        ? (avgFinishRank
            ? `${escapeHtml(getOrdinal(avgFinishRank))} best average`
            : "Rank unavailable")
        : "Minimum 2 races required"
    }
  </div>
</div>

      ${renderRaceTimeBox("AVERAGE MASTER 8 TIME", master8Stats, master8Rank)}
      ${renderRaceTimeBox("AVERAGE SEGA 8/16 TIME", sega8sega16Stats, sega8sega16Rank)}
      ${renderRaceTimeBox("AVERAGE 5G GAME GEAR TIME", gameGearStats, gameGearRank)}
    </div>
  `;
}

function renderMostPopularGamesChart(canvas, memberName) {
  destroyMemberChart();

  const { labels, values } = getMostPopularGamesData(memberName);
  const totalRuns = values.reduce((sum, value) => sum + value, 0);

  currentMemberChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values
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
              const percent = totalRuns ? ((value / totalRuns) * 100).toFixed(1) : "0.0";
              return `${label}: ${value} runs (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

function renderMostPlayedConsolesChart(canvas, memberName) {
  destroyMemberChart();

  const { labels, values } = getMostPlayedConsolesData(memberName);
  const totalRuns = values.reduce((sum, value) => sum + value, 0);

  currentMemberChart = new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data: values
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
              const percent = totalRuns ? ((value / totalRuns) * 100).toFixed(1) : "0.0";
              return `${label}: ${value} runs (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

function getTieAwareRank(rankingData, memberName) {
  const target = normalizeHandle(memberName);
  const targetItem = rankingData.find(item => normalizeHandle(item.name) === target);
  if (!targetItem) return null;

  const higherCount = rankingData.filter(item => item.value > targetItem.value).length;
  const sameCount = rankingData.filter(item => item.value === targetItem.value).length;

  return {
    rank: higherCount + 1,
    tied: sameCount > 1
  };
}

function buildEventsRankingData() {
  const members = getAllRunnerNames(allRows);

  return members.map(name => {
    const rows = allRows.filter(row => rowIncludesRunner(row, name));
    const events = new Set();

    rows.forEach(row => {
      const eventName = normalizeName(row.EVENT);
      if (eventName) events.add(eventName);
    });

    return {
      name,
      value: events.size
    };
  })
  .sort((a, b) => b.value - a.value);
}

function closeRunModal() {
  modal.classList.remove("open");
  modalBody.innerHTML = "";
  document.body.style.overflow = "";
}

function getNamesFromColumns(row, prefix, maxCount) {
  const names = [];
  for (let i = 1; i <= maxCount; i++) {
    const name = String(row[`${prefix}${i}`] || "").trim();
    if (name) names.push(name);
  }
  return names;
}

function getRunnerNames(row) {
  return getNamesFromColumns(row, "RUNNER", 16);
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

function formatDifferenceFromLeader(diffSeconds) {
  if (diffSeconds === null || diffSeconds <= 0) return "—";
  return `+${formatSecondsAsTime(diffSeconds)}`;
}

function buildRaceResultsData(row, timePrefix) {
  const results = [];

  for (let i = 1; i <= 6; i++) {
    const runnerName = String(row[`RUNNER${i}`] || "").trim();
    const timeValue = String(row[`${timePrefix}${i}`] || "").trim();

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

function openRunModal(row) {
  const game = String(row.GAME || "").trim() || "Untitled Run";
  const speedrunType = String(row.SPEEDRUNTYPE || "").trim();
  const runType = String(row.RUNTYPE || "").trim();
  const typeText = speedrunType || runType || "Run";

  const runnerNames = getRunnerNames(row);
  const runnerLinksHtml = runnerNames.length ? buildTwitchLinksHtml(runnerNames) : "";

  const commentaryNames = getNamesFromColumns(row, "COMMENTARY", 16);
  const commentaryLinksHtml = commentaryNames.length ? buildTwitchLinksHtml(commentaryNames) : "";

  const embedUrl = getYouTubeEmbedUrl(row.VIDEOURL, row.TIMESTAMP);
  const embedUrl2 = getYouTubeEmbedUrl(row.VIDEOURL2, row.TIMESTAMP2);

  const race1Data = buildRaceResultsData(row, "TIMERUNNER");
  const race2Data = buildRaceResultsData(row, "RACE2TIMERUNNER");

  const eventName = String(row.EVENT || "").trim();

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

  const hasRace1 = race1Data.length > 0;
  const hasRace2 = race2Data.length > 0;

  if (hasRace1 || hasRace2) {
    const raceTablesWrap = document.createElement("div");
    raceTablesWrap.className = "sc-race-tables-wrap";

    if (hasRace1) {
      const race1Table = createRaceTable("RACE #1", race1Data);
      if (race1Table) raceTablesWrap.appendChild(race1Table);
    }

    if (hasRace2) {
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
  document.body.style.overflow = "";

  prevBtn.disabled = currentMemberRunIndex <= 0;
  nextBtn.disabled = currentMemberRunIndex >= currentMemberRunRows.length - 1;
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
  if (currentMemberRunIndex > 0) {
    currentMemberRunIndex--;
    openRunModal(currentMemberRunRows[currentMemberRunIndex]);
  }
});

nextBtn.addEventListener("click", () => {
  if (currentMemberRunIndex < currentMemberRunRows.length - 1) {
    currentMemberRunIndex++;
    openRunModal(currentMemberRunRows[currentMemberRunIndex]);
  }
});

function rowIncludesCommentary(row, memberName) {
  const target = normalizeHandle(memberName);

  for (let i = 1; i <= 16; i++) {
    const commentary = normalizeHandle(row[`COMMENTARY${i}`]);
    if (commentary === target) return true;
  }

  return false;
}

function getRunnerNamesPlain(row) {
  const names = [];

  for (let i = 1; i <= 16; i++) {
    const runner = normalizeName(row[`RUNNER${i}`]);
    if (runner) names.push(runner);
  }

  return names.join(", ");
}

function getAllRunnerNames(rows) {
  const names = new Set();

  rows.forEach(row => {
    for (let i = 1; i <= 16; i++) {
      const runner = normalizeName(row[`RUNNER${i}`]);
      if (runner) names.add(runner);
    }
  });

  return [...names];
}

function getOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function buildRunsRankingData() {
  const members = getUniqueMemberNames();

  return members.map(name => ({
    name,
    value: allRows.filter(row => rowIncludesRunner(row, name)).length
  }))
  .sort((a, b) => b.value - a.value);
}

function buildUniqueGamesRankingData() {
  const members = getUniqueMemberNames();

  return members.map(name => {
    const games = new Set();

    // runs database
    allRows.forEach(row => {
      if (rowIncludesRunner(row, name)) {
        const game = normalizeName(row.GAME);
        if (game) games.add(game);
      }
    });

    // Races database
    const memberRaces = getRacesForRunner(name);
    memberRaces.forEach(race => {
      race.games.forEach(game => {
        const cleanGame = normalizeName(game);
        if (cleanGame) games.add(cleanGame);
      });
    });

    return {
      name,
      value: games.size
    };
  })
  .sort((a, b) => b.value - a.value);
}

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

function getRankForMember(rankingData, memberName) {
  const target = normalizeHandle(memberName);
  const index = rankingData.findIndex(item => normalizeHandle(item.name) === target);
  return index >= 0 ? index + 1 : null;
}

function renderRankingsView(container, memberName) {
  const runsRanking = buildRunsRankingData();
  const uniqueGamesRanking = buildUniqueGamesRankingData();
  const eventsRanking = buildEventsRankingData();

  const selectedRuns = runsRanking.find(item => normalizeHandle(item.name) === normalizeHandle(memberName));
  const selectedGames = uniqueGamesRanking.find(item => normalizeHandle(item.name) === normalizeHandle(memberName));
  const selectedEvents = eventsRanking.find(item => normalizeHandle(item.name) === normalizeHandle(memberName));

  const runsRankInfo = getTieAwareRank(runsRanking, memberName);
  const gamesRankInfo = getTieAwareRank(uniqueGamesRanking, memberName);
  const eventsRankInfo = getTieAwareRank(eventsRanking, memberName);

  const totalMembers = runsRanking.length;

  function rankText(rankInfo) {
    if (!rankInfo) return "—";
    const base = `${getOrdinal(rankInfo.rank)} most out of ${totalMembers} members`;
    return rankInfo.tied ? `Tied for ${base}` : base;
  }

  container.innerHTML = `
    <div class="sc-member-rankings-grid">
      <div class="sc-member-ranking-box">
        <div class="sc-member-ranking-label">NUMBER OF RUNS</div>
        <div class="sc-member-ranking-value">${escapeHtml(String(selectedRuns?.value ?? 0))}</div>
        <div class="sc-member-ranking-sub">${escapeHtml(rankText(runsRankInfo))}</div>
      </div>

      <div class="sc-member-ranking-box">
        <div class="sc-member-ranking-label">UNIQUE GAMES</div>
        <div class="sc-member-ranking-value">${escapeHtml(String(selectedGames?.value ?? 0))}</div>
        <div class="sc-member-ranking-sub">${escapeHtml(rankText(gamesRankInfo))}</div>
      </div>

      <div class="sc-member-ranking-box">
        <div class="sc-member-ranking-label">UNIQUE EVENTS</div>
        <div class="sc-member-ranking-value">${escapeHtml(String(selectedEvents?.value ?? 0))}</div>
        <div class="sc-member-ranking-sub">${escapeHtml(rankText(eventsRankInfo))}</div>
      </div>
    </div>
  `;
}

function setupMemberVisuals(visualCard, memberName) {
  const dropdown = visualCard.querySelector(".sc-visual-dropdown");
  const trigger = visualCard.querySelector(".sc-visual-trigger");
  const items = visualCard.querySelectorAll(".sc-visual-item");
  const canvas = visualCard.querySelector(".sc-member-visual-canvas");
  const rankingsView = visualCard.querySelector(".sc-member-rankings-view");

  function closeMenu() {
    dropdown.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    dropdown.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  }

  function showChart() {
    canvas.style.display = "block";
    rankingsView.style.display = "none";
  }

  function showRankings() {
    destroyMemberChart();
    canvas.style.display = "none";
    rankingsView.style.display = "block";
    renderRankingsView(rankingsView, memberName);
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      closeMenu();
    }
  });

  items.forEach(item => {
    item.addEventListener("click", () => {
      const visualType = item.dataset.visual;
      trigger.textContent = item.textContent.trim();
      closeMenu();

      if (visualType === "most-popular-games") {
        showChart();
        renderMostPopularGamesChart(canvas, memberName);
      } else if (visualType === "most-played-consoles") {
        showChart();
        renderMostPlayedConsolesChart(canvas, memberName);
      } else if (visualType === "rankings") {
        showRankings();
      } else if (visualType === "race-statistics") {
  destroyMemberChart();
  canvas.style.display = "none";
  rankingsView.style.display = "block";
  renderRaceStatsView(rankingsView, memberName);
}
    });
  });

  showChart();
  renderMostPopularGamesChart(canvas, memberName);
}

  async function getTwitchProfileImage(login) {
    try {
      const response = await fetch(`/api/twitch-user?login=${encodeURIComponent(login)}`);
      if (!response.ok) return "";
      const data = await response.json();
      return data.profile_image_url || "";
    } catch {
      return "";
    }
  }

  function findSocialRowForMember(name) {
    const target = normalizeHandle(name);
    return socialsRows.find(row =>
      normalizeHandle(row["TWITCH USERNAME"]) === target
    ) || null;
  }

  function cleanBlueskyHandle(handle) {
    return String(handle || "").trim().replace(/^@+/, "");
  }

  function createSocialLink(href, iconSrc, alt) {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    const img = document.createElement("img");
    img.src = iconSrc;
    img.alt = alt;

    a.appendChild(img);
    return a;
  }

  function buildSocialLinks(name, socialRow) {
    const socialWrap = document.createElement("div");
    socialWrap.className = "sc-member-social";

    socialWrap.appendChild(
      createSocialLink(
        `https://twitch.tv/${encodeURIComponent(name)}`,
        ICONS.twitch,
        "Twitch"
      )
    );

    if (!socialRow) {
      return socialWrap;
    }

    const youtube = normalizeName(socialRow["YOUTUBE"]);
    const x = normalizeName(socialRow["X (TWITTER)"]);
    const bluesky = cleanBlueskyHandle(socialRow["BLUESKY"]);
    const srcProfile = normalizeName(socialRow["SRC PROFILE"]);

    if (youtube) {
      socialWrap.appendChild(
        createSocialLink(
          `https://youtube.com/${encodeURIComponent(youtube)}`,
          ICONS.youtube,
          "YouTube"
        )
      );
    }

    if (x) {
      socialWrap.appendChild(
        createSocialLink(
          `https://x.com/${encodeURIComponent(x)}`,
          ICONS.x,
          "X"
        )
      );
    }

    if (bluesky) {
      socialWrap.appendChild(
        createSocialLink(
          `https://bsky.app/profile/${encodeURIComponent(bluesky)}`,
          ICONS.bluesky,
          "Bluesky"
        )
      );
    }

    if (srcProfile) {
      socialWrap.appendChild(
        createSocialLink(
          `https://speedrun.com/users/${encodeURIComponent(srcProfile)}`,
          ICONS.src,
          "Speedrun.com"
        )
      );
    }

    return socialWrap;
  }

  function buildPersonalWebsite(socialRow) {
    if (!socialRow) return null;

    const website = normalizeName(socialRow["PERSONAL WEBSITE"]);
    if (!website) return null;

    const p = document.createElement("p");
    p.className = "sc-member-website";

    const safeUrl = /^https?:\/\//i.test(website) ? website : `https://${website}`;

    p.innerHTML = `Personal Website: <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(website)}</a>`;
    return p;
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

  return game;
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

      for (let i = 1; i <= 6; i++) {
        const name = normalizeName(row[`RUNNER${i}`]);
        const rawTime = normalizeName(row[`RUNNER${i}TIME`]);

        if (name) {
          const parsedSeconds = parseRaceFinishTime(rawTime);

          runners.push({
            name,
            time: rawTime || "",
            seconds: parsedSeconds,
            isDNF: rawTime !== "" && parsedSeconds === null
          });
        }
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
  return race.runners.some(r => normalizeHandle(r.name) === target);
}

function getRacesForRunner(memberName) {
  return raceData.filter(race => runnerIsInRace(race, memberName));
}

  async function renderMember(name) {
  content.innerHTML = "";

  if (!name) return;

  const socialRow = findSocialRowForMember(name);
  const summary = buildMemberSummary(name);

  const wrap = document.createElement("div");
  wrap.className = "sc-member-wrap";

  const card = document.createElement("div");
  card.className = "sc-member-card";

  const left = document.createElement("div");
  left.className = "sc-member-left";

  const photoWrap = document.createElement("div");
  photoWrap.className = "sc-member-photo-wrap";
  photoWrap.appendChild(makePlaceholder(name));

  const info = document.createElement("div");
  info.className = "sc-member-info";

  const nameEl = document.createElement("h3");
  nameEl.className = "sc-member-name";
  nameEl.textContent = name;

  info.appendChild(nameEl);
  info.appendChild(buildSocialLinks(name, socialRow));

  const websiteEl = buildPersonalWebsite(socialRow);
  if (websiteEl) {
    info.appendChild(websiteEl);
  }

  left.appendChild(photoWrap);
  left.appendChild(info);

  const right = document.createElement("div");
  right.className = "sc-member-right";
  right.innerHTML = `
    <div class="sc-member-quickstats">
      <div><strong>Total Runs:</strong> ${escapeHtml(String(summary.runCount))}</div>
      <div><strong>Total Events:</strong> ${escapeHtml(String(summary.eventCount))}</div>
      <div><strong>Unique Games:</strong> ${escapeHtml(String(summary.gameCount))}</div>
      <div><strong>First Seen:</strong> ${escapeHtml(summary.firstSeenDate)}</div>
    </div>
  `;

  card.appendChild(left);
  card.appendChild(right);

  wrap.appendChild(card);
  content.appendChild(wrap);
  await renderMemberSummary(name);
  renderMemberRunsTable(name);
  renderMemberCommentaryTable(name);

  const profileImageUrl = await getTwitchProfileImage(name);
  if (profileImageUrl) {
    const img = document.createElement("img");
    img.className = "sc-member-photo";
    img.src = profileImageUrl;
    img.alt = `${name} Twitch profile picture`;
    photoWrap.innerHTML = "";
    photoWrap.appendChild(img);
  }
}

async function renderMemberSummary(memberName) {
  const summary = buildMemberSummary(memberName);
  const playtimeStats = await getTotalPlaytimeStatsForRunner(memberName);

  const wrap = document.createElement("div");
  wrap.className = "sc-member-summary-wrap";

  const summaryCard = document.createElement("div");
  summaryCard.className = "sc-member-summary-card";

  summaryCard.innerHTML = `
    <h3 class="sc-member-summary-title">RUNNER SUMMARY</h3>
    <div class="sc-member-summary-grid">
      <div class="sc-member-stat">
        <p class="sc-member-stat-label">First Event</p>
        <p class="sc-member-stat-value">${escapeHtml(summary.firstEvent)}</p>
      </div>

      <div class="sc-member-stat">
        <p class="sc-member-stat-label">Most Recent Event</p>
        <p class="sc-member-stat-value">${escapeHtml(summary.lastEvent)}</p>
      </div>

      <div class="sc-member-stat">
        <p class="sc-member-stat-label">Most Played Game</p>
        <p class="sc-member-stat-value">${summary.mostPlayedGameDisplay}</p>
      </div>

      <div class="sc-member-stat">
        <p class="sc-member-stat-label">Most Played Console</p>
        <p class="sc-member-stat-value">${escapeHtml(summary.mostPlayedConsole)}</p>
      </div>

      <div class="sc-member-stat">
        <p class="sc-member-stat-label">Number of Consoles Showcased</p>
        <p class="sc-member-stat-value">${escapeHtml(String(summary.consoleShowcaseCount))}</p>
      </div>

      <div class="sc-member-stat">
        <p class="sc-member-stat-label">Total Races</p>
        <p class="sc-member-stat-value">${escapeHtml(summary.totalRaces)}</p>
      </div>
      
      <div class="sc-member-stat sc-member-stat-full">
  <p class="sc-member-stat-label">Total Playtime*</p>
  <p class="sc-member-stat-value">${escapeHtml(playtimeStats.totalDisplay)}</p>
  <p class="sc-member-stat-sub">
    ${
      playtimeStats.totalSeconds > 0
        ? `${playtimeStats.percentOfAll.toFixed(1)}% of all runner VOD playtime • ${playtimeStats.rank ? getOrdinal(playtimeStats.rank) : "—"} of ${playtimeStats.totalRunners}`
        : "No VOD playtime available"
    }
  </p>
</div>
      
    </div>
  `;

  const visualCard = document.createElement("div");
  visualCard.className = "sc-member-summary-card sc-member-visual-card";

  visualCard.innerHTML = `
    <h3 class="sc-member-summary-title">ADVANCED STATISTICS</h3>
    <div class="sc-member-visual-controls">
      <div class="sc-dropdown sc-visual-dropdown">
        <button type="button" class="sc-dropdown-trigger sc-visual-trigger" aria-haspopup="listbox" aria-expanded="false">
          Most Played Games
        </button>
        <div class="sc-dropdown-menu sc-visual-menu" role="listbox">
  <button type="button" class="sc-dropdown-item sc-visual-item" data-visual="most-popular-games">
    Most Popular Games
  </button>
  <button type="button" class="sc-dropdown-item sc-visual-item" data-visual="most-played-consoles">
    Most Played Consoles
  </button>
  <button type="button" class="sc-dropdown-item sc-visual-item" data-visual="rankings">
    Rankings
  </button>
  <button type="button" class="sc-dropdown-item sc-visual-item" data-visual="race-statistics">
  Race Statistics
</button>
</div>
      </div>
    </div>
    <div class="sc-member-visual-chart-wrap">
  <canvas class="sc-member-visual-canvas"></canvas>
  <div class="sc-member-rankings-view" style="display:none;"></div>
</div>
  `;

  wrap.appendChild(summaryCard);
  wrap.appendChild(visualCard);
  content.appendChild(wrap);

  setupMemberVisuals(visualCard, memberName);
}

async function getYouTubeDuration(videoUrl) {
  try {
    const response = await fetch(
      `/api/youtube-duration?url=${encodeURIComponent(videoUrl)}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.duration_display || null;
  } catch {
    return null;
  }
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
    return "";
  }

  return "";
}

function getRowsWithVodForRunner(memberName) {
  return allRows.filter(row => {
    if (!rowIncludesRunner(row, memberName)) return false;
    return !!extractYouTubeId(row.VIDEOURL);
  });
}

async function getVideoDurationSeconds(videoUrl) {
  try {
    const response = await fetch(
      `/api/youtube-duration?url=${encodeURIComponent(videoUrl)}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    return typeof data.duration_seconds === "number" ? data.duration_seconds : null;
  } catch {
    return null;
  }
}

const youtubeDurationCache = new Map();

async function getCachedVideoDurationSeconds(videoUrl) {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) return null;

  if (youtubeDurationCache.has(videoId)) {
    return youtubeDurationCache.get(videoId);
  }

  const seconds = await getVideoDurationSeconds(videoUrl);
  youtubeDurationCache.set(videoId, seconds);
  return seconds;
}

async function getTotalPlaytimeSecondsForRunner(memberName) {
  const rows = getRowsWithVodForRunner(memberName);
  let totalSeconds = 0;

  for (const row of rows) {
    const seconds = await getCachedVideoDurationSeconds(row.VIDEOURL);
    if (seconds !== null) {
      totalSeconds += seconds;
    }
  }

  return totalSeconds;
}

async function buildPlaytimeRankingData() {
  const members = getUniqueMemberNames();
  const ranking = [];

  for (const name of members) {
    const totalSeconds = await getTotalPlaytimeSecondsForRunner(name);
    ranking.push({
      name,
      value: totalSeconds
    });
  }

  return ranking
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

async function getTotalPlaytimeStatsForRunner(memberName) {
  const ranking = await buildPlaytimeRankingData();
  const totalAllSeconds = ranking.reduce((sum, item) => sum + item.value, 0);

  const runnerEntry = ranking.find(
    item => normalizeHandle(item.name) === normalizeHandle(memberName)
  );

  const totalSeconds = runnerEntry ? runnerEntry.value : 0;
  const rank = runnerEntry
    ? ranking.findIndex(item => normalizeHandle(item.name) === normalizeHandle(memberName)) + 1
    : null;

  const percentOfAll =
    totalAllSeconds > 0 ? (totalSeconds / totalAllSeconds) * 100 : 0;

  return {
    totalSeconds,
    totalDisplay: totalSeconds > 0 ? formatSecondsAsTime(totalSeconds) : "—",
    percentOfAll,
    rank,
    totalRunners: ranking.length
  };
}

function renderMemberRunsTable(memberName) {
  const normalRows = allRows.filter(row => rowIncludesRunner(row, memberName));
  const memberRaces = getRacesForRunner(memberName);

  const raceRows = memberRaces.flatMap(race =>
    race.games.map(game => ({
      GAME: game,
      EVENT: race.eventName,
      DATE: race.date,
      RUNTYPE: "Race",
      SPEEDRUNTYPE: "",
      VIDEOURL: race.videoUrl,
      VIDEOURL2: "",
      TIMESTAMP: "",
      TIMESTAMP2: "",
      RUNNER1: race.runners[0]?.name || "",
      RUNNER2: race.runners[1]?.name || "",
      RUNNER3: race.runners[2]?.name || "",
      RUNNER4: race.runners[3]?.name || "",
      RUNNER5: race.runners[4]?.name || "",
      RUNNER6: race.runners[5]?.name || "",
      COMMENTARY1: "",
      COMMENTARY2: "",
      COMMENTARY3: "",
      COMMENTARY4: "",
      COMMENTARY5: "",
      COMMENTARY6: ""
    }))
  );

  const memberRows = [...normalRows, ...raceRows].sort((a, b) => {
  const dateA = parseEventDate(a.DATE);
  const dateB = parseEventDate(b.DATE);

  if (dateA && dateB) return dateA - dateB;
  if (dateA) return -1;
  if (dateB) return 1;
  return 0;
});

  currentMemberRunRows = memberRows;

  const wrap = document.createElement("div");
  wrap.className = "sc-member-runs-wrap";

  const card = document.createElement("div");
  card.className = "sc-member-runs-card";

  const title = document.createElement("h3");
  title.className = "sc-member-runs-title";
  title.textContent = `${memberName} RUNS`;

  const tableWrap = document.createElement("div");
  tableWrap.className = "sc-member-runs-table-wrap";

  const table = document.createElement("table");
  table.className = "sc-member-runs-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>GAME</th>
      <th>EVENT</th>
      <th>DATE</th>
      <th>RUNTYPE</th>
      <th>SPEEDRUNTYPE</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  memberRows.forEach((row, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><button type="button" class="sc-game-link">${escapeHtml(normalizeName(row.GAME) || "—")}</button></td>
      <td>${escapeHtml(normalizeName(row.EVENT) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.DATE) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.RUNTYPE) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.SPEEDRUNTYPE) || "—")}</td>
    `;

    const gameButton = tr.querySelector(".sc-game-link");
    gameButton.addEventListener("click", () => {
      currentMemberRunIndex = index;
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

function renderMemberCommentaryTable(memberName) {
  const commentaryRows = allRows.filter(row => rowIncludesCommentary(row, memberName));

  const wrap = document.createElement("div");
  wrap.className = "sc-member-runs-wrap";

  const card = document.createElement("div");
  card.className = "sc-member-runs-card";

  const title = document.createElement("h3");
  title.className = "sc-member-runs-title";
  title.textContent = `${memberName} COMMENTARY`;

  const tableWrap = document.createElement("div");
  tableWrap.className = "sc-member-runs-table-wrap";

  const table = document.createElement("table");
  table.className = "sc-member-runs-table";

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

  commentaryRows.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><button type="button" class="sc-game-link">${escapeHtml(normalizeName(row.GAME) || "—")}</button></td>
      <td>${escapeHtml(normalizeName(row.EVENT) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.DATE) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.RUNTYPE) || "—")}</td>
      <td>${escapeHtml(normalizeName(row.SPEEDRUNTYPE) || "—")}</td>
      <td>${escapeHtml(getRunnerNamesPlain(row) || "—")}</td>
    `;

    const gameButton = tr.querySelector(".sc-game-link");
    gameButton.addEventListener("click", () => {
      currentMemberRunRows = commentaryRows;
      currentMemberRunIndex = commentaryRows.indexOf(row);
      openRunModal(row);
    });

    tbody.appendChild(tr);
  });

  if (!commentaryRows.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="6">No commentary entries found.</td>
    `;
    tbody.appendChild(emptyRow);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  card.appendChild(title);
  card.appendChild(tableWrap);
  wrap.appendChild(card);
  content.appendChild(wrap);
}

  function setSelected(name) {
    trigger.textContent = name || "Select a member";
    trigger.dataset.value = name || "";
    closeMenu();
    renderMember(name);
  }

  function handleMembersLoaded() {
    const uniqueMembers = getUniqueMemberNames();

    menu.innerHTML = "";
    trigger.textContent = "Select a member";

    if (!uniqueMembers.length) {
      trigger.textContent = "No members found";
      content.innerHTML = `<p class="sc-results-message">No members were found in the CSV.</p>`;
      return;
    }

    const defaultItem = document.createElement("button");
    defaultItem.type = "button";
    defaultItem.className = "sc-dropdown-item";
    defaultItem.textContent = "Select a member";
    defaultItem.addEventListener("click", () => setSelected(""));
    menu.appendChild(defaultItem);

    uniqueMembers.forEach(name => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "sc-dropdown-item";
      item.textContent = name;
      item.title = name;
      item.addEventListener("click", () => setSelected(name));
      menu.appendChild(item);
    });
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      closeMenu();
    }
  });

  (async function initMemberData() {
  try {
    try {
      socialsRows = await loadCsv(SOCIALS_CSV_URL);
    } catch (err) {
      console.error("Papa Parse socials CSV error:", err);
      socialsRows = [];
    }

    try {
      extraRows = await loadCsv(EXTRA_CSV_URL);
    } catch (err) {
      console.error("Papa Parse extra CSV error:", err);
      extraRows = [];
    }
    
    raceData = buildRaceDatabase(extraRows);

    allRows = await loadCsv(CSV_URL);
    handleMembersLoaded();
  } catch (err) {
    console.error("Papa Parse member CSV error:", err);
    trigger.textContent = "Failed to load members";
    content.innerHTML = `<p class="sc-results-message">Could not load member CSV data.</p>`;
  }
})();
});
