
export type Role = 'user' | 'assistant' | 'system';

export type RenderSize = 'Mini HD' | 'Full HD' | '1K' | '2K' | '4K';

export type AspectRatio = '16:9' | '4:3' | '1:1';

export type ModelTier = 'free' | 'pro';

export interface Attachment {
  type: 'image' | 'video';
  url: string;
  base64?: string;
  mimeType?: string;
}

export interface RenderHistoryItem {
  id: string;
  prompt: string;
  size: RenderSize;
  imageUrl: string;
  timestamp: number;
  cost: number;
  aspectRatio?: AspectRatio;
  modelTier?: ModelTier;
}

export interface UsageStats {
  renderCount: number;
  totalCost: number;
  lastReset: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

export enum AppTab {
  RENDER = 'render',
  HISTORY = 'history'
}
