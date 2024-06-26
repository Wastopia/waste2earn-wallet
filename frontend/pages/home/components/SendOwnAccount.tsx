// svgs
import SuccesIcon from "@assets/svg/files/success.svg";
import ChevIcon from "@assets/svg/files/chev-icon.svg";
import { ReactComponent as CloseIcon } from "@assets/svg/files/close.svg";
import { ReactComponent as ExchangeIcon } from "@assets/svg/files/arrows-exchange-v.svg";
//
import { IconTypeEnum, SendingStatus, SendingStatusEnum } from "@/const";
import { IcrcAccount, IcrcLedgerCanister } from "@dfinity/ledger";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { IdentityHook } from "@hooks/identityHook";
import { clsx } from "clsx";
import { GeneralHook } from "../hooks/generalHook";
import { Asset, SubAccount } from "@redux/models/AccountModels";
import { useTranslation } from "react-i18next";
import {
  hexToUint8Array,
  shortAddress,
  subUint8ArrayToHex,
  roundToDecimalN,
  toFullDecimal,
  validateAmount,
  toHoleBigInt,
} from "@/utils";
import { CustomInput } from "@components/Input";
import { CustomButton } from "@components/Button";
import { AssetHook } from "../hooks/assetHook";
import { ChangeEvent } from "react";

interface SendOwnAccountProps {
  selectedAccount: SubAccount | undefined;
  setSelectedAccount(value: SubAccount | undefined): void;
  selectedAsset: Asset | undefined;
  receiver: any;
  setReciver(value: any): void;
  contactToSend: any;
  assetDropOpen: boolean;
  setAssetDropOpen(value: boolean): void;
  showModal(value: boolean): void;
  amount: string;
  weight: string,
  setDrawerOpen(value: boolean): void;
  setSendingStatus(value: SendingStatus): void;
  setAmount(value: string): void;
  setAmountBI(value: bigint): void;
  setNewAccount(value: string): void;
  setContactToSend(value: any): void;
}

