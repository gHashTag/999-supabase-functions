/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2.42.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const { search } = await req.json();
  if (!search) return new Response("Please provide a search param!");
  // Generate embedding for search term.
  const embedding = await model.run(search, {
    mean_pool: true,
    normalize: true,
  });
  // console.log(embedding, "embedding");
  // Query embeddings.
  const { data: result, error } = await supabase
    .rpc("query_embeddings_room_assets", {
      embedding: JSON.stringify(embedding),
      match_threshold: 0.8,
    })
    .select("title,transcription")
    .limit(4);

  // console.log(result, "result");
  if (error) {
    return Response.json(error);
  }

  return Response.json({ search, result });
});
