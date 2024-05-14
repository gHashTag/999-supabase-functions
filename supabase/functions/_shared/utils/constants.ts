export const DEV = Deno.env.get("DEV") === "true" ? true : false;

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
