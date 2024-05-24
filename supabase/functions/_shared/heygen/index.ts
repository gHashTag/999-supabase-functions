import { API_KEY, HEYGEN_URL } from "../constants.ts";
import { setVideoId } from "../supabase/videos.ts";

interface CreateVideoParams {
  avatar_id: string;
  voice_id: string;
  text: string;
  user_id: string;
}

export async function createVideo(
  { avatar_id, voice_id, text, user_id }: CreateVideoParams,
) {
  const data = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id,
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: text,
          voice_id,
        },
      },
    ],
    test: true,
    caption: false,
    dimension: {
      width: 1080,
      height: 1920,
    },
  };

  try {
    if (!HEYGEN_URL || !API_KEY) {
      throw new Error("HEYGEN_URL or API_KEY is not set");
    }
    const response = await fetch(HEYGEN_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    //  const result = { error: null, data: { video_id: "75a7b314e4c2415eb5930167b2793b3e" } }
    
    await setVideoId(user_id, result.data.video_id);
    return result;
  } catch (error) {
    console.error("Error creating video:", error);
    return { error: error.message };
  }
}
