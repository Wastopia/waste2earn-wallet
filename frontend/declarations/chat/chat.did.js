export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const MessageType = IDL.Variant({
    'order' : IDL.Null,
    'message' : IDL.Null,
    'image' : IDL.Null,
    'payment' : IDL.Null,
  });
  const Message = IDL.Record({
    'id' : IDL.Text,
    'content' : IDL.Text,
    'sender' : IDL.Principal,
    'orderId' : IDL.Text,
    'messageType' : MessageType,
    'imageUrl' : IDL.Opt(IDL.Text),
    'timestamp' : IDL.Int,
    'isNew' : IDL.Bool,
    'validatorId' : IDL.Opt(IDL.Text),
  });
  const Result = IDL.Variant({ 'ok' : Message, 'err' : IDL.Text });
  return IDL.Service({
    'deleteMessage' : IDL.Func([IDL.Text], [Result_1], []),
    'deleteOrderMessages' : IDL.Func([IDL.Text], [], []),
    'getMessage' : IDL.Func([IDL.Text], [IDL.Opt(Message)], ['query']),
    'getMessages' : IDL.Func([IDL.Text], [IDL.Vec(Message)], ['query']),
    'getNewMessages' : IDL.Func([IDL.Text], [IDL.Vec(Message)], ['query']),
    'getUnreadCount' : IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    'markMessagesAsRead' : IDL.Func([IDL.Text], [], []),
    'sendMessage' : IDL.Func(
        [IDL.Text, IDL.Opt(IDL.Text), IDL.Text, MessageType, IDL.Opt(IDL.Text)],
        [Message],
        [],
      ),
    'subscribeToOrder' : IDL.Func(
        [IDL.Text, IDL.Func([Message], [], [])],
        [],
        [],
      ),
    'unsubscribeFromOrder' : IDL.Func([IDL.Text], [], []),
    'updateMessage' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
