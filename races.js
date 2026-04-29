document.addEventListener("DOMContentLoaded", () => {
  const controls = document.getElementById("controls");
  if (!controls) return;

  let allRows = [];

  const IS_LOCAL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  const CSV_URL = IS_LOCAL
    ? "SEGA CREW RACES - MASTER.csv"
    : "https://stupendous-paletas-199024.netlify.app/SEGA CREW RACES - MASTER.csv";

  const wrapper = document.createElement("div");
  wrapper.className = "sc-page-controls";

  const label = document.createElement("div");
  label.className = "sc-label";
 

  const dropdown = document.createElement("div");
  dropdown.className = "sc-dropdown";
  dropdown.id = "raceDropdown";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "sc-dropdown-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.textContent = "Loading races...";

  const menu = document.createElement("div");
  menu.className = "sc-dropdown-menu";
  menu.setAttribute("role", "listbox");

  let raceTypeSearch = "";
  let raceTypeSearchTimer = null;

  const resultsWrap = document.createElement("div");
  resultsWrap.className = "sc-results-wrap";
  resultsWrap.id = "resultsWrap";

  dropdown.appendChild(trigger);
  dropdown.appendChild(menu);

  wrapper.appendChild(label);
  wrapper.appendChild(dropdown);

  controls.appendChild(wrapper);
  controls.appendChild(resultsWrap);

  function closeMenu() {
    dropdown.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    dropdown.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");

    requestAnimationFrame(() => {
      scrollSelectedRaceIntoView();
    });
  }

  function normalizeName(value) {
    return String(value || "").trim();
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

function getNamesFromColumns(row, prefix, maxCount) {
  const names = [];

  for (let i = 1; i <= maxCount; i++) {
    const name = normalizeName(row[`${prefix}${i}`]);
    if (name) names.push(name);
  }

  return names;
}

function buildTwitchLinksHtml(names) {
  return names.map(name => buildTwitchLinkHtml(name)).join(", ");
}

  function clearResults(message = "") {
    resultsWrap.innerHTML = "";

    if (message) {
      const msg = document.createElement("p");
      msg.className = "sc-results-message";
      msg.textContent = message;
      resultsWrap.appendChild(msg);
    }
  }
  
  function parseRaceTimeToSeconds(timeStr) {
  const raw = String(timeStr || "").trim();
  if (!raw) return null;

  if (raw.toUpperCase() === "DNF") return null;

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

function formatSecondsAsHms(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return "—";

  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getRaceResultsData(rowsForRace) {
  const runners = [];

  rowsForRace.forEach(row => {
    for (let i = 1; i <= 20; i++) {
      const runner = normalizeName(row[`RUNNER${i}`]);
      const time = normalizeName(row[`RUNNER${i}TIME`]);

      if (!runner || !time) continue;

      const isDNF = time.toUpperCase() === "DNF";
      const seconds = isDNF ? null : parseRaceTimeToSeconds(time);

      runners.push({
        runner,
        time,
        seconds,
        isDNF: isDNF || seconds === null
      });
    }
  });

  const seen = new Set();

  const deduped = runners.filter(item => {
    const key = `${item.runner}__${item.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => {
    if (a.isDNF && b.isDNF) return a.runner.localeCompare(b.runner);
    if (a.isDNF) return 1;
    if (b.isDNF) return -1;
    return a.seconds - b.seconds;
  });

  const winner = deduped.find(item => !item.isDNF);
  const winningSeconds = winner ? winner.seconds : null;

  return deduped.map((item, index) => {
  const diffSeconds =
    item.isDNF || winningSeconds === null
      ? null
      : item.seconds - winningSeconds;

  return {
    place: item.isDNF ? "DNF" : index + 1,
    runner: item.runner,
    time: item.time,
    behind:
      diffSeconds === null || diffSeconds <= 0
        ? "—"
        : formatSecondsAsHms(diffSeconds)
  };
});
}

  function scrollSelectedRaceIntoView() {
    const selectedName = normalizeName(trigger.dataset.value);
    if (!selectedName) return;

    const selectedItem = [...menu.querySelectorAll(".sc-dropdown-item")].find(
      item => normalizeName(item.dataset.value || item.textContent) === selectedName
    );

    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "center" });
    }
  }

  function scrollRaceMatchIntoView(query) {
    const cleanQuery = normalizeName(query).toLowerCase();
    if (!cleanQuery) return;

    const match = [...menu.querySelectorAll(".sc-dropdown-item")].find(item => {
      const value = normalizeName(item.dataset.value || item.textContent).toLowerCase();
      return value.startsWith(cleanQuery);
    });

    if (match) {
      match.scrollIntoView({ block: "center" });
    }
  }

  function buildRaceGoalsTable(rowsForRace) {
  const tableBox = document.createElement("div");
  tableBox.className = "sc-race-box sc-race-directory-box";

  const title = document.createElement("div");
  title.className = "sc-race-title";
  title.textContent = "RACE GOALS";

  const table = document.createElement("table");
  table.className = "sc-race-table sc-race-directory-table sc-race-goals-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>GAME</th>
      <th>GOAL</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  rowsForRace.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(row.GAMEID ?? "")}</td>
      <td>${escapeHtml(row.GAME ?? "")}</td>
      <td>${escapeHtml(row.GOAL ?? "")}</td>
    `;

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  tableBox.appendChild(title);
  tableBox.appendChild(table);

  return tableBox;
}

function buildResultsTable(rowsForRace) {
  const resultsData = getRaceResultsData(rowsForRace);

  const tableBox = document.createElement("div");
  tableBox.className = "sc-race-box sc-race-directory-box";

  const title = document.createElement("div");
  title.className = "sc-race-title";
  title.textContent = "RESULTS";

  const table = document.createElement("table");
  table.className = "sc-race-table sc-race-directory-table sc-race-results-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>RUNNER</th>
      <th>TIME</th>
      <th>DIFFERENCE</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  if (!resultsData.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">No results found.</td>`;
    tbody.appendChild(tr);
  } else {
    resultsData.forEach(item => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${escapeHtml(item.place)}</td>
        <td>${buildTwitchLinkHtml(item.runner)}</td>
        <td>${escapeHtml(item.time)}</td>
        <td>${escapeHtml(item.behind)}</td>
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

function getYouTubeEmbedUrl(url, timestamp = "") {
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

function buildRaceVideoEmbed(rowsForRace) {
  const videoRow = rowsForRace.find(row => normalizeName(row.VIDEOURL));
  if (!videoRow) return null;

  const embedUrl = getYouTubeEmbedUrl(videoRow.VIDEOURL, videoRow.TIMESTAMP);
  if (!embedUrl) return null;

  const videoWrap = document.createElement("div");
  videoWrap.className = "sc-race-video-wrap";

  const iframe = document.createElement("iframe");
  iframe.className = "sc-race-video";
  iframe.src = embedUrl;
  iframe.title = normalizeName(videoRow.EVENT) || "Race video";
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute(
    "allow",
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  );
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

  videoWrap.appendChild(iframe);

  return videoWrap;
}

function buildRaceInfoBlock(raceName, rowsForRace) {
  const infoRow =
    rowsForRace.find(row => normalizeName(row.EVENT) === raceName) ||
    rowsForRace[0];

  const date = normalizeName(infoRow.DATE);
  const commentaryNames = getNamesFromColumns(infoRow, "COMMENTARY", 6);
  const commentaryLinksHtml = buildTwitchLinksHtml(commentaryNames);
  const officialResultsUrl = normalizeName(infoRow.OFFICIALRESULTS);

  const infoBlock = document.createElement("div");
  infoBlock.className = "sc-race-info-block";

  infoBlock.innerHTML = `
    <h3 class="sc-race-selected-title">${escapeHtml(raceName)}</h3>

    ${date ? `
      <div class="sc-race-info-line">
        <span class="sc-race-info-label">Date:</span>
        <span>${escapeHtml(date)}</span>
      </div>
    ` : ""}

    ${commentaryLinksHtml ? `
      <div class="sc-race-info-line">
        <span class="sc-race-info-label">Commentary By:</span>
        <span>${commentaryLinksHtml}</span>
      </div>
    ` : ""}

    ${officialResultsUrl ? `
  <div class="sc-race-info-line sc-race-official-results-line">
    <a class="sc-race-official-results" href="${escapeHtml(officialResultsUrl)}" target="_blank" rel="noopener noreferrer">
      Official Results
    </a>
  </div>
` : ""}
  `;

  return infoBlock;
}

  function renderRaceTables(raceName) {
  clearResults();

  const matchingRaceRow = allRows.find(
    row => normalizeName(row.EVENT) === raceName
  );

  if (!matchingRaceRow) {
    clearResults("Could not find the selected race.");
    return;
  }

  const eventId = normalizeName(matchingRaceRow.EVENTID);

  if (!eventId) {
    clearResults("Selected race does not have an EVENTID.");
    return;
  }

  const rowsForRace = allRows.filter(row => {
    const rowEventId = normalizeName(row.EVENTID);
    const rowKey = normalizeName(row.KEY);

    return (
      rowEventId === eventId ||
      rowKey.startsWith(`${eventId}_`)
    );
  });

  if (!rowsForRace.length) {
    clearResults("No rows found for this race.");
    return;
  }
  
  const raceInfoBlock = buildRaceInfoBlock(raceName, rowsForRace);
  resultsWrap.appendChild(raceInfoBlock);

  const tablesWrap = document.createElement("div");
  tablesWrap.className = "sc-race-directory-tables-wrap";

  const goalsTable = buildRaceGoalsTable(rowsForRace);
  const resultsTable = buildResultsTable(rowsForRace);

  tablesWrap.appendChild(goalsTable);
  tablesWrap.appendChild(resultsTable);

  resultsWrap.appendChild(tablesWrap);
  
  const videoEmbed = buildRaceVideoEmbed(rowsForRace);

if (videoEmbed) {
  resultsWrap.appendChild(videoEmbed);
}
}

  function setSelected(raceName) {
    trigger.textContent = raceName || "Select a race";
    trigger.dataset.value = raceName || "";
    closeMenu();

    if (!raceName) {
      clearResults();
      return;
    }

    renderRaceTables(raceName);
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!dropdown.classList.contains("open")) return;
    if (e.key === "Escape") return;
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

    raceTypeSearch += e.key.toLowerCase();

    clearTimeout(raceTypeSearchTimer);
    raceTypeSearchTimer = setTimeout(() => {
      raceTypeSearch = "";
    }, 900);

    scrollRaceMatchIntoView(raceTypeSearch);
  });

  Papa.parse(CSV_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allRows = results.data || [];

      const uniqueRaces = [...new Set(
        allRows
          .map(row => String(row.EVENT || "").trim())
          .filter(v => v !== "")
      )].sort((a, b) => a.localeCompare(b));

      menu.innerHTML = "";
      trigger.textContent = "Select a race";

      if (!uniqueRaces.length) {
        trigger.textContent = "No races found";
        return;
      }

      const defaultItem = document.createElement("button");
      defaultItem.type = "button";
      defaultItem.className = "sc-dropdown-item";
      defaultItem.textContent = "Select a race";
      defaultItem.dataset.value = "Select a race";
      defaultItem.addEventListener("click", () => setSelected(""));
      menu.appendChild(defaultItem);

      uniqueRaces.forEach(raceName => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "sc-dropdown-item";
        item.textContent = raceName;
        item.title = raceName;
        item.dataset.value = raceName;
        item.addEventListener("click", () => setSelected(raceName));
        menu.appendChild(item);
      });
    },
    error: function(err) {
      console.error("Papa Parse load error:", err);
      trigger.textContent = "Failed to load races";
      clearResults("Could not load CSV data.");
    }
  });
});
