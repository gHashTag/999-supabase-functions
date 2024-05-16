import { PRODUCTION_URL } from "../constants.ts";

export async function createUser(data: any) {
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
