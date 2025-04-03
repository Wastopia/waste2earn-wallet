import {
  OperationStatusEnum,
  OperationTypeEnum,
  SpecialTxTypeEnum,
  TransactionType,
  TransactionTypeEnum,
} from "@/common/const";
import { Transaction, Operation, RosettaTransaction } from "@/redux/models/AccountModels";
import { subUint8ArrayToHex } from "@/common/utils/unitArray";
import { Transaction as IcrcTransaction } from "@dfinity/ledger-icrc/dist/candid/icrc_index";
import { AccountIdentifier, SubAccount as SubAccountNNS } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import logger from "@/common/utils/logger";
import { Approve, Burn, Mint, Transfer } from "@/candid/icrcLedger/icrcLedgerService";

export const MILI_PER_SECOND = 1000000;

export const formatIcpTransaccion = (
  accountId: string,
  rosettaTransaction: RosettaTransaction,
  blockHash: string,
): Transaction => {
  const {
    operations,
    metadata: { timestamp, block_height },
    transaction_identifier: { hash },
  } = rosettaTransaction;

  const transaction = { status: OperationStatusEnum.Enum.COMPLETED } as Transaction;
  operations?.forEach((operation: Operation, i: number) => {
    const value = BigInt(operation.amount.value);
    const amount = value.toString();
    if (operation.type === OperationTypeEnum.Enum.FEE) {
      transaction.fee = amount;
      return;
    }

    if (value > 0) {
      transaction.to = operation.account.address;
    } else if (value < 0) {
      transaction.from = operation.account.address;
    } else {
      if (i === 0) {
        transaction.from = operation.account.address;
      }
      if (i === 1) {
        transaction.to = operation.account.address;
      }
    }

    if (
      transaction.status === OperationStatusEnum.Enum.COMPLETED &&
      operation.status !== OperationStatusEnum.Enum.COMPLETED
    )
      transaction.status = operation.status;

    transaction.type = transaction.to === accountId ? TransactionTypeEnum.Enum.RECEIVE : TransactionTypeEnum.Enum.SEND;
    transaction.amount = amount;
    transaction.canisterId = import.meta.env.VITE_ICP_LEDGER_CANISTER_ID;
    transaction.idx = block_height.toString();
    transaction.symbol = operation.amount.currency.symbol;
    
    // Add ICHouse link with validation
    if (transaction.from && transaction.to && transaction.canisterId) {
      try {
        transaction.icHouseLink = `https://ic.house/address/${transaction.canisterId}/${transaction.from}/${transaction.to}`;
      } catch (error) {
        logger.error("Error generating ICHouse link:", error);
      }
    }
  });

  return {
    ...transaction,
    hash: hash + "-" + blockHash,
    timestamp: Math.floor(timestamp / MILI_PER_SECOND),
    syncStatus: 'synced',
    lastSyncedAt: Math.floor(timestamp / MILI_PER_SECOND)
  } as Transaction;
};

interface FormatBTCArgs {
  ckBTCTransaction: IcrcTransaction;
  id: bigint;
  principal: string;
  symbol: string;
  canister: string;
  subNumber?: string;
}

function mintMapper(mint: Mint[], initial: Transaction): Transaction {
  return mint.reduce((acc, current) => {
    const amount = current.amount.toString();
    const toOwner = current.to.owner;
    const toSubAccount = current.to.subaccount.length
      ? `0x${subUint8ArrayToHex((current.to.subaccount as [Uint8Array])[0])}`
      : "0x0";
    const from = "";
    const fromSub = "";

    let subaccTo: SubAccountNNS | undefined = undefined;
    try {
      subaccTo = SubAccountNNS.fromBytes((current.to.subaccount as [Uint8Array])[0]) as SubAccountNNS;
    } catch (error) {
      logger.debug("Error parsing subaccount", error);
      subaccTo = undefined;
    }

    const identityTo = AccountIdentifier.fromPrincipal({
      principal: current.to.owner as Principal,
      subAccount: subaccTo,
    }).toHex();

    const type = TransactionTypeEnum.Enum.RECEIVE;

    return {
      ...acc,
      amount,
      to: toOwner.toString(),
      toSub: toSubAccount,
      from,
      fromSub,
      identityTo,
      type,
    };
  }, initial);
}

