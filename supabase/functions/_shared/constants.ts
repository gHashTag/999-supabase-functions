if (!Deno.env.get("LOCAL_URL")) {
  throw new Error("LOCAL_URL is not set");
}

if (!Deno.env.get("PRODUCTION_URL")) {
  throw new Error("PRODUCTION_URL is not set");
}

if (!Deno.env.get("DEV")) {
  throw new Error("DEV is not set");
}

if (!Deno.env.get("SUPABASE_URL")) {
  throw new Error("SUPABASE_URL is not set");
}

if (!Deno.env.get("FUNCTION_SECRET")) {
  throw new Error("FUNCTION_SECRET is not set");
}

export const DEV = Deno.env.get("DEV") === "true" ? true : false;

export const SITE_URL = DEV
  ? Deno.env.get("LOCAL_URL")
  : Deno.env.get("PRODUCTION_URL");

export const PRODUCTION_URL = Deno.env.get("PRODUCTION_URL");

export const headers = {
  "Content-Type": "application/json",
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const FUNCTION_SECRET = Deno.env.get("FUNCTION_SECRET");

export const model_ai = "gpt-4o";
