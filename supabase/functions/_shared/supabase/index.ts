import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DEV } from "../constants.ts";

export const SUPABASE_ANON_KEY = DEV
  ? Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  : Deno.env.get("SUPABASE_ANON_KEY");

export const SUPABASE_URL = DEV
  ? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL")
  : Deno.env.get("SUPABASE_URL");

export const client = () => {
  const supabaseClient = createClient(
    SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY ?? "",
  );

  return supabaseClient;
};

export const supabase = client();
