/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { supabase } from "../_shared/supabase/index.ts";

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req) => {
  const { search } = await req.json();
  if (!search) return new Response("Please provide a search param!");
  // Generate embedding for search term.
  const embedding = await model.run(search, {
    mean_pool: true,
    normalize: true,
  });

  // Query embeddings.
  const { data: result, error } = await supabase
    .rpc("query_embeddings_users", {
      embedding: JSON.stringify(embedding),
      match_threshold: 0.8,
    })
    .select("username,first_name,last_name,position,designation")
    .limit(4);

  if (error) {
    return Response.json(error);
  }

  return Response.json({ search, result });
});
