import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const SELF_MODE = process.env.SELF_MODE ? parseInt(process.env.SELF_MODE, 10) : 0;
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ? process.env.OPENAI_BASE_URL : 'https://api.openai.com';
export const ROOM_WHITE_LIST = process.env.ROOM_WHITE_LIST ? process.env.ROOM_WHITE_LIST.split(',') : [];
export const { NODE_ENV, WECHATY_TYPE, PAD_LOCAL_TOKEN, SESSION_TOKEN, OPENAI_API_KEY } = process.env;
