import { AssetSymbolEnum } from "@/common/const";
import { Asset } from "@redux/models/AccountModels";
import store from "@redux/Store";
import { setTxWorker } from "@redux/transaction/TransactionReducer";
import { getAllTransactionsICP, getAllTransactionsICRC1 } from "@/pages/home/helpers/requests";
import { hexToUint8Array } from "@/common/utils/hexadecimal";
import logger from "@/common/utils/logger";
import { LocalRxdbDatabase } from "@/database/local-rxdb";

async function fetchICPTransactions(asset: Asset) {
  const txTransactions = [];
  const promises = [];

  for (const subAccount of asset.subAccounts) {
    const params = {
      subaccount_index: subAccount.sub_account_id,
      isOGY: asset.tokenSymbol === AssetSymbolEnum.Enum.OGY,
    };

    promises.push(getAllTransactionsICP(params));
  }

  const transactions = await Promise.all(promises);

  for (let i = 0; i < transactions.length; i++) {
    txTransactions.push({
      tx: transactions[i],
      symbol: asset.symbol,
      tokenSymbol: asset.tokenSymbol,
      subaccount: asset.subAccounts[i].sub_account_id,
    });
  }

  return txTransactions;
}

async function fetchICRC1Transactions(asset: Asset, selectedToken: Asset) {
  const txTransactions = [];
  const promises = [];

  for (const subAccount of asset.subAccounts) {
    const params = {
      canisterId: selectedToken.index || "",
      subaccount_index: hexToUint8Array(subAccount.sub_account_id || "0x0"),
      assetSymbol: asset.tokenSymbol,
      canister: selectedToken.address,
      subNumber: subAccount.sub_account_id,
    };

    promises.push(getAllTransactionsICRC1(params));
  }

  const transactions = await Promise.all(promises);

  for (let i = 0; i < transactions.length; i++) {
    txTransactions.push({
      tx: transactions[i],
      symbol: asset.symbol,
      tokenSymbol: asset.tokenSymbol,
      subaccount: asset.subAccounts[i].sub_account_id,
    });
  }

  return txTransactions;
}

export async function transactionCacheRefresh(assets: Asset[]) {
  try {
    logger.debug("Starting transaction refresh with assets:", assets);
    const txWorker = [];
    
    for (const asset of assets) {
      logger.debug("Processing asset:", asset.tokenSymbol);
      
      if (asset.tokenSymbol === AssetSymbolEnum.Enum.ICP || asset.tokenSymbol === AssetSymbolEnum.Enum.OGY) {
        const transactionsBySubAccounts = await fetchICPTransactions(asset);
        logger.debug("ICP/OGY transactions:", transactionsBySubAccounts);
        txWorker.push(...transactionsBySubAccounts);
      } else {
        const selectedAsset = assets.find((currentAsset) => currentAsset.symbol === asset.symbol);
        logger.debug("Selected ICRC1 asset:", selectedAsset);
        
        if (selectedAsset) {
          const transactionsBySubaccount = await fetchICRC1Transactions(asset, selectedAsset);
          logger.debug("ICRC1 transactions:", transactionsBySubaccount);
          txWorker.push(...transactionsBySubaccount);
        }
      }
    }
    
    logger.debug("Final txWorker state:", txWorker);
    store.dispatch(setTxWorker(txWorker));

    // Update local database with transactions
    const db = LocalRxdbDatabase.instance;
    await db.updateTransactionCache(txWorker);

  } catch (error) {
    logger.debug("Error in transactionCacheRefresh worker", error);
  }
}
