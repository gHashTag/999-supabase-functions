/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { supabase } from "../_shared/supabase/index.ts";

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const payload = await req.json();
  console.log(payload, "payload");
  const oldRecord = payload?.old_record;
  // console.log(oldRecord, "oldRecord");
  const { username, first_name, last_name, position, designation, id } =
    payload.record;

  const content = `${username}\n${first_name || ""}\n${last_name || ""}\n${
    position || ""
  }\n${designation || ""}`;
  console.log(content, "content");

  // Generate embedding
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  });

  if (oldRecord) {
    console.log("oldRecord", oldRecord);
    // Check if any of the fields has changed
    const hasChanged = Object.keys(payload.record).some((key) =>
      payload.record[key] !== oldRecord[key]
    );
    console.log(hasChanged, "hasChanged");
    if (!hasChanged) {
      console.log("No change in the record.");
      return new Response("ok - no change");
    }

    // Update existing record
    const { error } = await supabase.from("users").update({
      embedding: JSON.stringify(embedding),
    }).eq("id", id);
    if (error) throw error;
    console.log("Record updated.");

    return new Response("ok - updated");
  } else {
    // Insert new record
    const { error } = await supabase.from("users").update({
      embedding: JSON.stringify(embedding),
    }).eq("id", id);
    if (error) throw error;
    console.log("New record inserted.");

    return new Response("ok - inserted");
  }
});

// supabase functions deploy generate-embedding-users --no-verify-jwt
