// svg
import IcIcon from "@/assets/img/icp.png";
import SolanaIcon from "@/assets/svg/files/solana-icon.svg";

import BitcoinIcon from "@/assets/svg/files/bitcoin-icon.svg";
import ckBtcIcon from "@/assets/svg/files/ckbtc.svg";
import ckEthIcon from "@/assets/svg/files/ckETH.svg";
import OpenChatIcon from "@/assets/svg/files/openchat.svg";
import KinicIcon from "@/assets/svg/files/kinic.svg";
import HotOrNotIcon from "@/assets/svg/files/hot-or-not.svg";
import GoldTokenIcon from "@/assets/svg/files/gldt_icon.svg";
import OrigynIcon from "@/assets/svg/files/ogy_icon.svg";
import DragginzIcon from "@/assets/svg/files/dragginz.svg";
import GLDGovIcon from "@/assets/svg/files/GLDov_icon.svg";
import W2eIcon from "@/assets/svg/files/w2e-token.svg";
import WPlIcon from "@/assets/svg/files/wPl-token.svg";
import WPrIcon from "@/assets/svg/files/wPr-token.svg";
import WGIcon from "@/assets/svg/files/wG-token.svg";
import WMIcon from "@/assets/svg/files/wM-token.svg";
import WOxIcon from "@/assets/svg/files/wOx-token.svg";
import EWIcon from "@/assets/svg/files/eW-token.svg";

import { z } from "zod";
import { Token } from "@redux/models/TokenModels";
import { ICRC2systemAssets } from "./defaultTokens";

// Enums
export const TransactionTypeEnum = z.enum(["RECEIVE", "SEND", "NONE"]);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const OperationStatusEnum = z.enum(["COMPLETED", "REVERTED", "PENDING"]);
export type OperationStatus = z.infer<typeof OperationStatusEnum>;

export const OperationTypeEnum = z.enum(["TRANSACTION", "FEE"]);
export type OperationType = z.infer<typeof OperationTypeEnum>;

export const DrawerOptionEnum = z.enum(["SEND", "RECEIVE", "WRAP"]);
export type DrawerOption = z.infer<typeof DrawerOptionEnum>;

export const IconTypeEnum = z.enum(["ASSET", "HEADER", "FILTER"]);
export type IconType = z.infer<typeof IconTypeEnum>;

export const AssetSymbolEnum = z.enum([
  "ICP",
  "ckBTC",
  "CHAT",
  "KINIC",
  "SNS1",
  "HOT",
  "OGY",
  "W2E",
  "wPl",
  "wPr",
  "wG",
  "wM",
  "wOx",
  "eW",
]);
export type AssetSymbol = z.infer<typeof AssetSymbolEnum>;

export const ThemesEnum = z.enum(["dark", "light"]);
export type Themes = z.infer<typeof ThemesEnum>;

export const SendingStatusEnum = z.enum(["sending", "done", "error", "none"]);
export type SendingStatus = z.infer<typeof SendingStatusEnum>;

export const AddingAssetsEnum = z.enum(["adding", "done", "error", "none"]);
export type AddingAssets = z.infer<typeof AddingAssetsEnum>;

export const TokenNetworkEnum = z.enum(["ICRC-2"]);
export type TokenNetwork = z.infer<typeof TokenNetworkEnum>;

export const AccountDefaultEnum = z.enum(["Default"]);
export type AccountDefault = z.infer<typeof AccountDefaultEnum>;

export const WorkerTaskEnum = z.enum(["TRANSACTIONS", "ASSETS"]);
export type WorkerTask = z.infer<typeof WorkerTaskEnum>;

export const AuthNetworkNameEnum = z.enum(["Internet Identity", "NFID", "Solana", "Seed", "NONE"]);
export type AuthNetworkName = z.infer<typeof AuthNetworkNameEnum>;

export const AuthNetworkTypeEnum = z.enum(["IC", "NFID", "MM", "NONE"]);
export type AuthNetworkType = z.infer<typeof AuthNetworkTypeEnum>;

export const DeleteContactTypeEnum = z.enum(["CONTACT", "ASSET", "SUB"]);
export type DeleteContactTypeEnum = z.infer<typeof DeleteContactTypeEnum>;

export const TimerActionTypeEnum = z.enum(["TRANSACTIONS", "ASSETS"]);
export type TimerActionType = z.infer<typeof TimerActionTypeEnum>;

export const SpecialTxTypeEnum = z.enum(["mint", "burn"]);
export type SpecialTxType = z.infer<typeof SpecialTxTypeEnum>;

export const DIP20systemAssets: Array<Token> = [];
export const EXTsystemAssets: Array<Token> = [];
export const systemAssets: { [key: string]: Array<Token> } = {
  "ICRC-2": ICRC2systemAssets,
};

export const symbolIconDict: { [key: string]: string } = {
  BTC: BitcoinIcon,
  ICP: IcIcon,
  SOL: SolanaIcon,
  ckBTC: ckBtcIcon,
  ckETH: ckEthIcon,
  CHAT: OpenChatIcon,
  KINIC: KinicIcon,
  SNS1: DragginzIcon,
  HOT: HotOrNotIcon,
  GLDT: GoldTokenIcon,
  OGY: OrigynIcon,
  GLDGov: GLDGovIcon,
  W2E: W2eIcon,
  wPl: WPlIcon,
  wPr: WPrIcon,
  wG: WGIcon,
  wM: WMIcon,
  wOx: WOxIcon,
  eW: EWIcon,
};
