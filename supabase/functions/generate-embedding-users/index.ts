/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { supabase } from "../_shared/supabase/index.ts";

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const payload = await req.json();
  const oldRecord = payload?.old_record;
  // console.log(oldRecord, "oldRecord");
  const { username, first_name, last_name, position, designation, id } =
    payload.record;
  const hasChanged = Object.keys(payload.record).some((key) =>
    payload.record[key] !== oldRecord[key]
  );

  // Check if any of the fields has changed
  if (!hasChanged) {
    console.log("ok - no change");
    return new Response("ok - no change");
  }

  const content =
    `${username}\n${first_name}\n${last_name}\n${position}\n${designation}`;
  // console.log(content, "content");

  // Generate embedding
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  });
  // console.log(embedding, "embedding");

  // Store in DB
  const { error } = await supabase.from("users").update({
    embedding: JSON.stringify(embedding),
  }).eq(
    "id",
    id,
  );
  if (error) console.warn(error.message);

  return new Response("ok - updated");
});
