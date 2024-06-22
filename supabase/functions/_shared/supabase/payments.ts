import { supabase } from "./index.ts";

export async function sendPaymentInfo(user_id: string, level: string): Promise<any> {
  const { data, error } = await supabase
    .from('payments')
    .insert([
      { user_id: user_id, level: level }
    ]);

  if (error) {
    console.error('Error sending payment info:', error);
  } else {
    console.log('Payment info sent successfully:', data);
    return data
  }
}

export async function getPaymentsInfoByUsername(username: string): Promise<any> {
  // Получаем user_id по username из таблицы users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_id')
    .eq('username', username)
    .single();

  if (userError) {
    console.error('Error fetching user ID:', userError);
    return null;
  }

  const user_id = userData.user_id;

  // Получаем все строчки с данным user_id из таблицы payments
  const { data: paymentsData, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user_id);

  if (paymentsError) {
    console.error('Error fetching payments info:', paymentsError);
    return null;
  }

  return paymentsData;
}

