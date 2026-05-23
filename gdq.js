document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("gdq-content");
  if (!content) return;

  const IS_LOCAL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  const GDQ_CSV_URL = IS_LOCAL
    ? "GDQ - MASTER.csv"
    : "GDQ - MASTER.csv";

  injectGdqStyles();

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

  function normalizeKey(value) {
    return normalizeName(value).toLowerCase();
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

  function getRunnerNames(row) {
    const runners = [];

    for (let i = 1; i <= 4; i++) {
      const runner = normalizeName(row[`RUNNER${i}`]);
      if (runner) runners.push(runner);
    }

    return runners;
  }

  function buildRunnerLinks(runners) {
    if (!runners.length) return "—";

    return runners.map(runner => {
      const safeUrlName = encodeURIComponent(runner);
      return `<a href="https://twitch.tv/${safeUrlName}" target="_blank" rel="noopener noreferrer">${escapeHtml(runner)}</a>`;
    }).join(" / ");
  }

  function buildGameLink(row) {
    const game = normalizeName(row.GAME);
    const videoUrl = normalizeName(row.VIDEOURL);

    if (!game) return "—";

    if (!videoUrl) {
      return escapeHtml(game);
    }

    return `<a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(game)}</a>`;
  }

  function buildGdqEventGroups(rows) {
    const groups = [];
    let currentEvent = "";
    let currentGroup = null;

    rows.forEach(row => {
      const eventName = normalizeName(row.EVENT);

      if (eventName) {
        currentEvent = eventName;

        currentGroup = {
          event: currentEvent,
          runs: []
        };

        groups.push(currentGroup);
      }

      if (!currentGroup && currentEvent) {
        currentGroup = {
          event: currentEvent,
          runs: []
        };

        groups.push(currentGroup);
      }

      if (!currentGroup) return;

      const game = normalizeName(row.GAME);
      const category = normalizeName(row.CATEGORY);
      const videoUrl = normalizeName(row.VIDEOURL);
      const runners = getRunnerNames(row);

      if (!game && !category && !videoUrl && !runners.length) return;

      currentGroup.runs.push({
        ...row,
        EVENT: currentEvent
      });
    });

    return groups.filter(group => group.event && group.runs.length);
  }

  function getGdqType(eventName) {
    const cleanEvent = normalizeKey(eventName);

    if (cleanEvent.includes("awesome games")) {
      return "awesome";
    }

    if (cleanEvent.includes("summer games")) {
      return "summer";
    }

    return "other";
  }

  function buildEventTable(group) {
    const tableBox = document.createElement("div");
    tableBox.className = "sc-gdq-event-table-box";

    const title = document.createElement("div");
    title.className = "sc-gdq-event-title";
    title.textContent = group.event;

    const tableWrap = document.createElement("div");
    tableWrap.className = "sc-gdq-table-wrap";

    const table = document.createElement("table");
    table.className = "sc-gdq-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>GAME</th>
        <th>RUNNER(S)</th>
        <th>CATEGORY</th>
      </tr>
    `;

    const tbody = document.createElement("tbody");

    group.runs.forEach(row => {
      const tr = document.createElement("tr");
      const runners = getRunnerNames(row);

      tr.innerHTML = `
        <td>${buildGameLink(row)}</td>
        <td>${buildRunnerLinks(runners)}</td>
        <td>${escapeHtml(normalizeName(row.CATEGORY) || "—")}</td>
      `;

      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    tableBox.appendChild(title);
    tableBox.appendChild(tableWrap);

    return tableBox;
  }

  function renderGdqTables(rows) {
  const groups = buildGdqEventGroups(rows).reverse();

  const awesomeGroups = groups.filter(group => getGdqType(group.event) === "awesome");
  const summerGroups = groups.filter(group => getGdqType(group.event) === "summer");
  const otherGroups = groups.filter(group => getGdqType(group.event) === "other");

  content.innerHTML = "";

  const layout = document.createElement("div");
  layout.className = "sc-gdq-paired-layout";

  const headerRow = document.createElement("div");
  headerRow.className = "sc-gdq-paired-row sc-gdq-paired-header-row";

  const awesomeTitle = document.createElement("h3");
  awesomeTitle.className = "sc-gdq-column-title";

  const summerTitle = document.createElement("h3");
  summerTitle.className = "sc-gdq-column-title";

  headerRow.appendChild(awesomeTitle);
  headerRow.appendChild(summerTitle);
  layout.appendChild(headerRow);

  const maxLength = Math.max(awesomeGroups.length, summerGroups.length);

  if (!maxLength) {
    const emptyRow = document.createElement("div");
    emptyRow.className = "sc-gdq-paired-row";

    const awesomeMsg = document.createElement("p");
    awesomeMsg.className = "sc-results-message";
    awesomeMsg.textContent = "No Awesome Games events found.";

    const summerMsg = document.createElement("p");
    summerMsg.className = "sc-results-message";
    summerMsg.textContent = "No Summer Games events found.";

    emptyRow.appendChild(awesomeMsg);
    emptyRow.appendChild(summerMsg);
    layout.appendChild(emptyRow);
  } else {
    for (let i = 0; i < maxLength; i++) {
      const row = document.createElement("div");
      row.className = "sc-gdq-paired-row";

      const awesomeCell = document.createElement("div");
      awesomeCell.className = "sc-gdq-paired-cell";

      const summerCell = document.createElement("div");
      summerCell.className = "sc-gdq-paired-cell";

      if (awesomeGroups[i]) {
        awesomeCell.appendChild(buildEventTable(awesomeGroups[i]));
      }

      if (summerGroups[i]) {
        summerCell.appendChild(buildEventTable(summerGroups[i]));
      }

      row.appendChild(awesomeCell);
      row.appendChild(summerCell);
      layout.appendChild(row);
    }
  }

  content.appendChild(layout);

  if (otherGroups.length) {
    const otherWrap = document.createElement("div");
    otherWrap.className = "sc-gdq-other-wrap";

    const otherTitle = document.createElement("h3");
    otherTitle.className = "sc-gdq-column-title";
    otherTitle.textContent = "OTHER GDQ EVENTS";

    otherWrap.appendChild(otherTitle);

    otherGroups.forEach(group => {
      otherWrap.appendChild(buildEventTable(group));
    });

    content.appendChild(otherWrap);
  }
}

  function injectGdqStyles() {
    if (document.getElementById("sc-gdq-styles")) return;

    const style = document.createElement("style");
    style.id = "sc-gdq-styles";
    style.textContent = `
      .sc-gdq-paired-layout{
  display:flex;
  flex-direction:column;
  gap:18px;
  margin-top:24px;
}

.sc-gdq-paired-row{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:24px;
  align-items:start;
}

.sc-gdq-paired-header-row{
  margin-bottom:0;
}

.sc-gdq-paired-cell{
  min-width:0;
}

      .sc-gdq-column-title{
        margin:0;
        color:var(--sega-blue-dark);
        font-size:1.35rem;
        text-align:center;
        letter-spacing:0.4px;
      }

      .sc-gdq-event-table-box{
        background:#fff;
        border:1px solid var(--border);
        border-radius:18px;
        box-shadow:0 10px 30px rgba(0,0,0,0.08);
        overflow:hidden;
        text-align:left;
      }

      .sc-gdq-event-title{
        background:var(--sega-blue-dark);
        color:#fff;
        font-weight:800;
        letter-spacing:0.3px;
        text-align:center;
        padding:12px 14px;
        text-transform:uppercase;
        line-height:1.25;
      }

      .sc-gdq-table-wrap{
        width:100%;
        overflow-x:auto;
      }

      .sc-gdq-table{
        width:100%;
        border-collapse:collapse;
        min-width:520px;
      }

      .sc-gdq-table thead{
        background:#eef4ff;
      }

      .sc-gdq-table th{
        color:var(--sega-blue-dark);
        font-weight:800;
        letter-spacing:0.25px;
      }

      .sc-gdq-table th,
      .sc-gdq-table td{
        padding:11px 12px;
        text-align:left;
        border-bottom:1px solid #e7edf5;
        font-size:0.92rem;
        line-height:1.35;
        vertical-align:top;
      }

      .sc-gdq-table tbody tr:hover{
        background:#f8fbff;
      }

      .sc-gdq-table a{
        color:var(--sega-blue);
        text-decoration:none;
        font-weight:700;
      }

      .sc-gdq-table a:hover{
        color:var(--sega-blue-dark);
        text-decoration:underline;
      }

      .sc-gdq-other-wrap{
        margin-top:28px;
        display:flex;
        flex-direction:column;
        gap:18px;
      }


        @media (max-width: 900px){
  .sc-gdq-paired-row{
    grid-template-columns:1fr;
    gap:18px;
  }

  .sc-gdq-paired-header-row{
    display:none;
  }

  .sc-gdq-table{
    min-width:520px;
  }
}
      }
    `;

    document.head.appendChild(style);
  }

  content.innerHTML = `<p class="sc-results-message">Loading GDQ data...</p>`;

  loadCsv(GDQ_CSV_URL)
    .then(rows => {
      renderGdqTables(rows);
    })
    .catch(err => {
      console.error("GDQ CSV load error:", err);
      content.innerHTML = `<p class="sc-results-message">Could not load GDQ data.</p>`;
    });
});
