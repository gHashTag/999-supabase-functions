interface getAiFeedbackT{
  query: string,
  endpoint: string,
  token: string
}

async function getAiFeedback({query, endpoint, token}: getAiFeedbackT) {
  const response = await fetch(
    endpoint,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ question: query }),
    },
  );
  console.log(response)
  const result = await response.json();
  return result.text;
}

export { getAiFeedback };