const SendOwnAccount = ({
  selectedAccount,
  setSelectedAccount,
  selectedAsset,
  receiver,
  setReciver,
  contactToSend,
  assetDropOpen,
  setAssetDropOpen,
  showModal,
  weight,
  amount,
  setDrawerOpen,
  setSendingStatus,
  setAmount,
  setAmountBI,
  setNewAccount,
  setContactToSend,
}: SendOwnAccountProps) => {
  const { t } = useTranslation();

  const { reloadBallance } = AssetHook();
  const { getAssetIcon } = GeneralHook();
  const { userAgent } = IdentityHook();

  return (
    <div className="flex flex-col justify-center items-center w-full h-full text-lg text-PrimaryTextColorLight dark:text-PrimaryTextColor">
      <p className="w-full text-left opacity-60">{t("from")}</p>
      <DropdownMenu.Root
        onOpenChange={(e: boolean) => {
          setAssetDropOpen(e);
        }}
      >
        <DropdownMenu.Trigger asChild>
          <div
            className={clsx(
              sendBox,
              "border-BorderColorLight dark:border-BorderColor",
              "items-center",
              "cursor-pointer",
            )}
          >
            {getAssetIcon(IconTypeEnum.Enum.ASSET, selectedAsset?.tokenSymbol, selectedAsset?.logo)}
            <div className={clsx(accountInfo)}>
              <p className="text-left break-words w-full max-w-[18rem]">{`${selectedAsset?.name || ""} - ${selectedAccount?.name === "-" ? `SubAc N°: ${selectedAccount.sub_account_id}` : selectedAccount?.name
                }`}</p>
              <p className="opacity-60">{`${t("balance")}: ${toFullDecimal(
                selectedAccount?.amount || "0",
                selectedAccount?.decimal || 8,
              )}`}</p>
            </div>
            <img
              src={ChevIcon}
              style={{ width: "3rem", height: "2rem" }}
              alt="chevron-icon"
              className={`${assetDropOpen ? "rotate-90" : ""}`}
            />
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="w-full text-lg max-h-[calc(100vh-17rem)] scroll-y-light bg-PrimaryColorLight rounded-lg dark:bg-SecondaryColor z-[999] text-PrimaryTextColorLight dark:text-PrimaryTextColor shadow-sm shadow-BorderColorTwoLight dark:shadow-BorderColorTwo border border-BorderColorLight dark:border-BorderColor"
            sideOffset={5}
          >
            {selectedAsset?.subAccounts.map((sa, idx) => {
              if (
                `own-${sa.sub_account_id}` !== receiver.strAccount ||
                sa.address != receiver.icrcAccount.owner.toText()
              )
                return (
                  <DropdownMenu.Item
                    key={`subAc-${idx}`}
                    className={`flex flex-row justify-start items-center w-[25rem] p-3 cursor-pointer ${idx > 0 ? "border-t border-BorderColorLight dark:border-BorderColor" : ""
                      }`}
                    onSelect={() => {
                      setSelectedAccount(sa);
                    }}
                  >
                    {getAssetIcon(IconTypeEnum.Enum.ASSET, selectedAsset?.tokenSymbol, selectedAsset?.logo)}
                    <div className="flex flex-col justify-center items-start ml-3">
                      <p className="text-left break-words w-full max-w-[20rem]">
                        {sa.name === "-" ? `SubAc N°: ${sa.sub_account_id}` : sa.name}
                      </p>
                      <p className="opacity-60">{`${t("balance")}: ${toFullDecimal(
                        sa?.amount || "0",
                        sa?.decimal || 8,
                      )}`}</p>
                    </div>
                  </DropdownMenu.Item>
                );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <div className="flex justify-center items-center w-full"></div>
      <p className="w-full text-left opacity-60">{t("to")}</p>
      <div className={clsx(sendBox, "border-BorderSuccessColor")}>
        <img src={SuccesIcon} alt="success-icon" />
        <div className={clsx(accountInfo)}>
          <p className="text-left break-words w-full pr-1">
            {contactToSend
              ? `${contactToSend.name} - ${contactToSend.subName}`
              : receiver.name === "-"
                ? selectedAsset?.symbol || ""
                : receiver.name}
            <span className="opacity-70 ml-2 text-sm">
              {`[${contactToSend ? `0x${contactToSend.subId}` : `0x${subUint8ArrayToHex(receiver.icrcAccount.subaccount)}`
                }]`}
            </span>
          </p>
          <p className="opacity-60">{`${shortAddress(receiver.strAccount, 12, 10)}`}</p>
        </div>
        <CloseIcon
          className="cursor-pointer stroke-PrimaryTextColorLight dark:stroke-PrimaryTextColor"
          onClick={onClose}
        />
      </div>
      <p className="w-full text-left opacity-60">{t("Waste Weight: ")}{weight} {t("kgs")}</p>

      <p className="w-full text-left opacity-60">{t("Cost per kilogram")}</p>
      <div className={clsx(sendBox, "border-BorderColorLight dark:border-BorderColor", "items-center", "!mb-1")}>
        <div className={clsx(accountInfo)} lang="en-US">
          <CustomInput
            intent={"primary"}
            placeholder={`0 ${selectedAsset?.symbol} `}
            value={amount}
            border={"none"}
            onChange={onChangeAmount}
          />
        </div>
        <button
          className="flex justify-center items-center p-1 bg-RadioCheckColor rounded cursor-pointer"
          onClick={onMaxAmount}
        >
          <p className="text-sm text-PrimaryTextColor">{t("max")}</p>
        </button>
        <ExchangeIcon />
      </div>

      <p className="w-full text-left opacity-60">{t("Actual Fee: ")} {calculateTotalAmount()} </p>

      <div className="flex flex-row justify-between items-center w-full">
        {!maxAmount().valid ? (
          <p className="w-full text-left text-LockColor text-md  mr-3">{t("no.enought.balance")}</p>
        ) : Number(amount) > maxAmount().nAmount && maxAmount().valid ? (
          <p className="w-full text-left text-LockColor text-md whitespace-nowrap">{`${t(
            "max.amount.to.send",
          )}: ${toFullDecimal(maxAmount().nAmount.toString(), selectedAccount?.decimal || 8)} ${selectedAsset?.symbol || ""
            }`}</p>
        ) : (
          <p></p>
        )}
        <div className="flex flex-row justify-end items-center gap-2 text-md whitespace-nowrap">
          <p className="opacity-60">{t("fee")}</p>
          <p>{`${toFullDecimal(selectedAccount?.transaction_fee || "", selectedAccount?.decimal || 8)} ${selectedAsset?.symbol || ""
            }`}</p>
        </div>
      </div>

      <div className="w-full flex flex-row justify-end items-center mt-12">
        <CustomButton intent="deny" className="mr-3 min-w-[5rem]" onClick={onCancel}>
          <p>{t("cancel")}</p>
        </CustomButton>
        <CustomButton className="min-w-[5rem]" onClick={onSend}>
          <p>{t("next")}</p>
        </CustomButton>
      </div>
    </div>
  );

  function onClose() {
    setContactToSend(undefined);
    setNewAccount("");
    setReciver({
      name: "",
      color: "",
      strAccount: "",
      icrcAccount: {} as IcrcAccount,
    });
    setAmount("");
  }

  function calculateTotalAmount() {
    // Check if weight and selectedAsset are valid before calculation

    const tokenRate = validateAmount(amount, Number(selectedAsset?.decimal || "8")) ? Number(amount) : 0;
    const calcweight = Number(weight);

    if (!tokenRate) {
      console.error("Failed to fetch token rate");
      return "";
    }
    const totalAmount = calcweight * tokenRate;
    return totalAmount.toString();
  }

  function onChangeAmount(e: ChangeEvent<HTMLInputElement>) {
    const amnt = e.target.value;
    if (Number(amnt) >= 0 && (validateAmount(amnt, Number(selectedAsset?.decimal || "8")) || amnt === ""))
      setAmount(amnt.trim());
  }

  function onMaxAmount() {
    maxAmount().valid && setAmount(toFullDecimal(maxAmount().nAmount.toString(), selectedAccount?.decimal || 8));
  }

  function onCancel() {
    setContactToSend(undefined);
    setDrawerOpen(false);
  }

  async function onSend() {
    if (Number(calculateTotalAmount) >= 0 && maxAmount().valid) {
      if (Number(calculateTotalAmount) > maxAmount().nAmount && maxAmount().valid) {
        setSendingStatus(SendingStatusEnum.enum.error);
        showModal(true);
      } else {
        const sentAmount = toHoleBigInt(amount, Number(selectedAsset?.decimal));
        setAmountBI(sentAmount);
        let errorFound = false;
        setSendingStatus(SendingStatusEnum.enum.sending);
        showModal(true);
        const { transfer } = IcrcLedgerCanister.create({
          agent: userAgent,
          canisterId: selectedAsset?.address as any,
        });
        try {
          await transfer({
            to: {
              owner: receiver.icrcAccount.owner,
              subaccount: receiver.icrcAccount.subaccount ? [receiver.icrcAccount.subaccount] : [],
            },
            amount: sentAmount,
            from_subaccount: hexToUint8Array(selectedAccount?.sub_account_id || "0"),
          });
        } catch (e) {
          console.error(e);
          errorFound = true;
          setSendingStatus(SendingStatusEnum.enum.error);
        } finally {
          if (!errorFound) {
            setDrawerOpen(false);
            setSendingStatus(SendingStatusEnum.enum.done);
            reloadBallance();
          }
        }
      }
    }
  }

  function maxAmount() {
    const nAmount = roundToDecimalN(
      Number(selectedAccount?.amount || "0") - Number(selectedAccount?.transaction_fee || "0"),
      selectedAsset?.decimal || 8,
    );
    const over =
      BigInt(nAmount) > BigInt(selectedAccount?.amount || "0") - BigInt(selectedAccount?.transaction_fee || "");
    const sentAmount = toHoleBigInt(amount, Number(selectedAsset?.decimal));
    const valid =
      BigInt(selectedAccount?.amount || "0") >= BigInt(selectedAccount?.transaction_fee || "") &&
      BigInt(selectedAccount?.amount || "0") - BigInt(selectedAccount?.transaction_fee || "") >= BigInt(sentAmount);
    return { nAmount, over, valid };
  }
};

// Tailwind CSS constants
const sendBox = clsx(
  "flex",
  "flex-row",
  "w-full",
  "justify-between",
  "items-start",
  "rounded",
  "border",
  "p-3",
  "mb-4",
);
const accountInfo = clsx("flex", "flex-col", "justify-start", "items-start", "w-full", "pl-2", "pr-2");

export default SendOwnAccount;
