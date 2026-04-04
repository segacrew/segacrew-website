document.addEventListener("DOMContentLoaded", () => {
  const controls = document.getElementById("controls");
  if (!controls) {
    console.error("Could not find #controls in the HTML.");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "sc-page-controls";

  const label = document.createElement("label");
  label.className = "sc-label";
  label.textContent = "Select Event";
  label.setAttribute("for", "eventSelect");

  const select = document.createElement("select");
  select.id = "eventSelect";
  select.className = "sc-select";

  const loadingOption = document.createElement("option");
  loadingOption.textContent = "Loading events...";
  select.appendChild(loadingOption);

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  controls.appendChild(wrapper);

  Papa.parse("https://pub-19f61d2ffc5c4023a2fdfdbcbbba6c16.r2.dev/database.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      console.log("CSV results:", results);

      const rows = results.data || [];

      const uniqueEvents = [...new Set(
        rows
          .map(row => String(row.EVENT || "").trim())
          .filter(v => v !== "")
      )].sort((a, b) => a.localeCompare(b));

      select.innerHTML = "";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select an event";
      select.appendChild(defaultOption);

      uniqueEvents.forEach(eventName => {
        const option = document.createElement("option");
        option.value = eventName;
        option.textContent = eventName;
        select.appendChild(option);
      });

      console.log("Events loaded:", uniqueEvents);
    },
    error: function(err) {
      console.error("Papa Parse error:", err);
      select.innerHTML = "";
      const option = document.createElement("option");
      option.textContent = "Failed to load events";
      select.appendChild(option);
    }
  });
});
