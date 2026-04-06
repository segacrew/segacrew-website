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

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function scoreCandidate(gameName, consoleName, candidate) {
  let score = 0;

  const candidateName = normalize(candidate.name);
  const targetName = normalize(gameName);
  const targetConsole = normalize(consoleName);

  if (candidateName === targetName) {
    score += 100;
  } else if (candidateName.includes(targetName) || targetName.includes(candidateName)) {
    score += 40;
  }

  const platformNames = Array.isArray(candidate.platforms)
    ? candidate.platforms.map(p => normalize(p.name))
    : [];

  if (targetConsole) {
    const exactPlatformMatch = platformNames.some(name => name === targetConsole);
    const partialPlatformMatch = platformNames.some(
      name => name.includes(targetConsole) || targetConsole.includes(name)
    );

    if (exactPlatformMatch) {
      score += 100;
    } else if (partialPlatformMatch) {
      score += 40;
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
