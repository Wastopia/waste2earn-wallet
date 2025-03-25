import List "mo:base/List";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Bool "mo:base/Bool";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";

actor ChatCanister {
  // Types
  public type MessageType = {
    #order;
    #message;
    #payment;
    #image;
  };

  public type Message = {
    id : Text;
    orderId : Text;
    sender : Principal;
    validatorId : ?Text;
    content : Text;
    messageType : MessageType;
    timestamp : Int;
    imageUrl : ?Text;
    isNew : Bool;
  };

  public type ChatSubscription = {
    subscriber: Principal;
    callback: shared Message -> async ();
  };

  // State
  private var messages = HashMap.HashMap<Text, Message>(0, Text.equal, Text.hash);
  private var subscriptions = HashMap.HashMap<Principal, ChatSubscription>(
    0, Principal.equal, Principal.hash
  );
  private var orderSubscriptions = HashMap.HashMap<Text, List.List<Principal>>(
    0, Text.equal, Text.hash
  );

  // Add a new message
  public shared(msg) func sendMessage(
    orderId: Text,
    validatorId: ?Text,
    content: Text,
    messageType: MessageType,
    imageUrl: ?Text
  ) : async Message {
    let sender = msg.caller;
    let messageId = Nat.toText(Int.abs(Time.now() / 1_000_000_000));
    
    let newMessage : Message = {
      id = messageId;
      orderId = orderId;
      sender = sender;
      validatorId = validatorId;
      content = content;
      messageType = messageType;
      timestamp = Int.abs(Time.now() / 1_000_000_000);
      imageUrl = imageUrl;
      isNew = true;
    };
    
    // Add to messages
    messages.put(messageId, newMessage);
    
    // Notify subscribers for this order
    switch (orderSubscriptions.get(orderId)) {
      case (?subscribers) {
        for (subscriber in List.toIter(subscribers)) {
          switch (subscriptions.get(subscriber)) {
            case (?subscription) {
              try {
                await subscription.callback(newMessage);
              } catch (_e) {
                // Handle error gracefully
              };
            };
            case (null) ();
          };
        };
      };
      case (null) ();
    };
    
    newMessage;
  };

  // Get messages for an order
  public query func getMessages(orderId: Text) : async [Message] {
    let orderMessages = Buffer.Buffer<Message>(0);
    
    for ((_, message) in messages.entries()) {
      if (message.orderId == orderId) {
        orderMessages.add(message);
      };
    };
    
    Buffer.toArray(orderMessages);
  };

  // Get new messages for an order
  public query func getNewMessages(orderId: Text) : async [Message] {
    let newMessages = Buffer.Buffer<Message>(0);
    
    for ((_, message) in messages.entries()) {
      if (message.orderId == orderId and message.isNew) {
        newMessages.add(message);
      };
    };
    
    Buffer.toArray(newMessages);
  };

  // Mark messages as read
  public shared(_msg) func markMessagesAsRead(orderId: Text) : async () {
    for ((messageId, message) in messages.entries()) {
      if (message.orderId == orderId) {
        let updatedMessage = {
          message with isNew = false;
        };
        messages.put(messageId, updatedMessage);
      };
    };
  };

  // Subscribe to chat updates for an order
  public shared(msg) func subscribeToOrder(orderId: Text, callback: shared Message -> async ()) : async () {
    let subscriber = msg.caller;
    
    // Add subscription
    let subscription : ChatSubscription = {
      subscriber = subscriber;
      callback = callback;
    };
    
    subscriptions.put(subscriber, subscription);
    
    // Add to order subscribers
    switch (orderSubscriptions.get(orderId)) {
      case (?subscribers) {
        orderSubscriptions.put(orderId, List.push(subscriber, subscribers));
      };
      case (null) {
        orderSubscriptions.put(orderId, List.push(subscriber, List.nil()));
      };
    };
  };

  // Unsubscribe from chat updates
  public shared(msg) func unsubscribeFromOrder(orderId: Text) : async () {
    let subscriber = msg.caller;
    
    // Remove subscription
    subscriptions.delete(subscriber);
    
    // Remove from order subscribers
    switch (orderSubscriptions.get(orderId)) {
      case (?subscribers) {
        let updatedSubscribers = List.filter<Principal>(
          subscribers,
          func(p) = Principal.notEqual(p, subscriber)
        );
        orderSubscriptions.put(orderId, updatedSubscribers);
      };
      case (null) ();
    };
  };

  // Get unread message count for an order
  public query func getUnreadCount(orderId: Text) : async Nat {
    var count = 0;
    
    for ((_, message) in messages.entries()) {
      if (message.orderId == orderId and message.isNew) {
        count += 1;
      };
    };
    
    count;
  };

  // Delete messages for an order
  public shared(_msg) func deleteOrderMessages(orderId: Text) : async () {
    let messageIdsToDelete = Buffer.Buffer<Text>(0);
    
    for ((messageId, message) in messages.entries()) {
      if (message.orderId == orderId) {
        messageIdsToDelete.add(messageId);
      };
    };
    
    for (messageId in messageIdsToDelete.vals()) {
      messages.delete(messageId);
    };
    
    orderSubscriptions.delete(orderId);
  };

  // Get message by ID
  public query func getMessage(messageId: Text) : async ?Message {
    messages.get(messageId);
  };

  // Update message
  public shared(msg) func updateMessage(messageId: Text, content: Text) : async Result.Result<Message, Text> {
    switch (messages.get(messageId)) {
      case (?message) {
        if (Principal.equal(message.sender, msg.caller)) {
          let updatedMessage = {
            message with 
              content = content;
              timestamp = Time.now();
          };
          messages.put(messageId, updatedMessage);
          #ok(updatedMessage);
        } else {
          #err("Not authorized to update this message");
        };
      };
      case (null) {
        #err("Message not found");
      };
    };
  };

  // Delete message
  public shared(msg) func deleteMessage(messageId: Text) : async Result.Result<(), Text> {
    switch (messages.get(messageId)) {
      case (?message) {
        if (Principal.equal(message.sender, msg.caller)) {
          messages.delete(messageId);
          #ok();
        } else {
          #err("Not authorized to delete this message");
        };
      };
      case (null) {
        #err("Message not found");
      };
    };
  };
}