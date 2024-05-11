import { CreateUserProps } from "../../types/index.ts";
import { PRODUCTION_URL } from "../constants.ts";

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
