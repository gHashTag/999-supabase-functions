import { headers } from "./_shared/utils/constants.ts";
import { getAiFeedbackT } from "./_shared/utils/types/index.ts";

export async function getAiFeedbackFromSupabase(
  { query, endpoint }: getAiFeedbackT,
) {
  const response = await fetch(
    endpoint,
    {
      headers,
      method: "POST",
      body: JSON.stringify({ question: query }),
    },
  );
  console.log(response, "response");
  const result = await response.json();
  return result.text;
}
