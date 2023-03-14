import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ? process.env.OPENAI_BASE_URL : 'https://api.openai.com';
export const { NODE_ENV, WECHATY_TYPE, PAD_LOCAL_TOKEN, SESSION_TOKEN, OPENAI_API_KEY } = process.env;
