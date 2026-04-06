const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAppAccessToken() {
  const now = Date.now();

  if (cachedToken && now < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
  }

  const tokenUrl = new URL(TWITCH_TOKEN_URL);
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("grant_type", "client_credentials");

  const tokenRes = await fetch(tokenUrl.toString(), { method: "POST" });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token request failed: ${tokenRes.status} ${text}`);
  }

  const tokenData = await tokenRes.json();
  cachedToken = tokenData.access_token;
  cachedTokenExpiresAt = now + (tokenData.expires_in * 1000);

  return cachedToken;
}

function normalizePlatformName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PLATFORM_ALIASES = {
  "genesis": [
    "genesis",
    "sega genesis",
    "mega drive",
    "sega mega drive"
  ],
  "mega drive": [
    "genesis",
    "sega genesis",
    "mega drive",
    "sega mega drive"
  ],
  "32x": [
    "32x",
    "sega 32x"
  ],
  "sega 32x": [
    "32x",
    "sega 32x"
  ],
  "game gear": [
    "game gear",
    "sega game gear"
  ],
  "master system": [
    "master system",
    "sega master system",
    "sms"
  ],
  "sms": [
    "master system",
    "sega master system",
    "sms"
  ],
  "saturn": [
    "saturn",
    "sega saturn"
  ],
  "dreamcast": [
    "dreamcast",
    "sega dreamcast"
  ],
  "cd": [
    "cd",
    "sega cd",
    "mega cd"
  ],
  "sega cd": [
    "cd",
    "sega cd",
    "mega cd"
  ],
  "mega cd": [
    "cd",
    "sega cd",
    "mega cd"
  ],
  "game boy advance": [
    "game boy advance",
    "gba"
  ],
  "gba": [
    "game boy advance",
    "gba"
  ],
  "ds": [
    "ds",
    "nintendo ds"
  ],
  "nintendo ds": [
    "ds",
    "nintendo ds"
  ],
  "3ds": [
    "3ds",
    "nintendo 3ds"
  ],
  "nintendo 3ds": [
    "3ds",
    "nintendo 3ds"
  ],
  "wii": [
    "wii",
    "nintendo wii"
  ],
  "gamecube": [
    "gamecube",
    "nintendo gamecube",
    "gc"
  ],
  "gc": [
    "gamecube",
    "nintendo gamecube",
    "gc"
  ],
  "switch": [
    "switch",
    "nintendo switch"
  ],
  "playstation": [
    "playstation",
    "ps1",
    "psx",
    "sony playstation"
  ],
  "ps1": [
    "playstation",
    "ps1",
    "psx",
    "sony playstation"
  ],
  "psx": [
    "playstation",
    "ps1",
    "psx",
    "sony playstation"
  ],
  "playstation 2": [
    "playstation 2",
    "ps2"
  ],
  "ps2": [
    "playstation 2",
    "ps2"
  ],
  "playstation 3": [
    "playstation 3",
    "ps3"
  ],
  "ps3": [
    "playstation 3",
    "ps3"
  ],
  "playstation 4": [
    "playstation 4",
    "ps4"
  ],
  "ps4": [
    "playstation 4",
    "ps4"
  ],
  "playstation 5": [
    "playstation 5",
    "ps5"
  ],
  "ps5": [
    "playstation 5",
    "ps5"
  ],
  "xbox": [
    "xbox",
    "original xbox"
  ],
  "xbox 360": [
    "xbox 360",
    "360"
  ],
  "360": [
    "xbox 360",
    "360"
  ]
};

function expandPlatformAliases(value) {
  const normalized = normalizePlatformName(value);
  const aliases = PLATFORM_ALIASES[normalized] || [normalized];
  return new Set(aliases.map(normalizePlatformName));
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function scoreCandidate(gameName, consoleName, candidate) {
  let score = 0;

  const candidateName = normalize(gameName ? candidate.name : "");
  const targetName = normalize(gameName);

  if (candidateName === targetName) {
    score += 100;
  } else if (candidateName.includes(targetName) || targetName.includes(candidateName)) {
    score += 40;
  }

  const targetPlatformAliases = expandPlatformAliases(consoleName);

  const candidatePlatformNames = Array.isArray(candidate.platforms)
    ? candidate.platforms.map(p => p.name)
    : [];

  const candidatePlatformAliases = new Set(
    candidatePlatformNames.flatMap(name => [...expandPlatformAliases(name)])
  );

  if (consoleName) {
    const exactAliasMatch = [...targetPlatformAliases].some(alias =>
      candidatePlatformAliases.has(alias)
    );

    if (exactAliasMatch) {
      score += 100;
    } else {
      const partialMatch = [...targetPlatformAliases].some(targetAlias =>
        [...candidatePlatformAliases].some(candidateAlias =>
          candidateAlias.includes(targetAlias) || targetAlias.includes(candidateAlias)
        )
      );

      if (partialMatch) {
        score += 40;
      }
    }
  }

  if (candidate.cover?.image_id) {
    score += 10;
  }

  return score;
}

function buildCoverUrl(imageId) {
  if (!imageId) return "";
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

export default async (req) => {
  try {
    const url = new URL(req.url);
    const game = url.searchParams.get("game") || "";
    const consoleName = url.searchParams.get("console") || "";

    const trimmedGame = game.trim();
    const trimmedConsole = consoleName.trim();

    if (!trimmedGame) {
      return new Response(
        JSON.stringify({ error: "Missing game parameter" }),
        {
          status: 400,
          headers: { "content-type": "application/json" }
        }
      );
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const token = await getAppAccessToken();

    const body = `
      search "${trimmedGame.replaceAll('"', '\\"')}";
      fields name, cover.image_id, platforms.name;
      limit 20;
    `;

    const igdbRes = await fetch(IGDB_GAMES_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Client-ID": clientId,
        "Authorization": `Bearer ${token}`
      },
      body
    });

    if (!igdbRes.ok) {
      const text = await igdbRes.text();
      return new Response(
        JSON.stringify({
          error: "IGDB lookup failed",
          details: text
        }),
        {
          status: igdbRes.status,
          headers: { "content-type": "application/json" }
        }
      );
    }

    const results = await igdbRes.json();

    if (!Array.isArray(results) || !results.length) {
      return new Response(
        JSON.stringify({
          game: trimmedGame,
          console: trimmedConsole,
          cover_url: ""
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    }

    const ranked = results
      .map(item => ({
        item,
        score: scoreCandidate(trimmedGame, trimmedConsole, item)
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0]?.item;
    const coverUrl = buildCoverUrl(best?.cover?.image_id);

    return new Response(
      JSON.stringify({
        game: trimmedGame,
        console: trimmedConsole,
        matched_name: best?.name || "",
        cover_url: coverUrl || ""
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
  path: "/api/igdb-cover"
};
