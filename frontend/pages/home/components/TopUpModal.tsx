import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BasicModal } from "@components/modal";
import { CustomButton } from "@components/button";
import { CustomInput } from "@components/input";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { ReactComponent as GcashIcon } from "@assets/svg/files/gcash.svg";
import { ReactComponent as PaymayaIcon } from "@assets/svg/files/paymaya.svg";
import { ReactComponent as BpiIcon } from "@assets/svg/files/bpi.svg";
import { clsx } from "clsx";
import { useAppSelector } from "@redux/Store";
import { Order, PaymentMethod } from "@/types/p2p";
import { p2pService } from "@/services/p2p";
import { LoadingLoader } from "@components/loader";
import { useSnackbar } from "notistack";
import PaymentInstructions from "./PaymentInstructions";
import store from "@redux/Store";
import { TokenMarketInfo } from "@redux/models/TokenModels";
import ChatModal from "./ChatModal";

interface TopUpModalProps {
  onClose: () => void;
}

const PAYMENT_METHOD_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  gcash: GcashIcon,
  maya: PaymayaIcon,
  bpi: BpiIcon,
};

// Add new constants for enhanced escrow features
const ORDER_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

const ORDER_SIZE_TIERS = {
  SMALL: { max: 100, timeout: ORDER_TIMEOUT },
  MEDIUM: { max: 1000, timeout: ORDER_TIMEOUT },
  LARGE: { max: 5000, timeout: ORDER_TIMEOUT },
  XLARGE: { max: 10000, timeout: ORDER_TIMEOUT },
};

const USD_TO_PHP_RATE = 56; // Fixed exchange rate from USD to PHP

