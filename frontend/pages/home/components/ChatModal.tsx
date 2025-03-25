import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BasicDrawer } from "@components/drawer";
import { CustomButton } from "@components/button";
import { CustomInput } from "@components/input";
import { ReactComponent as AttachmentIcon } from "@assets/svg/files/attachment-icon.svg";
import { ReactComponent as StarIcon } from "@assets/svg/files/star.svg";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { LoadingLoader } from "@components/loader";
import { p2pService } from "@/services/p2p";
import { useSnackbar } from "notistack";
import { clsx } from "clsx";
import { Order, PaymentVerification, Message as P2PMessage } from "@/types/p2p";
import { LocalRxdbDatabase } from "@database/local-rxdb";
import { ORDER_STATUS_TRACKING } from "@/types/p2p";

// Add constant for order timeout
const ORDER_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

interface ChatModalProps {
  isDrawerOpen: boolean;
  onClose: () => void;
  selectedOrder?: Order | null;
}

interface Message extends Omit<P2PMessage, 'type'> {
  type: 'order' | 'message' | 'payment' | 'image';
  orderDetails?: Order;
  imageUrl?: string;
  validatorId?: string;
}

interface Validator {
  id: string;
  name: string;
  isActive: boolean;
  rating: number;
  responseTime: string;
  totalOrders: number;
  avatarUrl?: string;
}

const VALIDATORS: Validator[] = [
  { 
    id: 'v1', 
    name: 'John Validator', 
    isActive: true,
    rating: 4.8,
    responseTime: '< 5 min',
    totalOrders: 156,
    avatarUrl: 'https://ui-avatars.com/api/?name=John+Validator'
  },
  { 
    id: 'v2', 
    name: 'Maria Handler', 
    isActive: true,
    rating: 4.9,
    responseTime: '< 2 min',
    totalOrders: 243,
    avatarUrl: 'https://ui-avatars.com/api/?name=Maria+Handler'
  }
];

const CountdownTimer = ({ expiresAt }: { expiresAt: Date }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(expiresAt).getTime();
      const difference = expiryTime - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className={clsx(
      "text-sm font-medium",
      timeLeft === "Expired" ? "text-red-500" : "text-slate-color-success"
    )}>
      {timeLeft}
    </div>
  );
};

