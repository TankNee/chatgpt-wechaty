import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const SELF_MODE = process.env.SELF_MODE ? parseInt(process.env.SELF_MODE, 10) : 0;
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ? process.env.OPENAI_BASE_URL : 'https://api.openai.com';
export const ROOM_WHITE_LIST = process.env.ROOM_WHITE_LIST ? process.env.ROOM_WHITE_LIST.split(',') : [];
export const { NODE_ENV, WECHATY_TYPE, PAD_LOCAL_TOKEN, OPENAI_API_KEY } = process.env;

export const MAX_TOKENS = process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS, 10) : 512;
export const TEMPERATURE = process.env.TEMPERATURE ? parseFloat(process.env.TEMPERATURE) : 0.7;
export const TOP_P = process.env.TOP_P ? parseFloat(process.env.TOP_P) : 0.5;
export const MODEL_NAME = process.env.MODEL_NAME ? process.env.MODEL_NAME : 'gpt-3.5-turbo';
export const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT ? process.env.SYSTEM_PROMPT : 'You are a friendly AI assistant.';
