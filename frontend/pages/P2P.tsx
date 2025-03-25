import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@redux/Store';
import { p2pService } from '@/services/p2p';
import { Order, PaymentMethod, P2PPaymentVerification, PaymentVerification } from '@/types/p2p';
import { Button, Card, Typography, Grid, TextField, MenuItem, Box, Dialog, DialogContent, DialogTitle, IconButton, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import { clsx } from 'clsx';
import { CustomButton } from '@components/CustomButton';
import { LoadingLoader } from '@components/LoadingLoader';
import { useTranslation } from 'react-i18next';
import { LocalRxdbDatabase } from '@database/local-rxdb';
import { useAppSelector } from '@redux/Store';
import AttachFileIcon from '@mui/icons-material/AttachFile';

import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import { styled } from '@mui/material/styles';
import ChatIcon from '@mui/icons-material/Chat';
import LockIcon from '@mui/icons-material/Lock';
import WarningIcon from '@mui/icons-material/Warning';

interface Message {
  id: string;
  type: 'order' | 'message' | 'payment' | 'image';
  content: string;
  sender: 'validator' | 'user';
  timestamp: Date;
  orderDetails?: {
    id: string;
    amount: number;
    price: number;
    status: string;
    paymentMethod: PaymentMethod;
  };
  isNew?: boolean;
  imageUrl?: string;
  validatorId?: string;
}

// Add these constants
const ORDER_STATUS_TRACKING = {
  CREATED: "created",
  ESCROW_PENDING: "escrow_pending",
  ESCROW_LOCKED: "escrow_locked",
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_SUBMITTED: "payment_submitted",
  COMPLETED: "completed",
  DISPUTED: "disputed",
  CANCELLED: "cancelled",
  EXPIRED: "expired"
} as const;

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '500px',
  width: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden'
}));

const MessagesContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
});

const MessageInputContainer = styled(Box)(({ theme }) => ({
  padding: '16px',
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: '8px',
  alignItems: 'center'
}));

// Add styled components for messages
const MessageBubble = styled(Box)<{ sender: 'user' | 'validator' }>(({ theme, sender }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 12px',
  borderRadius: '12px',
  maxWidth: '80%',
  marginLeft: sender === 'user' ? 'auto' : '0',
  marginRight: sender === 'validator' ? 'auto' : '0',
  backgroundColor: sender === 'user' ? theme.palette.primary.main : theme.palette.grey[100],
  color: sender === 'user' ? theme.palette.primary.contrastText : theme.palette.text.primary,
}));

const MessageTime = styled(Typography)({
  fontSize: '0.75rem',
  opacity: 0.7,
  marginTop: '4px',
});

const ImageContainer = styled(Box)({
  position: 'relative',
  '& img': {
    maxWidth: '100%',
    borderRadius: '8px',
  },
});

// Shared renderMessage function
const renderChatMessage = (
  message: Message,
  selectedValidator: string | undefined,
  loading: boolean,
  handlePaymentReceived: (orderId: string, amount: number) => void,
  t: (key: string) => string
) => {
  if (message.type === 'image') {
    return (
      <MessageBubble sender={message.sender}>
        <ImageContainer>
          {message.imageUrl && (
            <>
              <img 
                src={message.imageUrl} 
                alt="Payment proof" 
              />
              {selectedValidator && message.orderDetails && (
                <CustomButton
                  className={clsx(
                    "mt-2 w-full bg-green-500 text-white text-sm py-1",
                    "hover:bg-green-600"
                  )}
                  onClick={() => message.orderDetails && handlePaymentReceived(
                    message.orderDetails.id,
                    message.orderDetails.amount
                  )}
                  disabled={loading}
                >
                  {loading ? <LoadingLoader /> : t("Confirm Payment Received")}
                </CustomButton>
              )}
            </>
          )}
          <MessageTime>
            {message.timestamp.toLocaleTimeString()}
          </MessageTime>
        </ImageContainer>
      </MessageBubble>
    );
  }

  return (
    <MessageBubble sender={message.sender}>
      <Typography>{message.content}</Typography>
      <MessageTime>
        {message.timestamp.toLocaleTimeString()}
      </MessageTime>
    </MessageBubble>
  );
};

