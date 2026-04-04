const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_USERS_URL = "https://api.twitch.tv/helix/users";

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAppAccessToken() {
  const now = Date.now();

  // Reuse token until shortly before expiry
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

  const tokenRes = await fetch(tokenUrl.toString(), {
    method: "POST",
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token request failed: ${tokenRes.status} ${text}`);
  }

  const tokenData = await tokenRes.json();

  cachedToken = tokenData.access_token;
  cachedTokenExpiresAt = now + (tokenData.expires_in * 1000);

  return cachedToken;
}

export default async (req, context) => {
  try {
    const login = context.params?.login || new URL(req.url).searchParams.get("login") || "";
    const trimmedLogin = login.trim();

    if (!trimmedLogin) {
      return new Response(
        JSON.stringify({ error: "Missing login parameter" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const token = await getAppAccessToken();

    const userUrl = new URL(TWITCH_USERS_URL);
    userUrl.searchParams.set("login", trimmedLogin);

    const userRes = await fetch(userUrl.toString(), {
      headers: {
        "Client-Id": clientId,
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!userRes.ok) {
      const text = await userRes.text();
      return new Response(
        JSON.stringify({
          error: "Twitch user lookup failed",
          details: text,
        }),
        {
          status: userRes.status,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const userData = await userRes.json();
    const user = userData?.data?.[0];

    return new Response(
      JSON.stringify({
        login: user?.login || trimmedLogin,
        display_name: user?.display_name || trimmedLogin,
        profile_image_url: user?.profile_image_url || "",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Unexpected server error",
        details: String(error.message || error),
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
};

export const config = {
  path: "/api/twitch-user",
};
