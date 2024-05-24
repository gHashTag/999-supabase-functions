// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { getVideoWithChatId, setVideoUrl } from "../_shared/supabase/videos.ts";
import { botAiKoshey } from "../_shared/telegram/bots.ts";

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

Deno.serve(async (req) => {
  const data = await req.json();

  if (data.event_type === "avatar_video.success") {
    const videoUrl = data.event_data.url;
    const video_id = data.event_data.video_id;
    const videoData = await getVideoWithChatId(video_id);

    if (!videoData) throw new Error('Video not found')
    const { chat_id  } = videoData
    try {
      await setVideoUrl(video_id, videoUrl)
      await botAiKoshey.api.sendVideo(chat_id, videoUrl);
    } catch (error) {
      console.error("Error sending video:", error);
      await botAiKoshey.api.sendMessage(
        chat_id,
        "Error sending video",
      );
    }
    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
    );
  } else {
    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/heygen-video' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
