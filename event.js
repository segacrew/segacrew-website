document.addEventListener("DOMContentLoaded", () => {
  const controls = document.getElementById("controls");
  if (!controls) return;

  let allRows = [];
  let currentEventRows = [];
  let currentRunIndex = -1;

  const wrapper = document.createElement("div");
  wrapper.className = "sc-page-controls";

  const label = document.createElement("div");
  label.className = "sc-label";
  label.textContent = "Select Event";

  const dropdown = document.createElement("div");
  dropdown.className = "sc-dropdown";
  dropdown.id = "eventDropdown";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "sc-dropdown-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.textContent = "Loading events...";

  const menu = document.createElement("div");
  menu.className = "sc-dropdown-menu";
  menu.setAttribute("role", "listbox");

  const resultsWrap = document.createElement("div");
  resultsWrap.className = "sc-results-wrap";
  resultsWrap.id = "resultsWrap";
  
  const eventImageMap = {
  "1": "images/segathonlogo1.png",
  "2": "images/segaweek.png",
  "3": "images/segamini-logo.png",
  "4": "images/nightmareonsegastreet.png",
  "5": "images/segathon2-new.png",
  "6": "images/segaweenoffset.png",
  "7": "images/shinobithon.png",
  "8": "images/fmv-marathon.png",
  "9": "images/segathon3.png",
  "10": "images/segalympicslogo2.png",
  "11": "images/segasat-logo.png",
  "12": "images/SegaWeen_III_Logo.png",
  "13": "images/ed-a-thon.png",
  "14": "images/segathon4logo.png",
  "15": "images/SegaWeen_Draft_2.png",
  "16": "images/rpg-a-thon.png",
  "17": "images/LICENSEDATHON.png",
  "18": "images/april-fools.png",
  "19": "images/ed-a-thon-2023.png",
  "20": "images/Sega_Crew_Live_Logo_copy.jpg",
  "21": "images/stvlogo.png",
  "22": "images/4040Logo1.png",
  "23": "images/segaween-part-5.png",
  "24": "images/segathonvi.png",
  "25": "images/DreamcastAnniversary.png",
  "26": "images/segalympics_logo_2024.png",
  "27": "images/segathon7.png",
  "28": "images/saturnalia_logo_1.png",
  "29": "images/MKIII.png",
  "30": "images/SW6logo.png",
  "31": "images/segalympics_logo_2026.png",
};
  

  const modal = document.createElement("div");
  modal.className = "sc-modal";
  modal.id = "runModal";
  modal.innerHTML = `
  <div class="sc-modal-content">
    <button type="button" class="sc-modal-close">×</button>

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

prevBtn.addEventListener("click", () => {
  if (currentRunIndex > 0) {
    currentRunIndex--;
    openRunModal(currentEventRows[currentRunIndex]);
  }
});

nextBtn.addEventListener("click", () => {
  if (currentRunIndex < currentEventRows.length - 1) {
    currentRunIndex++;
    openRunModal(currentEventRows[currentRunIndex]);
  }
});

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

  function formatDateToText(dateStr) {
    const raw = String(dateStr || "").trim();
    if (!raw) return "";

    const parts = raw.split("/");
    if (parts.length !== 3) return raw.toUpperCase();

    const monthNum = parseInt(parts[0], 10);
    const dayNum = parseInt(parts[1], 10);
    const yearNum = parseInt(parts[2], 10);

    const months = [
      "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
      "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];

    if (
      Number.isNaN(monthNum) ||
      Number.isNaN(dayNum) ||
      Number.isNaN(yearNum) ||
      monthNum < 1 ||
      monthNum > 12
    ) {
      return raw.toUpperCase();
    }

    return `${months[monthNum - 1]} ${dayNum} ${yearNum}`;
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
  return getNamesFromColumns(row, "RUNNER", 10);
}

function buildTwitchLinksHtml(names) {
  return names.map(name => {
    const safeName = encodeURIComponent(name);
    return `<a href="https://twitch.tv/${safeName}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`;
  }).join(" / ");
}

  function getRunnerLinksHtml(row) {
    const names = getRunnerNames(row);
    return names.map(name => {
      const safeName = encodeURIComponent(name);
      return `<a href="https://twitch.tv/${safeName}" target="_blank" rel="noopener noreferrer">${name}</a>`;
    }).join("<br>");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
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

  for (let i = 1; i <= 10; i++) {
    const runnerName = String(row[`RUNNER${i}`] || "").trim();
    const timeValue = String(row[`${timePrefix}${i}`] || "").trim();

    if (!runnerName || !timeValue) continue;

    const seconds = parseRaceTimeToSeconds(timeValue);

    results.push({
      runner: runnerName,
      time: timeValue,
      seconds: seconds, // null if not numeric (DNF, etc.)
      isDNF: seconds === null
    });
  }

  if (!results.length) return [];

  // Sort: valid times first, then DNFs at bottom
  results.sort((a, b) => {
    if (a.isDNF && b.isDNF) return 0;
    if (a.isDNF) return 1;
    if (b.isDNF) return -1;
    return a.seconds - b.seconds;
  });

  // Find fastest valid time
  const fastestEntry = results.find(r => !r.isDNF);
  const fastest = fastestEntry ? fastestEntry.seconds : null;

  return results.map(item => ({
    runner: item.runner,
    time: item.time,
    difference:
      item.isDNF || fastest === null
        ? null
        : item.seconds - fastest
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
  const runnerLinksHtml = runnerNames.length
    ? buildTwitchLinksHtml(runnerNames)
    : "";

  const commentaryNames = getNamesFromColumns(row, "COMMENTARY", 4);
  const commentaryLinksHtml = commentaryNames.length
    ? buildTwitchLinksHtml(commentaryNames)
    : "";

  const embedUrl = getYouTubeEmbedUrl(row.VIDEOURL, row.TIMESTAMP);
  const embedUrl2 = getYouTubeEmbedUrl(row.VIDEOURL2, row.TIMESTAMP2);
  
  const race1Data = buildRaceResultsData(row, "TIMERUNNER");
  const race2Data = buildRaceResultsData(row, "RACE2TIMERUNNER");

  const eventName = String(row.EVENT || "").trim();

modalTitle.textContent = game;

modalSubtitle.innerHTML = `
  ${eventName ? `
    <div class="sc-modal-event">
      ${escapeHtml(eventName)}
    </div>
  ` : ""}

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
  document.body.style.overflow = "hidden";
  
  prevBtn.disabled = currentRunIndex <= 0;
  nextBtn.disabled = currentRunIndex >= currentEventRows.length - 1;
}

  function closeRunModal() {
    modal.classList.remove("open");
    modalBody.innerHTML = "";
    document.body.style.overflow = "";
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
  
  function renderEventImage(eventId) {
  const existing = document.getElementById("scEventImageWrap");
  if (existing) existing.remove();

  const imageSrc = eventImageMap[eventId];
  if (!imageSrc) return;

  const imageWrap = document.createElement("div");
  imageWrap.className = "sc-event-image-wrap";
  imageWrap.id = "scEventImageWrap";

  const img = document.createElement("img");
  img.className = "sc-event-image";
  img.src = imageSrc;
  img.alt = "Event image";

  imageWrap.appendChild(img);
  resultsWrap.appendChild(imageWrap);
}

  function buildResultsTable(rowsForEventId, eventName) {

    if (!rowsForEventId.length) {
      clearResults("No rows found for this event.");
      return;
    }

    const title = document.createElement("h3");
    title.className = "sc-results-title";
    title.textContent = eventName;

    const tableWrap = document.createElement("div");
    tableWrap.className = "sc-table-wrap";

    const table = document.createElement("table");
    table.className = "sc-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>GAME</th>
        <th>RUN TYPE</th>
        <th>SPEEDRUN CATEGORY</th>
        <th>CONSOLE</th>
        <th>RUNNER(S)</th>
      </tr>
    `;

    const tbody = document.createElement("tbody");
    let lastDate = null;

    rowsForEventId.forEach(row => {
      const currentDate = String(row.DATE || "").trim();

      if (currentDate !== lastDate) {
        const dateRow = document.createElement("tr");
        dateRow.className = "sc-date-row";
        dateRow.innerHTML = `<td colspan="5">${formatDateToText(currentDate)}</td>`;
        tbody.appendChild(dateRow);
        lastDate = currentDate;
      }

      const gameButtonHtml = `
        <button type="button" class="sc-game-link">${escapeHtml(row.GAME ?? "")}</button>
      `;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${gameButtonHtml}</td>
        <td>${escapeHtml(row.RUNTYPE ?? "")}</td>
        <td>${escapeHtml(row.SPEEDRUNTYPE ?? "")}</td>
        <td>${escapeHtml(row.CONSOLE ?? "")}</td>
        <td>${getRunnerLinksHtml(row)}</td>
      `;

      const gameButton = tr.querySelector(".sc-game-link");
      if (gameButton) {
        gameButton.addEventListener("click", () => {
  currentRunIndex = rowsForEventId.indexOf(row);
  openRunModal(row);
});
      }

      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    resultsWrap.appendChild(title);
    resultsWrap.appendChild(tableWrap);
  }

  function setSelected(eventName) {
    trigger.textContent = eventName || "Select an event";
    trigger.dataset.value = eventName || "";
    closeMenu();

    if (!eventName) {
      clearResults();
      return;
    }

    const matchingEventRow = allRows.find(
      row => String(row.EVENT || "").trim() === eventName
    );

    if (!matchingEventRow) {
      clearResults("Could not find the selected event.");
      return;
    }

    const eventId = String(matchingEventRow.EVENTID || "").trim();

    if (!eventId) {
      clearResults("Selected event does not have an EVENTID.");
      return;
    }

    const rowsForEventId = allRows.filter(
  row => String(row.EVENTID || "").trim() === eventId
);

currentEventRows = rowsForEventId;

resultsWrap.innerHTML = "";
renderEventImage(eventId);
buildResultsTable(rowsForEventId, eventName);
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

  Papa.parse("https://stupendous-paletas-199024.netlify.app/sega crew database - master sheet.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      allRows = results.data || [];

      const uniqueEvents = [...new Set(
        allRows
          .map(row => String(row.EVENT || "").trim())
          .filter(v => v !== "")
      )].sort((a, b) => a.localeCompare(b));

      menu.innerHTML = "";
      trigger.textContent = "Select an event";

      if (!uniqueEvents.length) {
        trigger.textContent = "No events found";
        return;
      }

      const defaultItem = document.createElement("button");
      defaultItem.type = "button";
      defaultItem.className = "sc-dropdown-item";
      defaultItem.textContent = "Select an event";
      defaultItem.addEventListener("click", () => setSelected(""));
      menu.appendChild(defaultItem);

      uniqueEvents.forEach(eventName => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "sc-dropdown-item";
        item.textContent = eventName;
        item.title = eventName;
        item.addEventListener("click", () => setSelected(eventName));
        menu.appendChild(item);
      });
    },
    error: function(err) {
      console.error("Papa Parse load error:", err);
      trigger.textContent = "Failed to load events";
      clearResults("Could not load CSV data.");
    }
  });
});
