/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2.42.0";
import { Database, Tables } from "../_shared/database.types.ts";
// import OpenAI from "https://deno.land/x/openai@v4.28.0/mod.ts";

// if (!Deno.env.get("OPENAI_API_KEY")) {
//   throw new Error("OPENAI_API_KEY is not set");
// }

// const apiKey = Deno.env.get("OPENAI_API_KEY");
// const openai = new OpenAI({ apiKey });

type EmbeddingsRecord = Tables<"embeddings">;
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: EmbeddingsRecord;
  schema: "public";
  old_record: null | EmbeddingsRecord;
}

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const model = new Supabase.ai.Session("gte-small");
// console.log(model, "model");

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const { content, id } = payload.record;
  console.log(payload, "payload");
  // Check if content has changed.
  if (content === payload?.old_record?.content) {
    return new Response("ok - no change");
  }
  // const {
  //   data: [{ embedding }],
  // } = await openai.embeddings.create({
  //   model: "text-embedding-3-large",
  //   input: content,
  //   dimensions: 384,
  // });
  // // Generate embedding
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  });
  console.log(embedding, "embedding");

  // Store in DB
  const { error } = await supabase.from("embeddings").update({
    embedding: JSON.stringify(embedding),
  }).eq(
    "id",
    id,
  );
  if (error) console.warn(error.message);

  return new Response("ok - updated");
});
