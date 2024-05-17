import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

import { oneLine, stripIndent } from "https://esm.sh/common-tags@1.8.2";
import { supabase } from "../_shared/supabase/index.ts";

import {
  embeddingResponse,
  getCompletion,
  tokenizer,
} from "../_shared/supabase/ai.ts";
import { corsHeaders } from "../_shared/handleCORS.ts";

import { setMessage } from "../_shared/supabase/message.ts";

serve(async (req: Request) => {
  // ask-custom-data logic
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Search query is passed in request payload
  const {
    query,
    id_array,
    user_id,
    username,
    first_name,
    last_name,
    workspace_id,
    room_id,
  } = await req.json();

  const embeddingUser = await embeddingResponse(query);

  // OpenAI recommends replacing newlines with spaces for best results
  const input = query.replace(/\n/g, " ");
  console.log(input, "input");
  // Generate a one-time embedding for the query itself

  console.log(id_array, "id_array");
  // Query embeddings.
  const { data: tasks, error: tasksError } = await supabase
    .rpc("query_embeddings_tasks_with_ids", {
      id_array,
      embedding_vector: JSON.stringify(embeddingUser),
      match_threshold: 0.4,
    })
    .select("id,user_id,title,description,created_at,updated_at")
    .limit(4);
  console.log(tasks, "tasks");

  // get the relevant documents to our question by using the match_documents
  // rpc: call PostgreSQL functions in supabase

  if (tasksError) {
    console.error(tasksError, "tasksError");
    throw new Response(`Error: ${tasksError}`, {
      status: 400,
      statusText: tasksError.message,
    });
  }
  // documents is going to be all the relevant data to our specific question.

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

  const prompt = stripIndent`${oneLine`
  You are the head of the dao 999 nft digital avatar bank, which is very helpful when it comes to talking about the tasks of its inhabitants! Always answer honestly and be as helpful as you can! If there is no task, then return an empty array.`}
    Context sections:
    ${contextText}
    Question: """
    ${query}
    """
    Answer as simple text:
  `;
  console.log(prompt, "prompt");
  // get response from gpt-4o model
  const { id, ai_content } = await getCompletion(prompt);

  if (ai_content) {
    const commonPrompt =
      `User ${first_name} ${last_name}: ${query}\n\nassistant: ${ai_content}`;
    const embedding = await embeddingResponse(commonPrompt);

    const messageObject = {
      user_id,
      username,
      workspace_id,
      room_id,
      content: input,
      ai_content,
      embedding,
    };

    const dataMessage = await setMessage(messageObject);

    console.log(dataMessage, "dataMessage");

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

// supabase functions deploy ask-data --no-verify-jwt
