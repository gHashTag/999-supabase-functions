// USERS
export type TUser = Readonly<{
  auth_date?: number;
  first_name: string;
  last_name?: string;
  hash?: string;
  id?: number;
  photo_url?: string;
  username?: string;
}>;

export type SupabaseUser = TUser & {
  user_id: string;
  inviter?: string | null;
  is_bot?: boolean | null;
  language_code?: string | null;
  telegram_id?: number | null;
  email?: string | null;
  created_at?: Date;
  aggregateverifier?: string | null;
  admin_email?: string | null;
  role?: string | null;
  display_name?: string | null;
  select_izbushka?: string | null;
  position?: string | null;
  designation?: string | null;
  avatar_id: string;
  voice_id: string;
};

export interface UserContext {
        username: string;
        first_name: string;
        last_name?: string;
        is_bot: boolean;
        language_code: string;
        chat_id: number
        inviter: string
        telegram_id: number
}

export interface UserData extends TUser {
  is_bot: boolean;
  language_code: string;
  telegram_id: number;
  email: string;
}

// PASSPORT
export interface UserPassport {
  user_id: string;
  workspace_id: string;
  room_id: string;
  username: string;
  first_name: string;
  last_name: string;
  chat_id: number;
  type: "room" | "task" | "workspace";
  is_owner: boolean;
  photo_url?: string;
  task_id?: string;
  passport_id?: string;
  recording_id?: string;
  rooms?: RoomNode[];
}

export interface CheckPassportResult {
  passport?: UserPassport[];
  passport_id?: string;
}

export interface CheckPassportIsExistingResult {
  isExistingPassport: boolean;
  passport?: UserPassport[];
  passport_id?: string;
}

// WORKSPACES

export interface WorkspaceNode {
  background: string;
  colors: string[][];
  created_at: string;
  id: string;
  title: string;
  type: string;
  updated_at: string;
  user_id: string;
  workspace_id: string;
}

// ROOMS

export type RoomInfoT = {
  __typename: string;
  chat_id: string;
  name: string;
  type: string;
  codes: string;
};

export interface PassportUser {
  user_id: string;
  workspace_id: string;
  room_id: string;
  username: string;
  first_name: string;
  last_name: string;
  chat_id: number;
  type: "room";
  is_owner: boolean;
  photo_url: string | null;
  rooms: { chat_id: string };
}

export interface RoomNode {
  id: number;
  created_at: string;
  updated_at?: string | null;
  workspace_id?: string | null;
  type: string;
  id_additional?: string | null;
  name: string;
  enabled?: boolean | null;
  description?: string | null;
  customer_id?: string | null;
  app_id?: string | null;
  recording_info?: string | null;
  template_id?: string | null;
  template?: string | null;
  region?: string | null;
  customer?: string | null;
  large_room?: boolean | null;
  codes: string;
  type_additional?: string | null;
  user_id?: string | null;
  room_id: string;
  language_code: string;
  chat_id: number;
  token?: string | null;
  username: string;
  original_name?: string | null;
  public?: boolean | null;
  rooms?: RoomInfoT;
}

export interface GetSelectIzbushkaIdResult {
  dataIzbushka: RoomNode[];
  izbushka: RoomNode | null;
  selectIzbushkaError: { message: string; code?: string } | null;
}

// PROGRESS
export interface updateProgressContext {
  user_id: string;
  isTrue: boolean;
  language: string;
}

export interface UpdateResultParams {
  user_id: string;
  language: string;
  value: boolean;
}

export interface getQuestionT {
  ctx: QuestionContext;
  language: string;
}

export interface getBiggestT {
  lesson_number: number;
  language: string;
}

export interface QuestionContext {
  lesson_number?: number;
  subtopic?: number;
}

export interface resetProgressT {
  username: string;
  language: string;
}

export interface getCorrectsT {
  user_id: string;
  language: string;
}

export interface Progress {
  [key: string]: number;
}

export interface LessonData {
  lesson_number: number;
}

export interface SubtopicData {
  subtopic: string;
}

export interface LastCallbackResult {
  lesson_number: number;
  subtopic: string;
}

export interface CheckAndReturnUserResult {
  isUserExist: boolean;
  user: SupabaseUser | null;
}

export interface CheckUsernameCodesResult {
  isInviterExist: boolean;
  invitation_codes: string | undefined;
  error: boolean;
  inviter_user_id: string;
}

export interface SelectIzbushkaError {
  message: string;
  code?: string;
}

// SUPABASE
export interface SupabaseResponse<T> {
  data: T[] | null;
  error: SelectIzbushkaError | null;
}

export interface RoomAsset {
  account_id: string;
  app_id: string;
  duration: number;
  metadata_id: string;
  metadata_timestamp: string;
  recording_id: string;
  room_id: string;
  room_name: string;
  session_id: string;
  summary_json_asset_id: string;
  summary_json_path: string;
  summary_json_presigned_url: string;
  transcript_json_asset_id: string;
  transcript_json_path: string;
  transcript_json_presigned_url: string;
  transcript_srt_asset_id: string;
  transcript_srt_path: string;
  transcript_srt_presigned_url: string;
  transcript_txt_asset_id: string;
  transcript_txt_path: string;
  transcript_txt_presigned_url: string;
  transcription_id: string;
}

export interface TranscriptionAsset extends RoomAsset {
  title: string;
  summary_short: string;
  transcription: string;
  user_id: string;
  workspace_id: string;
}

export interface getAiFeedbackT {
  query: string;
  endpoint: string;
  token?: string;
}

export interface Filter {
  username: string;
  user_id: string;
  workspace_id: string;
  room_id: string;
  recording_id: string;
}

export interface getAiSupabaseFeedbackT {
  query: string;
  id_array: string[];
  username: string;
  language_code: string;
}

export interface createVoiceT {
  file: Blob
  telegram_id: string
}


export interface UserProfile {
  username: string;
  company: string;
  position: string;
  description: string;
  interests: string;
}

export type AiRole = "system" | "user" | "assistant";
