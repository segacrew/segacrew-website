document.addEventListener("DOMContentLoaded", () => {
  const controls = document.getElementById("controls");
  if (!controls) return;

  let allRows = [];

  const IS_LOCAL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  const CSV_URL = IS_LOCAL
    ? "SEGA CREW RACES - MASTER.csv"
    : "SEGA CREW RACES - MASTER.csv";
    
  const RACE_INFORMATION = {
  "Sega 8 #7": {
    title: "Sega 8 #7",
    date: "November 21, 2026",

    raceRulesImage:
      "images/Sega8_7_GameList.png",

    pathMapImage:
      "images/Sega8_7_RaceMap.png",
      
     resources: {
      romPackUrl: "https://discord.com/channels/570798335997247510/590703739481096212/1558523536937717760",
      timeSheetUrl: "https://docs.google.com/spreadsheets/d/1DAz4z-ykSG56r2hYeI5k3zSJh6DKJ8SGzTPYciN9VZs",
      gameRevealUrl: "https://www.twitch.tv/videos/2896984034",
      speedrunArchiveUrl: "https://www.speedrun.com/Multiple_Genesis_Games?h=mega-16-sega-16-sega8-2026-list-announced-11am-edt-saturday-10-october-click-website"
  },  

    detailedGoals: [
      {
        game: "1. Castle of Illusion Starring Mickey Mouse",
        goal: "Beat the Game",
        additionalInfo: " ",
        timeStart: "When you press start on the options menu",
        timeStartImage: "images/01 Monster World IV - Time Start.png",
        timeEnd: "On the last hit on mizrabel",
        timeEndImage: "images/01 Monster World IV - Time End.png",
      },
      {
		game: "2. Street Fighter II': Special Champion Edition",
		goals: [
	  {
		label: "Goal A",
		goal: "Beat 4 Opponents",
		additionalInfo: "Normal speed (no hyper speed). 2 star difficulty or higher",
		timeStart: "On character select",
		timeStartImage: "images/02 Street Fighter II' Special Champion Edition - Time Start.png",
		timeEnd: "On final hit on fourth opponent",
		timeEndImage: "images/02 Street Fighter II' Special Champion Edition - Goal A Time End.png"
	  },
      {
		label: "Goal B",
		goal: "Beat 8 Opponents",
		additionalInfo: "Normal speed (no hyper speed). 2 star difficulty or higher",
		timeStart: "On character select",
		timeStartImage: "images/02 Street Fighter II' Special Champion Edition - Time Start.png",
		timeEnd: "On final hit on eigth opponent",
		timeEndImage: "images/02 Street Fighter II' Special Champion Edition - Goal B Time End.png"
       }
      ]
    },
      {
		game: "3. Insector X",
		goals: [
	  {
		label: "Goal A",
		goal: "Score 200,000 points",
		additionalInfo: "Any options setting. You MUST do this goal if you do Goal A of Street Fighter II': Special Champion Edition",
		timeStart: "On selecting '1PLAY START' on the title screen",
		timeStartImage: "images/03 Insector X - Time Start.png",
		timeEnd: "When score counter hits 200,000 points",
		timeEndImage: "images/03 Insector X - Goal A Time End.png"
	  },
      {
		label: "Goal B",
		goal: "Score 100,000 points",
		additionalInfo: "Any options setting. You MUST do this goal if you do Goal B of Street Fighter II': Special Champion Edition",
		timeStart: "On selecting '1PLAY START' on the title screen",
		timeStartImage: "images/03 Insector X - Time Start.png",
		timeEnd: "When score counter hits 100,000 points",
		timeEndImage: "images/03 Insector X - Goal B Time End.png"
       }
      ]
    },              
      {
		game: "4. Earthworm Jim",
		goals: [
	  {
		label: "Goal A",
		goal: "Beat Evil the Cat",
		additionalInfo: "Practice Mode",
		timeStart: "On selecting 'PRESS START' on the title screen",
		timeStartImage: "images/04 Earthworm Jim - Time Start.png",
		timeEnd: "When ninth cat angel appears",
		timeEndImage: "images/04 Earthworm Jim -  Goal A Time End.png"
	  },
      {
		label: "Goal B",
		goal: "Beat Tube Race",
		additionalInfo: "Practice Mode",
		timeStart: "On selecting 'PRESS START' on the title screen",
		timeStartImage: "images/04 Earthworm Jim - Time Start.png",
		timeEnd: "When Jim exits screen after completing 'DOWN THE TUBES' level",
		timeEndImage: "images/04 Earthworm Jim -  Goal B Time End.png"
       }
      ]
    },
      {
		game: "5. Phantasy Star IV",
		goals: [
	  {
		label: "Goal A",
		goal: "Find Alshline",
		additionalInfo: "You MUST do this goal if you do Goal A of Earthworm Jim",
		timeStart: "On selecting 'PRESS START BUTTON' on the title screen",
		timeStartImage: "images/05 Phantasy Star IV - Time Start.png",
		timeEnd: "When the text 'ALSHLINE is procured!' appears",
		timeEndImage: "images/05 Phantasy Star IV - Goal A Time End.png"
	  },
      {
		label: "Goal B",
		goal: "Find the Professor",
		additionalInfo: "You MUST do this goal if you do Goal B of Earthworm Jim",
		timeStart: "On selecting 'PRESS START BUTTON' on the title screen",
		timeStartImage: "images/05 Phantasy Star IV - Time Start.png",
		timeEnd: "On fade to black after interacting with the Professor",
		timeEndImage: "images/05 Phantasy Star IV - Goal B Time End.png"
       }
      ]
    },
      {
		game: "6. Alisia Dragoon",
		goals: [
	  {
		label: "Goal A",
		goal: "Beat Stage 4",
		additionalInfo: "Normal Mode",
		timeStart: "On selecting 'START' on the title screen",
		timeStartImage: "images/06 Alisia Dragoon - Time Start.png",
		timeEnd: "On fade out after stage 4",
		timeEndImage: "images/06 Alisia Dragoon - Goal A Time End.png"
	  },
      {
		label: "Goal B",
		goal: "Beat Stage 5",
		additionalInfo: "Normal Mode",
		timeStart: "On selecting 'START' on the title screen",
		timeStartImage: "images/06 Alisia Dragoon - Time Start.png",
		timeEnd: "On final hit on stage 5 tank boss",
		timeEndImage: "images/06 Alisia Dragoon - Goal B Time End.png"
       }
      ]
    },
      {
		game: "7. Tetris",
		goals: [
	  {
		label: "Goal A",
		goal: "Score 80 Lines",
		additionalInfo: "Default settings, normal game mode. You MUST do this goal if you do Goal A of Alisia Dragoon",
		timeStart: "On selecting level",
		timeStartImage: "images/07 Tetris - Time Start.png",
		timeEnd: "When you score 80 lines",
		timeEndImage: "images/07_Tetris_-_Goal_A_Time_End.png"
	  },
      {
		label: "Goal B",
		goal: "Score 50 Lines",
		additionalInfo: "Default settings, normal game mode. You MUST do this goal if you do Goal B of Alisia Dragoon",
		timeStart: "on selecting level",
		timeStartImage: "images/07 Tetris - Time Start.png",
		timeEnd: "When you score 50 lines",
		timeEndImage: "images/07 Tetris - Goal B Time End.png"
       }
      ]
    },
      {
        game: "8. Chiki Chiki Boys",
        goal: "Beat the Game",
        additionalInfo: " ",
        timeStart: "When pressing 'START' at level selection screen",
        timeStartImage: "images/08 Chiki Chiki Boys - Time Start.png",
        timeEnd: "Upon losing control of player control after the final boss",
        timeEndImage: "images/08 Chiki Chiki Boys - Time End.png"
      }
    ]
  }
};  

  const modeButtons = document.createElement("div");
  modeButtons.className = "sc-race-mode-buttons";

  const resultsModeButton = document.createElement("button");
  resultsModeButton.type = "button";
  resultsModeButton.className = "sc-race-mode-button active";
  resultsModeButton.textContent = "Race Results";

  const infoModeButton = document.createElement("button");
  infoModeButton.type = "button";
  infoModeButton.className = "sc-race-mode-button";
  infoModeButton.textContent = "Race Information";

  modeButtons.appendChild(resultsModeButton);
  modeButtons.appendChild(infoModeButton);

  controls.appendChild(modeButtons);

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

  const infoWrapper = document.createElement("div");
  infoWrapper.className = "sc-page-controls";
  infoWrapper.style.display = "none";

  const infoLabel = document.createElement("div");
  infoLabel.className = "sc-label";

  const infoDropdown = document.createElement("div");
  infoDropdown.className = "sc-dropdown";
  infoDropdown.id = "raceInfoDropdown";

  const infoTrigger = document.createElement("button");
  infoTrigger.type = "button";
  infoTrigger.className = "sc-dropdown-trigger";
  infoTrigger.setAttribute("aria-haspopup", "listbox");
  infoTrigger.setAttribute("aria-expanded", "false");
  infoTrigger.textContent = "Select a race";

  const infoMenu = document.createElement("div");
  infoMenu.className = "sc-dropdown-menu";
  infoMenu.setAttribute("role", "listbox");

  infoDropdown.appendChild(infoTrigger);
  infoDropdown.appendChild(infoMenu);

  infoWrapper.appendChild(infoLabel);
  infoWrapper.appendChild(infoDropdown);

  dropdown.appendChild(trigger);
  dropdown.appendChild(menu);

  wrapper.appendChild(label);
  wrapper.appendChild(dropdown);

  controls.appendChild(wrapper);
  controls.appendChild(infoWrapper);
  controls.appendChild(resultsWrap);

  const infoDefaultItem = document.createElement("button");
  infoDefaultItem.type = "button";
  infoDefaultItem.className = "sc-dropdown-item";
  infoDefaultItem.textContent = "Select a race";
  infoDefaultItem.dataset.value = "";

  infoDefaultItem.addEventListener("click", () => {
    infoTrigger.textContent = "Select a race";
    infoTrigger.dataset.value = "";

    infoDropdown.classList.remove("open");
    infoTrigger.setAttribute("aria-expanded", "false");

    clearResults();
  });

  infoMenu.appendChild(infoDefaultItem);

  Object.keys(RACE_INFORMATION).forEach(raceName => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "sc-dropdown-item";
    item.textContent = raceName;
    item.title = raceName;
    item.dataset.value = raceName;

    item.addEventListener("click", () => {
      infoTrigger.textContent = raceName;
      infoTrigger.dataset.value = raceName;

      infoDropdown.classList.remove("open");
      infoTrigger.setAttribute("aria-expanded", "false");

      renderRaceInformation(raceName);
    });

    infoMenu.appendChild(item);
  });

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
      item =>
        normalizeName(item.dataset.value || item.textContent) === selectedName
    );

    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "center" });
    }
  }

  function scrollRaceMatchIntoView(query) {
    const cleanQuery = normalizeName(query).toLowerCase();
    if (!cleanQuery) return;

    const match = [...menu.querySelectorAll(".sc-dropdown-item")].find(item => {
      const value = normalizeName(
        item.dataset.value || item.textContent
      ).toLowerCase();

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
    table.className =
      "sc-race-table sc-race-directory-table sc-race-goals-table";

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
    table.className =
      "sc-race-table sc-race-directory-table sc-race-results-table";

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
          videoId =
            parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
        } else if (parsed.pathname.startsWith("/shorts/")) {
          videoId =
            parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
        } else if (parsed.pathname.startsWith("/live/")) {
          videoId =
            parsed.pathname.split("/live/")[1]?.split("/")[0] || "";
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
    const videoRow = rowsForRace.find(row =>
      normalizeName(row.VIDEOURL)
    );

    if (!videoRow) return null;

    const embedUrl = getYouTubeEmbedUrl(
      videoRow.VIDEOURL,
      videoRow.TIMESTAMP
    );

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
    iframe.setAttribute(
      "referrerpolicy",
      "strict-origin-when-cross-origin"
    );

    videoWrap.appendChild(iframe);

    return videoWrap;
  }

  function renderRaceInformation(raceName) {
  clearResults();

  const race = RACE_INFORMATION[raceName];
  if (!race) return;

  const infoBlock = document.createElement("div");
  infoBlock.className = "sc-race-info-block";

  const title = document.createElement("h3");
  title.className = "sc-race-selected-title";
  title.textContent = race.title;

  infoBlock.appendChild(title);  

  if (race.date) {
  const date = document.createElement("div");
  date.className = "sc-race-info-line";

  date.innerHTML = `
    <span class="sc-race-info-label">Date:</span>
    <span>${escapeHtml(race.date)}</span>
  `;

  infoBlock.appendChild(date);
}


  const tabButtons = document.createElement("div");
  tabButtons.className = "sc-race-info-tab-buttons";

  const raceRulesButton = document.createElement("button");
  raceRulesButton.type = "button";
  raceRulesButton.className = "sc-race-info-tab-button active";
  raceRulesButton.textContent = "Race Rules";

  const detailedGoalsButton = document.createElement("button");
  detailedGoalsButton.type = "button";
  detailedGoalsButton.className = "sc-race-info-tab-button";
  detailedGoalsButton.textContent = "Detailed Goals";

  const pathMapButton = document.createElement("button");
  pathMapButton.type = "button";
  pathMapButton.className = "sc-race-info-tab-button";
  pathMapButton.textContent = "Path Map";
  
  const resourcesButton = document.createElement("button");
  resourcesButton.type = "button";
  resourcesButton.className = "sc-race-info-tab-button";
  resourcesButton.textContent = "Resources";

  tabButtons.appendChild(raceRulesButton);
  tabButtons.appendChild(detailedGoalsButton);
  tabButtons.appendChild(pathMapButton);
  tabButtons.appendChild(resourcesButton);

  infoBlock.appendChild(tabButtons);

  const content = document.createElement("div");
  content.className = "sc-race-info-content";

  infoBlock.appendChild(content);
  resultsWrap.appendChild(infoBlock);

  function setActiveTab(activeButton) {
    [
      raceRulesButton,
      detailedGoalsButton,
      pathMapButton,
      resourcesButton
    ].forEach(button => {
      button.classList.toggle("active", button === activeButton);
    });
  }
  
  function showResources() {
  setActiveTab(resourcesButton);
  content.innerHTML = "";

  const resources = race.resources || {};

  const resourcesWrap = document.createElement("div");
  resourcesWrap.className = "sc-race-resources";

  resourcesWrap.innerHTML = `
  <div class="sc-race-resource-line">
    <span class="sc-race-resource-label">ROM Pack:</span>

    ${
      resources.romPackUrl
        ? `
          <a
            href="${escapeHtml(resources.romPackUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            HERE
          </a>
        `
        : `<span>Not available</span>`
    }
  </div>

  <div class="sc-race-resource-line">
    <span class="sc-race-resource-label">Google Docs Time Sheet:</span>

    ${
      resources.timeSheetUrl
        ? `
          <a
            href="${escapeHtml(resources.timeSheetUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            HERE
          </a>
        `
        : `<span>Not available</span>`
    }
  </div>

  <div class="sc-race-resource-line">
    <span class="sc-race-resource-label">Game Reveal Stream:</span>

    ${
      resources.gameRevealUrl
        ? `
          <a
            href="${escapeHtml(resources.gameRevealUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            HERE
          </a>
        `
        : `<span>Not available</span>`
    }
  </div>

  <div class="sc-race-resource-line">
    <span class="sc-race-resource-label">Speedrun Archive:</span>

    ${
      resources.speedrunArchiveUrl
        ? `
          <a
            href="${escapeHtml(resources.speedrunArchiveUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            HERE
          </a>
        `
        : `<span>Not available</span>`
    }
  </div>
`;

  content.appendChild(resourcesWrap);
}

  function showRaceRules() {
    setActiveTab(raceRulesButton);
    content.innerHTML = "";

    if (!race.raceRulesImage) {
      const message = document.createElement("p");
      message.className = "sc-results-message";
      message.textContent = "No race rules image is available.";
      content.appendChild(message);
      return;
    }

    const imageWrap = document.createElement("div");
    imageWrap.className = "sc-race-rules-image-wrap";

    const image = document.createElement("img");
    image.className = "sc-race-rules-image";
    image.src = race.raceRulesImage;
    image.alt = `${race.title} Race Rules`;

    image.style.maxWidth = "100%";
    image.style.height = "auto";

    imageWrap.appendChild(image);
    content.appendChild(imageWrap);
  }

  function showDetailedGoals() {
  setActiveTab(detailedGoalsButton);
  content.innerHTML = "";

  const goals = race.detailedGoals || [];

  if (!goals.length) {
    const message = document.createElement("p");
    message.className = "sc-results-message";
    message.textContent = "No detailed goals are available.";
    content.appendChild(message);
    return;
  }

  const goalsWrap = document.createElement("div");
  goalsWrap.className = "sc-detailed-goals";

  goals.forEach(goalData => {
    const item = document.createElement("div");
    item.className = "sc-detailed-goal-item";

    const header = document.createElement("button");
    header.type = "button";
    header.className = "sc-detailed-goal-header";
    header.setAttribute("aria-expanded", "false");

    header.innerHTML = `
      <span>${escapeHtml(goalData.game)}</span>
      <span class="sc-detailed-goal-arrow"></span>
    `;

    const body = document.createElement("div");
    body.className = "sc-detailed-goal-body";

    let goalHtml = "";

    if (Array.isArray(goalData.goals) && goalData.goals.length) {
      goalHtml = goalData.goals.map(goalOption => {
        const additionalInfoHtml = goalOption.additionalInfo
          ? `
            <div class="sc-detailed-goal-line sc-detailed-goal-additional-info">
              <span class="sc-detailed-goal-label">
                Additional Information:
              </span>
              <span>
                ${escapeHtml(goalOption.additionalInfo)}
              </span>
            </div>
          `
          : "";

        return `
          <div class="sc-detailed-goal-option">

            <div class="sc-detailed-goal-option-title">
              ${escapeHtml(goalOption.label)}
            </div>

            <div class="sc-detailed-goal-summary">
              <div class="sc-detailed-goal-line">
                <span class="sc-detailed-goal-label">
                  Goal:
                </span>

                <span>
                  ${escapeHtml(goalOption.goal || "")}
                </span>
              </div>

              ${additionalInfoHtml}
            </div>

            <div class="sc-detailed-goal-timing">

              <div class="sc-detailed-goal-timing-column">

                <div class="sc-detailed-goal-timing-title">
                  Time Start
                </div>

                <div class="sc-detailed-goal-timing-text">
                  ${escapeHtml(goalOption.timeStart || "")}
                </div>

                ${
                  goalOption.timeStartImage
                    ? `
                      <img
                        class="sc-detailed-goal-image"
                        src="${escapeHtml(goalOption.timeStartImage)}"
                        alt="${escapeHtml(goalData.game)} ${escapeHtml(goalOption.label)} timer start"
                      >
                    `
                    : ""
                }

              </div>

              <div class="sc-detailed-goal-timing-column">

                <div class="sc-detailed-goal-timing-title">
                  Time End
                </div>

                <div class="sc-detailed-goal-timing-text">
                  ${escapeHtml(goalOption.timeEnd || "")}
                </div>

                ${
                  goalOption.timeEndImage
                    ? `
                      <img
                        class="sc-detailed-goal-image"
                        src="${escapeHtml(goalOption.timeEndImage)}"
                        alt="${escapeHtml(goalData.game)} ${escapeHtml(goalOption.label)} timer end"
                      >
                    `
                    : ""
                }

              </div>

            </div>

          </div>
        `;
      }).join("");

    } else {
      const additionalInfoHtml = goalData.additionalInfo
        ? `
          <div class="sc-detailed-goal-line sc-detailed-goal-additional-info">
            <span class="sc-detailed-goal-label">
              Additional Information:
            </span>

            <span>
              ${escapeHtml(goalData.additionalInfo)}
            </span>
          </div>
        `
        : "";

      goalHtml = `
        <div class="sc-detailed-goal-option">

          <div class="sc-detailed-goal-summary">

            <div class="sc-detailed-goal-line">
              <span class="sc-detailed-goal-label">
                Goal:
              </span>

              <span>
                ${escapeHtml(goalData.goal || "")}
              </span>
            </div>

            ${additionalInfoHtml}

          </div>

          <div class="sc-detailed-goal-timing">

            <div class="sc-detailed-goal-timing-column">

              <div class="sc-detailed-goal-timing-title">
                Time Start
              </div>

              <div class="sc-detailed-goal-timing-text">
                ${escapeHtml(goalData.timeStart || "")}
              </div>

              ${
                goalData.timeStartImage
                  ? `
                    <img
                      class="sc-detailed-goal-image"
                      src="${escapeHtml(goalData.timeStartImage)}"
                      alt="${escapeHtml(goalData.game)} timer start"
                    >
                  `
                  : ""
              }

            </div>

            <div class="sc-detailed-goal-timing-column">

              <div class="sc-detailed-goal-timing-title">
                Time End
              </div>

              <div class="sc-detailed-goal-timing-text">
                ${escapeHtml(goalData.timeEnd || "")}
              </div>

              ${
                goalData.timeEndImage
                  ? `
                    <img
                      class="sc-detailed-goal-image"
                      src="${escapeHtml(goalData.timeEndImage)}"
                      alt="${escapeHtml(goalData.game)} timer end"
                    >
                  `
                  : ""
              }

            </div>

          </div>

        </div>
      `;
    }

    body.innerHTML = goalHtml;

    header.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      item.classList.toggle("open", !isOpen);
      header.setAttribute("aria-expanded", String(!isOpen));
    });

    item.appendChild(header);
    item.appendChild(body);
    goalsWrap.appendChild(item);
  });

  content.appendChild(goalsWrap);
}

  function showPathMap() {
  setActiveTab(pathMapButton);
  content.innerHTML = "";

  if (!race.pathMapImage) {
    const message = document.createElement("p");
    message.className = "sc-results-message";
    message.textContent = "No path map image is available.";
    content.appendChild(message);
    return;
  }

  const imageWrap = document.createElement("div");
  imageWrap.className = "sc-race-path-map-wrap";

  const image = document.createElement("img");
  image.className = "sc-race-path-map-image";
  image.src = race.pathMapImage;
  image.alt = `${race.title} Path Map`;

  imageWrap.appendChild(image);
  content.appendChild(imageWrap);
}

  raceRulesButton.addEventListener("click", showRaceRules);
  detailedGoalsButton.addEventListener("click", showDetailedGoals);
  pathMapButton.addEventListener("click", showPathMap);
  resourcesButton.addEventListener("click", showResources);

  showRaceRules();
}

  function buildRaceInfoBlock(raceName, rowsForRace) {
    const infoRow =
      rowsForRace.find(
        row => normalizeName(row.EVENT) === raceName
      ) || rowsForRace[0];

    const date = normalizeName(infoRow.DATE);
    const commentaryNames = getNamesFromColumns(
      infoRow,
      "COMMENTARY",
      6
    );
    const commentaryLinksHtml =
      buildTwitchLinksHtml(commentaryNames);

    const officialResultsUrl =
      normalizeName(infoRow.OFFICIALRESULTS);

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
          <a
            class="sc-race-official-results"
            href="${escapeHtml(officialResultsUrl)}"
            target="_blank"
            rel="noopener noreferrer"
          >
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

    const raceInfoBlock =
      buildRaceInfoBlock(raceName, rowsForRace);

    resultsWrap.appendChild(raceInfoBlock);

    const tablesWrap = document.createElement("div");
    tablesWrap.className =
      "sc-race-directory-tables-wrap";

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

  function showRaceResultsMode() {
    resultsModeButton.classList.add("active");
    infoModeButton.classList.remove("active");

    wrapper.style.display = "";
    infoWrapper.style.display = "none";

    infoDropdown.classList.remove("open");
    infoTrigger.setAttribute("aria-expanded", "false");

    clearResults();

    const selectedRace =
      normalizeName(trigger.dataset.value);

    if (selectedRace) {
      renderRaceTables(selectedRace);
    }
  }

  function showRaceInformationMode() {
    resultsModeButton.classList.remove("active");
    infoModeButton.classList.add("active");

    wrapper.style.display = "none";
    infoWrapper.style.display = "";

    closeMenu();
    clearResults();

    const selectedRace =
      normalizeName(infoTrigger.dataset.value);

    if (selectedRace) {
      renderRaceInformation(selectedRace);
    }
  }

  resultsModeButton.addEventListener(
    "click",
    showRaceResultsMode
  );

  infoModeButton.addEventListener(
    "click",
    showRaceInformationMode
  );

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

  infoTrigger.addEventListener("click", (e) => {
    e.stopPropagation();

    const isOpen =
      infoDropdown.classList.contains("open");

    closeMenu();

    if (isOpen) {
      infoDropdown.classList.remove("open");
      infoTrigger.setAttribute("aria-expanded", "false");
    } else {
      infoDropdown.classList.add("open");
      infoTrigger.setAttribute("aria-expanded", "true");
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      closeMenu();
    }

    if (!infoDropdown.contains(e.target)) {
      infoDropdown.classList.remove("open");
      infoTrigger.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();

      infoDropdown.classList.remove("open");
      infoTrigger.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!dropdown.classList.contains("open")) return;
    if (e.key === "Escape") return;
    if (
      e.key.length !== 1 ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) return;

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

      const defaultItem =
        document.createElement("button");

      defaultItem.type = "button";
      defaultItem.className = "sc-dropdown-item";
      defaultItem.textContent = "Select a race";
      defaultItem.dataset.value = "Select a race";

      defaultItem.addEventListener(
        "click",
        () => setSelected("")
      );

      menu.appendChild(defaultItem);

      uniqueRaces.forEach(raceName => {
        const item = document.createElement("button");

        item.type = "button";
        item.className = "sc-dropdown-item";
        item.textContent = raceName;
        item.title = raceName;
        item.dataset.value = raceName;

        item.addEventListener(
          "click",
          () => setSelected(raceName)
        );

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