const TopUpModal = ({ onClose }: TopUpModalProps) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState<"swap" | "buy">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("1");
  const [swapFromToken, setSwapFromToken] = useState("WASTE");
  const [swapToToken, setSwapToToken] = useState("USDC");
  const [swapAmount, setSwapAmount] = useState("");
  const [estimatedReceiveAmount, setEstimatedReceiveAmount] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(true);
  const assets = useAppSelector((state) => state.asset.list.assets);
  const wasteToken = assets.find(asset => asset.tokenSymbol === "WASTE");
  const WASTE_TOKEN_PRICE = useMemo(() => {
    if (!wasteToken) return 1;
    const market = store.getState().asset.utilData.tokensMarket.find(
      (tm: TokenMarketInfo) => tm.symbol === wasteToken.tokenSymbol
    );
    if (!market) return 1;
    return market.price * USD_TO_PHP_RATE; // Convert USD price to PHP
  }, [wasteToken]);

  useEffect(() => {
    loadOrders();
    loadPaymentMethods();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const availableOrders = await p2pService.getAvailableOrders();
      setOrders(availableOrders);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await p2pService.getPaymentMethods();
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedPaymentMethod(methods[0].id);
      }
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    const newAmount = typeof e === 'string' ? e : e.target.value;
    setAmount(newAmount);
    // Automatically calculate price based on amount
    setPrice((parseFloat(newAmount) * WASTE_TOKEN_PRICE).toString());
  };

  const handleCreateOrder = async () => {
    if (!amount || !price || !selectedPaymentMethod) return;
    
    try {
      setLoading(true);
      const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
      if (!paymentMethod) return;

      const newOrder = await p2pService.createOrder({
        sellerId: "current-user-id",
        amount: parseFloat(amount),
        price: parseFloat(price),
        paymentMethod,
      });

      setOrders([...orders, newOrder]);
      setSelectedOrder(newOrder);
      
      // Hide TopUpModal and show ChatModal
      setShowTopUpModal(false);
      setShowChatModal(true);
      
      setAmount("");
      setPrice("");
    } catch (error) {
      console.error("Failed to create order:", error);
      enqueueSnackbar(t('Failed to create order'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChatModalClose = () => {
    setShowChatModal(false);
    setShowTopUpModal(true);
  };

  // Add new function to handle token swap
  const handleSwapTokens = () => {
    const temp = swapFromToken;
    setSwapFromToken(swapToToken);
    setSwapToToken(temp);
    setSwapAmount("");
    setEstimatedReceiveAmount("");
  };

  // Add function to calculate estimated receive amount
  const calculateEstimatedAmount = (amount: string) => {
    // This is a placeholder calculation - replace with actual rates
    const rates = {
      'WASTE-USDC': 0.017, // 1 WASTE = 58 USDC
      'WASTE-ICP': 0.003, // 1 WASTE = 0.001 ICP
      'USDC-WASTE': 58, // 1 USDC = 100 WASTE
      'ICP-WASTE': 336.4, // 1 ICP = 1000 WASTE
    };

    const pair = `${swapFromToken}-${swapToToken}`;
    const rate = rates[pair as keyof typeof rates] || 1;
    return (parseFloat(amount) * rate).toFixed(6);
  };

  const handleSwapAmountChange = (value: string) => {
    setSwapAmount(value);
    if (value) {
      setEstimatedReceiveAmount(calculateEstimatedAmount(value));
    } else {
      setEstimatedReceiveAmount("");
    }
  };

  return (
    <>
      {showTopUpModal && (
        <BasicModal
          open={true}
          width="w-[30rem]"
          padding="p-4 sm:p-6"
          border="border border-BorderColorTwoLight dark:border-BorderColorTwo"
        >
          <div className="relative flex flex-col w-full gap-4">
            <CloseIcon 
              className={clsx(
                "absolute cursor-pointer top-2 right-2 sm:top-5 sm:right-5",
                "stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor"
              )} 
              onClick={onClose} 
            />

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold">{t("P2P Exchange")}</h2>
              
              {showPaymentInstructions && selectedOrder ? (
                <PaymentInstructions
                  order={selectedOrder}
                  onClose={() => setShowPaymentInstructions(false)}
                />
              ) : (
                <>
                  {/* Tab Navigation */}
                  <div className="flex gap-2 border-b border-BorderColorTwoLight dark:border-BorderColorTwo">
                    <button
                      className={clsx(
                        "px-4 py-2",
                        activeTab === "swap" 
                          ? "border-b-2 border-slate-color-success text-slate-color-success"
                          : "text-gray-500"
                      )}
                      onClick={() => setActiveTab("swap")}
                    >
                      {t("Swap")}
                    </button>
                    <button
                      className={clsx(
                        "px-4 py-2",
                        activeTab === "buy"
                          ? "border-b-2 border-slate-color-success text-slate-color-success"
                          : "text-gray-500"
                      )}
                      onClick={() => setActiveTab("buy")}
                    >
                      {t("Buy")}
                    </button>
                  </div>

                  {/* Swap Interface */}
                  {activeTab === "swap" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">{t("You Pay")}</label>
                        <div className="relative">
                          <CustomInput
                            type="number"
                            value={swapAmount}
                            onChange={(e) => handleSwapAmountChange(e.target.value)}
                            placeholder="0.00"
                          />
                          <select
                            value={swapFromToken}
                            onChange={(e) => setSwapFromToken(e.target.value)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border border-BorderColorTwoLight dark:border-BorderColorTwo rounded px-2 py-1"
                          >
                            <option value="WASTE">WASTE</option>
                            <option value="USDC">USDC</option>
                            <option value="ICP">ICP</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleSwapTokens}
                        className="self-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m-4 4v8m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </button>

                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">{t("You Receive")}</label>
                        <div className="relative">
                          <CustomInput
                            type="number"
                            value={estimatedReceiveAmount}
                            disabled
                            placeholder="0.00"
                          />
                          <select
                            value={swapToToken}
                            onChange={(e) => setSwapToToken(e.target.value)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border border-BorderColorTwoLight dark:border-BorderColorTwo rounded px-2 py-1"
                          >
                            <option value="USDC">USDC</option>
                            <option value="ICP">ICP</option>
                            <option value="WASTE">WASTE</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex justify-between mb-1">
                          <span>{t("Exchange Rate")}:</span>
                          <span>1 {swapFromToken} = {calculateEstimatedAmount("1")} {swapToToken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("Network Fee")}:</span>
                          <span>0.001 {swapToToken}</span>
                        </div>
                      </div>

                      <CustomButton
                        className={clsx(
                          "bg-slate-color-success text-black transition-all duration-300",
                          "hover:bg-slate-color-success/90 active:scale-95"
                        )}
                        onClick={() => {}}
                        disabled={!swapAmount || parseFloat(swapAmount) <= 0}
                      >
                        {t("Swap Tokens")}
                      </CustomButton>
                    </div>
                  )}

                  {/* Buy Interface */}
                  {activeTab === "buy" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">{t("Enter Waste Token")}</label>
                        <CustomInput
                          type="number"
                          value={amount}
                          onChange={handleAmountChange}
                          placeholder={t("Amount")}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">{t("Order Tiers")}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAmountChange(ORDER_SIZE_TIERS.SMALL.max.toString())}
                            className={clsx(
                              "p-3 rounded-lg border transition-all text-left",
                              parseFloat(amount) <= ORDER_SIZE_TIERS.SMALL.max
                                ? "border-slate-color-success bg-slate-color-success/5"
                                : "border-BorderColorTwoLight dark:border-BorderColorTwo hover:border-slate-color-success/50"
                            )}
                          >
                            <div className="text-sm font-medium">Small</div>
                            <div className="text-xs text-gray-500">
                              ≤ {ORDER_SIZE_TIERS.SMALL.max} WASTE
                              <span className="block">≈ ${(ORDER_SIZE_TIERS.SMALL.max * WASTE_TOKEN_PRICE / USD_TO_PHP_RATE).toFixed(2)}</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAmountChange(ORDER_SIZE_TIERS.MEDIUM.max.toString())}
                            className={clsx(
                              "p-3 rounded-lg border transition-all text-left",
                              parseFloat(amount) > ORDER_SIZE_TIERS.SMALL.max && parseFloat(amount) <= ORDER_SIZE_TIERS.MEDIUM.max
                                ? "border-slate-color-success bg-slate-color-success/5"
                                : "border-BorderColorTwoLight dark:border-BorderColorTwo hover:border-slate-color-success/50"
                            )}
                          >
                            <div className="text-sm font-medium">Medium</div>
                            <div className="text-xs text-gray-500">
                              ≤ {ORDER_SIZE_TIERS.MEDIUM.max} WASTE
                              <span className="block">≈ ${(ORDER_SIZE_TIERS.MEDIUM.max * WASTE_TOKEN_PRICE / USD_TO_PHP_RATE).toFixed(2)}</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAmountChange(ORDER_SIZE_TIERS.LARGE.max.toString())}
                            className={clsx(
                              "p-3 rounded-lg border transition-all text-left",
                              parseFloat(amount) > ORDER_SIZE_TIERS.MEDIUM.max && parseFloat(amount) <= ORDER_SIZE_TIERS.LARGE.max
                                ? "border-slate-color-success bg-slate-color-success/5"
                                : "border-BorderColorTwoLight dark:border-BorderColorTwo hover:border-slate-color-success/50"
                            )}
                          >
                            <div className="text-sm font-medium">Large</div>
                            <div className="text-xs text-gray-500">
                              ≤ {ORDER_SIZE_TIERS.LARGE.max} WASTE
                              <span className="block">≈ ${(ORDER_SIZE_TIERS.LARGE.max * WASTE_TOKEN_PRICE / USD_TO_PHP_RATE).toFixed(2)}</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAmountChange(ORDER_SIZE_TIERS.XLARGE.max.toString())}
                            className={clsx(
                              "p-3 rounded-lg border transition-all text-left",
                              parseFloat(amount) > ORDER_SIZE_TIERS.LARGE.max && parseFloat(amount) <= ORDER_SIZE_TIERS.XLARGE.max
                                ? "border-slate-color-success bg-slate-color-success/5"
                                : "border-BorderColorTwoLight dark:border-BorderColorTwo hover:border-slate-color-success/50"
                            )}
                          >
                            <div className="text-sm font-medium">X-Large</div>
                            <div className="text-xs text-gray-500">
                              ≤ {ORDER_SIZE_TIERS.XLARGE.max} WASTE
                              <span className="block">≈ ${(ORDER_SIZE_TIERS.XLARGE.max * WASTE_TOKEN_PRICE / USD_TO_PHP_RATE).toFixed(2)}</span>
                            </div>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">{t("Peso Equivalent")}</label>
                        <CustomInput
                          type="number"
                          value={price}
                          disabled
                          placeholder={t("Amount")}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">{t("Payment Method")}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {paymentMethods.map((method) => {
                            const Icon = PAYMENT_METHOD_ICONS[method.type];
                            return (
                              <button
                                key={method.id}
                                onClick={() => setSelectedPaymentMethod(method.id)}
                                className={clsx(
                                  "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                                  selectedPaymentMethod === method.id
                                    ? "border-slate-color-success bg-slate-color-success/5"
                                    : "border-BorderColorTwoLight dark:border-BorderColorTwo hover:border-slate-color-success/50"
                                )}
                              >
                                {Icon && (
                                  <div className="w-8 h-8">
                                    <Icon className="w-full h-full" />
                                  </div>
                                )}
                                <span className="text-sm font-medium">{method.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <CustomButton
                        className={clsx(
                          "bg-slate-color-success text-black transition-all duration-300",
                          "hover:bg-slate-color-success/90 active:scale-95"
                        )}
                        onClick={handleCreateOrder}
                        disabled={loading}
                      >
                        {loading ? <LoadingLoader /> : t("Create an Order")}
                      </CustomButton>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </BasicModal>
      )}

      <ChatModal 
        isDrawerOpen={showChatModal}
        onClose={handleChatModalClose}
        selectedOrder={selectedOrder}
      />
    </>
  );
};

export default TopUpModal; 