function burnMapper(burn: Burn[], initial: Transaction): Transaction {
  return burn.reduce((acc, current) => {
    const amount = current.amount.toString();
    const fromOwner = current.from.owner;
    const fromSubAccount = current.from.subaccount.length
      ? `0x${subUint8ArrayToHex((current.from.subaccount as [Uint8Array])[0])}`
      : "0x0";
    const to = "";
    const toSub = "";

    let subaccFrom: SubAccountNNS | undefined = undefined;
    try {
      subaccFrom = SubAccountNNS.fromBytes((current.from.subaccount as [Uint8Array])[0]) as SubAccountNNS;
    } catch (error) {
      logger.debug("Error parsing subaccount", error);
      subaccFrom = undefined;
    }

    const identityFrom = AccountIdentifier.fromPrincipal({
      principal: current.from.owner as Principal,
      subAccount: subaccFrom,
    }).toHex();

    return {
      ...acc,
      amount,
      from: fromOwner.toString(),
      fromSub: fromSubAccount,
      to,
      toSub,
      identityFrom: identityFrom,
      type: TransactionTypeEnum.Enum.SEND,
    };
  }, initial);
}

function approveMapper(approve: Approve[], initial: Transaction): Transaction {
  return approve.reduce((acc, current) => {
    const amount = current.amount.toString();
    const fee = current.fee.toString();
    const from = current.from.owner.toString();
    const fromSubAccount = current.from.subaccount.length
      ? `0x${subUint8ArrayToHex((current.from.subaccount as [Uint8Array])[0])}`
      : "0x0";

    const to = current.spender.owner.toString();
    const toSubAccount = current.spender.subaccount.length
      ? `0x${subUint8ArrayToHex((current.spender.subaccount as [Uint8Array])[0])}`
      : "0x0";

    return {
      ...acc,
      amount,
      fee,
      from,
      fromSub: fromSubAccount,
      to,
      toSub: toSubAccount,
      type: TransactionTypeEnum.Enum.APPROVE,
    };
  }, initial);
}

interface MapperArgs {
  principal: string;
  subNumber: string | undefined;
}

function transferMapper(transfer: Transfer[], initial: Transaction, options: MapperArgs): Transaction {
  return transfer.reduce((acc, current) => {
    try {
      const amount = current.amount.toString();
      const toOwner = current.to.owner;
      const fromOwner = current.from.owner;
      const toSubAccount = current.to.subaccount.length
        ? `0x${subUint8ArrayToHex((current.to.subaccount as [Uint8Array])[0])}`
        : "0x0";

      const fromSubAccount = current.from.subaccount.length
        ? `0x${subUint8ArrayToHex((current.from.subaccount as [Uint8Array])[0])}`
        : "0x0";

      const subCheck = options.subNumber;
      const principalCheck = options.principal;

      // Enhanced logging for transaction type detection
      logger.debug("Transaction type detection", {
        fromOwner: fromOwner.toString(),
        principalCheck,
        fromSubAccount,
        subCheck,
        toOwner: toOwner.toString(),
        toSubAccount
      });

      // Improved transaction type detection with null checks
      let type: TransactionType = TransactionTypeEnum.Enum.RECEIVE;
      
      if (!principalCheck) {
        logger.warn("No principal provided for transaction type detection");
        type = TransactionTypeEnum.Enum.NONE;
      } else {
        // If user is the sender (principal and subaccount match), it's an outgoing/SEND transaction
        if (fromOwner.toString() === principalCheck && fromSubAccount === subCheck) {
          type = TransactionTypeEnum.Enum.SEND;
          logger.debug("Transaction identified as SEND");
        } 
        // If user is the receiver (principal and subaccount match), it's an incoming/RECEIVE transaction
        else if (toOwner.toString() === principalCheck && toSubAccount === subCheck) {
          type = TransactionTypeEnum.Enum.RECEIVE;
          logger.debug("Transaction identified as RECEIVE");
        }
        // Edge case - fallback based on principal only
        else {
          if (fromOwner.toString() === principalCheck) {
            type = TransactionTypeEnum.Enum.SEND;
            logger.debug("Fallback: Transaction identified as SEND based on principal only");
          }
          else if (toOwner.toString() === principalCheck) {
            type = TransactionTypeEnum.Enum.RECEIVE;
            logger.debug("Fallback: Transaction identified as RECEIVE based on principal only");
          }
        }
      }

      // Get AccountIdentifier of Receiver with error handling
      let subaccTo: SubAccountNNS | undefined = undefined;
      let identityTo = "";
      try {
        if (current.to.subaccount.length) {
          subaccTo = SubAccountNNS.fromBytes((current.to.subaccount as [Uint8Array])[0]) as SubAccountNNS;
        }
        identityTo = AccountIdentifier.fromPrincipal({
          principal: current.to.owner as Principal,
          subAccount: subaccTo,
        }).toHex();
      } catch (error) {
        logger.error("Error getting receiver account identifier:", error);
        identityTo = current.to.owner.toString();
      }

      // Get AccountIdentifier of Sender with error handling
      let subaccFrom: SubAccountNNS | undefined = undefined;
      let identityFrom = "";
      try {
        if (current.from.subaccount.length) {
          subaccFrom = SubAccountNNS.fromBytes((current.from.subaccount as [Uint8Array])[0]) as SubAccountNNS;
        }
        identityFrom = AccountIdentifier.fromPrincipal({
          principal: current.from.owner as Principal,
          subAccount: subaccFrom,
        }).toHex();
      } catch (error) {
        logger.error("Error getting sender account identifier:", error);
        identityFrom = current.from.owner.toString();
      }

      return {
        ...acc,
        amount,
        to: toOwner.toString(),
        toSub: toSubAccount,
        from: fromOwner.toString(),
        fromSub: fromSubAccount,
        identityTo,
        identityFrom,
        type,
      };
    } catch (error) {
      logger.error("Error in transfer mapper:", error);
      return acc;
    }
  }, initial);
}

