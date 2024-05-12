/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2.42.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

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

// create embedding column in users table
// alter table public.users
// add column embedding vector (384);

// create index if not exists users_embedding_idx on public.users using hnsw (embedding vector_ip_ops) tablespace pg_default;

// create hook

// create trigger on_inserted_or_updated_embedding_users
// after insert
// or
// update of username,
// first_name,
// last_name,
// position,
// designation on public.users for each row
// execute function supabase_functions.http_request (
//   'https://dmrooqbmxdhdyblqzswu.supabase.co.supabase.co/functions/v1/generate-embedding-users',
//   'POST',
//   '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcm9vcWJteGRoZHlibHF6c3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwMzU2OTYsImV4cCI6MjAyNDYxMTY5Nn0.zCE28Ez7R06_QyGyI4Hmk-8SGi9ju6V5Jq1YCuhW8AY
// # SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcm9vcWJteGRoZHlibHF6c3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTAzNTY5NiwiZXhwIjoyMDI0NjExNjk2fQ.Q3UK9aUA8-P-22GYAAU8-Bg2U4uhYc2a3_JzTuXSqpE"}',
//   '{}',
//   '5000'
// );
