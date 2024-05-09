import { DEV } from "../helpers.ts";

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

const SITE_URL = DEV
  ? Deno.env.get("LOCAL_URL")
  : Deno.env.get("PRODUCTION_URL");

const headers = {
  "Content-Type": "application/json",
};

type CreateRoom = {
  id: string;
  name: string;
  type: string;
  username: string | undefined;
  token: string | undefined;
  chat_id: number;
  lang: string | undefined;
};
async function create100MsRoom({
  id,
  name,
  type,
  username,
  token,
  chat_id,
  lang,
}: CreateRoom) {
  const url = `${SITE_URL}/api/create-room-from-tg`;

  const newData = {
    id,
    name,
    type,
    username,
    token,
    chat_id,
    lang,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
    },
    body: JSON.stringify(newData),
  });

  const text = await response.text();

  try {
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    throw new Error("Error parsing JSON response from server");
  }
}

export { create100MsRoom };
