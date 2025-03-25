import { Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { createActor } from '../declarations/chat';
import { getAuthClient } from '../services/auth';

export type MessageType = 'order' | 'message' | 'payment' | 'image';

export interface Message {
  id: string;
  orderId: string;
  sender: Principal;
  validatorId?: string;
  content: string;
  messageType: { [key: string]: null };
  timestamp: bigint;
  imageUrl?: string;
  isNew: boolean;
}

// Helper function to convert canister message type to frontend type
const messageTypeToString = (type: { [key: string]: null }): MessageType => {
  if ('order' in type) return 'order';
  if ('message' in type) return 'message';
  if ('payment' in type) return 'payment';
  if ('image' in type) return 'image';
  return 'message'; // default
};

// Helper function to convert frontend type to canister type
const stringToMessageType = (type: MessageType): { [key: string]: null } => {
  switch (type) {
    case 'order': return { order: null };
    case 'message': return { message: null };
    case 'payment': return { payment: null };
    case 'image': return { image: null };
    default: return { message: null };
  }
};

// Transform canister message to frontend message
const transformMessage = (message: any): Message => {
  return {
    ...message,
    validatorId: message.validatorId[0] || undefined,
    imageUrl: message.imageUrl[0] || undefined,
    messageType: messageTypeToString(message.messageType)
  };
};

// Transform array of canister messages to frontend messages
const transformMessages = (messages: any[]): Message[] => {
  return messages.map(transformMessage);
};

class ChatService {
  private actor: any;
  private identity: Identity | null = null;

  constructor() {
    // Will be initialized later when identity is available
    this.actor = null;
  }

  async init(): Promise<void> {
    const authClient = await getAuthClient();
    const isAuthenticated = await authClient.isAuthenticated();
    if (isAuthenticated) {
      this.identity = authClient.getIdentity();
      const canisterId = process.env.CHAT_CANISTER_ID || '';
      this.actor = await createActor(canisterId, {
        agentOptions: {
          identity: this.identity,
        },
      });
    }
  }

  async getActor() {
    if (!this.actor) {
      await this.init();
    }
    return this.actor;
  }

  async sendMessage(params: {
    orderId: string;
    validatorId?: string;
    content: string;
    type: MessageType;
    imageUrl?: string;
  }): Promise<Message> {
    const actor = await this.getActor();
    if (!actor) throw new Error('Not authenticated');

    const result = await actor.sendMessage(
      params.orderId,
      params.validatorId ? [params.validatorId] : [],
      params.content,
      stringToMessageType(params.type),
      params.imageUrl ? [params.imageUrl] : []
    );

    return transformMessage(result);
  }

  async getMessages(orderId: string): Promise<Message[]> {
    const actor = await this.getActor();
    if (!actor) throw new Error('Not authenticated');

    const messages = await actor.getMessages(orderId);
    return transformMessages(messages);
  }

  async getNewMessages(orderId: string): Promise<Message[]> {
    const actor = await this.getActor();
    if (!actor) throw new Error('Not authenticated');

    const messages = await actor.getNewMessages(orderId);
    return transformMessages(messages);
  }

  async markMessagesAsRead(orderId: string): Promise<void> {
    const actor = await this.getActor();
    if (!actor) throw new Error('Not authenticated');

    await actor.markMessagesAsRead(orderId);
  }

  async getUnreadCount(orderId: string): Promise<number> {
    const actor = await this.getActor();
    if (!actor) throw new Error('Not authenticated');

    return Number(await actor.getUnreadCount(orderId));
  }

  async deleteOrderMessages(orderId: string): Promise<void> {
    const actor = await this.getActor();
    if (!actor) throw new Error('Not authenticated');

    await actor.deleteOrderMessages(orderId);
  }

  async updateMessage(messageId: string, content: string): Promise<Message | null> {
    const actor = await this.getActor();
    if (!actor) throw new Error('Not authenticated');

    const result = await actor.updateMessage(messageId, content);
    if ('ok' in result) {
      return transformMessage(result.ok);
    }
    return null;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const actor = await this.getActor();
    if (!actor) throw new Error('Not authenticated');

    const result = await actor.deleteMessage(messageId);
    return 'ok' in result;
  }
}

export const chatService = new ChatService(); 