import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Message {
  'id' : string,
  'content' : string,
  'sender' : Principal,
  'orderId' : string,
  'messageType' : MessageType,
  'imageUrl' : [] | [string],
  'timestamp' : bigint,
  'isNew' : boolean,
  'validatorId' : [] | [string],
}
export type MessageType = { 'order' : null } |
  { 'message' : null } |
  { 'image' : null } |
  { 'payment' : null };
export type Result = { 'ok' : Message } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export interface _SERVICE {
  'deleteMessage' : ActorMethod<[string], Result_1>,
  'deleteOrderMessages' : ActorMethod<[string], undefined>,
  'getMessage' : ActorMethod<[string], [] | [Message]>,
  'getMessages' : ActorMethod<[string], Array<Message>>,
  'getNewMessages' : ActorMethod<[string], Array<Message>>,
  'getUnreadCount' : ActorMethod<[string], bigint>,
  'markMessagesAsRead' : ActorMethod<[string], undefined>,
  'sendMessage' : ActorMethod<
    [string, [] | [string], string, MessageType, [] | [string]],
    Message
  >,
  'subscribeToOrder' : ActorMethod<[string, [Principal, string]], undefined>,
  'unsubscribeFromOrder' : ActorMethod<[string], undefined>,
  'updateMessage' : ActorMethod<[string, string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
