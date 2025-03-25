export const idlFactory = ({ IDL }) => {
  const MessageType = IDL.Variant({
    'order': IDL.Null,
    'message': IDL.Null,
    'payment': IDL.Null,
    'image': IDL.Null
  });
  
  const Message = IDL.Record({
    'id': IDL.Text,
    'orderId': IDL.Text,
    'sender': IDL.Principal,
    'validatorId': IDL.Opt(IDL.Text),
    'content': IDL.Text,
    'messageType': MessageType,
    'timestamp': IDL.Int,
    'imageUrl': IDL.Opt(IDL.Text),
    'isNew': IDL.Bool
  });
  
  const Result = IDL.Variant({
    'ok': Message,
    'err': IDL.Text
  });
  
  const Result_1 = IDL.Variant({
    'ok': IDL.Tuple(),
    'err': IDL.Text
  });
  
  return IDL.Service({
    'deleteMessage': IDL.Func([IDL.Text], [Result_1], []),
    'deleteOrderMessages': IDL.Func([IDL.Text], [], []),
    'getMessage': IDL.Func([IDL.Text], [IDL.Opt(Message)], ['query']),
    'getMessages': IDL.Func([IDL.Text], [IDL.Vec(Message)], ['query']),
    'getNewMessages': IDL.Func([IDL.Text], [IDL.Vec(Message)], ['query']),
    'getUnreadCount': IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    'markMessagesAsRead': IDL.Func([IDL.Text], [], []),
    'sendMessage': IDL.Func(
      [IDL.Text, IDL.Opt(IDL.Text), IDL.Text, MessageType, IDL.Opt(IDL.Text)],
      [Message],
      []
    ),
    'subscribeToOrder': IDL.Func(
      [IDL.Text, IDL.Func([Message], [], ['oneway'])],
      [],
      []
    ),
    'unsubscribeFromOrder': IDL.Func([IDL.Text], [], []),
    'updateMessage': IDL.Func([IDL.Text, IDL.Text], [Result], [])
  });
}; 