exports.handler = async function () {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const channelLogin = process.env.TWITCH_CHANNEL_LOGIN || "segacrew";

  if (!clientId || !clientSecret) {
    return jsonResponse(500, {
      error: "Missing Twitch API environment variables."
    });
  }

  try {
    const token = await getTwitchAppAccessToken(clientId, clientSecret);

    const userData = await twitchGet(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(channelLogin)}`,
      clientId,
      token
    );

    const user = userData.data?.[0];

    if (!user) {
      return jsonResponse(404, {
        error: "Twitch channel not found."
      });
    }

    const broadcasterId = user.id;

    const [channelData, streamData, followersData, clipsData] = await Promise.all([
      twitchGet(
        `https://api.twitch.tv/helix/channels?broadcaster_id=${encodeURIComponent(broadcasterId)}`,
        clientId,
        token
      ),
      twitchGet(
        `https://api.twitch.tv/helix/streams?user_id=${encodeURIComponent(broadcasterId)}`,
        clientId,
        token
      ),
      twitchGet(
        `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${encodeURIComponent(broadcasterId)}&first=1`,
        clientId,
        token
      ),
      twitchGet(
  `https://api.twitch.tv/helix/clips?broadcaster_id=${encodeURIComponent(broadcasterId)}&first=20`,
  clientId,
  token
)
    ]);

    const channel = channelData.data?.[0] || null;
    const stream = streamData.data?.[0] || null;
    const clips = clipsData.data || [];

    return jsonResponse(200, {
      channel: {
        id: user.id,
        login: user.login,
        displayName: user.display_name,
        description: user.description,
        profileImageUrl: user.profile_image_url,
        offlineImageUrl: user.offline_image_url,
        createdAt: user.created_at,
        viewCount: user.view_count,
        followers: followersData.total ?? null,
        broadcasterType: user.broadcaster_type || "",
        currentTitle: channel?.title || "",
        currentGame: channel?.game_name || "",
        currentLanguage: channel?.broadcaster_language || ""
      },
      live: stream
        ? {
            isLive: true,
            title: stream.title,
            game: stream.game_name,
            viewerCount: stream.viewer_count,
            startedAt: stream.started_at,
            thumbnailUrl: stream.thumbnail_url
          }
        : {
            isLive: false
          },
      recentClips: clips.map(clip => ({
  id: clip.id,
  title: clip.title,
  createdAt: clip.created_at,
  url: clip.url,
  embedUrl: clip.embed_url,
  broadcasterName: clip.broadcaster_name,
  creatorName: clip.creator_name,
  videoId: clip.video_id,
  gameId: clip.game_id,
  language: clip.language,
  viewCount: clip.view_count,
  duration: clip.duration,
  thumbnailUrl: clip.thumbnail_url
}))
    });
  } catch (err) {
    console.error("twitch-channel-stats error:", err);

    return jsonResponse(500, {
      error: "Could not load Twitch channel stats."
    });
  }
};

async function getTwitchAppAccessToken(clientId, clientSecret) {
  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials"
    })
  });

  if (!response.ok) {
    throw new Error(`Twitch token request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function twitchGet(url, clientId, token) {
  const response = await fetch(url, {
    headers: {
      "Client-ID": clientId,
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Twitch request failed ${response.status}: ${body}`);
  }

  return response.json();
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300"
    },
    body: JSON.stringify(body)
  };
}