interface P2PChatBoxProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onSendImage: (file: File) => void;
  selectedValidator?: string;
  loading: boolean;
  handlePaymentReceived: (orderId: string, amount: number) => void;
  t: (key: string) => string;
}

const P2PChatBox: React.FC<P2PChatBoxProps> = ({
  open,
  onClose,
  orderId,
  messages,
  onSendMessage,
  onSendImage,
  selectedValidator,
  loading,
  handlePaymentReceived,
  t
}) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendImage(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Order Chat #{orderId}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <ChatContainer>
          <MessagesContainer>
            {messages.map((message, index) => (
              <Box key={message.id || index} sx={{ mb: 2 }}>
                {renderChatMessage(message, selectedValidator, loading, handlePaymentReceived, t)}
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </MessagesContainer>
          <MessageInputContainer>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageChange}
            />
            <IconButton onClick={handleImageClick} color="primary">
              <ImageIcon />
            </IconButton>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              variant="outlined"
              size="small"
            />
            <IconButton 
              onClick={handleSend}
              color="primary"
              disabled={!messageText.trim()}
            >
              <SendIcon />
            </IconButton>
          </MessageInputContainer>
        </ChatContainer>
      </DialogContent>
    </Dialog>
  );
};

// Add EscrowModal component
interface EscrowModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onAccept: (order: Order) => Promise<void>;
  loading: boolean;
  t: (key: string) => string;
}

