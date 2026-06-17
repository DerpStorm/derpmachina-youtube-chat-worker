const YOUTUBE_CHAT_RUNNER_URL = process.env.YOUTUBE_CHAT_RUNNER_URL;
const YOUTUBE_RUNNER_SECRET = process.env.YOUTUBE_RUNNER_SECRET;

if (!YOUTUBE_CHAT_RUNNER_URL) throw new Error("Missing YOUTUBE_CHAT_RUNNER_URL");
if (!YOUTUBE_RUNNER_SECRET) throw new Error("Missing YOUTUBE_RUNNER_SECRET");

let delayMs = 2000;

async function runYouTubeChatRunner() {
  try {
    const res = await fetch(YOUTUBE_CHAT_RUNNER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-runner-secret": YOUTUBE_RUNNER_SECRET
      },

      // No str_id = process ALL YouTube streamers
      body: JSON.stringify({})
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("YouTube runner failed:", res.status, payload);
      delayMs = 10_000;
      return;
    }

    const summaries = payload?.summaries || [];

    const liveStreams =
      summaries.filter(s => s.live);

    if (liveStreams.length > 0) {

      const lowestPoll =
        Math.min(
          ...liveStreams.map(
            s => Number(s.polling_interval_ms || 2000)
          )
        );

      delayMs = Math.max(1000, lowestPoll);
      delayMs = Math.min(10000, delayMs);

      console.log(
        `Checked ${summaries.length} streamers, ${liveStreams.length} live`
      );

    } else {

      delayMs = 30_000;

      console.log(
        `Checked ${summaries.length} streamers, none live`
      );
    }

  } catch (err) {
    console.error("YouTube chat worker error:", err);
    delayMs = 10_000;
  }
}

async function loop() {
  while (true) {
    await runYouTubeChatRunner();
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

loop();
