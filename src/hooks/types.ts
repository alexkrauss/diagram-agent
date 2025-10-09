/**
 * Message types for the chat interface.
 * These types define the structure of messages in the conversation.
 */

export interface TextPart {
  type: 'text';
  text: string;
}

export interface FilePart {
  type: 'file';
  file: File;
  url?: string;
}

export type MessagePart = TextPart | FilePart;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

export interface ChatHandler {
  messages: Message[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  sendMessage: (message: Message) => Promise<void>;
}
