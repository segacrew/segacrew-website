const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

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
    return raw;
  }

  return raw;
}

function parseIsoDurationToSeconds(duration) {
  const match = String(duration || "").match(
    /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/
  );

  if (!match) return null;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return (hours * 3600) + (minutes * 60) + seconds;
}

function formatSeconds(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export default async (req) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing YOUTUBE_API_KEY");
    }

    const url = new URL(req.url);
    const input = url.searchParams.get("url") || url.searchParams.get("id") || "";
    const videoId = extractYouTubeId(input);

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Missing YouTube url or id parameter" }),
        {
          status: 400,
          headers: { "content-type": "application/json" }
        }
      );
    }

    const apiUrl = new URL(YOUTUBE_VIDEOS_URL);
    apiUrl.searchParams.set("part", "contentDetails,snippet");
    apiUrl.searchParams.set("id", videoId);
    apiUrl.searchParams.set("key", apiKey);

    const res = await fetch(apiUrl.toString(), {
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({
          error: "YouTube API lookup failed",
          details: text
        }),
        {
          status: res.status,
          headers: { "content-type": "application/json" }
        }
      );
    }

    const data = await res.json();
    const item = data?.items?.[0];

    if (!item) {
      return new Response(
        JSON.stringify({
          video_id: videoId,
          duration_iso: "",
          duration_seconds: null,
          duration_display: ""
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "cache-control": "public, max-age=86400"
          }
        }
      );
    }

    const durationIso = item.contentDetails?.duration || "";
    const durationSeconds = parseIsoDurationToSeconds(durationIso);
    const durationDisplay =
      durationSeconds === null ? "" : formatSeconds(durationSeconds);

    return new Response(
      JSON.stringify({
        video_id: videoId,
        title: item.snippet?.title || "",
        duration_iso: durationIso,
        duration_seconds: durationSeconds,
        duration_display: durationDisplay
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=86400"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unexpected server error",
        details: String(error.message || error)
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" }
      }
    );
  }
};

export const config = {
  path: "/api/youtube-duration"
};
