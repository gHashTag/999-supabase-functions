import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

import { oneLine, stripIndent } from "https://esm.sh/common-tags@1.8.2";
import { supabase, supabaseSQL } from "../_shared/supabase/index.ts";

import {
  embeddingResponse,
  getCompletion,
  matchEmbedding,
  matchEmbeddingIds,
  tokenizer,
} from "../_shared/supabase/ai.ts";
import { corsHeaders } from "../_shared/handleCORS.ts";

import { setMessage } from "../_shared/supabase/message.ts";
import { getSupabaseUser, getUser } from "../_shared/supabase/users.ts";
import { getSelectIzbushkaId } from "../_shared/supabase/rooms.ts";

serve(async (req: Request): Promise<Response> => {
  // ask-custom-data logic
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // Search query is passed in request payload
  const {
    query,
    id_array,
    username,
    language_code,
  } = await req.json();

  // Generate a one-time embedding for the query itself
  const embeddingQuery = await embeddingResponse(query);

  // OpenAI recommends replacing newlines with spaces for best results
  const input = query.replace(/\n/g, " ");
  // Query embeddings.

  if (!id_array || !id_array.length) {
    throw new Response("Id array is empty", { status: 400 });
  }
  // console.log(embeddingQuery, "embeddingQuery");

  const tasks = await matchEmbeddingIds(
    id_array,
    embeddingQuery,
  );

  const messages = await matchEmbedding(
    "match_messages",
    embeddingQuery,
    username,
  );

  let tokenCount = 0;
  console.log(tokenCount, "tokenCount");

  let contextText = "";

  // Concat matched documents
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    const content =
      `${task.title}\n${task.description}\n${task.created_at}\n${task.updated_at}`;

    const encoded = tokenizer.encode(content);

    tokenCount += encoded.text.length;

    // Limit context to max 1500 tokens (configurable)
    if (tokenCount > 1000000) {
      throw new Response("Context too long", { status: 400 });
    }

    contextText += `${content.trim()}\n`;
  }

  const { position, designation, full_name } = await getUser(username);

  const prompt = stripIndent`${oneLine`
  You are the head of the dao 999 nft digital avatar bank, which is very helpful when it comes to talking about the tasks of its inhabitants! Always answer honestly and be as helpful as you can! Respond in ${language_code} language.`}
    Context sections:
    ${contextText}
    Question: """
    ${query}
   
   
    Answer as simple text:
  `;

  const assistantPrompt = `
    Past dialogue with the user: """
    ${messages}
    """
  `;

  const systemPrompt = `
    You are this user's personal digital avatar:
    """
    ${full_name}
    """
    Position: """
    ${position}
    """
    Designation: """
    ${designation}
    """
  `;

  // get response from gpt-4o model
  const { id, ai_content } = await getCompletion({
    prompt,
    assistantPrompt,
    systemPrompt,
  });

  if (ai_content) {
    const dataUser = await getSupabaseUser(username);
    if (!dataUser || !dataUser.select_izbushka) {
      throw new Response("User not found", { status: 400 });
    }

    const { izbushka } = await getSelectIzbushkaId(dataUser.select_izbushka);

    const commonPrompt =
      `User ${dataUser.first_name} ${dataUser.last_name}: ${query}\n\nAssistant: ${ai_content}`;

    const embedding = await embeddingResponse(commonPrompt);

    if (
      !izbushka || !dataUser.user_id || !dataUser.username ||
      !izbushka.workspace_id || !izbushka.room_id || !embedding
    ) {
      throw new Response("Izbushka not found", { status: 400 });
    }

    const messageObject = {
      user_id: dataUser?.user_id,
      username: dataUser?.username,
      workspace_id: izbushka?.workspace_id,
      room_id: izbushka?.room_id,
      content: input,
      ai_content,
      embedding: JSON.stringify(embedding),
    };

    await setMessage(messageObject);
    // return the response from the model to our use through a Response
    return new Response(JSON.stringify({ id, ai_content, tasks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response("No content", {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// CREATE
// OR REPLACE FUNCTION query_embeddings_tasks_with_ids (
//   id_array BIGINT[],
//   embedding_vector vector (384),
//   match_threshold FLOAT
// ) RETURNS SETOF tasks LANGUAGE plpgsql AS $$
// begin
//   return query
//   select t.*
//   from tasks t
//   where t.id = any(id_array)
//   and t.embedding <#> embedding_vector < -match_threshold
//   order by t.embedding <#> embedding_vector;
// end;
// $$;

// -- alter table public.messages
// -- add column embedding vector (384);

// -- create index if not exists messages_embedding_idx on public.messages using hnsw (embedding vector_ip_ops) tablespace pg_default;

// create or replace function match_messages (
//   embedding_vector vector(384),
//   match_threshold float,
//   match_count int,
//   search_username text
// )
// returns table (
//   id bigint,
//   user_id uuid,
//   username text,
//   workspace_id uuid,
//   room_id text,
//   content text,
//   ai_content text,
//   similarity float
// )
// language plpgsql
// as $$
// begin
//   return query
//   select
//     messages.id,
//     messages.user_id,
//     messages.username,
//     messages.workspace_id,
//     messages.room_id,
//     messages.content,
//     messages.ai_content,
//     1 - (messages.embedding <=> embedding_vector) as similarity
//   from messages
//   where 1 - (messages.embedding <=> embedding_vector) > match_threshold
//   and messages.username = search_username
//   order by similarity desc
//   limit match_count;
// end;
// $$;

//supabase functions deploy ask-data --no-verify-jwt
