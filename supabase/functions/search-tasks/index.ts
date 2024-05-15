/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { model } from "../_shared/utils/supabase/ai.ts";
import { supabase } from "../_shared/utils/supabase/index.ts";

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
    .rpc("query_embeddings_tasks", {
      embedding: JSON.stringify(embedding),
      match_threshold: 0.8,
    })
    .select("title,description,created_at,updated_at,assigned_to")
    .limit(4);

  if (error) {
    return Response.json(error);
  }

  return Response.json({ search, result });
});
