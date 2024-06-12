/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { supabase } from "../_shared/supabase/index.ts";

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { old_record: oldRecord, record } = payload;
    const { title, transcription, id } = record;
    const content = `${title}\n${transcription}`;

    // Generate embedding
    const embedding = await model.run(content, {
      mean_pool: true,
      normalize: true,
    });

    if (oldRecord) {
      // Check if any of the fields has changed
      const hasChanged = title !== oldRecord.title ||
        transcription !== oldRecord.transcription;
      if (!hasChanged) {
        console.log("No change in the record.");
        return new Response("ok - no change");
      }
      setTimeout(async () => {
        // Update existing record
        const { error } = await supabase.from("room_assets").update({
          embedding: JSON.stringify(embedding),
        }).eq("id", id);
        if (error) throw error;
        console.log("Record updated.");
      }, 3000);
      return new Response("ok - updated");
    } else {
      // Insert new record
      setTimeout(async () => {
        const { error } = await supabase.from("room_assets").update({
          embedding: JSON.stringify(embedding),
        }).eq("id", id);
        if (error) throw error;
        console.log("New record inserted.");
      }, 3000);
      return new Response("ok - inserted");
    }
  } catch (error) {
    console.error("Error:", error.message);
    return new Response("Error processing request", { status: 500 });
  }
});

// supabase functions deploy generate-embedding-room_assets --no-verify-jwt
