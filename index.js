const YOUTUBE_CHAT_RUNNER_URL = process.env.YOUTUBE_CHAT_RUNNER_URL;
const YOUTUBE_RUNNER_SECRET = process.env.YOUTUBE_RUNNER_SECRET;
const STR_ID = Number(process.env.STR_ID || 1);

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
      body: JSON.stringify({
        str_id: STR_ID
      })
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("YouTube runner failed:", res.status, payload);
      delayMs = 10_000;
      return;
    }

    const summary = payload?.summaries?.[0];

    if (summary?.live) {
      delayMs = Number(summary.polling_interval_ms || 2000);
      delayMs = Math.max(delayMs, 1000);
      delayMs = Math.min(delayMs, 10_000);

      console.log("YouTube chat checked:", {
        live: true,
        messages: summary.message_count,
        new: summary.new_message_count,
        nextPollMs: delayMs
      });
    } else {
      delayMs = 30_000;
      console.log("YouTube not live. Checking again in 30s.");
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
