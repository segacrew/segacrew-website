document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("other-events-content");
  if (!content) return;

  const IS_LOCAL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  const RGL_CSV_URL = IS_LOCAL
    ? "RGL TOP 10 - RGL.csv"
    : "RGL TOP 10 - RGL.csv";

  let rglRows = [];
  let currentCountdownRows = [];
  let currentCountdownIndex = -1;

  injectOtherEventsStyles();
  createRunModal();
  
  const MANUAL_EVENTS = [
  {
    id: "sega-jeopardy-1",
    label: "Sega Jeopardy! Episode 1",
    type: "jeopardy",
    title: "Sega Jeopardy! Episode 1",
    videoUrl: "https://www.youtube.com/watch?v=pLf6xb4B3hk",
    scores: [
      { runner: "NoDiggity1", score: "$2500" },
      { runner: "ZeeGee_", score: "$400" },
      { runner: "Arnaud33200", score: "$-1000" }
    ]
  },
  {
    id: "sega-jeopardy-2",
    label: "Sega Jeopardy! Episode 2",
    type: "jeopardy",
    title: "Sega Jeopardy! Episode 2",
    videoUrl: "https://www.youtube.com/watch?v=riMpjc3k-Fk",
    scores: [
      { runner: "NoDiggity1", score: "$2700" },
      { runner: "Shimegabriel", score: "$1400" },
      { runner: "Shannaberryblast", score: "$500" }
    ]
  },
  {
    id: "sega-jeopardy-3",
    label: "Sega Jeopardy! Episode 3",
    type: "jeopardy",
    title: "Sega Jeopardy! Episode 3",
    videoUrl: "https://www.youtube.com/watch?v=RC9lYfOmzlY",
    scores: [
      { runner: "Squilibob", score: "$4801" },
      { runner: "Faust4712", score: "$4800" },
      { runner: "GnarBlast", score: "$3200" }
    ]
  },
  {
    id: "sega-jeopardy-4",
    label: "Sega Jeopardy! Episode 4 (Championship)",
    type: "jeopardy",
    title: "Sega Jeopardy! Episode 4 (Championship)",
    videoUrl: "https://www.youtube.com/watch?v=jqQ5jZjPktc",
    scores: [
      { runner: "Shimegabriel", score: "$10600" },
      { runner: "Squilibob", score: "$6733" },
      { runner: "NoDiggity1", score: "$0" }
    ]
  },
  {
    id: "podcast-1",
    label: "The Sega Crew Podcast: Episode 1",
    type: "podcast",
    title: "The Sega Crew Podcast: Episode 1",
    videoUrl: "https://www.youtube.com/watch?v=4pAXOug4X8c"
  },
  {
    id: "podcast-2",
    label: "The Sega Crew Podcast: Episode 2",
    type: "podcast",
    title: "The Sega Crew Podcast: Episode 2",
    videoUrl: "https://www.youtube.com/watch?v=I4_62qdwKx8"
  }
];



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

  function loadCsv(url) {
    return new Promise((resolve, reject) => {
      Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: results => resolve(results.data || []),
        error: reject
      });
    });
  }

  function getField(row, possibleNames) {
    for (const name of possibleNames) {
      if (Object.prototype.hasOwnProperty.call(row, name)) {
        const value = normalizeName(row[name]);
        if (value) return value;
      }
    }

    return "";
  }

  function getYear(row) {
    return getField(row, ["YEAR", "Year", "year"]);
  }

  function getRank(row) {
    return getField(row, ["RANK", "Rank", "rank", "PLACE", "Place", "place", "POSITION", "Position", "position"]);
  }

  function getGame(row) {
    return getField(row, ["GAME", "Game", "game"]);
  }

  function getCategory(row) {
    return getField(row, ["CATEGORY", "Category", "category"]);
  }

  function getRunnerNames(row) {
    const runners = [];

    for (let i = 1; i <= 2; i++) {
      const runner = normalizeName(row[`RUNNER${i}`]);
      if (runner) runners.push(runner);
    }

    return runners;
  }

  function getCommentaryNames(row) {
    const commentators = [];

    for (let i = 1; i <= 2; i++) {
      const commentator = normalizeName(row[`COMMENTARY${i}`]);
      if (commentator) commentators.push(commentator);
    }

    return commentators;
  }

  function buildTwitchLinks(names) {
    if (!names.length) return "—";

    return names.map(name => {
      const safeUrlName = encodeURIComponent(name);
      return `<a href="https://twitch.tv/${safeUrlName}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>`;
    }).join(" / ");
  }

  function buildGameButton(row, index) {
    const game = getGame(row) || "—";
    const hasVideo =
      normalizeName(row.VIDEOURL) ||
      normalizeName(row.VIDEOURL2);

    if (!hasVideo) {
      return escapeHtml(game);
    }

    return `<button type="button" class="sc-other-event-link" data-run-index="${index}">${escapeHtml(game)}</button>`;
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
      const match = raw.match(
        /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/
      );

      if (!match) return "";

      const startSeconds = parseTimestampToSeconds(timestamp);
      const embedUrl = new URL(`https://www.youtube.com/embed/${match[1]}`);

      if (startSeconds > 0) {
        embedUrl.searchParams.set("start", String(startSeconds));
      }

      return embedUrl.toString();
    }
  }

  function getCountdownYears(rows) {
    const years = new Set();

    rows.forEach(row => {
      const year = getYear(row);
      if (year) years.add(year);
    });

    return [...years].sort((a, b) => Number(a) - Number(b));
  }

  function getRowsForYear(year) {
    const rows = rglRows.filter(row => getYear(row) === year);

    return rows.sort((a, b) => {
      const rankA = parseInt(getRank(a), 10);
      const rankB = parseInt(getRank(b), 10);

      if (!Number.isNaN(rankA) && !Number.isNaN(rankB)) {
        return rankA - rankB;
      }

      return rglRows.indexOf(a) - rglRows.indexOf(b);
    });
  }
  
  function buildExpandedRglRows(rows) {
  let currentContext = {
    YEAR: "",
    EVENT: ""
  };

  return rows.map(row => {
    const year = getYear(row);
    const event = getField(row, ["EVENT", "Event", "event"]);

    if (year) currentContext.YEAR = year;
    if (event) currentContext.EVENT = event;

    return {
      ...row,
      YEAR: year || currentContext.YEAR,
      EVENT: event || currentContext.EVENT
    };
  });
}

  function buildCountdownDropdown(years) {
    const controls = document.createElement("div");
    controls.className = "sc-other-events-controls";

    const dropdown = document.createElement("div");
    dropdown.className = "sc-dropdown sc-other-events-dropdown";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "sc-dropdown-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.textContent = "Select An Event";

    const menu = document.createElement("div");
    menu.className = "sc-dropdown-menu";
    menu.setAttribute("role", "listbox");

    function closeMenu() {
      dropdown.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
      dropdown.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    }

    years.forEach(year => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "sc-dropdown-item";
      item.dataset.value = year;
      item.textContent = `Sega Sunday Countdown - The Top 10 Sega Genesis Games of ${year}`;

      item.addEventListener("click", () => {
        trigger.textContent = item.textContent;
        trigger.dataset.value = year;
        closeMenu();
        renderCountdown(year);
      });

      menu.appendChild(item);
    });
    
    MANUAL_EVENTS.forEach(eventData => {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "sc-dropdown-item";
  item.dataset.value = eventData.id;
  item.textContent = eventData.label;

  item.addEventListener("click", () => {
    trigger.textContent = eventData.label;
    trigger.dataset.value = eventData.id;
    closeMenu();

    if (eventData.type === "jeopardy") {
      renderSegaJeopardyEvent(eventData);
    } else if (eventData.type === "podcast") {
      renderPodcastEvent(eventData);
    }
  });

  menu.appendChild(item);
});

    trigger.addEventListener("click", e => {
      e.stopPropagation();

      if (dropdown.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener("click", e => {
      if (!dropdown.contains(e.target)) {
        closeMenu();
      }
    });

    dropdown.appendChild(trigger);
    dropdown.appendChild(menu);
    controls.appendChild(dropdown);

    return controls;
  }
  
  function renderSegaJeopardyEvent(eventData) {
  const existing = content.querySelector(".sc-other-events-results");
  if (existing) existing.remove();

  currentCountdownRows = [];
  currentCountdownIndex = -1;

  const results = document.createElement("div");
  results.className = "sc-other-events-results";

  const tableBox = document.createElement("div");
  tableBox.className = "sc-other-events-table-box sc-jeopardy-table-box";

  const title = document.createElement("div");
  title.className = "sc-other-events-table-title";
  title.textContent = eventData.title;

  const tableWrap = document.createElement("div");
  tableWrap.className = "sc-other-events-table-wrap";

  const table = document.createElement("table");
  table.className = "sc-other-events-table sc-jeopardy-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>RUNNER</th>
      <th>SCORE</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  const visibleScores = eventData.scores.filter(item =>
    normalizeName(item.runner) || normalizeName(item.score)
  );

  if (!visibleScores.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="2">Scores to be added.</td>`;
    tbody.appendChild(tr);
  } else {
    visibleScores.forEach(item => {
      const runner = normalizeName(item.runner);
      const score = normalizeName(item.score);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${runner ? buildTwitchLinks([runner]) : "—"}</td>
        <td>${escapeHtml(score || "—")}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  tableBox.appendChild(title);
  tableBox.appendChild(tableWrap);
  results.appendChild(tableBox);

  const embedUrl = getYouTubeEmbedUrl(eventData.videoUrl, "");

  const videoBox = document.createElement("div");
  videoBox.className = "sc-manual-event-video-box";

  if (embedUrl) {
    const iframe = document.createElement("iframe");
    iframe.className = "sc-manual-event-video";
    iframe.src = embedUrl;
    iframe.title = eventData.title;
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

    videoBox.appendChild(iframe);
  } else {
    const msg = document.createElement("p");
    msg.className = "sc-results-message";
    msg.textContent = "Video embed to be added.";
    videoBox.appendChild(msg);
  }

  results.appendChild(videoBox);
  content.appendChild(results);
}

function renderPodcastEvent(eventData) {
  const existing = content.querySelector(".sc-other-events-results");
  if (existing) existing.remove();

  currentCountdownRows = [];
  currentCountdownIndex = -1;

  const results = document.createElement("div");
  results.className = "sc-other-events-results";

  const title = document.createElement("div");
  title.className = "sc-other-events-table-title sc-podcast-title";
  title.textContent = eventData.title;

  const embedUrl = getYouTubeEmbedUrl(eventData.videoUrl, "");

  const videoBox = document.createElement("div");
  videoBox.className = "sc-manual-event-video-box";

  if (embedUrl) {
    const iframe = document.createElement("iframe");
    iframe.className = "sc-manual-event-video";
    iframe.src = embedUrl;
    iframe.title = eventData.title;
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

    videoBox.appendChild(iframe);
  } else {
    const msg = document.createElement("p");
    msg.className = "sc-results-message";
    msg.textContent = "Video embed to be added.";
    videoBox.appendChild(msg);
  }

  results.appendChild(title);
  results.appendChild(videoBox);
  content.appendChild(results);
}

  function renderCountdown(year) {
    const rows = getRowsForYear(year);
    currentCountdownRows = rows;
    currentCountdownIndex = -1;

    const existing = content.querySelector(".sc-other-events-results");
    if (existing) existing.remove();

    const results = document.createElement("div");
    results.className = "sc-other-events-results";

    const tableBox = document.createElement("div");
    tableBox.className = "sc-other-events-table-box";

    const title = document.createElement("div");
    title.className = "sc-other-events-table-title";
    title.textContent = `Sega Sunday Countdown - The Top 10 Sega Genesis Games of ${year}`;

    const tableWrap = document.createElement("div");
    tableWrap.className = "sc-other-events-table-wrap";

    const table = document.createElement("table");
    table.className = "sc-other-events-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>RANK</th>
        <th>GAME</th>
        <th>RUNNER(S)</th>
        <th>COMMENTARY</th>
      </tr>
    `;

    const tbody = document.createElement("tbody");

    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4">No countdown data found.</td>`;
      tbody.appendChild(tr);
    } else {
      rows.forEach((row, index) => {
        const rank = getRank(row) || String(index + 1);
        const runners = getRunnerNames(row);

        const tr = document.createElement("tr");
        const commentary = getCommentaryNames(row);

tr.innerHTML = `
  <td>${escapeHtml(rank)}</td>
  <td>${buildGameButton(row, index)}</td>
  <td>${buildTwitchLinks(runners)}</td>
  <td>${buildTwitchLinks(commentary)}</td>
`;

        const gameButton = tr.querySelector(".sc-other-event-link");
        if (gameButton) {
          gameButton.addEventListener("click", () => {
            currentCountdownIndex = index;
            openRunModal(row);
          });
        }

        tbody.appendChild(tr);
      });
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    tableBox.appendChild(title);
    tableBox.appendChild(tableWrap);
    results.appendChild(tableBox);
    content.appendChild(results);
  }

  function createRunModal() {
    if (document.getElementById("otherEventsModal")) return;

    const modal = document.createElement("div");
    modal.className = "sc-modal";
    modal.id = "otherEventsModal";

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

    const closeBtn = modal.querySelector(".sc-modal-close");
    const prevBtn = modal.querySelector(".sc-modal-prev");
    const nextBtn = modal.querySelector(".sc-modal-next");

    closeBtn.addEventListener("click", closeRunModal);

    modal.addEventListener("click", e => {
      if (e.target === modal) {
        closeRunModal();
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        closeRunModal();
      }
    });

    prevBtn.addEventListener("click", () => {
      if (currentCountdownIndex > 0) {
        currentCountdownIndex--;
        openRunModal(currentCountdownRows[currentCountdownIndex]);
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentCountdownIndex < currentCountdownRows.length - 1) {
        currentCountdownIndex++;
        openRunModal(currentCountdownRows[currentCountdownIndex]);
      }
    });
  }

  function closeRunModal() {
    const modal = document.getElementById("otherEventsModal");
    if (!modal) return;

    const modalBody = modal.querySelector("#scModalBody");

    modal.classList.remove("open");
    if (modalBody) modalBody.innerHTML = "";
    document.body.style.overflow = "";
  }

  function openRunModal(row) {
    const modal = document.getElementById("otherEventsModal");
    if (!modal) return;

    const modalTitle = modal.querySelector("#scModalTitle");
    const modalSubtitle = modal.querySelector("#scModalSubtitle");
    const modalBody = modal.querySelector("#scModalBody");
    const prevBtn = modal.querySelector(".sc-modal-prev");
    const nextBtn = modal.querySelector(".sc-modal-next");

    const game = getGame(row) || "Untitled Run";
    const category = getCategory(row);
    const runners = getRunnerNames(row);
    const commentators = getCommentaryNames(row);

    const embedUrl = getYouTubeEmbedUrl(row.VIDEOURL, row.TIMESTAMP);
    const embedUrl2 = getYouTubeEmbedUrl(row.VIDEOURL2, row.TIMESTAMP2);

    modalTitle.textContent = game;

    modalSubtitle.innerHTML = `
      ${category ? `<div class="sc-modal-event">${escapeHtml(category)}</div>` : ""}
      ${runners.length ? `<div class="sc-modal-meta-line">Runner(s): ${buildTwitchLinks(runners)}</div>` : ""}
      ${commentators.length ? `<div class="sc-modal-meta-line sc-modal-commentary">Commentary: ${buildTwitchLinks(commentators)}</div>` : ""}
    `;

    modalBody.innerHTML = "";

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

    prevBtn.disabled = currentCountdownIndex <= 0;
    nextBtn.disabled = currentCountdownIndex >= currentCountdownRows.length - 1;
  }

  function renderOtherEventsPage(rows) {
    rglRows = buildExpandedRglRows(rows);

    const years = getCountdownYears(rglRows);

    content.innerHTML = "";

    if (!years.length) {
      content.innerHTML = `<p class="sc-results-message">No RGL countdown data found.</p>`;
      return;
    }

    content.appendChild(buildCountdownDropdown(years));
  }

  function injectOtherEventsStyles() {
    if (document.getElementById("sc-other-events-styles")) return;

    const style = document.createElement("style");
    style.id = "sc-other-events-styles";
    style.textContent = `
      .sc-other-events-controls{
        display:flex;
        justify-content:center;
        margin:24px auto 28px;
      }

      .sc-other-events-dropdown{
        position:relative;
        width:100%;
        max-width:620px;
      }

      .sc-dropdown-trigger{
        width:100%;
        padding:13px 44px 13px 16px;
        border:1px solid #c9d8ec;
        border-radius:14px;
        background:#ffffff;
        color:var(--text);
        font-size:1rem;
        font-family:Arial, Helvetica, sans-serif;
        font-weight:600;
        text-align:left;
        box-shadow:0 6px 18px rgba(0,0,0,0.06);
        outline:none;
        cursor:pointer;
        transition:border-color 0.2s ease, box-shadow 0.2s ease;
        position:relative;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .sc-dropdown-trigger::after{
        content:"";
        position:absolute;
        right:14px;
        top:50%;
        width:10px;
        height:10px;
        border-right:2px solid var(--sega-blue);
        border-bottom:2px solid var(--sega-blue);
        transform:translateY(-65%) rotate(45deg);
        transition:transform 0.2s ease;
      }

      .sc-dropdown.open .sc-dropdown-trigger::after{
        transform:translateY(-35%) rotate(-135deg);
      }

      .sc-dropdown-menu{
        position:absolute;
        top:calc(100% + 8px);
        left:0;
        width:100%;
        max-height:320px;
        overflow-y:auto;
        background:#fff;
        border:1px solid #c9d8ec;
        border-radius:14px;
        box-shadow:0 12px 28px rgba(0,0,0,0.12);
        padding:8px;
        z-index:2000;
        display:none;
      }

      .sc-dropdown.open .sc-dropdown-menu{
        display:block;
      }

      .sc-dropdown-item{
        width:100%;
        border:none;
        background:transparent;
        padding:11px 12px;
        border-radius:10px;
        text-align:left;
        font-size:0.97rem;
        font-family:Arial, Helvetica, sans-serif;
        color:var(--text);
        cursor:pointer;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }

      .sc-dropdown-item:hover{
        background:#eef4ff;
        color:var(--sega-blue-dark);
      }

      .sc-other-events-results{
        margin-top:24px;
      }

      .sc-other-events-table-box{
        width:100%;
        max-width:980px;
        margin:0 auto;
        background:#fff;
        border:1px solid var(--border);
        border-radius:18px;
        box-shadow:0 10px 30px rgba(0,0,0,0.08);
        overflow:hidden;
        text-align:left;
      }

      .sc-other-events-table-title{
        background:var(--sega-blue-dark);
        color:#fff;
        font-weight:800;
        letter-spacing:0.3px;
        text-align:center;
        padding:13px 16px;
        text-transform:uppercase;
        line-height:1.25;
      }

      .sc-other-events-table-wrap{
        width:100%;
        overflow-x:auto;
      }

      .sc-other-events-table{
        width:100%;
        border-collapse:collapse;
        min-width:760px;
      }

      .sc-other-events-table thead{
        background:#eef4ff;
      }

      .sc-other-events-table th{
        color:var(--sega-blue-dark);
        font-weight:800;
        letter-spacing:0.25px;
      }

      .sc-other-events-table th,
      .sc-other-events-table td{
        padding:12px 14px;
        text-align:left;
        border-bottom:1px solid #e7edf5;
        font-size:0.95rem;
        line-height:1.35;
        vertical-align:top;
      }

      .sc-other-events-table tbody tr:hover{
        background:#f8fbff;
      }

      .sc-other-events-table a,
      .sc-modal-subtitle a{
        color:var(--sega-blue);
        text-decoration:none;
        font-weight:700;
      }

      .sc-other-events-table a:hover,
      .sc-modal-subtitle a:hover{
        color:var(--sega-blue-dark);
        text-decoration:underline;
      }

      .sc-other-event-link{
        background:none;
        border:none;
        padding:0;
        margin:0;
        color:var(--sega-blue);
        font:inherit;
        font-weight:700;
        text-align:left;
        cursor:pointer;
        text-decoration:none;
      }

      .sc-other-event-link:hover{
        color:var(--sega-blue-dark);
        text-decoration:underline;
      }

      .sc-modal{
        position:fixed;
        inset:0;
        background:rgba(10,18,30,0.7);
        display:none;
        align-items:center;
        justify-content:center;
        padding:24px;
        z-index:5000;
      }

      .sc-modal.open{
        display:flex;
      }

      .sc-modal-content{
        width:min(900px, 100%);
        max-height:90vh;
        overflow-y:auto;
        background:#fff;
        border-radius:18px;
        box-shadow:0 20px 60px rgba(0,0,0,0.25);
        position:relative;
        padding:28px;
        text-align:left;
      }

      .sc-modal-close{
        position:absolute;
        top:14px;
        right:14px;
        width:40px;
        height:40px;
        border:none;
        border-radius:999px;
        background:#eef4ff;
        color:var(--sega-blue-dark);
        font-size:1.4rem;
        line-height:1;
        cursor:pointer;
        font-weight:700;
      }

      .sc-modal-nav{
        display:flex;
        justify-content:space-between;
        margin-bottom:12px;
      }

      .sc-modal-nav button{
        background:#eef4ff;
        border:1px solid #cfe0ff;
        color:var(--sega-blue-dark);
        font-weight:700;
        padding:8px 14px;
        border-radius:10px;
        cursor:pointer;
      }

      .sc-modal-nav button:disabled{
        opacity:0.4;
        cursor:default;
      }

      .sc-modal-title{
        margin:0 40px 8px 0;
        font-size:1.8rem;
        color:var(--sega-blue-dark);
        line-height:1.15;
      }

      .sc-modal-subtitle{
        margin:0 0 18px;
        color:var(--muted);
        font-size:1rem;
        line-height:1.6;
      }

      .sc-modal-event{
        font-size:1.15rem;
        font-weight:700;
        color:var(--sega-blue-dark);
        margin-bottom:6px;
      }

      .sc-modal-meta-line + .sc-modal-meta-line{
        margin-top:4px;
      }

      .sc-modal-video{
        width:100%;
        aspect-ratio:16 / 9;
        border:none;
        border-radius:14px;
        background:#000;
        display:block;
      }

      .sc-modal-video + .sc-modal-video{
        margin-top:16px;
      }

      .sc-modal-message{
        margin:16px 0 0;
        color:var(--muted);
      }
      
      .sc-manual-event-video-box{
  width:100%;
  max-width:980px;
  margin:20px auto 0;
  background:#fff;
  border:1px solid var(--border);
  border-radius:18px;
  box-shadow:0 10px 30px rgba(0,0,0,0.08);
  padding:18px;
}

.sc-manual-event-video{
  width:100%;
  aspect-ratio:16 / 9;
  border:none;
  border-radius:14px;
  background:#000;
  display:block;
}

.sc-manual-event-body{
  padding:22px;
}

.sc-jeopardy-table-box{
  max-width:520px;
}

.sc-jeopardy-table{
  min-width:0;
}

.sc-jeopardy-table th,
.sc-jeopardy-table td{
  text-align:center;
}

.sc-jeopardy-table td:first-child,
.sc-jeopardy-table th:first-child{
  text-align:left;
}

.sc-podcast-title{
  max-width:980px;
  margin:0 auto 20px;
  border-radius:18px;
}

      @media (max-width: 900px){
        .sc-other-events-dropdown{
          max-width:100%;
        }

        .sc-dropdown-trigger{
          font-size:0.95rem;
        }

        .sc-other-events-table{
          min-width:760px;
        }

        .sc-modal-content{
          padding:22px;
        }

        .sc-modal-title{
          font-size:1.45rem;
        }
      }
    `;

    document.head.appendChild(style);
  }

  content.innerHTML = `<p class="sc-results-message">Loading other event data...</p>`;

  loadCsv(RGL_CSV_URL)
    .then(rows => {
      renderOtherEventsPage(rows);
    })
    .catch(err => {
      console.error("RGL countdown CSV load error:", err);
      content.innerHTML = `<p class="sc-results-message">Could not load other event data.</p>`;
    });
});
