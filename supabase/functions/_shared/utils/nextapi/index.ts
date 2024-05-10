import { PRODUCTION_URL } from "../constants.ts";

type CreateUserProps = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_bot?: boolean;
  language_code?: string;
  chat_id?: number;
  inviter?: string;
  invitation_codes: string;
  telegram_id?: number;
  email?: string;
  photo_url?: string;
};

export async function createUser(data: CreateUserProps) {
  try {
    const url = `${PRODUCTION_URL}/api/create-user`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    return result;
  } catch (error) {
    console.error(error, "error");
    return { error: error };
  }
}
