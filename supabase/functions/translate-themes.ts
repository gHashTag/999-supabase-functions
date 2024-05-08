import { client } from "./utils/client.ts";
import { translateText } from "./utils/translateText.ts";

const supabase = client()

export async function translateThemes(table: string) {
  const { data: javascriptData, error } = await supabase.from(table).select('*').limit(10)

  console.log(javascriptData)
  if (error) {
    console.error('Error fetching data from Supabase:', error.message);
    return;
  }

  for (const row of javascriptData) {
    const { question, variant_0, variant_1, variant_2, topic } = row;
    const question_en = await translateText(question, 'en');
    const variant_0_en = await translateText(variant_0, 'en');
    const variant_1_en = await translateText(variant_1, 'en');
    const variant_2_en = await translateText(variant_2, 'en');
    const topic_en = await translateText(topic, 'en');

    await supabase.from(table).update([
      { question_en, variant_0_en, variant_1_en, variant_2_en, topic_en }
    ]).match({ id: row.id });
  }

  console.log('Translation and update completed successfully.');
}

