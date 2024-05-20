create or replace function match_messages (
  embedding_vector vector(384),
  match_threshold float,
  match_count int, 
  search_username text
)
returns table (
  id bigint,
  username text,
  user_id text,
  workspace_id text,
  room_id text,
  content text,
  ai_content text,
  created_at text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    messages.id,
    messages.user_id,
    messages.username,
    messages.workspace_id,
    messages.room_id,
    messages.content,
    messages.ai_content,
    1 - (messages.embedding <=> embedding_vector) as similarity
  from messages
  where 1 - (messages.embedding <=> embedding_vector) > match_threshold
  and messages.username = search_username
  order by similarity desc
  limit match_count;
end;
$$;


-- export const matchEmbedding = async (
--   rpc_function_name: string,
--   embedding: unknown,
--   search_username: string,
-- ) => {
--   try {
--     const { data, error } = await supabaseSQL
--       .rpc(rpc_function_name, {
--         embedding_vector: JSON.stringify(embedding),
--         match_threshold: 0.4,
--         match_count: 9,
--         search_username,
--       })
--       .select("*")
--       .limit(9);

--     if (error) {
--       throw new Error(
--         `Error matching matchEmbedding: ${JSON.stringify(error)}`,
--       );
--     }

--     return data;
--   } catch (error) {
--     throw new Error(`Error matching embedding: ${error}`);
--   }
-- };