export default function ChatModal({ isDrawerOpen, onClose, selectedOrder }: ChatModalProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedValidator, setSelectedValidator] = useState("");
  const [showValidatorList, setShowValidatorList] = useState(false);
  const [validatorFilter, setValidatorFilter] = useState<'all' | 'active'>('active');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [validators, setValidators] = useState<Validator[]>(VALIDATORS);

  useEffect(() => {
    if (selectedOrder) {
      // Add initial order message when chat opens
      setMessages([{
        id: Math.random().toString(),
        type: 'order',
        content: `Order created: ${selectedOrder.amount} WASTE for ${selectedOrder.price} PHP`,
        sender: 'system',
        timestamp: new Date(),
        orderDetails: selectedOrder,
        isNew: true
      }]);
    }
  }, [selectedOrder]);

  const loadValidators = async () => {
    try {
      setLoading(true);
      const db = LocalRxdbDatabase.instance;
      const validatorsData = await db.getValidators();
      
      if (validatorsData && validatorsData.length > 0) {
        setValidators(validatorsData);
      } else {
        // Fallback to mock validators if no data in database
        setValidators(VALIDATORS);
      }
    } catch (error) {
      console.error('Error loading validators:', error);
      enqueueSnackbar(t('Failed to load validators'), { variant: 'error' });
      // Fallback to mock validators on error
      setValidators(VALIDATORS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValidators();
  }, []);

  const handleValidatorSelect = (validatorId: string) => {
    const validator = validators.find(v => v.id === validatorId);
    if (validator) {
      setSelectedValidator(validatorId);
      setShowValidatorList(false);
      
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: `Connected with validator: ${validator.name}`,
        sender: 'system',
        timestamp: new Date(),
        validatorId: validatorId,
        isNew: true
      }]);
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    try {
      setLoading(true);
      
      // Update order status to escrow pending
      await p2pService.updateOrderStatus(order.id, ORDER_STATUS_TRACKING.ESCROW_PENDING);

      const expiryDate = new Date(Date.now() + ORDER_TIMEOUT);

      // Add order confirmation message
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: `Order accepted: ${order.amount} WASTE
Please complete the payment within 5 minutes.`,
        sender: 'system',
        timestamp: new Date(),
        isNew: true,
        expiresAt: expiryDate
      }]);

      // Add payment instruction message
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'payment',
        content: `Please send ${order.price} PHP to ${order.paymentMethod.name}
Time remaining: 5 minutes`,
        sender: 'system',
        timestamp: new Date(),
        isNew: true,
        expiresAt: expiryDate
      }]);

      // Set up order timeout handler
      const timeoutId = setTimeout(async () => {
        const orderStatus = await p2pService.getOrderById(order.id);
        if (orderStatus?.status === ORDER_STATUS_TRACKING.ESCROW_PENDING || 
            orderStatus?.status === ORDER_STATUS_TRACKING.PAYMENT_PENDING) {
          await p2pService.updateOrderStatus(order.id, ORDER_STATUS_TRACKING.EXPIRED);
          setMessages(prev => [...prev, {
            id: Math.random().toString(),
            type: 'message',
            content: 'Order expired. The 5-minute time limit has elapsed.',
            sender: 'system',
            timestamp: new Date(),
            isNew: true
          }]);
          // Close both modals
          onClose();
        }
      }, ORDER_TIMEOUT);

      // Clean up timeout on component unmount
      return () => clearTimeout(timeoutId);

    } catch (error) {
      console.error("Failed to accept order:", error);
      enqueueSnackbar(t('Failed to accept order'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setLoading(true);
      await p2pService.updateOrderStatus(orderId, ORDER_STATUS_TRACKING.CANCELLED);
      
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: t('Order cancelled.'),
        sender: 'system',
        timestamp: new Date(),
        isNew: true
      }]);

      // Close ChatModal and return to TopUpModal
      onClose();
    } catch (error) {
      console.error("Failed to cancel order:", error);
      enqueueSnackbar(t('Failed to cancel order'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedValidator || !selectedOrder?.id) return;

    const messageId = Math.random().toString();
    try {
      setLoading(true);
      
      // Add message to local state immediately for better UX
      const newMessageObj = {
        id: messageId,
        type: 'message' as const,
        content: newMessage,
        sender: 'user' as const,
        timestamp: new Date(),
        validatorId: selectedValidator,
        isNew: true
      };

      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage("");

      // Send message to backend
      await p2pService.sendMessage({
        orderId: selectedOrder.id,
        validatorId: selectedValidator,
        content: newMessage,
        type: 'message',
        sender: 'user'
      });

    } catch (error) {
      console.error('Error sending message:', error);
      enqueueSnackbar(t('Failed to send message'), { variant: 'error' });
      
      // Remove the message from local state if it failed to send
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMessages(prev => [...prev, {
          id: Math.random().toString(),
          type: 'image',
          content: 'Image attachment',
          sender: 'user',
          timestamp: new Date(),
          imageUrl: reader.result as string,
          isNew: true,
          validatorId: selectedValidator
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder || !selectedImage) {
      enqueueSnackbar('Please select an order and upload payment proof', { variant: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      
      // Convert image to base64
      const reader = new FileReader();
      const imageBase64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(selectedImage);
      });
      
      const imageBase64 = await imageBase64Promise;
      
      // Create payment verification with proof
      const verification: PaymentVerification = {
        orderId: selectedOrder.id,
        status: "pending",
        proof: imageBase64,
      };
      
      await p2pService.createPaymentVerification(verification);
      await p2pService.updateOrderStatus(selectedOrder.id, ORDER_STATUS_TRACKING.PAYMENT_SUBMITTED);
      
      // Add confirmation message to chat
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        type: 'message',
        content: 'Payment proof submitted successfully. Awaiting verification.',
        sender: 'system',
        timestamp: new Date(),
        orderDetails: selectedOrder,
        isNew: true
      }]);
      
      // Reset states
      setSelectedImage(null);
      enqueueSnackbar('Payment proof submitted successfully', { variant: 'success' });
      
    } catch (error) {
      console.error("Failed to confirm payment:", error);
      enqueueSnackbar('Failed to submit payment proof', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderValidatorFilterToggle = () => (
    <div className="flex items-center justify-between p-3 border-b border-BorderColorTwoLight dark:border-BorderColorTwo">
      <span className="text-sm text-gray-500">{t("Show:")}</span>
      <div className="flex rounded-lg border border-BorderColorTwoLight dark:border-BorderColorTwo overflow-hidden">
        <button
          className={clsx(
            "px-3 py-1 text-sm",
            validatorFilter === 'all'
              ? "bg-slate-color-success text-white"
              : "hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
          onClick={() => setValidatorFilter('all')}
        >
          {t("All")}
        </button>
        <button
          className={clsx(
            "px-3 py-1 text-sm",
            validatorFilter === 'active'
              ? "bg-slate-color-success text-white"
              : "hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
          onClick={() => setValidatorFilter('active')}
        >
          {t("Active Only")}
        </button>
      </div>
    </div>
  );

  const renderSelectedValidatorBadge = () => {
    const validator = VALIDATORS.find(v => v.id === selectedValidator);
    if (!validator) return null;

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-color-success/10 rounded-lg">
        <div className="relative">
          {validator.avatarUrl ? (
            <img 
              src={validator.avatarUrl} 
              alt={validator.name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-semibold">{validator.name.charAt(0)}</span>
            </div>
          )}
          <div 
            className={clsx(
              "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-white dark:border-gray-800",
              validator.isActive ? "bg-green-500" : "bg-gray-400"
            )}
          />
        </div>
        <span className="text-sm font-medium">{validator.name}</span>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <StarIcon className="w-4 h-4 text-yellow-400" />
          <span>{validator.rating.toFixed(1)}</span>
        </div>
        <button 
          onClick={() => setSelectedValidator("")}
          className="ml-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const renderMessage = (message: Message) => {
    const validator = message.validatorId ? validators.find(v => v.id === message.validatorId) : null;

    switch (message.type) {
      case 'order':
        return (
          <div className={clsx(
            "flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-w-[80%]",
            message.isNew && "animate-slideDown"
          )}>
            <div className="font-medium text-slate-color-success">{message.content}</div>
            {message.orderDetails && (
              <>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <div>Amount: {message.orderDetails.amount} WASTE</div>
                  <div>Price: {message.orderDetails.price} PHP</div>
                  <div>Payment: {message.orderDetails.paymentMethod.name}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <CustomButton
                    className={clsx(
                      "flex-1 bg-slate-color-success text-white text-sm py-1",
                      "hover:bg-slate-color-success/90"
                    )}
                    onClick={() => message.orderDetails && handleAcceptOrder(message.orderDetails)}
                    disabled={loading}
                  >
                    {loading ? <LoadingLoader /> : t("Accept Order")}
                  </CustomButton>
                  <CustomButton
                    className={clsx(
                      "flex-1 bg-red-500 text-white text-sm py-1",
                      "hover:bg-red-600"
                    )}
                    onClick={() => message.orderDetails && handleCancelOrder(message.orderDetails.id)}
                    disabled={loading}
                  >
                    {loading ? <LoadingLoader /> : t("Cancel")}
                  </CustomButton>
                </div>
              </>
            )}
          </div>
        );

      case 'image':
        return (
          <div className={clsx(
            "p-2 rounded-lg max-w-[80%]",
            message.sender === 'user' ? "ml-auto" : "",
            message.isNew && "animate-slideDown"
          )}>
            {message.imageUrl && (
              <img 
                src={message.imageUrl} 
                alt="Attachment" 
                className="max-w-full rounded-lg"
              />
            )}
          </div>
        );

      case 'payment':
      case 'message':
        return (
          <div className="flex flex-col gap-1">
            {validator && message.sender === 'user' && (
              <div className="text-xs text-gray-500 text-right">
                To: {validator.name}
              </div>
            )}
            <div className={clsx(
              "p-3 rounded-lg max-w-[80%]",
              message.sender === 'user' 
                ? "bg-slate-color-success text-white ml-auto" 
                : "bg-gray-100 dark:bg-gray-700",
              message.isNew && "animate-slideDown"
            )}>
              {message.content}
              {message.expiresAt && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Time Remaining:</span>
                    <CountdownTimer expiresAt={message.expiresAt} />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Add scroll to bottom effect when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderValidatorList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <LoadingLoader />
        </div>
      );
    }

    const filteredValidators = validators.filter(validator => 
      validatorFilter === 'all' || (validatorFilter === 'active' && validator.isActive)
    );

    if (filteredValidators.length === 0) {
      return (
        <div className="text-center p-4 text-gray-500">
          {validatorFilter === 'active' 
            ? t("No active validators available")
            : t("No validators available")}
        </div>
      );
    }

    return (
      <div className="absolute z-[9999] top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-BorderColorTwoLight dark:border-BorderColorTwo z-50">
        {renderValidatorFilterToggle()}
        <div className="grid grid-cols-1 gap-2 p-2">
          {filteredValidators.map((validator) => (
            <button
              key={validator.id}
              onClick={() => handleValidatorSelect(validator.id)}
              className={clsx(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                "hover:bg-gray-50 dark:hover:bg-gray-700",
                !validator.isActive && "opacity-50"
              )}
              disabled={!validator.isActive}
            >
              <div className="relative">
                {validator.avatarUrl ? (
                  <img
                    src={validator.avatarUrl}
                    alt={validator.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {validator.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div 
                  className={clsx(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800",
                    validator.isActive ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{validator.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span>⭐ {validator.rating.toFixed(1)}</span>
                  <span className="mx-1">•</span>
                  <span>{validator.responseTime}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Update the message update effect
  useEffect(() => {
    const handleNewMessage = async () => {
      try {
        if (!selectedOrder?.id) return;
        
        const newMessages = await p2pService.getNewMessages(selectedOrder.id);
        if (newMessages && newMessages.length > 0) {
          // Convert P2PMessages to local Message format
          const convertedMessages: Message[] = newMessages.map(msg => ({
            ...msg,
            type: msg.type === 'system' ? 'message' : msg.type // Convert system type to message
          }));
          setMessages(prev => [...prev, ...convertedMessages]);
        }
      } catch (error) {
        console.error('Error fetching new messages:', error);
      }
    };

    const intervalId = setInterval(handleNewMessage, 5000);
    return () => clearInterval(intervalId);
  }, [selectedOrder?.id]);

  return (
    <BasicDrawer
      isDrawerOpen={isDrawerOpen}
      onClose={onClose}
      title={t("Chat with Validator")}
    >
      <div className="flex flex-col gap-4 px-4 sm:px-6 relative z-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{t("Online Chat")}</h3>
          <div className="relative">
            {selectedValidator ? (
              renderSelectedValidatorBadge()
            ) : (
              <CustomButton
                className={clsx(
                  "text-sm px-3 py-1.5",
                  "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
                onClick={() => setShowValidatorList(!showValidatorList)}
              >
                {t("Select Validator")}
              </CustomButton>
            )}
            {showValidatorList && renderValidatorList()}
          </div>
        </div>

        <div className="flex flex-col h-[calc(100vh-300px)] border border-BorderColorTwoLight dark:border-BorderColorTwo rounded-lg overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={clsx(
                  "flex transform transition-all duration-500 ease-in-out",
                  message.sender === 'user' ? "justify-end" : "justify-start",
                  message.isNew ? "animate-slideDown" : ""
                )}
              >
                {renderMessage(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-BorderColorTwoLight dark:border-BorderColorTwo">
            {selectedImage && (
              <div className="mb-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <span className="text-sm">Payment proof selected</span>
                <CustomButton
                  className="bg-slate-color-success text-white text-sm"
                  onClick={handleConfirmPayment}
                  disabled={loading}
                >
                  {loading ? <LoadingLoader /> : t("Confirm Payment")}
                </CustomButton>
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <CustomInput
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={selectedValidator 
                    ? t("Type your message...") 
                    : t("Select a validator to start chatting...")}
                  disabled={!selectedValidator}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  disabled={!selectedValidator}
                >
                  <AttachmentIcon className="w-5 h-5" />
                </button>
              </div>
              <CustomButton
                className="bg-slate-color-success text-white"
                onClick={handleSendMessage}
                disabled={!selectedValidator || loading}
              >
                {loading ? <LoadingLoader /> : t("Send")}
              </CustomButton>
            </div>
          </div>
        </div>
      </div>
    </BasicDrawer>
  );
}