export interface CreateUserProps {
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
}
