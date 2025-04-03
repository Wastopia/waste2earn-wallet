import store from "@redux/Store";
import { AccountIdentifier, SubAccount as SubAccountNNS } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { GetAllTransactionsICPParams } from "@/@types/assets";
import { hexToUint8Array } from "@/common/utils/hexadecimal";
import { formatckBTCTransaccion, formatIcpTransaccion } from "@/pages/home/helpers/mappers";
import { Actor } from "@dfinity/agent";
import { _SERVICE as LedgerActor } from "@/candid/IcrcIndex/icrc_index";
import { idlFactory as LedgerFactory } from "@/candid/IcrcIndex/icrc_index.idl";
import logger from "@/common/utils/logger";
import { SpecialTxTypeEnum } from "@/common/const";

export const getAllTransactionsICP = async (params: GetAllTransactionsICPParams) => {
  const { subaccount_index, isOGY } = params;

  const myPrincipal = store.getState().auth.userPrincipal;
  let subacc: SubAccountNNS | undefined = undefined;
  
  logger.info(`Fetching ICP transactions for subaccount: ${subaccount_index}`);

  try {
    subacc = SubAccountNNS.fromBytes(hexToUint8Array(subaccount_index)) as SubAccountNNS;
  } catch (error) {
    logger.debug("Error parsing subaccount", error);
    subacc = undefined;
  }

  const accountIdentifier = AccountIdentifier.fromPrincipal({
    principal: myPrincipal,
    subAccount: subacc,
  });
  
  logger.info(`Account identifier for ICP transactions: ${accountIdentifier.toHex()}`);

  try {
    const response = await fetch(
      `${isOGY ? import.meta.env.VITE_ROSETTA_URL_OGY : import.meta.env.VITE_ROSETTA_URL}/search/transactions`,
      {
        method: "POST",
        body: JSON.stringify({
          network_identifier: {
            blockchain: isOGY ? import.meta.env.VITE_NET_ID_BLOCKCHAIN_OGY : import.meta.env.VITE_NET_ID_BLOCKCHAIN,
            network: isOGY ? import.meta.env.VITE_NET_ID_NETWORK_OGY : import.meta.env.VITE_NET_ID_NETWORK,
          },
          account_identifier: {
            address: accountIdentifier.toHex(),
          },
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
      },
    ).catch();

    if (!response.ok) throw Error(`${response.statusText}`);
    const { transactions } = await response.json();
    
    logger.info(`Retrieved ${transactions.length} ICP transactions`);

    const transactionsInfo = transactions.map(({ transaction, block_identifier }: any) =>
      formatIcpTransaccion(accountIdentifier.toHex(), transaction, block_identifier.hash),
    );
    
    logger.info(`Formatted ${transactionsInfo.length} ICP transactions`);
    // Log a sample transaction for debugging
    if (transactionsInfo.length > 0) {
      logger.debug('Sample transaction:', JSON.stringify(transactionsInfo[0]));
    }

    return transactionsInfo;
  } catch (error) {
    logger.error("Error getting ICP transactions:", error);
    return [];
  }
};

interface GetAllTransactionsICRCParams {
  canisterId: string | Principal;
  subaccount_index: Uint8Array;
  assetSymbol: string;
  canister: string;
  subNumber?: string;
}

export const getAllTransactionsICRC1 = async (params: GetAllTransactionsICRCParams) => {
  try {
    const { canisterId, subaccount_index, assetSymbol, canister, subNumber } = params;
    
    logger.info(`Fetching ICRC1 transactions for asset: ${assetSymbol}, canister: ${canisterId.toString()}`);

    const myAgent = store.getState().auth.userAgent;
    const myPrincipal = store.getState().auth.userPrincipal;
    const actor = Actor.createActor<LedgerActor>(LedgerFactory, {
      agent: myAgent,
      canisterId,
    });

    const result = await actor.get_account_transactions({
      account: { owner: myPrincipal, subaccount: [subaccount_index] },
      max_results: BigInt(100),
      start: [],
    });

    if (!result?.Ok?.transactions) {
      logger.error(`No transactions found or error in response for ICRC1: ${JSON.stringify(result)}`);
      return [];
    }
    
    logger.info(`Retrieved ${result.Ok.transactions.length} ICRC1 transactions`);

    const transactions = result?.Ok?.transactions
      .filter((tx) => tx.transaction.kind !== SpecialTxTypeEnum.Enum.approve)
      .map(({ transaction, id }) => {
        const formatresult = formatckBTCTransaccion({
          ckBTCTransaction: transaction,
          id,
          principal: myPrincipal?.toString(),
          symbol: assetSymbol,
          canister,
          subNumber,
        });

        return formatresult;
      });
    
    logger.info(`Formatted ${transactions.length} ICRC1 transactions`);
    // Log a sample transaction for debugging
    if (transactions.length > 0) {
      logger.debug('Sample ICRC1 transaction:', JSON.stringify(transactions[0]));
    }

    return transactions;
  } catch (error) {
    logger.error("Error getting ICRC1 transactions:", error);
    return [];
  }
};
