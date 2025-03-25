# Chat Canister Integration Guide

This guide explains how to integrate the `ChatCanister` with the frontend application for validator communication.

## Overview

The chat system consists of:

1. **Backend (`chat.mo`)**: Motoko canister that handles chat messages
2. **Frontend Services (`chat.ts`)**: TypeScript service for interacting with the canister
3. **UI Integration (`ChatModal.tsx`)**: React component that uses the chat service

## Deployment

1. Deploy the chat canister using dfx:

```bash
dfx deploy chat
```

2. Get the canister ID:

```bash
dfx canister id chat
```

3. Set the canister ID in your environment variables:

```
# .env file
CHAT_CANISTER_ID=$(dfx canister id chat)
```

## Frontend Integration

### 1. Services

The `chatService` in `frontend/services/chat.ts` provides methods to interact with the chat canister:

- `sendMessage`: Send a new message
- `getMessages`: Get all messages for an order
- `getNewMessages`: Get only new/unread messages
- `markMessagesAsRead`: Mark messages as read
- `getUnreadCount`: Get count of unread messages
- `deleteOrderMessages`: Delete all messages for an order
- `updateMessage`: Update message content
- `deleteMessage`: Delete a specific message

### 2. Usage in Components

```typescript
import { chatService } from "@/services/chat";

// Get messages for an order
const messages = await chatService.getMessages(orderId);

// Send a message
await chatService.sendMessage({
  orderId: "order-123",
  validatorId: "validator-456", // Optional
  content: "Hello, validator!",
  type: "message", // 'message', 'order', 'payment', or 'image'
  imageUrl: "data:image/png;base64,..." // Optional
});

// Mark messages as read
await chatService.markMessagesAsRead(orderId);
```

### 3. Message Types

The chat system supports four message types:

- `message`: Regular text messages
- `order`: Order-related system messages
- `payment`: Payment instruction messages
- `image`: Image attachment messages

## Data Flow

1. User creates an order
2. Order appears in chat as an 'order' message
3. User selects a validator to chat with
4. Messages are sent and received through the chat canister
5. Payment proof can be sent as an 'image' message
6. System messages (order status changes) are sent as 'message' type

## Message Format

Messages have the following structure:

```typescript
interface Message {
  id: string;           // Unique ID
  orderId: string;      // Order ID this message belongs to
  sender: Principal;    // Sender's principal ID
  validatorId?: string; // Optional validator ID
  content: string;      // Message content
  messageType: MessageType; // "message", "order", "payment", or "image"
  timestamp: Int;       // Unix timestamp
  imageUrl?: string;    // Optional image URL (for image messages)
  isNew: boolean;       // Whether the message is unread
}
```

## Polling and Real-time Updates

The frontend polls for new messages every 5 seconds using:

```typescript
useEffect(() => {
  const intervalId = setInterval(async () => {
    const newMessages = await chatService.getNewMessages(orderId);
    // Process new messages...
  }, 5000);
  
  return () => clearInterval(intervalId);
}, [orderId]);
```

## Error Handling

All service methods include proper error handling:

```typescript
try {
  await chatService.sendMessage({
    orderId,
    content,
    type: "message"
  });
} catch (error) {
  console.error("Failed to send message:", error);
  // Show error notification
}
```

## Considerations

1. **Authentication**: Ensure users are authenticated before using chat services
2. **Image Handling**: Images are sent as base64 data URLs and should be kept small
3. **Principal IDs**: Make sure window.userPrincipal is set for proper sender identification
4. **Order Lifecycle**: Messages should be deleted when orders are completed 