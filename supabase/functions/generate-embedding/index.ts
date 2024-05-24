/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import {  Tables } from "../_shared/database.types.ts";
import { supabase } from "../_shared/supabase/index.ts";

type EmbeddingsRecord = Tables<"embeddings">;
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: EmbeddingsRecord;
  schema: "public";
  old_record: null | EmbeddingsRecord;
}

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const { content, id } = payload?.record;

  // Check if content has changed.
  if (content === payload?.old_record?.content) {
    return new Response("ok - no change");
  }

  // Generate embedding
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  });
  console.log(embedding, "embedding");

  // Store in DB
  const { data, error } = await supabase.from("embeddings").update({
    embedding: JSON.stringify(embedding),
  }).eq(
    "id",
    id,
  ).select("*");
  if (error) console.log(error.message, "ERROR MESSAGE(46)");

  return new Response("ok - updated");
});
