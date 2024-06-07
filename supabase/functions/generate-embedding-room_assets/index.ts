/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { supabase } from "../_shared/supabase/index.ts";

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const payload = await req.json();
  console.log(payload, "payload");
  const oldRecord = payload?.old_record;
  console.log(oldRecord, "oldRecord");
  console.log(payload.record, "payload.record");
  const { title, transcription, id } = payload?.record;
  const hasChanged = Object.keys(payload.record).some((key) =>
    payload.record[key] !== oldRecord[key]
  );

  console.log(hasChanged, "hasChanged");

  // Check if any of the fields has changed
  if (!hasChanged) {
    console.log("ok - no change");
    return new Response("ok - no change");
  }

  const content = `${title}\n${transcription}`;
  // console.log(content, "content");

  // Generate embedding
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  });
  // console.log(embedding, "embedding");

  // Store in DB
  const { error } = await supabase.from("room_assets").update({
    embedding: JSON.stringify(embedding),
  }).eq(
    "id",
    id,
  );
  if (error) console.warn(error.message);

  return new Response("ok - updated");
});

// supabase functions deploy generate-embedding-room_assets --no-verify-jwt
