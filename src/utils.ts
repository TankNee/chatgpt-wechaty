import { MessageInterface } from 'wechaty/impls';
import fs from 'fs';

export interface RoomMessage {
  text: string;
  time: Date;
  talker: string;
}

export function isNullOrEmpty(str: string): boolean {
  return str === null || str === undefined || str === '';
}

export async function saveRoomMessage(message: MessageInterface) {
  const roomName = await message.room()?.topic();
  const roomId = message.room()?.id;
  const takerName = message.talker()?.name();
  const messageText = message.text();
  const messageTime = message.date();

  const path = `./history/wechat_${roomId}.json`;

  if (isNullOrEmpty(roomName) || isNullOrEmpty(takerName) || isNullOrEmpty(messageText)) {
    return;
  }

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '[]');
  }
  const data = JSON.parse(fs.readFileSync(path, 'utf-8')) as RoomMessage[];
  data.push({ text: messageText, time: messageTime, talker: takerName });

  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

export function getRoomMessage(roomId: string, num: number): RoomMessage[] {
  const path = `./history/wechat_${roomId}.json`;
  const data = JSON.parse(fs.readFileSync(path, 'utf-8')) as RoomMessage[];
  // 最后的num条消息
  return data.slice(-num);
}
