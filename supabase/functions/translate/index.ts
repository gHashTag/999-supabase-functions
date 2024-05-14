import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { client } from "../_shared/utils/supabase/index.ts";
import { translateText } from "../_shared/utils/translateText.ts";

const supabase = client();

serve(async (req: Request) => {
  const { table } = await req.json();
  const { data: dataToTranslate, error } = await supabase.from(table).select(
    "*",
  );

  if (error) {
    console.error("Error fetching data from Supabase:", error.message);
    return new Response("Error fetching data from Supabase", { status: 500 });
  }

  for (const row of dataToTranslate) {
    const {
      question,
      variant_0,
      variant_1,
      variant_2,
      topic,
      question_en: defaultEn,
    } = row;
    if (defaultEn === null) {
      const question_en = await translateText(question, "en");
      const variant_0_en = await translateText(variant_0, "en");
      const variant_1_en = await translateText(variant_1, "en");
      const variant_2_en = await translateText(variant_2, "en");
      const topic_en = await translateText(topic, "en");

      console.log(question_en, `✅question: ${question}`);
      await supabase.from(table).update([
        { question_en, variant_0_en, variant_1_en, variant_2_en, topic_en },
      ]).match({ id: row.id });
    } else {
      console.log("❌question is not null: ", question);
    }
  }

  console.log("✅✨Translation and update completed successfully.");
  return new Response("Translation and update completed successfully", {
    status: 200,
  });
});
