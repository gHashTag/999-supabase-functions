import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getWorkspaceById(workspace_id: string) {
  const supabaseClient = client();
  const { data, error } = await supabaseClient
    .from("workspaces")
    .select("*")
    .eq("workspace_id", workspace_id);
  console.log(error, "error");
  return data;
}

export const client = () => {
  const SUPABASE_ANON_KEY = Deno.env.get(
    "SUPABASE_ANON_KEY",
  );

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

  const supabaseClient = createClient(
    SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY ?? "",
  );
  // console.log("supabaseClient", supabaseClient);
  return supabaseClient;
};
