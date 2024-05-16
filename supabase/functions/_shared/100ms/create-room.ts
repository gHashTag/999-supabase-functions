import { headers } from "../constants.ts";

type CreateRoom = {
  id: string;
  name: string;
  type: string;
  username: string | undefined;
  user_id: string | undefined;
  token: string | undefined;
  chat_id: number;
  lang: string | undefined;
};

async function create100MsRoom({
  id,
  name,
  type,
  username,
  user_id,
  token,
  chat_id,
  lang,
}: CreateRoom) {
  const url = `${Deno.env.get("PRODUCTION_URL")}/api/create-room-from-tg`;
  console.log(url, "url");
  const newData = {
    id,
    name,
    type,
    username,
    user_id,
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