export const formatckBTCTransaccion = (args: FormatBTCArgs): Transaction => {
  const { ckBTCTransaction, id, principal, symbol, canister, subNumber } = args;
  const { approve, burn, kind, mint, timestamp, transfer } = ckBTCTransaction;

  logger.debug("formatckBTCTransaccion called", {
    id: id.toString(),
    principal,
    symbol,
    kind,
    subNumber,
    hasTransfer: !!transfer && transfer.length > 0,
    hasMint: !!mint && mint.length > 0,
    hasBurn: !!burn && burn.length > 0,
    hasApprove: !!approve && approve.length > 0
  });

  const initialTransaction: Transaction = {
    idx: id.toString(),
    from: "",
    fromSub: "",
    to: "",
    toSub: "",
    amount: "",
    canisterId: canister,
    status: OperationStatusEnum.Enum.COMPLETED,
    type: "NONE",
    symbol,
    identityTo: "",
    identityFrom: "",
    kind,
    hash: "",
    timestamp: Math.floor(Number(timestamp) / MILI_PER_SECOND),
    fee: "",
    syncStatus: 'pending'
  };

  let result: Transaction;

  try {
    switch (kind) {
      case SpecialTxTypeEnum.Enum.mint:
        result = mintMapper(mint, initialTransaction);
        break;
      case SpecialTxTypeEnum.Enum.burn:
        result = burnMapper(burn, initialTransaction);
        break;
      case SpecialTxTypeEnum.Enum.approve:
        result = approveMapper(approve, initialTransaction);
        break;
      case SpecialTxTypeEnum.Enum.transfer:
        result = transferMapper(transfer, initialTransaction, { principal, subNumber });
        break;
      default:
        logger.error(`formatckBTCTransaccion: unknown transaction type ${kind}`);
        return initialTransaction;
    }

    // Add ICHouse link with validation
    if (result.from && result.to && result.canisterId) {
      try {
        result.icHouseLink = `https://ic.house/address/${result.canisterId}/${result.from}/${result.to}`;
      } catch (error) {
        logger.error("Error generating ICHouse link:", error);
      }
    }

    result.syncStatus = 'synced';
    result.lastSyncedAt = Math.floor(Number(timestamp) / MILI_PER_SECOND);

    return result;
  } catch (error) {
    logger.error("Error in formatckBTCTransaccion:", error);
    return initialTransaction;
  }
};

export function chunkTransactions(options: { transactions: Transaction[]; chunkSize: number }) {
  const { transactions, chunkSize } = options;
  const transactionsChunks: Array<Transaction[]> = [];

  for (let i = 0; i < transactions.length; i += chunkSize) {
    const chunk = transactions.slice(i, i + chunkSize);
    transactionsChunks.push(chunk);
  }

  return transactionsChunks;
}

interface deChunkTransactionsParams {
  transactions: Array<Transaction[]>;
  chunkNumber: number;
  from: number;
}

export function deChunkTransactions(options: deChunkTransactionsParams): Transaction[] {
  const { transactions, chunkNumber, from } = options;
  const transactionsMerged: Transaction[] = [];

  if (transactions.length === 0) return [];
  if (transactions.length === 1) return transactions[0];

  if (chunkNumber <= 0 || from <= 0) {
    logger.debug("Error: chunkNumber and from must be positive integers.");
    return [];
  }

  if (chunkNumber > transactions.length) {
    logger.debug(`Error: chunkNumber ${chunkNumber} exceeds total chunks (${transactions.length}).`);
    return [];
  }

  const chunkIndex = chunkNumber - 1;
  const fromIndex = from - 1;

  if (fromIndex < 0 || fromIndex >= transactions[chunkIndex].length) {
    logger.debug(`Error: from index ${fromIndex} is invalid for chunk ${chunkNumber}.`);
    return [];
  }

  for (let index = fromIndex; index <= chunkIndex; index++) {
    transactionsMerged.push(...transactions[index]);
  }

  return transactionsMerged;
}
