// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { corsHeaders, headers } from "../_shared/handleCORS.ts";
import { getVideoWithChatId, setVideoUrl } from "../_shared/supabase/videos.ts";
import { botAiKoshey } from "../_shared/telegram/bots.ts";

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

Deno.serve(async (req) => {
  console.log('Hello from heygen-video', req)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders, ...headers } });
  }
  const data = await req.json();
  console.log(data,'data')

  if (data.event_type === "avatar_video.success") {
    const videoUrl = data.event_data.url;
    console.log(videoUrl,'videoUrl')
    const video_id = data.event_data.video_id;
    console.log(video_id,'video_id')
    const videoData = await getVideoWithChatId(video_id);
    console.log(videoData,'videoData')

    if (!videoData) throw new Error('Video not found')
    const { chat_id } = videoData
    console.log(chat_id,'chat_id')
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

// supabase functions deploy heygen-video --no-verify-jwt