const EscrowModal: React.FC<EscrowModalProps> = ({
  open,
  onClose,
  order,
  onAccept,
  loading,
  
}) => {
  if (!order) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LockIcon color="primary" />
          <Typography variant="h6">Escrow Confirmation</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Order Details
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography>Amount: {order.amount} WASTE</Typography>
            <Typography>Price: {order.price} PHP</Typography>
            <Typography>Payment Method: {order.paymentMethod.name}</Typography>
            <Typography>Seller ID: {order.sellerId}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'warning.main' }}>
            <WarningIcon />
            <Typography variant="body2">
              By accepting this order, {order.amount} WASTE tokens will be locked in escrow.
              The tokens will be released to the seller once payment is verified.
            </Typography>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onAccept(order)}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Processing...' : 'Confirm & Lock in Escrow'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export const P2P: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { userPrincipal } = useSelector((state: RootState) => state.auth);
  const principal = userPrincipal?.toString();
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrder, setNewOrder] = useState({
    amount: '',
    price: '',
    paymentMethod: ''
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedValidator, setSelectedValidator] = useState<string>('');
  const assets = useAppSelector((state) => state.asset.list.assets);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [escrowModalOpen, setEscrowModalOpen] = useState(false);
  const [selectedOrderForEscrow, setSelectedOrderForEscrow] = useState<Order | null>(null);
  const [paymentVerifications, setPaymentVerifications] = useState<P2PPaymentVerification[]>([]);
  const [validators, setValidators] = useState<Array<{ id: string; name: string }>>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadPaymentMethods();
    loadValidators();
  }, []);

  useEffect(() => {
    loadPaymentVerifications();
  }, [currentOrderId]);

  const loadData = async () => {
    try {
      const availableOrders = await p2pService.getAvailableOrders();
      setOrders(availableOrders);
    } catch (error) {
      console.error('Error loading P2P data:', error);
      enqueueSnackbar('Failed to load P2P data', { variant: 'error' });
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await p2pService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      enqueueSnackbar('Failed to load payment methods', { variant: 'error' });
    }
  };

  const loadPaymentVerifications = async () => {
    if (!currentOrderId) return;
    
    try {
      const verifications = await LocalRxdbDatabase.instance.getPaymentVerificationsByOrder(currentOrderId);
      // Convert PaymentVerification to P2PPaymentVerification
      const p2pVerifications: P2PPaymentVerification[] = verifications.map(v => ({
        id: v.orderId,
        transactionId: v.orderId,
        userId: principal || '',
        status: v.status,
        proof: v.proof || '',
        createdAt: v.verifiedAt?.toISOString() || new Date().toISOString(),
        verifiedAt: v.verifiedAt?.toISOString(),
        notes: ''
      }));
      setPaymentVerifications(p2pVerifications);
    } catch (error) {
      console.error('Error loading payment verifications:', error);
      enqueueSnackbar('Failed to load payment verifications', { variant: 'error' });
    }
  };

  const loadValidators = async () => {
    try {
      const validatorList = await LocalRxdbDatabase.instance.getValidators();
      setValidators(validatorList.map(v => ({
        id: v.id,
        name: v.name
      })));
    } catch (error) {
      console.error('Error loading validators:', error);
      enqueueSnackbar('Failed to load validators', { variant: 'error' });
    }
  };

  const handleCreateOrder = async () => {
    if (!principal) {
      enqueueSnackbar('Please login to create an order', { variant: 'error' });
      return;
    }

    try {
      const selectedMethod = paymentMethods.find(m => m.id === newOrder.paymentMethod);
      if (!selectedMethod) {
        enqueueSnackbar('Please select a payment method', { variant: 'error' });
        return;
      }

      await p2pService.createOrder({
        sellerId: principal,
        amount: parseFloat(newOrder.amount),
        price: parseFloat(newOrder.price),
        paymentMethod: selectedMethod
      });
      enqueueSnackbar('Order created successfully', { variant: 'success' });
      setNewOrder({ amount: '', price: '', paymentMethod: '' });
      loadData();
    } catch (error) {
      console.error('Error creating order:', error);
      enqueueSnackbar('Failed to create order', { variant: 'error' });
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    if (!principal) {
      enqueueSnackbar('Please login to accept order', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      await p2pService.lockTokensInEscrow(order);
      await p2pService.updateOrderStatus(order.id, "payment_pending");
      enqueueSnackbar('Order accepted successfully', { variant: 'success' });
      setEscrowModalOpen(false);
      setSelectedOrderForEscrow(null);
      loadData();
    } catch (error) {
      console.error('Error accepting order:', error);
      enqueueSnackbar('Failed to accept order', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    if (!principal) {
      enqueueSnackbar('Please login to verify payment', { variant: 'error' });
      return;
    }

    try {
      const order = await p2pService.getOrderById(orderId);
      if (!order) {
        enqueueSnackbar('Order not found', { variant: 'error' });
        return;
      }

      if (order.sellerId !== principal) {
        enqueueSnackbar('Only the seller can verify payments', { variant: 'error' });
        return;
      }

      // Update payment verification status
      const verification = paymentVerifications.find(v => v.transactionId === orderId);
      if (verification) {
        const verifiedAt = new Date();
        
        // Update database record
        const dbVerification: PaymentVerification = {
          orderId: verification.transactionId,
          proof: verification.proof,
          status: 'verified',
          verifiedAt
        };
        await LocalRxdbDatabase.instance.updatePaymentVerification(orderId, dbVerification);

        // Update state
        const updatedVerification: P2PPaymentVerification = {
          ...verification,
          status: 'verified',
          verifiedAt: verifiedAt.toISOString()
        };
        setPaymentVerifications(prev => 
          prev.map(v => v.id === verification.id ? updatedVerification : v)
        );
      }

      const success = await p2pService.verifyPayment(orderId);
      if (success) {
        enqueueSnackbar('Payment verified successfully', { variant: 'success' });
        loadData();
      } else {
        enqueueSnackbar('Failed to verify payment', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      enqueueSnackbar('Failed to verify payment', { variant: 'error' });
    }
  };

  const handleDispute = async (orderId: string) => {
    if (!principal) {
      enqueueSnackbar('Please login to dispute order', { variant: 'error' });
      return;
    }

    try {
      const order = await p2pService.getOrderById(orderId);
      if (!order) {
        enqueueSnackbar('Order not found', { variant: 'error' });
        return;
      }

      const success = await p2pService.disputeOrder(orderId);
      if (success) {
        enqueueSnackbar('Order disputed successfully', { variant: 'success' });
        loadData();
      } else {
        enqueueSnackbar('Failed to dispute order', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error disputing order:', error);
      enqueueSnackbar('Failed to dispute order', { variant: 'error' });
    }
  };

  const handlePaymentReceived = async (orderId: string, amount: number) => {
    try {
      setLoading(true);
      await p2pService.updateOrderStatus(orderId, ORDER_STATUS_TRACKING.COMPLETED);
      
      const userAssets = assets.find((asset: { tokenSymbol: string }) => 
        asset.tokenSymbol === "WASTE"
      );
      
      if (userAssets) {
        const updatedAsset = {
          ...userAssets,
          subAccounts: userAssets.subAccounts.map(subAccount => ({
            ...subAccount,
            amount: (parseFloat(subAccount.amount) + amount).toString(),
            currency_amount: (parseFloat(subAccount.currency_amount || "0") + amount).toString()
          }))
        };
        
        await LocalRxdbDatabase.instance.updateAsset(userAssets.address, updatedAsset, { sync: true });
        
        setChatMessages(prev => [...prev, {
          id: Math.random().toString(),
          type: 'message',
          content: `Payment received and ${amount} WASTE tokens added to your wallet!`,
          sender: 'validator',
          timestamp: new Date(),
          isNew: true
        }]);
      }
    } catch (error) {
      console.error("Failed to process payment received:", error);
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: 'Failed to process payment. Please try again.',
        sender: 'validator',
        timestamp: new Date(),
        isNew: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') && selectedOrder) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      await handleSendImage(file);
    }
  };

  const handleClearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendImage = async (file: File) => {
    if (!selectedOrder || !principal) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const newMessage: Message = {
        id: Math.random().toString(),
        type: 'image',
        content: 'Payment proof uploaded',
        sender: 'user',
        timestamp: new Date(),
        imageUrl: reader.result as string,
        orderDetails: {
          id: selectedOrder.id,
          amount: selectedOrder.amount,
          price: selectedOrder.price,
          status: selectedOrder.status,
          paymentMethod: selectedOrder.paymentMethod
        },
        isNew: true,
        validatorId: selectedValidator
      };

      try {
        await p2pService.updateOrderStatus(selectedOrder.id, 'payment_submitted');
        
        // Create payment verification record for database
        const dbPaymentVerification: PaymentVerification = {
          orderId: selectedOrder.id,
          proof: reader.result as string,
          status: 'pending',
          verifiedAt: new Date()
        };

        await LocalRxdbDatabase.instance.createPaymentVerification(dbPaymentVerification);
        
        // Create P2P payment verification for state
        const p2pVerification: P2PPaymentVerification = {
          id: selectedOrder.id,
          transactionId: selectedOrder.id,
          userId: principal,
          status: 'pending',
          proof: reader.result as string,
          notes: 'Payment proof submitted by user',
          createdAt: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, newMessage]);
        setPaymentVerifications(prev => [...prev, p2pVerification]);
        enqueueSnackbar('Payment proof uploaded successfully', { variant: 'success' });
        // Clear the selected image after successful upload
        handleClearImage();
      } catch (error) {
        console.error('Error uploading payment proof:', error);
        enqueueSnackbar('Failed to upload payment proof', { variant: 'error' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenChat = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setCurrentOrderId(orderId);
        setChatOpen(true);
        
        // Automatically select a validator if none is selected
        if (!selectedValidator && validators.length > 0) {
          // Select the first available validator by default
          setSelectedValidator(validators[0].id);
        }
        
        // Load existing payment verification if any
        const paymentVerification = await LocalRxdbDatabase.instance.getPaymentVerification(orderId);
        if (paymentVerification?.proof) {
          const proofMessage: Message = {
            id: Math.random().toString(),
            type: 'image',
            content: 'Payment proof uploaded',
            sender: 'user',
            timestamp: paymentVerification.verifiedAt ? new Date(paymentVerification.verifiedAt) : new Date(),
            imageUrl: paymentVerification.proof,
            orderDetails: {
              id: order.id,
              amount: order.amount,
              price: order.price,
              status: order.status,
              paymentMethod: order.paymentMethod
            },
            isNew: false,
            validatorId: selectedValidator
          };
          setChatMessages([proofMessage]);
        }
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      enqueueSnackbar('Failed to load chat history', { variant: 'error' });
    }
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setCurrentOrderId('');
    setSelectedOrder(null);
    setChatMessages([]);
  };

  const handleSendMessage = (content: string) => {
    if (!selectedOrder) return;
    
    const newMessage: Message = {
      id: Math.random().toString(),
      type: 'message',
      content,
      sender: 'user',
      timestamp: new Date(),
      orderDetails: {
        id: selectedOrder.id,
        amount: selectedOrder.amount,
        price: selectedOrder.price,
        status: selectedOrder.status,
        paymentMethod: selectedOrder.paymentMethod
      },
      isNew: true
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  // Add handler for opening escrow modal
  const handleOpenEscrowModal = (order: Order) => {
    setSelectedOrderForEscrow(order);
    setEscrowModalOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        P2P Exchange
      </Typography>

      {/* Create Order Form */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create New Order
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newOrder.amount}
              onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={newOrder.price}
              onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Payment Method"
              value={newOrder.paymentMethod}
              onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method.id} value={method.id}>
                  {method.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateOrder}
              disabled={!newOrder.amount || !newOrder.price || !newOrder.paymentMethod}
            >
              Create Order
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Active Orders */}
      <Typography variant="h5" gutterBottom>
        Available Orders
      </Typography>
      <Grid container spacing={2}>
        {orders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6">
                {order.amount} WASTE
              </Typography>
              <Typography>Price: {order.price} PHP</Typography>
              <Typography>Payment: {order.paymentMethod.name}</Typography>
              <Typography>Status: {order.status}</Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {/* Update Accept Order Button */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenEscrowModal(order)}
                  disabled={order.sellerId === principal || order.status !== ORDER_STATUS_TRACKING.CREATED}
                  sx={{ flex: '1 1 auto' }}
                >
                  Accept Order
                </Button>
                
                {/* Verify Payment Button - Only shown to seller */}
                {order.sellerId === principal && order.status === 'payment_pending' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleVerifyPayment(order.id)}
                    sx={{ flex: '1 1 auto' }}
                  >
                    Verify Payment
                  </Button>
                )}
                
                {/* Dispute Button - Shown to both parties */}
                {(order.status === 'payment_pending' || order.status === 'payment_submitted') && (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleDispute(order.id)}
                    sx={{ flex: '1 1 auto' }}
                  >
                    Dispute
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleOpenChat(order.id)}
                  startIcon={<ChatIcon />}
                >
                  Chat
                </Button>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                {imagePreview ? (
                  <Box sx={{ position: 'relative', width: 'fit-content' }}>
                    <img 
                      src={imagePreview} 
                      alt="Selected payment proof" 
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                      }}
                      onClick={handleClearImage}
                    >
                      <CloseIcon sx={{ color: 'white' }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => fileInputRef.current?.click()}
                    startIcon={<AttachFileIcon />}
                  >
                    Upload Payment Proof
                  </Button>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add the chat box component */}
      <P2PChatBox
        open={chatOpen}
        onClose={handleCloseChat}
        orderId={currentOrderId}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        selectedValidator={selectedValidator}
        loading={loading}
        handlePaymentReceived={handlePaymentReceived}
        t={t}
      />

      {/* Add validator selection dialog when chat is open */}
      <Dialog
        open={chatOpen && !selectedValidator}
        onClose={() => {}}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Select Validator</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              select
              label="Validator"
              value={selectedValidator}
              onChange={(e) => setSelectedValidator(e.target.value)}
            >
              {validators.map((validator) => (
                <MenuItem key={validator.id} value={validator.id}>
                  {validator.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Add EscrowModal */}
      <EscrowModal
        open={escrowModalOpen}
        onClose={() => {
          setEscrowModalOpen(false);
          setSelectedOrderForEscrow(null);
        }}
        order={selectedOrderForEscrow}
        onAccept={handleAcceptOrder}
        loading={loading}
        t={t}
      />
    </Box>
  );
}; 